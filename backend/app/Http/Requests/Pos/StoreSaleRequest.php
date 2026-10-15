<?php

namespace App\Http\Requests\Pos;

use App\Models\Sale;
use App\Models\SalePayment;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSaleRequest extends FormRequest
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
            'contact_id' => ['nullable', 'exists:contacts,id'],
            'document_type' => ['required', Rule::in(Sale::DOCUMENT_TYPES)],

            // Optional source document the sale is invoicing.
            'quotation_id' => ['nullable', 'exists:quotations,id', 'prohibits:sales_order_id'],
            'sales_order_id' => ['nullable', 'exists:sales_orders,id'],

            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.product_serial_id' => ['nullable', 'exists:product_serials,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],

            'payments' => ['required', 'array', 'min:1'],
            'payments.*.payment_method' => ['required', Rule::in(SalePayment::METHODS)],
            'payments.*.amount' => ['required', 'numeric', 'min:0.01'],
            'payments.*.reference_number' => [
                'nullable',
                'string',
                'max:50',
                'required_if:payments.*.payment_method,yape_plin,transfer',
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'items.required' => 'Agrega al menos un producto al carrito.',
            'payments.required' => 'Registra al menos un método de pago.',
        ];
    }
}
