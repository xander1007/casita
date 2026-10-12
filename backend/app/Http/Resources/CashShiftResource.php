<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CashShiftResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'opening_balance' => (float) $this->opening_balance,
            'closing_balance' => $this->closing_balance !== null ? (float) $this->closing_balance : null,
            'expected_balance' => $this->expected_balance !== null ? (float) $this->expected_balance : null,
            'difference' => $this->difference !== null ? (float) $this->difference : null,
            'total_cash_sales' => (float) $this->total_cash_sales,
            'total_card_sales' => (float) $this->total_card_sales,
            'total_transfer_sales' => (float) $this->total_transfer_sales,
            'total_yape_plin_sales' => (float) $this->total_yape_plin_sales,
            'notes' => $this->notes,
            'opened_at' => $this->opened_at,
            'closed_at' => $this->closed_at,
            'cash_register' => $this->whenLoaded(
                'cashRegister',
                fn () => $this->cashRegister ? new CashRegisterResource($this->cashRegister) : null,
            ),
            'user' => $this->whenLoaded('user', fn () => $this->user?->name),
        ];
    }
}
