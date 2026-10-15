<?php

namespace App\Http\Resources;

use App\Models\SalesOrderItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SalesOrderResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'order_date' => $this->order_date?->toDateString(),
            'expected_date' => $this->expected_date?->toDateString(),
            'op_taxed' => (float) $this->op_taxed,
            'op_exonerated' => (float) $this->op_exonerated,
            'igv' => (float) $this->igv,
            'total' => (float) $this->total,
            'status' => $this->status,
            'notes' => $this->notes,
            'completed_at' => $this->completed_at,
            'cancelled_at' => $this->cancelled_at,
            'cancellation_reason' => $this->cancellation_reason,
            'has_on_demand' => $this->whenLoaded('items', fn () => $this->items->contains(fn (SalesOrderItem $i) => $i->isOnDemand())),
            'contact' => $this->whenLoaded('contact', fn () => $this->contact ? new ContactResource($this->contact) : null),
            'warehouse' => $this->whenLoaded('warehouse', fn () => $this->warehouse ? new WarehouseResource($this->warehouse) : null),
            'user' => $this->whenLoaded('user', fn () => $this->user?->name),
            'quotation' => $this->whenLoaded('quotation', fn () => $this->quotation ? [
                'id' => $this->quotation->id,
                'code' => $this->quotation->code,
            ] : null),
            'sale' => $this->whenLoaded('sale', fn () => $this->sale ? [
                'id' => $this->sale->id,
                'document_number' => sprintf('%s-%s', $this->sale->series, str_pad((string) $this->sale->number, 6, '0', STR_PAD_LEFT)),
            ] : null),
            'created_at' => $this->created_at,
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn (SalesOrderItem $item) => [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'product' => $item->relationLoaded('product') ? new ProductResource($item->product) : null,
                'quantity' => $item->quantity,
                'unit_price' => (float) $item->unit_price,
                'subtotal' => (float) $item->subtotal,
                'igv' => (float) $item->igv,
                'total' => (float) $item->total,
                'reserved_quantity' => $item->reserved_quantity,
                'on_demand_quantity' => $item->on_demand_quantity,
                'received_quantity' => $item->received_quantity,
                'pending_quantity' => $item->pendingQuantity(),
                'is_on_demand' => $item->isOnDemand(),
                'purchases' => $item->relationLoaded('allocations')
                    ? $item->allocations->map(fn ($allocation) => [
                        'purchase_id' => $allocation->purchaseDetail?->purchase_id,
                        'document_number' => $allocation->purchaseDetail?->purchase?->document_number,
                        'supplier' => $allocation->purchaseDetail?->purchase?->supplier?->name_or_business_name,
                        'quantity' => $allocation->quantity,
                    ])
                    : [],
            ])),
        ];
    }
}
