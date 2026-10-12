<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'document_type' => $this->document_type,
            'series' => $this->series,
            'number' => $this->number,
            'document_number' => sprintf('%s-%s', $this->series, str_pad((string) $this->number, 6, '0', STR_PAD_LEFT)),
            'op_taxed' => (float) $this->op_taxed,
            'op_exonerated' => (float) $this->op_exonerated,
            'igv' => (float) $this->igv,
            'total' => (float) $this->total,
            'amount_in_words' => $this->amount_in_words,
            'payment_status' => $this->payment_status,
            'payment_condition' => $this->payment_condition,
            'status' => $this->status,
            'annulled_at' => $this->annulled_at,
            'annulment_reason' => $this->annulment_reason,
            'contact' => $this->whenLoaded('contact', fn () => $this->contact ? new ContactResource($this->contact) : null),
            'user' => $this->whenLoaded('user', fn () => $this->user?->name),
            'created_at' => $this->created_at,
            'details' => SaleDetailResource::collection($this->whenLoaded('details')),
            'payments' => SalePaymentResource::collection($this->whenLoaded('payments')),
        ];
    }
}
