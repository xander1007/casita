<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TechnicalService extends Model
{
    public const DEVICE_TYPES = ['laptop', 'desktop', 'printer', 'monitor', 'other'];

    public const STATUS_RECEIVED = 'received';

    public const STATUS_DIAGNOSING = 'diagnosing';

    public const STATUS_REPAIRED = 'repaired';

    public const STATUS_DELIVERED = 'delivered';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUSES = [
        self::STATUS_RECEIVED,
        self::STATUS_DIAGNOSING,
        self::STATUS_REPAIRED,
        self::STATUS_DELIVERED,
        self::STATUS_CANCELLED,
    ];

    protected $fillable = [
        'code',
        'customer_id',
        'technician_id',
        'device_type',
        'brand',
        'model',
        'serial_number',
        'device_password',
        'accessories',
        'reported_issue',
        'diagnosis',
        'status',
        'estimated_cost',
        'final_cost',
        'sale_id',
        'received_at',
        'delivered_at',
    ];

    protected function casts(): array
    {
        return [
            'estimated_cost' => 'decimal:2',
            'final_cost' => 'decimal:2',
            'received_at' => 'datetime',
            'delivered_at' => 'datetime',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'customer_id');
    }

    public function technician(): BelongsTo
    {
        return $this->belongsTo(User::class, 'technician_id');
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(TechnicalServiceItem::class);
    }
}
