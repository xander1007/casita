<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CashShift extends Model
{
    public const STATUS_OPEN = 'open';

    public const STATUS_CLOSED = 'closed';

    protected $fillable = [
        'cash_register_id',
        'user_id',
        'opening_balance',
        'closing_balance',
        'expected_balance',
        'difference',
        'total_cash_sales',
        'total_card_sales',
        'total_transfer_sales',
        'total_yape_plin_sales',
        'status',
        'notes',
        'opened_at',
        'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'opening_balance' => 'decimal:2',
            'closing_balance' => 'decimal:2',
            'expected_balance' => 'decimal:2',
            'difference' => 'decimal:2',
            'total_cash_sales' => 'decimal:2',
            'total_card_sales' => 'decimal:2',
            'total_transfer_sales' => 'decimal:2',
            'total_yape_plin_sales' => 'decimal:2',
            'opened_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    public function cashRegister(): BelongsTo
    {
        return $this->belongsTo(CashRegister::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
