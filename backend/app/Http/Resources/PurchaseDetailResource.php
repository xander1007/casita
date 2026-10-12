<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseDetailResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'product_name' => $this->whenLoaded('product', fn () => $this->product?->name),
            'requires_serial' => $this->whenLoaded('product', fn () => (bool) $this->product?->requires_serial),
            'quantity' => $this->quantity,
            'unit_cost' => (float) $this->unit_cost,
            'subtotal' => (float) $this->subtotal,
            'serials' => ProductSerialResource::collection($this->whenLoaded('serials')),
        ];
    }
}
