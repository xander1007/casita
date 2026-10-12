<?php

namespace App\Http\Requests\Despatches;

use App\Models\Despatch;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDespatchRequest extends FormRequest
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
            'reference_sale_id' => ['nullable', 'exists:sales,id'],
            'starting_address' => ['required', 'string', 'max:255'],
            'arrival_address' => ['required', 'string', 'max:255'],
            'transport_reason' => ['required', Rule::in(Despatch::TRANSPORT_REASONS)],
            'gross_weight' => ['nullable', 'numeric', 'min:0'],
            'package_count' => ['nullable', 'integer', 'min:0'],
            'vehicle_plate' => ['nullable', 'string', 'max:20'],
            'vehicle_brand' => ['nullable', 'string', 'max:50'],
            'driver_dni' => ['nullable', 'string', 'max:20'],
            'driver_license' => ['nullable', 'string', 'max:20'],
            'order_number' => ['nullable', 'string', 'max:100'],
            'observations' => ['nullable', 'string'],
            'transport_start_date' => ['required', 'date'],
            'delivery_date' => ['nullable', 'date'],

            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['nullable', 'exists:products,id'],
            'items.*.code' => ['nullable', 'string', 'max:30'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.001'],
            'items.*.unit_of_measure' => ['required', 'string', 'max:10'],
            'items.*.weight' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'items.required' => 'Agrega al menos un ítem a trasladar.',
            'contact_id.required' => 'Selecciona el destinatario de la guía.',
        ];
    }
}
