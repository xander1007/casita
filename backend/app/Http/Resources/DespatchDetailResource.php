<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DespatchDetailResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'code' => $this->code,
            'description' => $this->description,
            'quantity' => (float) $this->quantity,
            'unit_of_measure' => $this->unit_of_measure,
            'weight' => $this->weight !== null ? (float) $this->weight : null,
        ];
    }
}
