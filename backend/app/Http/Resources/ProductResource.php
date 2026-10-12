<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $totalStock = (int) ($this->total_stock ?? 0);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'internal_code' => $this->internal_code,
            'barcode' => $this->barcode,
            'description' => $this->description,
            'purchase_price' => (float) $this->purchase_price,
            'sale_price' => (float) $this->sale_price,
            'unit_of_measure' => $this->unit_of_measure,
            'igv_affectation' => $this->igv_affectation,
            'min_stock' => $this->min_stock,
            'requires_serial' => (bool) $this->requires_serial,
            'is_service' => (bool) $this->is_service,
            'is_active' => (bool) $this->is_active,
            'category' => $this->whenLoaded('category', fn () => $this->category ? new CategoryResource($this->category) : null),
            'brand' => $this->whenLoaded('brand', fn () => $this->brand ? new BrandResource($this->brand) : null),
            'total_stock' => $totalStock,
            'is_low_stock' => ! $this->is_service && $totalStock <= $this->min_stock,
            'serials_count' => $this->when(isset($this->serials_count), fn () => (int) $this->serials_count),
        ];
    }
}
