<?php

namespace App\Http\Controllers\Api\Reports;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseDetail;
use App\Models\Sale;
use App\Models\SaleDetail;
use App\Models\StockMovement;
use App\Support\CsvSanitizer;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SunatReportController extends Controller
{
    /**
     * Resolve the [from, to, period] tuple for a SUNAT report request.
     * Accepts either an explicit date_from/date_to range, or a year/month
     * (SUNAT "período tributario") pair — defaulting to the current month.
     *
     * @return array{0: Carbon, 1: Carbon, 2: string}
     */
    private function resolvePeriod(Request $request): array
    {
        if ($request->filled('date_from') && $request->filled('date_to')) {
            $from = Carbon::parse($request->string('date_from')->toString())->startOfDay();
            $to = Carbon::parse($request->string('date_to')->toString())->endOfDay();
        } else {
            $year = max(2000, min(2100, (int) $request->integer('year', (int) now()->year)));
            $month = max(1, min(12, (int) $request->integer('month', (int) now()->month)));
            $from = Carbon::create($year, $month, 1)->startOfDay();
            $to = $from->copy()->endOfMonth()->endOfDay();
        }

        return [$from, $to, $from->format('Ym')];
    }

    /**
     * Paginate an in-memory collection the same way Eloquent would.
     */
    private function paginateCollection(Collection $items, Request $request): LengthAwarePaginator
    {
        $perPage = (int) $request->integer('per_page', 15);
        $page = max(1, (int) $request->integer('page', 1));

        return new LengthAwarePaginator(
            $items->slice(($page - 1) * $perPage, $perPage)->values(),
            $items->count(),
            $perPage,
            $page,
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function paginatedJson(LengthAwarePaginator $paginator): array
    {
        return [
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];
    }

    /**
     * Split a free-text purchase document number ("F001-1234") into its
     * serie/correlativo parts.
     *
     * @return array{0: string, 1: string}
     */
    private function splitDocumentNumber(string $documentNumber): array
    {
        if (str_contains($documentNumber, '-')) {
            [$serie, $correlativo] = explode('-', $documentNumber, 2);

            return [$serie, $correlativo];
        }

        return [$documentNumber, ''];
    }

    // ------------------------------------------------------------------
    // RVIE — Registro de Ventas e Ingresos Electrónico (SIRE / PLE 14.1)
    // ------------------------------------------------------------------

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function rvieRows(Request $request): Collection
    {
        [$from, $to, $periodo] = $this->resolvePeriod($request);

        return Sale::query()
            ->with('contact')
            ->where('status', Sale::STATUS_COMPLETED)
            ->whereIn('document_type', ['01', '03'])
            ->whereBetween('created_at', [$from, $to])
            ->orderBy('created_at')
            ->get()
            ->values()
            ->map(function (Sale $sale, int $index) use ($periodo) {
                $contact = $sale->contact;

                return [
                    'periodo' => $periodo,
                    'car' => str_pad((string) ($index + 1), 6, '0', STR_PAD_LEFT),
                    'fecha_emision' => $sale->created_at->format('d/m/Y'),
                    'tipo_comprobante' => $sale->document_type,
                    'serie' => $sale->series,
                    'correlativo' => str_pad((string) $sale->number, 6, '0', STR_PAD_LEFT),
                    'tipo_doc_cliente' => $contact?->identity_document_type ?? '0',
                    'doc_cliente' => $contact?->document_number ?? '00000000',
                    'razon_social' => $contact?->name_or_business_name ?? 'Clientes Varios',
                    'op_gravada' => (float) $sale->op_taxed,
                    'op_exonerada' => (float) $sale->op_exonerated,
                    'igv' => (float) $sale->igv,
                    'total' => (float) $sale->total,
                ];
            });
    }

    public function ventasPreview(Request $request): JsonResponse
    {
        return response()->json($this->paginatedJson($this->paginateCollection($this->rvieRows($request), $request)));
    }

    public function exportVentasTxt(Request $request): StreamedResponse
    {
        $rows = $this->rvieRows($request);
        [, , $periodo] = $this->resolvePeriod($request);

        return response()->streamDownload(function () use ($rows) {
            $handle = fopen('php://output', 'w');

            foreach ($rows as $row) {
                fwrite($handle, implode('|', CsvSanitizer::row([
                    $row['periodo'],
                    $row['car'],
                    $row['fecha_emision'],
                    $row['tipo_comprobante'],
                    $row['serie'],
                    $row['correlativo'],
                    $row['tipo_doc_cliente'],
                    $row['doc_cliente'],
                    $row['razon_social'],
                    number_format($row['op_gravada'], 2, '.', ''),
                    number_format($row['op_exonerada'], 2, '.', ''),
                    number_format($row['igv'], 2, '.', ''),
                    number_format($row['total'], 2, '.', ''),
                ]))."\r\n");
            }

            fclose($handle);
        }, "RVIE-{$periodo}.txt", ['Content-Type' => 'text/plain']);
    }

    public function exportVentasCsv(Request $request): StreamedResponse
    {
        $rows = $this->rvieRows($request);
        [, , $periodo] = $this->resolvePeriod($request);

        return response()->streamDownload(function () use ($rows) {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, [
                'Periodo', 'CAR', 'Fecha Emisión', 'Tipo Comprobante', 'Serie', 'Correlativo',
                'Tipo Doc. Cliente', 'Doc. Identidad Cliente', 'Razón Social',
                'Op. Gravada', 'Op. Exonerada', 'IGV', 'Total',
            ]);

            foreach ($rows as $row) {
                fputcsv($handle, CsvSanitizer::row([
                    $row['periodo'], $row['car'], $row['fecha_emision'], $row['tipo_comprobante'],
                    $row['serie'], $row['correlativo'], $row['tipo_doc_cliente'], $row['doc_cliente'],
                    $row['razon_social'], number_format($row['op_gravada'], 2, '.', ''),
                    number_format($row['op_exonerada'], 2, '.', ''), number_format($row['igv'], 2, '.', ''),
                    number_format($row['total'], 2, '.', ''),
                ]));
            }

            fclose($handle);
        }, "RVIE-{$periodo}.csv", ['Content-Type' => 'text/csv']);
    }

    // ------------------------------------------------------------------
    // RICE — Registro de Compras Electrónico (SIRE / PLE 8.1)
    // ------------------------------------------------------------------

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function riceRows(Request $request): Collection
    {
        [$from, $to, $periodo] = $this->resolvePeriod($request);

        return Purchase::query()
            ->with('supplier')
            ->where('status', Purchase::STATUS_COMPLETED)
            ->whereBetween('purchase_date', [$from->toDateString(), $to->toDateString()])
            ->orderBy('purchase_date')
            ->get()
            ->values()
            ->map(function (Purchase $purchase, int $index) use ($periodo) {
                $supplier = $purchase->supplier;
                [$serie, $correlativo] = $this->splitDocumentNumber($purchase->document_number);

                return [
                    'periodo' => $periodo,
                    'car' => str_pad((string) ($index + 1), 6, '0', STR_PAD_LEFT),
                    'fecha_emision' => $purchase->purchase_date->format('d/m/Y'),
                    'fecha_vencimiento' => $purchase->purchase_date->format('d/m/Y'),
                    'tipo_comprobante' => $purchase->document_type === 'factura' ? '01' : '03',
                    'serie' => $serie,
                    'correlativo' => $correlativo,
                    'tipo_doc_proveedor' => $supplier?->identity_document_type ?? '6',
                    'doc_proveedor' => $supplier?->document_number ?? '-',
                    'razon_social' => $supplier?->name_or_business_name ?? '-',
                    'base_imponible' => (float) $purchase->subtotal,
                    'igv' => (float) $purchase->igv,
                    'importe_total' => (float) $purchase->total,
                ];
            });
    }

    public function comprasPreview(Request $request): JsonResponse
    {
        return response()->json($this->paginatedJson($this->paginateCollection($this->riceRows($request), $request)));
    }

    public function exportComprasTxt(Request $request): StreamedResponse
    {
        $rows = $this->riceRows($request);
        [, , $periodo] = $this->resolvePeriod($request);

        return response()->streamDownload(function () use ($rows) {
            $handle = fopen('php://output', 'w');

            foreach ($rows as $row) {
                fwrite($handle, implode('|', CsvSanitizer::row([
                    $row['periodo'],
                    $row['car'],
                    $row['fecha_emision'],
                    $row['fecha_vencimiento'],
                    $row['tipo_comprobante'],
                    $row['serie'],
                    $row['correlativo'],
                    $row['doc_proveedor'],
                    $row['razon_social'],
                    number_format($row['base_imponible'], 2, '.', ''),
                    number_format($row['igv'], 2, '.', ''),
                    number_format($row['importe_total'], 2, '.', ''),
                ]))."\r\n");
            }

            fclose($handle);
        }, "RICE-{$periodo}.txt", ['Content-Type' => 'text/plain']);
    }

    public function exportComprasCsv(Request $request): StreamedResponse
    {
        $rows = $this->riceRows($request);
        [, , $periodo] = $this->resolvePeriod($request);

        return response()->streamDownload(function () use ($rows) {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, [
                'Periodo', 'CAR', 'Fecha Emisión', 'Fecha Vencimiento', 'Tipo Comprobante', 'Serie', 'Correlativo',
                'Doc. Proveedor', 'Razón Social', 'Base Imponible', 'IGV', 'Importe Total',
            ]);

            foreach ($rows as $row) {
                fputcsv($handle, CsvSanitizer::row([
                    $row['periodo'], $row['car'], $row['fecha_emision'], $row['fecha_vencimiento'],
                    $row['tipo_comprobante'], $row['serie'], $row['correlativo'], $row['doc_proveedor'],
                    $row['razon_social'], number_format($row['base_imponible'], 2, '.', ''),
                    number_format($row['igv'], 2, '.', ''), number_format($row['importe_total'], 2, '.', ''),
                ]));
            }

            fclose($handle);
        }, "RICE-{$periodo}.csv", ['Content-Type' => 'text/csv']);
    }

    // ------------------------------------------------------------------
    // Kardex Valorizado (Formato 13.1) — costo promedio ponderado
    // ------------------------------------------------------------------

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function kardex13Rows(Request $request): Collection
    {
        [$from, $to] = $this->resolvePeriod($request);

        $productsQuery = Product::query()->where('is_active', true)->where('is_service', false);

        if ($productId = $request->integer('product_id')) {
            $productsQuery->where('id', $productId);
        }

        $rows = collect();

        foreach ($productsQuery->orderBy('name')->get() as $product) {
            $entries = PurchaseDetail::query()
                ->join('purchases', 'purchases.id', '=', 'purchase_details.purchase_id')
                ->where('purchase_details.product_id', $product->id)
                ->where('purchases.status', Purchase::STATUS_COMPLETED)
                ->orderBy('purchases.purchase_date')
                ->orderBy('purchases.id')
                ->get([
                    'purchase_details.quantity as quantity',
                    'purchase_details.unit_cost as unit_cost',
                    'purchases.purchase_date as date',
                    'purchases.document_number as reference',
                ])
                ->map(fn ($row) => (object) [
                    'date' => Carbon::parse($row->date)->startOfDay(),
                    'type' => 'in',
                    'quantity' => (int) $row->quantity,
                    'unit_cost' => (float) $row->unit_cost,
                    'reference' => "Compra {$row->reference}",
                ]);

            $exits = SaleDetail::query()
                ->join('sales', 'sales.id', '=', 'sale_details.sale_id')
                ->where('sale_details.product_id', $product->id)
                ->where('sales.status', Sale::STATUS_COMPLETED)
                ->orderBy('sales.created_at')
                ->orderBy('sales.id')
                ->get([
                    'sale_details.quantity as quantity',
                    'sales.created_at as date',
                    'sales.series as series',
                    'sales.number as number',
                ])
                ->map(fn ($row) => (object) [
                    'date' => Carbon::parse($row->date),
                    'type' => 'out',
                    'quantity' => (int) $row->quantity,
                    'unit_cost' => null,
                    'reference' => "Venta {$row->series}-".str_pad((string) $row->number, 6, '0', STR_PAD_LEFT),
                ]);

            $timeline = $entries->concat($exits)->sortBy(fn ($movement) => $movement->date->timestamp)->values();

            $runningQty = 0;
            $runningValue = 0.0;

            foreach ($timeline as $movement) {
                if ($movement->type === 'in') {
                    $movementValue = $movement->quantity * $movement->unit_cost;
                    $runningQty += $movement->quantity;
                    $runningValue += $movementValue;
                    $unitCostUsed = $movement->unit_cost;
                } else {
                    $avgCostBefore = $runningQty > 0 ? $runningValue / $runningQty : 0.0;
                    $movementValue = $movement->quantity * $avgCostBefore;
                    $runningQty -= $movement->quantity;
                    $runningValue -= $movementValue;

                    if ($runningQty <= 0) {
                        $runningQty = max($runningQty, 0);
                        $runningValue = max($runningValue, 0.0);
                    }

                    $unitCostUsed = $avgCostBefore;
                }

                if ($movement->date->between($from, $to)) {
                    $rows->push([
                        'product_id' => $product->id,
                        'product' => $product->name,
                        'code' => $product->internal_code,
                        'date' => $movement->date->toDateTimeString(),
                        'type' => $movement->type,
                        'reference' => $movement->reference,
                        'quantity' => $movement->quantity,
                        'unit_cost' => round($unitCostUsed, 4),
                        'movement_value' => round($movementValue, 2),
                        'balance_quantity' => $runningQty,
                        'average_cost' => round($runningQty > 0 ? $runningValue / $runningQty : 0.0, 4),
                        'balance_value' => round($runningValue, 2),
                    ]);
                }
            }
        }

        return $rows->values();
    }

    public function kardex13Preview(Request $request): JsonResponse
    {
        return response()->json($this->paginatedJson($this->paginateCollection($this->kardex13Rows($request), $request)));
    }

    public function exportKardex13Txt(Request $request): StreamedResponse
    {
        $rows = $this->kardex13Rows($request);
        [, , $periodo] = $this->resolvePeriod($request);

        return response()->streamDownload(function () use ($rows) {
            $handle = fopen('php://output', 'w');

            foreach ($rows as $row) {
                fwrite($handle, implode('|', CsvSanitizer::row([
                    $row['product'],
                    $row['code'] ?? '',
                    $row['date'],
                    $row['type'] === 'in' ? 'ENTRADA' : 'SALIDA',
                    $row['reference'],
                    $row['quantity'],
                    number_format($row['unit_cost'], 4, '.', ''),
                    number_format($row['movement_value'], 2, '.', ''),
                    $row['balance_quantity'],
                    number_format($row['average_cost'], 4, '.', ''),
                    number_format($row['balance_value'], 2, '.', ''),
                ]))."\r\n");
            }

            fclose($handle);
        }, "KARDEX13-{$periodo}.txt", ['Content-Type' => 'text/plain']);
    }

    public function exportKardex13Csv(Request $request): StreamedResponse
    {
        $rows = $this->kardex13Rows($request);
        [, , $periodo] = $this->resolvePeriod($request);

        return response()->streamDownload(function () use ($rows) {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, [
                'Producto', 'Código', 'Fecha', 'Tipo', 'Documento', 'Cantidad', 'Costo Unitario',
                'Valor Movimiento', 'Saldo Cantidad', 'Costo Promedio', 'Saldo Valorizado',
            ]);

            foreach ($rows as $row) {
                fputcsv($handle, CsvSanitizer::row([
                    $row['product'], $row['code'], $row['date'], $row['type'] === 'in' ? 'Entrada' : 'Salida',
                    $row['reference'], $row['quantity'], number_format($row['unit_cost'], 4, '.', ''),
                    number_format($row['movement_value'], 2, '.', ''), $row['balance_quantity'],
                    number_format($row['average_cost'], 4, '.', ''), number_format($row['balance_value'], 2, '.', ''),
                ]));
            }

            fclose($handle);
        }, "KARDEX13-{$periodo}.csv", ['Content-Type' => 'text/csv']);
    }

    // ------------------------------------------------------------------
    // Registro de Inventario Físico (Formato 12.1)
    // ------------------------------------------------------------------

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function inventory12Rows(Request $request): Collection
    {
        [$from, $to] = $this->resolvePeriod($request);

        $query = StockMovement::query()->with(['product', 'warehouse'])->orderBy('created_at')->orderBy('id');

        if ($warehouseId = $request->integer('warehouse_id')) {
            $query->where('warehouse_id', $warehouseId);
        }

        if ($productId = $request->integer('product_id')) {
            $query->where('product_id', $productId);
        }

        $groups = $query->get()->groupBy(fn (StockMovement $movement) => $movement->product_id.'-'.$movement->warehouse_id);

        $rows = collect();

        foreach ($groups as $movements) {
            $balance = 0;

            foreach ($movements as $movement) {
                $balance = $movement->type === 'adjustment'
                    ? $movement->quantity
                    : $balance + ($movement->type === 'out' ? -$movement->quantity : $movement->quantity);

                if ($movement->created_at->between($from, $to)) {
                    $rows->push([
                        'date' => $movement->created_at->toDateTimeString(),
                        'warehouse' => $movement->warehouse->name,
                        'product' => $movement->product->name,
                        'code' => $movement->product->internal_code,
                        'unit' => $movement->product->unit_of_measure,
                        'type' => $movement->type,
                        'quantity' => $movement->quantity,
                        'balance_quantity' => $balance,
                        'reference' => $movement->reason,
                    ]);
                }
            }
        }

        return $rows->sortBy('date')->values();
    }

    public function inventory12Preview(Request $request): JsonResponse
    {
        return response()->json($this->paginatedJson($this->paginateCollection($this->inventory12Rows($request), $request)));
    }

    private const INVENTORY_TYPE_LABELS = ['in' => 'ENTRADA', 'out' => 'SALIDA', 'adjustment' => 'AJUSTE'];

    public function exportInventory12Txt(Request $request): StreamedResponse
    {
        $rows = $this->inventory12Rows($request);
        [, , $periodo] = $this->resolvePeriod($request);

        return response()->streamDownload(function () use ($rows) {
            $handle = fopen('php://output', 'w');

            foreach ($rows as $row) {
                fwrite($handle, implode('|', CsvSanitizer::row([
                    $row['date'],
                    $row['warehouse'],
                    $row['product'],
                    $row['code'] ?? '',
                    $row['unit'],
                    self::INVENTORY_TYPE_LABELS[$row['type']],
                    $row['quantity'],
                    $row['balance_quantity'],
                    $row['reference'] ?? '',
                ]))."\r\n");
            }

            fclose($handle);
        }, "INVENTARIO12-{$periodo}.txt", ['Content-Type' => 'text/plain']);
    }

    public function exportInventory12Csv(Request $request): StreamedResponse
    {
        $rows = $this->inventory12Rows($request);
        [, , $periodo] = $this->resolvePeriod($request);

        return response()->streamDownload(function () use ($rows) {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, [
                'Fecha', 'Almacén', 'Producto', 'Código', 'Unidad', 'Tipo Movimiento',
                'Cantidad', 'Saldo Cantidad', 'Referencia',
            ]);

            foreach ($rows as $row) {
                fputcsv($handle, CsvSanitizer::row([
                    $row['date'], $row['warehouse'], $row['product'], $row['code'], $row['unit'],
                    self::INVENTORY_TYPE_LABELS[$row['type']], $row['quantity'], $row['balance_quantity'],
                    $row['reference'],
                ]));
            }

            fclose($handle);
        }, "INVENTARIO12-{$periodo}.csv", ['Content-Type' => 'text/csv']);
    }
}
