<?php

namespace App\Services;

use App\Models\GovernmentPurchaseOrder;
use App\Models\WarehouseStock;

/**
 * Compares the items requested in a government purchase order against the
 * current warehouse stock, and works out what still has to be bought to
 * complete the delivery.
 */
class GovernmentOrderStockReport
{
    public const LINE_COMPLETE = 'complete';

    public const LINE_PARTIAL = 'partial';

    public const LINE_MISSING = 'missing';

    public const LINE_SERVICE = 'service';

    /**
     * @return array{warehouse: ?array{id: int, name: string}, generated_at: string, lines: list<array<string, mixed>>, summary: array<string, mixed>}
     */
    public function build(GovernmentPurchaseOrder $order): array
    {
        $order->loadMissing(['items.product', 'warehouse']);

        // The same product may be listed on several lines of the OC: report it once.
        $requested = $order->items
            ->groupBy('product_id')
            ->map(fn ($items) => [
                'product' => $items->first()->product,
                'quantity' => (int) $items->sum('quantity'),
            ]);

        $stocks = WarehouseStock::query()
            ->with('warehouse')
            ->whereIn('product_id', $requested->keys())
            ->when($order->warehouse_id, fn ($q) => $q->where('warehouse_id', $order->warehouse_id))
            ->get()
            ->groupBy('product_id');

        $lines = $requested->map(function (array $entry, int $productId) use ($stocks) {
            $product = $entry['product'];
            $required = $entry['quantity'];
            $productStocks = $stocks->get($productId, collect());

            if ($product->is_service) {
                $available = $required;
                $status = self::LINE_SERVICE;
            } else {
                // Units reserved for sales orders and negative balances never count as available.
                $available = (int) $productStocks->sum(fn (WarehouseStock $stock) => $stock->available());
                $status = match (true) {
                    $available >= $required => self::LINE_COMPLETE,
                    $available > 0 => self::LINE_PARTIAL,
                    default => self::LINE_MISSING,
                };
            }

            $toBuy = max(0, $required - $available);
            $unitCost = (float) $product->purchase_price;

            return [
                'product_id' => $productId,
                'internal_code' => $product->internal_code,
                'product_name' => $product->name,
                'unit_of_measure' => $product->unit_of_measure,
                'is_service' => (bool) $product->is_service,
                'required' => $required,
                'available' => $product->is_service ? null : $available,
                'covered' => min($required, $available),
                'to_buy' => $toBuy,
                'unit_cost' => $unitCost,
                'estimated_cost' => round($toBuy * $unitCost, 2),
                'status' => $status,
                'stock_by_warehouse' => $productStocks
                    ->filter(fn (WarehouseStock $stock) => $stock->available() !== 0)
                    ->map(fn (WarehouseStock $stock) => [
                        'warehouse_id' => $stock->warehouse_id,
                        'warehouse' => $stock->warehouse?->name,
                        'quantity' => $stock->available(),
                    ])
                    ->values(),
            ];
        })->values();

        $toBuyLines = $lines->where('to_buy', '>', 0);

        return [
            'warehouse' => $order->warehouse ? ['id' => $order->warehouse->id, 'name' => $order->warehouse->name] : null,
            'generated_at' => now()->toIso8601String(),
            'lines' => $lines->all(),
            'summary' => [
                'total_lines' => $lines->count(),
                'complete_lines' => $lines->whereIn('status', [self::LINE_COMPLETE, self::LINE_SERVICE])->count(),
                'lines_to_buy' => $toBuyLines->count(),
                'units_required' => $lines->sum('required'),
                'units_covered' => $lines->sum('covered'),
                'units_to_buy' => $lines->sum('to_buy'),
                'estimated_purchase_cost' => round($toBuyLines->sum('estimated_cost'), 2),
                'can_fulfill' => $toBuyLines->isEmpty(),
            ],
        ];
    }
}
