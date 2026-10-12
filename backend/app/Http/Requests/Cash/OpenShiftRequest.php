<?php

namespace App\Http\Requests\Cash;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class OpenShiftRequest extends FormRequest
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
            'cash_register_id' => ['required', 'exists:cash_registers,id'],
            'opening_balance' => ['required', 'numeric', 'min:0'],
        ];
    }
}
