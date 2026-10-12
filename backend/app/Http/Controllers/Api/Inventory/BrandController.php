<?php

namespace App\Http\Controllers\Api\Inventory;

use App\Http\Controllers\Controller;
use App\Http\Requests\Inventory\BrandRequest;
use App\Http\Resources\BrandResource;
use App\Models\Brand;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BrandController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return BrandResource::collection(Brand::query()->orderBy('name')->get());
    }

    public function store(BrandRequest $request): JsonResponse
    {
        $brand = Brand::create($request->validated())->refresh();

        return response()->json(['brand' => new BrandResource($brand)], 201);
    }

    public function update(BrandRequest $request, Brand $brand): JsonResponse
    {
        $brand->update($request->validated());

        return response()->json(['brand' => new BrandResource($brand)]);
    }

    public function destroy(Brand $brand): JsonResponse
    {
        $brand->delete();

        return response()->json(['message' => 'Marca eliminada correctamente.']);
    }
}
