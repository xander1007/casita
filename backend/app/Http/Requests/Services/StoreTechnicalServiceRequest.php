<?php

namespace App\Http\Requests\Services;

use App\Models\TechnicalService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTechnicalServiceRequest extends FormRequest
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
            'customer_id' => ['nullable', 'exists:contacts,id'],
            'customer_document_type' => ['required_without:customer_id', 'string'],
            'customer_document_number' => ['required_without:customer_id', 'string', 'max:20'],
            'customer_name' => ['required_without:customer_id', 'string', 'max:255'],
            'customer_phone' => ['nullable', 'string', 'max:30'],

            'technician_id' => ['nullable', 'exists:users,id'],
            'device_type' => ['required', Rule::in(TechnicalService::DEVICE_TYPES)],
            'brand' => ['nullable', 'string', 'max:100'],
            'model' => ['nullable', 'string', 'max:100'],
            'serial_number' => ['nullable', 'string', 'max:100'],
            'device_password' => ['nullable', 'string', 'max:100'],
            'accessories' => ['nullable', 'string', 'max:255'],
            'reported_issue' => ['required', 'string'],
            'estimated_cost' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'customer_name.required_without' => 'Selecciona un cliente o ingresa sus datos.',
            'reported_issue.required' => 'Describe la falla reportada por el cliente.',
        ];
    }
}
