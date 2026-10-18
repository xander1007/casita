<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuotationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'issue_date' => $this->issue_date?->toDateString(),
            'valid_until' => $this->valid_until?->toDateString(),
            'is_expired' => $this->isExpired(),
            'op_taxed' => (float) $this->op_taxed,
            'op_exonerated' => (float) $this->op_exonerated,
            'igv' => (float) $this->igv,
            'total' => (float) $this->total,
            'status' => $this->status,
            'notes' => $this->notes,
            'converted_at' => $this->converted_at,
            'contact' => $this->whenLoaded('contact', fn () => $this->contact ? new ContactResource($this->contact) : null),
            'warehouse' => $this->whenLoaded('warehouse', fn () => $this->warehouse ? new WarehouseResource($this->warehouse) : null),
            'user' => $this->whenLoaded('user', fn () => $this->user?->name),
            'sale' => $this->whenLoaded('sale', fn () => $this->sale ? [
                'id' => $this->sale->id,
                'document_number' => sprintf('%s-%s', $this->sale->series, str_pad((string) $this->sale->number, 6, '0', STR_PAD_LEFT)),
            ] : null),
            'sales_order' => $this->whenLoaded('salesOrder', fn () => $this->salesOrder ? [
                'id' => $this->salesOrder->id,
                'code' => $this->salesOrder->code,
            ] : null),
            'created_at' => $this->created_at,
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($item) => [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'product' => $item->relationLoaded('product') ? new ProductResource($item->product) : null,
                'quantity' => $item->quantity,
                'unit_price' => (float) $item->unit_price,
                'subtotal' => (float) $item->subtotal,
                'igv' => (float) $item->igv,
                'total' => (float) $item->total,
            ])),
        ];
    }
}
