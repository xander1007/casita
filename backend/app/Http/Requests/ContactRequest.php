<?php

namespace App\Http\Requests;

use App\Models\Contact;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ContactRequest extends FormRequest
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
        $contactId = $this->route('contact')?->id;

        return [
            'type' => ['required', Rule::in(Contact::TYPES)],
            'identity_document_type' => ['required', Rule::in(Contact::DOCUMENT_TYPES)],
            'document_number' => [
                'required',
                'string',
                'max:20',
                Rule::unique('contacts', 'document_number')
                    ->where(fn ($query) => $query->where('identity_document_type', $this->input('identity_document_type')))
                    ->ignore($contactId),
            ],
            'name_or_business_name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
