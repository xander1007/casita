<?php

namespace App\Services\Sales;

use App\Models\PurchaseAllocation;
use App\Models\PurchaseDetail;
use App\Models\Quotation;
use App\Models\Sale;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\User;
use App\Models\WarehouseStock;
use App\Support\SaleLineCalculator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Sales orders and the stock reservations behind them.
 *
 * Invariant: for every open order line, heldQuantity() (reserved + received)
 * units are counted in warehouse_stocks.reserved_quantity of the order's
 * warehouse. Every method that changes one side changes the other in the
 * same transaction.
 */
class SalesOrderService
{
    /**
     * Register an order. Each line takes what it can from available stock;
     * the rest is marked "a demanda" and waits for a back-to-back purchase.
     *
     * @param  array{contact_id: int, warehouse_id: int, order_date: string, expected_date?: ?string, notes?: ?string, items: array<int, array{product_id: int, quantity: int, unit_price: float}>}  $data
     */
    public function create(array $data, User $user, ?Quotation $quotation = null): SalesOrder
    {
        $built = SaleLineCalculator::build($data['items']);

        return DB::transaction(function () use ($data, $user, $quotation, $built) {
            $order = SalesOrder::create([
                'code' => $this->nextCode(),
                'contact_id' => $data['contact_id'],
                'warehouse_id' => $data['warehouse_id'],
                'user_id' => $user->id,
                'quotation_id' => $quotation?->id,
                'order_date' => $data['order_date'],
                'expected_date' => $data['expected_date'] ?? null,
                'notes' => $data['notes'] ?? null,
                'status' => SalesOrder::STATUS_PENDING,
                ...$built['totals'],
            ]);

            foreach ($built['lines'] as $line) {
                $product = $line['product'];
                $reserved = 0;

                if (! $product->is_service) {
                    $stock = $this->lockedStock($product->id, $order->warehouse_id);
                    $reserved = min($stock?->available() ?? 0, $line['quantity']);

                    if ($reserved > 0) {
                        $stock->increment('reserved_quantity', $reserved);
                    }
                }

                SalesOrderItem::create([
                    'sales_order_id' => $order->id,
                    'product_id' => $product->id,
                    'quantity' => $line['quantity'],
                    'unit_price' => $line['unit_price'],
                    'subtotal' => $line['subtotal'],
                    'igv' => $line['igv'],
                    'total' => $line['total'],
                    'reserved_quantity' => $reserved,
                    'on_demand_quantity' => $product->is_service ? 0 : $line['quantity'] - $reserved,
                    'received_quantity' => 0,
                ]);
            }

            $this->refreshStatus($order);

            return $order;
        });
    }

    /**
     * Cancel an open order and free every unit it was holding.
     */
    public function cancel(SalesOrder $order, User $user, string $reason): void
    {
        DB::transaction(function () use ($order, $user, $reason) {
            $order = SalesOrder::query()->lockForUpdate()->findOrFail($order->id);

            if (! $order->isOpen()) {
                throw ValidationException::withMessages(['order' => 'Solo se pueden cancelar pedidos pendientes o listos.']);
            }

            $this->releaseHeldStock($order);

            $order->update([
                'status' => SalesOrder::STATUS_CANCELLED,
                'cancelled_at' => now(),
                'cancelled_by' => $user->id,
                'cancellation_reason' => $reason,
            ]);
        });
    }

    /**
     * Called from the POS transaction before stock is decremented: frees the
     * order's reservation so the sale can consume those same units.
     */
    public function releaseForSale(SalesOrder $order, int $saleWarehouseId): SalesOrder
    {
        $order = SalesOrder::query()->lockForUpdate()->findOrFail($order->id);

        if ($order->status !== SalesOrder::STATUS_READY) {
            throw ValidationException::withMessages([
                'sales_order_id' => $order->status === SalesOrder::STATUS_PENDING
                    ? "El pedido {$order->code} aún tiene productos a demanda por recibir."
                    : "El pedido {$order->code} ya no está disponible para facturar.",
            ]);
        }

        if ($order->warehouse_id !== $saleWarehouseId) {
            throw ValidationException::withMessages([
                'sales_order_id' => "El stock del pedido {$order->code} está reservado en otro almacén. Factúralo desde una caja de ese almacén.",
            ]);
        }

        $this->releaseHeldStock($order);

        return $order;
    }

    public function markCompleted(SalesOrder $order, Sale $sale): void
    {
        $order->update([
            'status' => SalesOrder::STATUS_COMPLETED,
            'sale_id' => $sale->id,
            'completed_at' => now(),
        ]);
    }

    /**
     * Called from the purchase transaction after stock was incremented:
     * reserves the received units for the order lines they were bought for.
     *
     * @param  array<int, array{sales_order_item_id: int, quantity: int}>  $allocations
     */
    public function allocateFromPurchase(PurchaseDetail $detail, int $warehouseId, array $allocations): void
    {
        foreach ($allocations as $allocation) {
            $item = SalesOrderItem::query()->with('order')->lockForUpdate()->find($allocation['sales_order_item_id']);
            $quantity = (int) $allocation['quantity'];

            if (! $item || $item->product_id !== $detail->product_id) {
                throw ValidationException::withMessages(['items' => 'Una de las líneas de pedido no corresponde al producto comprado.']);
            }

            if ($item->order->status !== SalesOrder::STATUS_PENDING) {
                throw ValidationException::withMessages(['items' => "El pedido {$item->order->code} ya no espera productos a demanda."]);
            }

            if ($item->order->warehouse_id !== $warehouseId) {
                throw ValidationException::withMessages([
                    'items' => "El pedido {$item->order->code} debe recibirse en el almacén {$item->order->warehouse?->name}.",
                ]);
            }

            if ($quantity > $item->pendingQuantity()) {
                throw ValidationException::withMessages([
                    'items' => "El pedido {$item->order->code} solo necesita {$item->pendingQuantity()} unidad(es) de este producto.",
                ]);
            }

            $this->lockedStock($item->product_id, $warehouseId)->increment('reserved_quantity', $quantity);

            PurchaseAllocation::create([
                'purchase_detail_id' => $detail->id,
                'sales_order_item_id' => $item->id,
                'quantity' => $quantity,
            ]);

            $item->increment('received_quantity', $quantity);
            $this->refreshStatus($item->order);
        }
    }

