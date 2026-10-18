<?php

namespace App\Http\Controllers\Api\Pos;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pos\StoreSaleRequest;
use App\Http\Resources\SaleResource;
use App\Models\CashShift;
use App\Models\CompanySetting;
use App\Models\Contact;
use App\Models\DocumentSeries;
use App\Models\Product;
use App\Models\ProductSerial;
use App\Models\Quotation;
use App\Models\Sale;
use App\Models\SaleDetail;
use App\Models\SalePayment;
use App\Models\SalesOrder;
use App\Models\StockMovement;
use App\Models\WarehouseStock;
use App\Services\Sales\SalesOrderService;
use App\Support\NumberToLetters;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class POSController extends Controller
{
    /**
     * The generic "Clientes Varios" walk-in customer used when no client is selected.
     */
    private const DEFAULT_CONTACT_DOCUMENT_NUMBER = '00000000';

    public function __construct(private readonly SalesOrderService $salesOrders) {}

    /**
     * Process a POS sale in a single database transaction: assigns the next
     * correlative, decrements stock/serials, and registers the payments.
     */
    public function store(StoreSaleRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();

        $shift = CashShift::query()
            ->where('user_id', $user->id)
            ->where('status', CashShift::STATUS_OPEN)
            ->with('cashRegister')
            ->first();

        if (! $shift) {
            throw ValidationException::withMessages([
                'shift' => 'No tienes una caja abierta. Abre un turno antes de vender.',
            ]);
        }

        $cashRegister = $shift->cashRegister;
        $warehouseId = $cashRegister?->warehouse_id;

        if (! $warehouseId) {
            throw ValidationException::withMessages([
                'shift' => 'La caja actual no tiene un almacén asignado. Configúralo antes de vender.',
            ]);
        }

        $contact = $this->resolveContact($data['contact_id'] ?? null);

        if ($data['document_type'] === '01' && $contact->identity_document_type !== '6') {
            throw ValidationException::withMessages([
                'contact_id' => 'Para emitir una Factura el cliente debe tener RUC.',
            ]);
        }

        $products = Product::query()->whereIn('id', collect($data['items'])->pluck('product_id'))->get()->keyBy('id');

        $lines = [];
        $opTaxed = 0.0;
        $opExonerated = 0.0;
        $igvTotal = 0.0;

        foreach ($data['items'] as $item) {
            $product = $products->get($item['product_id']);

            if (! $product) {
                throw ValidationException::withMessages(['items' => 'Uno de los productos ya no existe.']);
            }

            if ($product->requires_serial && empty($item['product_serial_id'])) {
                throw ValidationException::withMessages([
                    'items' => "El producto \"{$product->name}\" requiere seleccionar un número de serie.",
                ]);
            }

            if (! empty($item['product_serial_id']) && $item['quantity'] != 1) {
                throw ValidationException::withMessages([
                    'items' => "El producto \"{$product->name}\" con número de serie debe venderse en cantidad de 1.",
                ]);
            }

            $lineTotal = round($item['quantity'] * $item['unit_price'], 2);

            if ($product->igv_affectation === '10') {
                $lineBase = round($lineTotal / 1.18, 2);
                $lineIgv = round($lineTotal - $lineBase, 2);
            } else {
                $lineBase = $lineTotal;
                $lineIgv = 0.0;
            }

            if ($product->igv_affectation === '10') {
                $opTaxed += $lineBase;
            } else {
                $opExonerated += $lineBase;
            }
            $igvTotal += $lineIgv;

            $lines[] = [
                'product' => $product,
                'product_serial_id' => $item['product_serial_id'] ?? null,
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'subtotal' => $lineBase,
                'igv' => $lineIgv,
                'total' => $lineTotal,
            ];
        }

        $saleTotal = round($opTaxed + $opExonerated + $igvTotal, 2);
        $paidTotal = round(collect($data['payments'])->sum('amount'), 2);

        if ($paidTotal + 0.01 < $saleTotal) {
            throw ValidationException::withMessages([
                'payments' => 'El monto pagado es insuficiente para cubrir el total de la venta.',
            ]);
        }

        $sale = DB::transaction(function () use (
            $data,
            $shift,
            $contact,
            $user,
            $warehouseId,
            $lines,
            $opTaxed,
            $opExonerated,
            $igvTotal,
            $saleTotal,
        ) {
            $salesOrder = null;
            $quotation = null;

            if (! empty($data['sales_order_id'])) {
                // Frees the order's reservation so the stock checks below can consume those units.
                $salesOrder = $this->salesOrders->releaseForSale(SalesOrder::query()->findOrFail($data['sales_order_id']), $warehouseId);

                if ($salesOrder->contact_id !== $contact->id) {
                    throw ValidationException::withMessages([
                        'contact_id' => "El pedido {$salesOrder->code} pertenece a otro cliente.",
                    ]);
                }

                // The whole reservation is released, so the sale must take all of it.
                $ordered = $salesOrder->items()->get()->groupBy('product_id')->map->sum('quantity')->sortKeys();
                $sold = collect($lines)->groupBy(fn ($line) => $line['product']->id)->map->sum('quantity')->sortKeys();

                if ($ordered->all() != $sold->all()) {
                    throw ValidationException::withMessages([
                        'items' => "La venta debe incluir exactamente los productos y cantidades del pedido {$salesOrder->code}.",
                    ]);
                }
            }

            if (! empty($data['quotation_id'])) {
                $quotation = Quotation::query()->lockForUpdate()->findOrFail($data['quotation_id']);

                if ($quotation->status !== Quotation::STATUS_APPROVED) {
                    throw ValidationException::withMessages([
                        'quotation_id' => "La cotización {$quotation->code} no está aprobada o ya fue convertida.",
                    ]);
                }
            }

            $series = DocumentSeries::query()
                ->where('cash_register_id', $shift->cash_register_id)
                ->where('document_type', $data['document_type'])
                ->where('is_active', true)
                ->lockForUpdate()
                ->first();

            if (! $series) {
                throw ValidationException::withMessages([
                    'document_type' => 'No hay una serie SUNAT activa configurada para este comprobante en esta caja.',
                ]);
            }

            $number = $series->current_correlative + 1;
            $series->update(['current_correlative' => $number]);

            $sale = Sale::create([
                'cash_shift_id' => $shift->id,
                'contact_id' => $contact->id,
                'user_id' => $user->id,
                'document_type' => $data['document_type'],
                'series' => $series->series,
                'number' => $number,
                'op_taxed' => $opTaxed,
                'op_exonerated' => $opExonerated,
                'igv' => $igvTotal,
                'total' => $saleTotal,
                'amount_in_words' => NumberToLetters::toInvoiceWords($saleTotal),
                'payment_status' => 'paid',
                'payment_condition' => 'CONTADO',
                'status' => Sale::STATUS_COMPLETED,
            ]);

            $documentNumber = "{$series->series}-".str_pad((string) $number, 6, '0', STR_PAD_LEFT);

            foreach ($lines as $line) {
                $product = $line['product'];

                $detail = SaleDetail::create([
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'product_serial_id' => $line['product_serial_id'],
                    'quantity' => $line['quantity'],
                    'unit_price' => $line['unit_price'],
                    'subtotal' => $line['subtotal'],
                    'igv' => $line['igv'],
                    'total' => $line['total'],
                ]);

                if ($product->is_service) {
                    continue;
                }

                if ($line['product_serial_id']) {
                    $serial = ProductSerial::query()->lockForUpdate()->find($line['product_serial_id']);

                    if (! $serial || $serial->product_id !== $product->id || $serial->status !== 'available') {
                        throw ValidationException::withMessages([
                            'items' => "La serie seleccionada para \"{$product->name}\" ya no está disponible.",
                        ]);
                    }

                    $serial->update(['status' => 'sold']);
                }

                $stock = WarehouseStock::query()
                    ->where('product_id', $product->id)
                    ->where('warehouse_id', $warehouseId)
                    ->lockForUpdate()
                    ->first();

                if (! $stock || $stock->available() < $line['quantity']) {
                    throw ValidationException::withMessages([
                        'items' => "No hay suficiente stock de \"{$product->name}\" en esta caja.",
                    ]);
                }

                $stock->decrement('quantity', $line['quantity']);

                StockMovement::create([
                    'product_id' => $product->id,
                    'warehouse_id' => $warehouseId,
                    'user_id' => $user->id,
                    'type' => 'out',
                    'quantity' => $line['quantity'],
                    'reason' => "Venta {$documentNumber}",
                ]);
            }

            $shiftIncrements = [
                'cash' => 'total_cash_sales',
                'card' => 'total_card_sales',
                'transfer' => 'total_transfer_sales',
                'yape_plin' => 'total_yape_plin_sales',
            ];

            foreach ($data['payments'] as $payment) {
                SalePayment::create([
                    'sale_id' => $sale->id,
                    'payment_method' => $payment['payment_method'],
                    'amount' => $payment['amount'],
                    'reference_number' => $payment['reference_number'] ?? null,
                ]);

                $shift->increment($shiftIncrements[$payment['payment_method']], $payment['amount']);
            }

            if ($salesOrder) {
                $this->salesOrders->markCompleted($salesOrder, $sale);
            }

            $quotation?->update([
                'status' => Quotation::STATUS_CONVERTED,
                'sale_id' => $sale->id,
                'converted_at' => now(),
            ]);

            return $sale;
        });

        $sale->load(['details.product', 'details.productSerial', 'payments', 'contact', 'user']);

        return response()->json([
            'sale' => new SaleResource($sale),
            'change' => max(0, round($paidTotal - $saleTotal, 2)),
        ], 201);
    }

    /**
     * Return the formatted payload for the 80mm ticket / A4 print preview.
     */
    public function print(Sale $sale): JsonResponse
    {
        $sale->load(['details.product', 'details.productSerial', 'payments', 'contact', 'user', 'cashShift.cashRegister']);

        return response()->json([
            'company' => CompanySetting::query()->first(),
            'sale' => new SaleResource($sale),
        ]);
    }

    /**
     * Resolve the contact for the sale, defaulting to the generic walk-in customer.
     */
    private function resolveContact(?int $contactId): Contact
    {
        if ($contactId) {
            $contact = Contact::query()->find($contactId);

            if ($contact) {
                return $contact;
            }
        }

        return Contact::query()->firstOrCreate(
            ['identity_document_type' => '1', 'document_number' => self::DEFAULT_CONTACT_DOCUMENT_NUMBER],
            ['type' => 'client', 'name_or_business_name' => 'Clientes Varios', 'is_active' => true],
        );
    }
}
