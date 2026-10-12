<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentSeries extends Model
{
    use HasFactory;

    /**
     * Document types: SUNAT Catalog No. 01 codes plus the internal "NV" (Nota de Venta).
     */
    public const DOCUMENT_TYPES = ['01', '03', 'NV'];

    protected $fillable = [
        'cash_register_id',
        'document_type',
        'series',
        'current_correlative',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'current_correlative' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function cashRegister(): BelongsTo
    {
        return $this->belongsTo(CashRegister::class);
    }
}
