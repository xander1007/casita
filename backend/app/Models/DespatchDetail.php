<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DespatchDetail extends Model
{
    protected $fillable = [
        'despatch_id',
        'product_id',
        'code',
        'description',
        'quantity',
        'unit_of_measure',
        'weight',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:3',
            'weight' => 'decimal:2',
        ];
    }

    public function despatch(): BelongsTo
    {
        return $this->belongsTo(Despatch::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
