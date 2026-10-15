<?php

namespace App\Models;

use App\Models\Concerns\CaseSensitiveSearch;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductSerial extends Model
{
    use CaseSensitiveSearch;

    public const STATUSES = ['available', 'sold', 'reserved', 'defective'];

    protected $fillable = ['product_id', 'warehouse_id', 'purchase_detail_id', 'serial_number', 'status', 'notes'];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function purchaseDetail(): BelongsTo
    {
        return $this->belongsTo(PurchaseDetail::class);
    }
}
