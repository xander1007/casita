<?php

namespace App\Http\Controllers\Api\Reports;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Http\Resources\SaleResource;
use App\Models\CashShift;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleDetail;
use App\Models\SalePayment;
use App\Models\StockMovement;
use App\Models\TechnicalService;
use App\Support\CsvSanitizer;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    /**
     * Resolve the [from, to] date range for a report request.
     *
     * @return array{0: Carbon, 1: Carbon}
     */
    private function resolveRange(Request $request): array
    {
        $period = $request->string('period')->toString() ?: 'today';
        $today = Carbon::today();

        return match ($period) {
            'week' => [$today->copy()->startOfWeek(), $today->copy()->endOfWeek()->endOfDay()],
            'month' => [$today->copy()->startOfMonth(), $today->copy()->endOfMonth()->endOfDay()],
            'custom' => [
                $request->filled('date_from') ? Carbon::parse($request->string('date_from')->toString())->startOfDay() : $today->copy()->startOfDay(),
                $request->filled('date_to') ? Carbon::parse($request->string('date_to')->toString())->endOfDay() : $today->copy()->endOfDay(),
            ],
            default => [$today->copy()->startOfDay(), $today->copy()->endOfDay()],
        };
    }

    /**
     * Executive summary KPIs for the given date range.
     */
    public function summary(Request $request): JsonResponse
    {
        [$from, $to] = $this->resolveRange($request);

        $totalSales = (float) Sale::query()
            ->where('status', Sale::STATUS_COMPLETED)
            ->whereBetween('created_at', [$from, $to])
            ->sum('total');

        $totalCost = (float) SaleDetail::query()
            ->join('sales', 'sales.id', '=', 'sale_details.sale_id')
            ->join('products', 'products.id', '=', 'sale_details.product_id')
            ->where('sales.status', Sale::STATUS_COMPLETED)
            ->whereBetween('sales.created_at', [$from, $to])
            ->selectRaw('COALESCE(SUM(sale_details.quantity * products.purchase_price), 0) as total_cost')
            ->value('total_cost');

        $activeServices = TechnicalService::query()
            ->whereNotIn('status', [TechnicalService::STATUS_DELIVERED, TechnicalService::STATUS_CANCELLED])
            ->count();

        $cashBalance = (float) CashShift::query()
            ->where('status', CashShift::STATUS_OPEN)
            ->get(['opening_balance', 'total_cash_sales'])
            ->sum(fn (CashShift $shift) => (float) $shift->opening_balance + (float) $shift->total_cash_sales);

        return response()->json([
            'period' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'total_sales' => $totalSales,
            'total_cost' => $totalCost,
            'net_profit' => $totalSales - $totalCost,
            'active_services' => $activeServices,
            'cash_balance' => $cashBalance,
        ]);
    }

    /**
     * POS metrics: top products, sales by payment method, sales by document type.
     */
    public function posMetrics(Request $request): JsonResponse
    {
        [$from, $to] = $this->resolveRange($request);

        $topProducts = SaleDetail::query()
            ->join('sales', 'sales.id', '=', 'sale_details.sale_id')
            ->join('products', 'products.id', '=', 'sale_details.product_id')
            ->where('sales.status', Sale::STATUS_COMPLETED)
            ->whereBetween('sales.created_at', [$from, $to])
            ->selectRaw('products.id, products.name, SUM(sale_details.quantity) as quantity_sold, SUM(sale_details.total) as total_sold')
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('quantity_sold')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'id' => $row->id,
                'name' => $row->name,
                'quantity_sold' => (int) $row->quantity_sold,
                'total_sold' => (float) $row->total_sold,
            ]);

        $paymentMethods = SalePayment::query()
            ->join('sales', 'sales.id', '=', 'sale_payments.sale_id')
            ->where('sales.status', Sale::STATUS_COMPLETED)
            ->whereBetween('sales.created_at', [$from, $to])
            ->selectRaw('sale_payments.payment_method, SUM(sale_payments.amount) as total')
            ->groupBy('sale_payments.payment_method')
            ->get()
            ->map(fn ($row) => [
                'payment_method' => $row->payment_method,
                'total' => (float) $row->total,
            ]);

        $documentTypes = Sale::query()
            ->where('status', Sale::STATUS_COMPLETED)
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw('document_type, COUNT(*) as count, SUM(total) as total')
            ->groupBy('document_type')
            ->get()
            ->map(fn ($row) => [
                'document_type' => $row->document_type,
                'count' => (int) $row->count,
                'total' => (float) $row->total,
            ]);

        return response()->json([
            'top_products' => $topProducts,
            'payment_methods' => $paymentMethods,
            'document_types' => $documentTypes,
        ]);
    }

    /**
     * Daily sales totals for the given range, used to chart the current month.
     */
    public function dailySales(Request $request): JsonResponse
    {
        [$from, $to] = $this->resolveRange($request);

        $rows = Sale::query()
            ->where('status', Sale::STATUS_COMPLETED)
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw('DATE(created_at) as date, SUM(total) as total')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn ($row) => [
                'date' => $row->date,
                'total' => (float) $row->total,
            ]);

        return response()->json(['data' => $rows]);
    }

    /**
     * Products at or below their minimum stock threshold.
     */
    public function criticalInventory(): AnonymousResourceCollection
    {
        $products = Product::query()
            ->with(['category', 'brand'])
            ->withSum('warehouseStocks as total_stock', 'quantity')
            ->where('is_active', true)
            ->where('is_service', false)
            ->get()
            ->filter(fn (Product $product) => (int) ($product->total_stock ?? 0) <= $product->min_stock)
            ->sortBy('total_stock')
            ->values();

        return ProductResource::collection($products);
    }

    /**
     * Shared query for the "Registro de Ventas" report (accounting-style listing).
     */
    private function salesRegistryQuery(Request $request)
    {
        [$from, $to] = $this->resolveRange($request);

        return Sale::query()
            ->with('contact')
            ->where('status', Sale::STATUS_COMPLETED)
            ->whereBetween('created_at', [$from, $to])
            ->orderBy('created_at');
    }

    /**
     * Paginated preview of the sales registry.
     */
    public function salesRegistry(Request $request): AnonymousResourceCollection
    {
        $perPage = (int) $request->integer('per_page', 15);

        return SaleResource::collection($this->salesRegistryQuery($request)->paginate($perPage));
    }

    /**
     * Export the sales registry (with IGV breakdown and correlativos) as CSV.
     */
    public function exportSalesRegistry(Request $request): StreamedResponse
    {
        $sales = $this->salesRegistryQuery($request)->get();
        $filename = 'registro-ventas-'.now()->format('Ymd-His').'.csv';

        return response()->streamDownload(function () use ($sales) {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, ['Fecha', 'Tipo Comprobante', 'Serie', 'Número', 'Cliente', 'Documento', 'Op. Gravada', 'Op. Exonerada', 'IGV', 'Total']);

            foreach ($sales as $sale) {
                fputcsv($handle, CsvSanitizer::row([
                    $sale->created_at->format('Y-m-d'),
                    match ($sale->document_type) {
                        '01' => 'Factura',
                        '03' => 'Boleta',
                        default => 'Nota de Venta',
                    },
                    $sale->series,
                    str_pad((string) $sale->number, 6, '0', STR_PAD_LEFT),
                    $sale->contact?->name_or_business_name ?? 'Clientes Varios',
                    $sale->contact?->document_number ?? '-',
                    number_format((float) $sale->op_taxed, 2, '.', ''),
                    number_format((float) $sale->op_exonerated, 2, '.', ''),
                    number_format((float) $sale->igv, 2, '.', ''),
                    number_format((float) $sale->total, 2, '.', ''),
                ]));
            }

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    /**
     * Shared query for the basic valued kardex report.
     */
    private function kardexQuery(Request $request)
    {
        [$from, $to] = $this->resolveRange($request);

        $query = StockMovement::query()
            ->with(['product', 'warehouse'])
            ->whereBetween('created_at', [$from, $to])
            ->orderBy('product_id')
            ->orderBy('created_at');

        if ($productId = $request->integer('product_id')) {
            $query->where('product_id', $productId);
        }

        return $query;
    }

    /**
     * Paginated preview of the kardex.
     */
    public function kardex(Request $request): JsonResponse
    {
        $perPage = (int) $request->integer('per_page', 15);
        $movements = $this->kardexQuery($request)->paginate($perPage);

        return response()->json([
            'data' => collect($movements->items())->map(fn (StockMovement $movement) => $this->kardexRow($movement))->values(),
            'meta' => [
                'current_page' => $movements->currentPage(),
                'last_page' => $movements->lastPage(),
                'per_page' => $movements->perPage(),
                'total' => $movements->total(),
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function kardexRow(StockMovement $movement): array
    {
        $unitCost = (float) $movement->product->purchase_price;
        $signedQty = $movement->type === 'out' ? -$movement->quantity : $movement->quantity;

        return [
            'id' => $movement->id,
            'date' => $movement->created_at->toDateTimeString(),
            'product' => $movement->product->name,
            'warehouse' => $movement->warehouse->name,
            'type' => $movement->type,
            'quantity' => $movement->quantity,
            'unit_cost' => $unitCost,
            'value' => round(abs($signedQty) * $unitCost, 2),
            'reason' => $movement->reason,
        ];
    }

    /**
     * Export the basic valued kardex (Kardex valorizado básico) as CSV, with a
     * running balance per product across the exported date range.
     */
    public function exportKardex(Request $request): StreamedResponse
    {
        $movements = $this->kardexQuery($request)->get();
        $filename = 'kardex-'.now()->format('Ymd-His').'.csv';

        return response()->streamDownload(function () use ($movements) {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, ['Fecha', 'Producto', 'Almacén', 'Tipo', 'Cantidad', 'Costo Unit.', 'Valor Movimiento', 'Saldo Cantidad', 'Saldo Valorizado', 'Motivo']);

            $balances = [];

            foreach ($movements as $movement) {
                $unitCost = (float) $movement->product->purchase_price;
                $signedQty = $movement->type === 'out' ? -$movement->quantity : $movement->quantity;

                $balances[$movement->product_id] = $movement->type === 'adjustment'
                    ? $movement->quantity
                    : ($balances[$movement->product_id] ?? 0) + $signedQty;

                fputcsv($handle, CsvSanitizer::row([
                    $movement->created_at->format('Y-m-d H:i'),
                    $movement->product->name,
                    $movement->warehouse->name,
                    match ($movement->type) {
                        'in' => 'Entrada',
                        'out' => 'Salida',
                        default => 'Ajuste',
                    },
                    $movement->quantity,
                    number_format($unitCost, 2, '.', ''),
                    number_format(abs($signedQty) * $unitCost, 2, '.', ''),
                    $balances[$movement->product_id],
                    number_format($balances[$movement->product_id] * $unitCost, 2, '.', ''),
                    $movement->reason,
                ]));
            }

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }
}
