<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WarehouseStock extends Model
{
    protected $fillable = ['product_id', 'warehouse_id', 'quantity', 'reserved_quantity'];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'reserved_quantity' => 'integer',
        ];
    }

    /**
     * Units that can be sold or consumed: physical stock minus what is
     * already committed to sales orders.
     */
    public function available(): int
    {
        return max(0, $this->quantity - $this->reserved_quantity);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }
}
