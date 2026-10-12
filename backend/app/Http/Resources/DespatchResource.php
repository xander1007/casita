<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DespatchResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'series' => $this->series,
            'number' => $this->number,
            'document_number' => sprintf('%s-%s', $this->series, str_pad((string) $this->number, 8, '0', STR_PAD_LEFT)),
            'contact' => $this->whenLoaded('contact', fn () => $this->contact ? new ContactResource($this->contact) : null),
            'reference_sale' => $this->whenLoaded('referenceSale', fn () => $this->referenceSale ? [
                'id' => $this->referenceSale->id,
                'document_number' => sprintf(
                    '%s-%s',
                    $this->referenceSale->series,
                    str_pad((string) $this->referenceSale->number, 6, '0', STR_PAD_LEFT),
                ),
            ] : null),
            'starting_address' => $this->starting_address,
            'arrival_address' => $this->arrival_address,
            'transport_reason' => $this->transport_reason,
            'gross_weight' => $this->gross_weight !== null ? (float) $this->gross_weight : null,
            'package_count' => $this->package_count,
            'vehicle_plate' => $this->vehicle_plate,
            'vehicle_brand' => $this->vehicle_brand,
            'driver_dni' => $this->driver_dni,
            'driver_license' => $this->driver_license,
            'order_number' => $this->order_number,
            'observations' => $this->observations,
            'status' => $this->status,
            'emission_date' => $this->emission_date,
            'transport_start_date' => $this->transport_start_date,
            'delivery_date' => $this->delivery_date,
            'user' => $this->whenLoaded('user', fn () => $this->user?->name),
            'details' => DespatchDetailResource::collection($this->whenLoaded('details')),
            'created_at' => $this->created_at,
        ];
    }
}
