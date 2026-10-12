<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Purchase extends Model
{
    public const DOCUMENT_TYPES = ['factura', 'boleta'];

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_ANNULLED = 'annulled';

    protected $fillable = [
        'supplier_id',
        'warehouse_id',
        'user_id',
        'document_type',
        'document_number',
        'purchase_date',
        'subtotal',
        'igv',
        'total',
        'status',
        'annulled_at',
        'annulled_by',
        'annulment_reason',
    ];

    protected function casts(): array
    {
        return [
            'purchase_date' => 'date',
            'subtotal' => 'decimal:2',
            'igv' => 'decimal:2',
            'total' => 'decimal:2',
            'annulled_at' => 'datetime',
        ];
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'supplier_id');
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function annulledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'annulled_by');
    }

    public function details(): HasMany
    {
        return $this->hasMany(PurchaseDetail::class);
    }
}
