<?php

namespace App\Http\Requests\Inventory;

use App\Models\Product;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductRequest extends FormRequest
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
        $productId = $this->route('product')?->id;

        return [
            'category_id' => ['nullable', 'exists:categories,id'],
            'brand_id' => ['nullable', 'exists:brands,id'],
            'name' => ['required', 'string', 'max:255'],
            'internal_code' => [
                'required', 'string', 'max:100',
                Rule::unique('products', 'internal_code')->ignore($productId),
            ],
            'barcode' => [
                'nullable', 'string', 'max:100',
                Rule::unique('products', 'barcode')->ignore($productId),
            ],
            'description' => ['nullable', 'string'],
            'purchase_price' => ['required', 'numeric', 'min:0'],
            'sale_price' => ['required', 'numeric', 'min:0'],
            'unit_of_measure' => ['required', Rule::in(Product::UNITS_OF_MEASURE)],
            'igv_affectation' => ['required', Rule::in(Product::IGV_AFFECTATIONS)],
            'min_stock' => ['sometimes', 'integer', 'min:0'],
            'requires_serial' => ['sometimes', 'boolean'],
            'is_service' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
