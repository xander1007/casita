<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends Model
{
    public const DOCUMENT_TYPES = ['01', '03', 'NV'];

    public const PAYMENT_STATUSES = ['paid', 'pending'];

    public const PAYMENT_CONDITIONS = ['CONTADO', 'CRÉDITO'];

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_ANNULLED = 'annulled';

    protected $fillable = [
        'cash_shift_id',
        'contact_id',
        'user_id',
        'document_type',
        'series',
        'number',
        'op_taxed',
        'op_exonerated',
        'igv',
        'total',
        'amount_in_words',
        'payment_status',
        'payment_condition',
        'status',
        'annulled_at',
        'annulled_by',
        'annulment_reason',
    ];

    protected function casts(): array
    {
        return [
            'number' => 'integer',
            'op_taxed' => 'decimal:2',
            'op_exonerated' => 'decimal:2',
            'igv' => 'decimal:2',
            'total' => 'decimal:2',
            'annulled_at' => 'datetime',
        ];
    }

    public function cashShift(): BelongsTo
    {
        return $this->belongsTo(CashShift::class);
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
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
        return $this->hasMany(SaleDetail::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SalePayment::class);
    }
}
