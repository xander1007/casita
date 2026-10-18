<?php

namespace App\Http\Requests\GovernmentOrders;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreGovernmentOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'contact_id' => ['required', 'exists:contacts,id'],
            'warehouse_id' => ['nullable', 'exists:warehouses,id'],
            'order_number' => [
                'required', 'string', 'max:50',
                Rule::unique('government_purchase_orders', 'order_number')->where('contact_id', $this->input('contact_id')),
            ],
            'siaf_number' => ['nullable', 'string', 'max:50'],
            'issue_date' => ['required', 'date'],
            'delivery_deadline' => ['nullable', 'date', 'after_or_equal:issue_date'],
            'notes' => ['nullable', 'string', 'max:2000'],

            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'order_number.unique' => 'Esta entidad ya tiene registrada una orden de compra con ese número.',
            'delivery_deadline.after_or_equal' => 'El plazo de entrega no puede ser anterior a la fecha de emisión.',
            'items.required' => 'Agrega al menos un ítem a la orden de compra.',
        ];
    }
}
