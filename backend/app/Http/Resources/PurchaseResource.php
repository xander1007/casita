<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'document_type' => $this->document_type,
            'document_number' => $this->document_number,
            'purchase_date' => $this->purchase_date?->toDateString(),
            'subtotal' => (float) $this->subtotal,
            'igv' => (float) $this->igv,
            'total' => (float) $this->total,
            'status' => $this->status,
            'annulled_at' => $this->annulled_at,
            'annulment_reason' => $this->annulment_reason,
            'supplier' => $this->whenLoaded('supplier', fn () => $this->supplier ? new ContactResource($this->supplier) : null),
            'warehouse' => $this->whenLoaded('warehouse', fn () => $this->warehouse ? new WarehouseResource($this->warehouse) : null),
            'user' => $this->whenLoaded('user', fn () => $this->user?->name),
            'created_at' => $this->created_at,
            'details' => PurchaseDetailResource::collection($this->whenLoaded('details')),
        ];
    }
}
