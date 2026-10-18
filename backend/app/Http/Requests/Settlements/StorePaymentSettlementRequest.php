<?php

namespace App\Http\Requests\Settlements;

use App\Models\PaymentSettlement;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePaymentSettlementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        // An empty operation number means "not provided", never a duplicate of another blank one.
        $operation = trim((string) $this->input('operation_number', ''));

        $this->merge([
            'operation_number' => $operation === '' ? null : $operation,
            'bank' => trim((string) $this->input('bank', '')),
            'account' => trim((string) $this->input('account', '')),
            'document_number' => trim((string) $this->input('document_number', '')),
        ]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'contact_id' => ['required', 'exists:contacts,id'],
            'document_type' => ['required', Rule::in(PaymentSettlement::DOCUMENT_TYPES)],
            'document_number' => ['required', 'string', 'max:30'],
            'currency' => ['sometimes', Rule::in(PaymentSettlement::CURRENCIES)],
            'amount' => ['required', 'numeric', 'gt:0', 'max:9999999999.99'],
            'operation_number' => [
                'nullable', 'string', 'max:50',
                // The same bank operation cannot settle two documents twice over.
                Rule::unique('payment_settlements', 'operation_number')
                    ->where('bank', $this->input('bank'))
                    ->where('status', PaymentSettlement::STATUS_REGISTERED),
            ],
            'payment_date' => ['required', 'date', 'before_or_equal:today'],
            'payment_method' => ['required', Rule::in(PaymentSettlement::PAYMENT_METHODS)],
            'bank' => ['required', 'string', 'max:100'],
            'account' => ['required', 'string', 'max:50'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'operation_number.unique' => 'Ya existe una cancelación registrada con este N° de operación en el mismo banco.',
            'payment_date.before_or_equal' => 'La fecha de pago no puede ser posterior a hoy.',
            'amount.gt' => 'El importe debe ser mayor a cero.',
            'bank.required' => 'Indica el banco.',
            'account.required' => 'Indica la cuenta.',
        ];
    }
}
