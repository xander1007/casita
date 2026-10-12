<?php

namespace App\Http\Requests\Services;

use App\Models\TechnicalService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTechnicalServiceRequest extends FormRequest
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
            'technician_id' => ['nullable', 'exists:users,id'],
            'device_type' => ['sometimes', Rule::in(TechnicalService::DEVICE_TYPES)],
            'brand' => ['nullable', 'string', 'max:100'],
            'model' => ['nullable', 'string', 'max:100'],
            'serial_number' => ['nullable', 'string', 'max:100'],
            'device_password' => ['nullable', 'string', 'max:100'],
            'accessories' => ['nullable', 'string', 'max:255'],
            'reported_issue' => ['sometimes', 'string'],
            'diagnosis' => ['nullable', 'string'],
            'estimated_cost' => ['nullable', 'numeric', 'min:0'],
            'final_cost' => ['nullable', 'numeric', 'min:0'],
            'status' => [
                'sometimes',
                Rule::in([
                    TechnicalService::STATUS_RECEIVED,
                    TechnicalService::STATUS_DIAGNOSING,
                    TechnicalService::STATUS_REPAIRED,
                    TechnicalService::STATUS_CANCELLED,
                ]),
            ],
        ];
    }
}
