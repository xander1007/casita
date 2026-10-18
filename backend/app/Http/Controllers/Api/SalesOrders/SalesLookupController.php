<?php

namespace App\Http\Controllers\Api\SalesOrders;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContactResource;
use App\Http\Resources\ProductResource;
use App\Http\Resources\WarehouseResource;
use App\Models\Contact;
use App\Models\Product;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Scoped lookups for the quotation and sales order forms.
 */
class SalesLookupController extends Controller
{
    public function warehouses(): AnonymousResourceCollection
    {
        return WarehouseResource::collection(Warehouse::query()->where('is_active', true)->orderBy('name')->get());
    }

    public function customers(Request $request): AnonymousResourceCollection
    {
        $query = Contact::query()
            ->where('is_active', true)
            ->where(fn ($q) => $q->where('type', 'client')->orWhere('type', 'both'))
            ->orderBy('name_or_business_name');

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('name_or_business_name', 'like', "%{$search}%")
                    ->orWhere('document_number', 'like', "%{$search}%");
            });
        }

        return ContactResource::collection($query->limit(10)->get());
    }

    /**
     * Product search with available stock (physical minus reserved) in the
     * given warehouse, or across all warehouses when none is given.
     */
    public function products(Request $request): AnonymousResourceCollection
    {
        $query = Product::query()
            ->with(['category', 'brand'])
            ->withStock($request->integer('warehouse_id') ?: null)
            ->where('is_active', true)
            ->latest();

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->whereContainsExact('name', $search)
                    ->orWhereContainsExact('internal_code', $search)
                    ->orWhereContainsExact('barcode', $search);
            });
        }

        return ProductResource::collection($query->limit(20)->get());
    }
}
