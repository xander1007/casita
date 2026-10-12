<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Despatch extends Model
{
    public const STATUS_ISSUED = 'issued';

    public const STATUS_ANNULLED = 'annulled';

    /**
     * SUNAT Catalog No. 20 (motivo de traslado) — the subset this system supports.
     */
    public const TRANSPORT_REASONS = [
        'Venta',
        'Traslado entre establecimientos de la misma empresa',
        'Traslado por emisor itinerante',
        'Otros',
    ];

    protected $fillable = [
        'series',
        'number',
        'contact_id',
        'reference_sale_id',
        'user_id',
        'starting_address',
        'arrival_address',
        'transport_reason',
        'gross_weight',
        'package_count',
        'vehicle_plate',
        'vehicle_brand',
        'driver_dni',
        'driver_license',
        'order_number',
        'observations',
        'status',
        'emission_date',
        'transport_start_date',
        'delivery_date',
    ];

    protected function casts(): array
    {
        return [
            'number' => 'integer',
            'gross_weight' => 'decimal:2',
            'package_count' => 'integer',
            'emission_date' => 'date',
            'transport_start_date' => 'date',
            'delivery_date' => 'date',
        ];
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function referenceSale(): BelongsTo
    {
        return $this->belongsTo(Sale::class, 'reference_sale_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function details(): HasMany
    {
        return $this->hasMany(DespatchDetail::class);
    }
}
