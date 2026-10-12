<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TechnicalServiceResource extends JsonResource
{
    /**
     * @var array<string, string>
     */
    private const DEVICE_TYPE_LABELS = [
        'laptop' => 'Laptop',
        'desktop' => 'PC Escritorio',
        'printer' => 'Impresora',
        'monitor' => 'Monitor',
        'other' => 'Otro',
    ];

    /**
     * @var array<string, string>
     */
    private const STATUS_LABELS = [
        'received' => 'Recibido',
        'diagnosing' => 'En Diagnóstico',
        'repaired' => 'Reparado',
        'delivered' => 'Entregado',
        'cancelled' => 'Cancelado',
    ];

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $items = TechnicalServiceItemResource::collection($this->whenLoaded('items'));

        return [
            'id' => $this->id,
            'code' => $this->code,
            'customer' => $this->whenLoaded('customer', fn () => $this->customer ? new ContactResource($this->customer) : null),
            'technician' => $this->whenLoaded('technician', fn () => $this->technician ? [
                'id' => $this->technician->id,
                'name' => $this->technician->name,
            ] : null),
            'device_type' => $this->device_type,
            'device_type_label' => self::DEVICE_TYPE_LABELS[$this->device_type] ?? $this->device_type,
            'brand' => $this->brand,
            'model' => $this->model,
            'serial_number' => $this->serial_number,
            'device_password' => $this->device_password,
            'accessories' => $this->accessories,
            'reported_issue' => $this->reported_issue,
            'diagnosis' => $this->diagnosis,
            'status' => $this->status,
            'status_label' => self::STATUS_LABELS[$this->status] ?? $this->status,
            'estimated_cost' => (float) $this->estimated_cost,
            'final_cost' => $this->final_cost !== null ? (float) $this->final_cost : null,
            'sale_id' => $this->sale_id,
            'received_at' => $this->received_at,
            'delivered_at' => $this->delivered_at,
            'items' => $items,
            'items_total' => $this->when(
                $this->relationLoaded('items'),
                fn () => (float) $this->items->sum('subtotal'),
            ),
            'created_at' => $this->created_at,
        ];
    }
}
