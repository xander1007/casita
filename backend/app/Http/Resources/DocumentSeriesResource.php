<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocumentSeriesResource extends JsonResource
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
            'current_correlative' => $this->current_correlative,
            'is_active' => (bool) $this->is_active,
            'cash_register' => $this->whenLoaded(
                'cashRegister',
                fn () => $this->cashRegister ? new CashRegisterResource($this->cashRegister) : null,
            ),
        ];
    }
}
