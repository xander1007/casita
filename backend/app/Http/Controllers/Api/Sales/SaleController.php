<?php

namespace App\Http\Controllers\Api\Sales;

use App\Http\Controllers\Controller;
use App\Http\Requests\Sales\AnnulSaleRequest;
use App\Http\Resources\SaleResource;
use App\Models\CashShift;
use App\Models\ProductSerial;
use App\Models\Sale;
use App\Models\StockMovement;
use App\Models\WarehouseStock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaleController extends Controller
{
    /**
     * List the sales history with search and filters.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Sale::query()->with(['contact', 'user'])->latest();

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('series', 'like', "%{$search}%")
                    ->orWhere('number', 'like', "%{$search}%")
                    ->orWhereHas('contact', fn ($c) => $c->where('name_or_business_name', 'like', "%{$search}%"));
            });
        }

        if ($documentType = $request->string('document_type')->toString()) {
            $query->where('document_type', $documentType);
        }

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        if ($from = $request->string('date_from')->toString()) {
            $query->whereDate('created_at', '>=', $from);
        }

        if ($to = $request->string('date_to')->toString()) {
            $query->whereDate('created_at', '<=', $to);
        }

        $perPage = (int) $request->integer('per_page', 15);

        return SaleResource::collection($query->paginate($perPage));
    }

    /**
     * Show a single sale with its full detail.
     */
    public function show(Sale $sale): JsonResponse
    {
        $sale->load(['details.product', 'details.productSerial', 'payments', 'contact', 'user', 'annulledBy']);

        return response()->json(['sale' => new SaleResource($sale)]);
    }

    /**
     * Annul a sale: reverses the stock, releases any serials sold, and
     * reverts the cash shift totals if the shift is still open.
     */
    public function annul(AnnulSaleRequest $request, Sale $sale): JsonResponse
    {
        if ($sale->status === Sale::STATUS_ANNULLED) {
            throw ValidationException::withMessages([
                'sale' => 'Este comprobante ya se encuentra anulado.',
            ]);
        }

        DB::transaction(function () use ($request, $sale) {
            $sale->load(['details.product', 'payments', 'cashShift.cashRegister']);
            $warehouseId = $sale->cashShift->cashRegister?->warehouse_id;
            $documentNumber = "{$sale->series}-".str_pad((string) $sale->number, 6, '0', STR_PAD_LEFT);

            foreach ($sale->details as $detail) {
                if ($detail->product->is_service || ! $warehouseId) {
                    continue;
                }

                WarehouseStock::query()
                    ->where('product_id', $detail->product_id)
                    ->where('warehouse_id', $warehouseId)
                    ->increment('quantity', $detail->quantity);

                StockMovement::create([
                    'product_id' => $detail->product_id,
                    'warehouse_id' => $warehouseId,
                    'user_id' => $request->user()->id,
                    'type' => 'in',
                    'quantity' => $detail->quantity,
                    'reason' => "Anulación de venta {$documentNumber}",
                ]);

                if ($detail->product_serial_id) {
                    ProductSerial::query()->where('id', $detail->product_serial_id)->update(['status' => 'available']);
                }
            }

            if ($sale->cashShift->status === CashShift::STATUS_OPEN) {
                $shiftIncrements = [
                    'cash' => 'total_cash_sales',
                    'card' => 'total_card_sales',
                    'transfer' => 'total_transfer_sales',
                    'yape_plin' => 'total_yape_plin_sales',
                ];

                foreach ($sale->payments as $payment) {
                    $sale->cashShift->decrement($shiftIncrements[$payment->payment_method], $payment->amount);
                }
            }

            $sale->update([
                'status' => Sale::STATUS_ANNULLED,
                'annulled_at' => now(),
                'annulled_by' => $request->user()->id,
                'annulment_reason' => $request->validated('reason'),
            ]);
        });

        return response()->json([
            'sale' => new SaleResource($sale->fresh(['details.product', 'details.productSerial', 'payments', 'contact', 'user', 'annulledBy'])),
        ]);
    }
}
