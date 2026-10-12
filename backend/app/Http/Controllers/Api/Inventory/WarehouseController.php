<?php

namespace App\Http\Controllers\Api\Inventory;

use App\Http\Controllers\Controller;
use App\Http\Requests\Inventory\WarehouseRequest;
use App\Http\Resources\WarehouseResource;
use App\Models\Warehouse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class WarehouseController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return WarehouseResource::collection(Warehouse::query()->orderBy('name')->get());
    }

    public function store(WarehouseRequest $request): JsonResponse
    {
        $warehouse = Warehouse::create($request->validated())->refresh();

        return response()->json(['warehouse' => new WarehouseResource($warehouse)], 201);
    }

    public function update(WarehouseRequest $request, Warehouse $warehouse): JsonResponse
    {
        $warehouse->update($request->validated());

        return response()->json(['warehouse' => new WarehouseResource($warehouse)]);
    }

    public function destroy(Warehouse $warehouse): JsonResponse
    {
        $warehouse->delete();

        return response()->json(['message' => 'Almacén eliminado correctamente.']);
    }
}
