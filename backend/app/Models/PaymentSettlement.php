<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Cancelación (pago) de un comprobante: factura, nota de crédito o letra.
 */
class PaymentSettlement extends Model
{
    public const DOCUMENT_TYPES = ['factura', 'nota_credito', 'letra'];

    public const PAYMENT_METHODS = ['transfer', 'deposit', 'check', 'cash', 'card', 'yape_plin'];

    public const CURRENCIES = ['PEN', 'USD'];

    public const STATUS_REGISTERED = 'registered';

    public const STATUS_ANNULLED = 'annulled';

    protected $fillable = [
        'contact_id',
        'user_id',
        'document_type',
        'document_number',
        'currency',
        'amount',
        'operation_number',
        'payment_date',
        'payment_method',
        'bank',
        'account',
        'notes',
        'status',
        'annulled_at',
        'annulled_by',
        'annulment_reason',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'payment_date' => 'date',
            'annulled_at' => 'datetime',
        ];
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
}
