<?php

namespace App\Http\Requests\Inventory;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreSerialsRequest extends FormRequest
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
            'warehouse_id' => ['nullable', 'exists:warehouses,id'],
            'serial_numbers' => ['required', 'array', 'min:1'],
            'serial_numbers.*' => ['required', 'string', 'max:255', 'distinct', 'unique:product_serials,serial_number'],
        ];
    }
}