    /**
     * Called from the purchase-annulment transaction before stock is
     * decremented: the units go back to "pending" on their order lines.
     * Orders already invoiced or cancelled hold nothing, so they are skipped.
     */
    public function revertPurchaseAllocations(PurchaseDetail $detail, int $warehouseId): void
    {
        $detail->load('allocations.salesOrderItem.order');

        foreach ($detail->allocations as $allocation) {
            $item = $allocation->salesOrderItem;

            if ($item->order->isOpen()) {
                $stock = $this->lockedStock($item->product_id, $warehouseId);
                $stock->decrement('reserved_quantity', min($allocation->quantity, $stock->reserved_quantity));
                $item->decrement('received_quantity', $allocation->quantity);
                $this->refreshStatus($item->order);
            }

            $allocation->delete();
        }
    }

    /**
     * Open on-demand lines still waiting for stock, with the last supplier
     * each product was bought from as the suggested supplier.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function purchaseSuggestions(?int $warehouseId = null): Collection
    {
        $items = SalesOrderItem::query()
            ->with(['product', 'order.contact', 'order.warehouse'])
            ->whereColumn('received_quantity', '<', 'on_demand_quantity')
            ->whereHas('order', fn ($q) => $q->where('status', SalesOrder::STATUS_PENDING)
                ->when($warehouseId, fn ($w) => $w->where('warehouse_id', $warehouseId)))
            ->get()
            ->sortBy(fn (SalesOrderItem $item) => [$item->order->expected_date?->timestamp ?? PHP_INT_MAX, $item->id])
            ->values();

        $lastSuppliers = $this->lastSuppliers($items->pluck('product_id')->unique()->all());

        return $items->map(fn (SalesOrderItem $item) => [
            'sales_order_item_id' => $item->id,
            'sales_order_id' => $item->sales_order_id,
            'order_code' => $item->order->code,
            'expected_date' => $item->order->expected_date?->toDateString(),
            'customer' => $item->order->contact?->name_or_business_name,
            'warehouse_id' => $item->order->warehouse_id,
            'warehouse' => $item->order->warehouse?->name,
            'product_id' => $item->product_id,
            'product_name' => $item->product->name,
            'internal_code' => $item->product->internal_code,
            'requires_serial' => (bool) $item->product->requires_serial,
            'purchase_price' => (float) $item->product->purchase_price,
            'quantity_to_buy' => $item->pendingQuantity(),
            'suggested_supplier' => $lastSuppliers[$item->product_id] ?? null,
        ]);
    }

    private function refreshStatus(SalesOrder $order): void
    {
        $hasPending = $order->items()->get()->contains(fn (SalesOrderItem $item) => $item->pendingQuantity() > 0);

        $order->update(['status' => $hasPending ? SalesOrder::STATUS_PENDING : SalesOrder::STATUS_READY]);
    }

    private function releaseHeldStock(SalesOrder $order): void
    {
        foreach ($order->items()->with('product')->get() as $item) {
            $held = $item->heldQuantity();

            if ($held === 0 || $item->product->is_service) {
                continue;
            }

            $stock = $this->lockedStock($item->product_id, $order->warehouse_id);

            if ($stock) {
                $stock->decrement('reserved_quantity', min($held, $stock->reserved_quantity));
            }
        }
    }

    private function lockedStock(int $productId, int $warehouseId): ?WarehouseStock
    {
        return WarehouseStock::query()
            ->where('product_id', $productId)
            ->where('warehouse_id', $warehouseId)
            ->lockForUpdate()
            ->first();
    }

    /**
     * @param  list<int>  $productIds
     * @return array<int, array{id: int, name: string, document_number: string}>
     */
    private function lastSuppliers(array $productIds): array
    {
        if ($productIds === []) {
            return [];
        }

        return PurchaseDetail::query()
            ->join('purchases', 'purchases.id', '=', 'purchase_details.purchase_id')
            ->join('contacts', 'contacts.id', '=', 'purchases.supplier_id')
            ->whereIn('purchase_details.product_id', $productIds)
            ->where('purchases.status', 'completed')
            ->orderByDesc('purchases.purchase_date')
            ->orderByDesc('purchases.id')
            ->get(['purchase_details.product_id', 'contacts.id', 'contacts.name_or_business_name', 'contacts.document_number'])
            ->unique('product_id')
            ->mapWithKeys(fn ($row) => [$row->product_id => [
                'id' => $row->id,
                'name' => $row->name_or_business_name,
                'document_number' => $row->document_number,
            ]])
            ->all();
    }

    private function nextCode(): string
    {
        $last = SalesOrder::query()->lockForUpdate()->orderByDesc('id')->first();
        $next = $last ? ((int) substr($last->code, 4)) + 1 : 1;

        return 'PED-'.str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }
}
