<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductSerialResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'serial_number' => $this->serial_number,
            'status' => $this->status,
            'notes' => $this->notes,
            'warehouse' => $this->whenLoaded('warehouse', fn () => $this->warehouse ? new WarehouseResource($this->warehouse) : null),
            'created_at' => $this->created_at,
        ];
    }
}
