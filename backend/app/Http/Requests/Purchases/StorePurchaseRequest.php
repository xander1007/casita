<?php

namespace App\Http\Requests\Purchases;

use App\Models\Purchase;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePurchaseRequest extends FormRequest
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
            'supplier_id' => ['required', 'exists:contacts,id'],
            'warehouse_id' => ['required', 'exists:warehouses,id'],
            'document_type' => ['required', Rule::in(Purchase::DOCUMENT_TYPES)],
            'document_number' => ['required', 'string', 'max:30'],
            'purchase_date' => ['required', 'date'],

            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_cost' => ['required', 'numeric', 'min:0'],
            'items.*.serial_numbers' => ['array'],
            'items.*.serial_numbers.*' => ['string', 'max:255', 'distinct', 'unique:product_serials,serial_number'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'items.required' => 'Agrega al menos un producto a la compra.',
        ];
    }
}
