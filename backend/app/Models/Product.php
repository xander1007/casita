<?php

namespace App\Models;

use App\Models\Concerns\CaseSensitiveSearch;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use CaseSensitiveSearch, HasFactory;

    /**
     * A short, common subset of SUNAT Catalog No. 03 (unidades de medida).
     */
    public const UNITS_OF_MEASURE = ['NIU', 'ZZ', 'KGM', 'LTR', 'MTR', 'PAQ', 'BX', 'GLL'];

    /**
     * SUNAT Catalog No. 07 (afectación al IGV).
     */
    public const IGV_AFFECTATIONS = ['10', '20', '30', '40'];

    protected $fillable = [
        'category_id',
        'brand_id',
        'name',
        'internal_code',
        'barcode',
        'description',
        'purchase_price',
        'sale_price',
        'unit_of_measure',
        'igv_affectation',
        'min_stock',
        'requires_serial',
        'is_service',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'purchase_price' => 'decimal:2',
            'sale_price' => 'decimal:2',
            'min_stock' => 'integer',
            'requires_serial' => 'boolean',
            'is_service' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function serials(): HasMany
    {
        return $this->hasMany(ProductSerial::class);
    }

    public function warehouseStocks(): HasMany
    {
        return $this->hasMany(WarehouseStock::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    /**
     * Adds total_stock and reserved_stock (units held by sales orders), for one
     * warehouse or across all of them. ProductResource derives available_stock.
     */
    public function scopeWithStock(Builder $query, ?int $warehouseId = null): Builder
    {
        $inWarehouse = fn ($stocks) => $stocks->when($warehouseId, fn ($s) => $s->where('warehouse_id', $warehouseId));

        return $query
            ->withSum(['warehouseStocks as total_stock' => $inWarehouse], 'quantity')
            ->withSum(['warehouseStocks as reserved_stock' => $inWarehouse], 'reserved_quantity');
    }
}
