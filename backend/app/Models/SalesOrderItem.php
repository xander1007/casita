<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalesOrderItem extends Model
{
    protected $fillable = [
        'sales_order_id',
        'product_id',
        'quantity',
        'unit_price',
        'subtotal',
        'igv',
        'total',
        'reserved_quantity',
        'on_demand_quantity',
        'received_quantity',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_price' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'igv' => 'decimal:2',
            'total' => 'decimal:2',
            'reserved_quantity' => 'integer',
            'on_demand_quantity' => 'integer',
            'received_quantity' => 'integer',
        ];
    }

    public function isOnDemand(): bool
    {
        return $this->on_demand_quantity > 0;
    }

    /**
     * On-demand units still to be bought / received for this line.
     */
    public function pendingQuantity(): int
    {
        return max(0, $this->on_demand_quantity - $this->received_quantity);
    }

    /**
     * Units currently held in the warehouse for this line.
     */
    public function heldQuantity(): int
    {
        return $this->reserved_quantity + $this->received_quantity;
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class, 'sales_order_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(PurchaseAllocation::class);
    }
}
