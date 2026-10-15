<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Pedido de venta. Reserves stock for the customer; lines without stock are
 * handled "a demanda" and wait for a back-to-back purchase.
 */
class SalesOrder extends Model
{
    /** Waiting for on-demand units to arrive. */
    public const STATUS_PENDING = 'pending';

    /** Every unit is reserved in the warehouse: it can be invoiced. */
    public const STATUS_READY = 'ready';

    /** Invoiced through the POS. */
    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'code',
        'contact_id',
        'warehouse_id',
        'user_id',
        'quotation_id',
        'order_date',
        'expected_date',
        'op_taxed',
        'op_exonerated',
        'igv',
        'total',
        'status',
        'notes',
        'sale_id',
        'completed_at',
        'cancelled_at',
        'cancelled_by',
        'cancellation_reason',
    ];

    protected function casts(): array
    {
        return [
            'order_date' => 'date',
            'expected_date' => 'date',
            'op_taxed' => 'decimal:2',
            'op_exonerated' => 'decimal:2',
            'igv' => 'decimal:2',
            'total' => 'decimal:2',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function isOpen(): bool
    {
        return in_array($this->status, [self::STATUS_PENDING, self::STATUS_READY], true);
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(SalesOrderItem::class);
    }
}
