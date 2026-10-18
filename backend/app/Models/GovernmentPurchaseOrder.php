<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Orden de Compra (OC) emitida por una entidad del Estado.
 */
class GovernmentPurchaseOrder extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_DELIVERED = 'delivered';

    public const STATUS_ANNULLED = 'annulled';

    public const STATUSES = [self::STATUS_PENDING, self::STATUS_DELIVERED, self::STATUS_ANNULLED];

    protected $fillable = [
        'contact_id',
        'warehouse_id',
        'user_id',
        'order_number',
        'siaf_number',
        'issue_date',
        'delivery_deadline',
        'total',
        'status',
        'notes',
        'annulled_at',
        'annulled_by',
        'annulment_reason',
    ];

    protected function casts(): array
    {
        return [
            'issue_date' => 'date',
            'delivery_deadline' => 'date',
            'total' => 'decimal:2',
            'annulled_at' => 'datetime',
        ];
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    /**
     * Warehouse the order will be fulfilled from; null means "any warehouse".
     */
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

    public function items(): HasMany
    {
        return $this->hasMany(GovernmentPurchaseOrderItem::class);
    }
}
