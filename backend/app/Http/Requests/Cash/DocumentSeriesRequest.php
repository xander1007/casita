<?php

namespace App\Http\Requests\Cash;

use App\Models\DocumentSeries;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DocumentSeriesRequest extends FormRequest
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
        $seriesId = $this->route('series')?->id;

        return [
            'cash_register_id' => ['nullable', 'exists:cash_registers,id'],
            'document_type' => ['required', Rule::in(DocumentSeries::DOCUMENT_TYPES)],
            'series' => ['required', 'string', 'max:10', Rule::unique('document_series', 'series')->ignore($seriesId)],
            'current_correlative' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
