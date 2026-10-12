<?php

namespace App\Http\Controllers\Api\Inventory;

use App\Http\Controllers\Controller;
use App\Http\Requests\Inventory\ProductRequest;
use App\Http\Requests\Inventory\StockMovementRequest;
use App\Http\Requests\Inventory\StoreSerialsRequest;
use App\Http\Resources\ProductResource;
use App\Http\Resources\ProductSerialResource;
use App\Http\Resources\StockMovementResource;
use App\Models\Product;
use App\Models\ProductSerial;
use App\Models\StockMovement;
use App\Models\WarehouseStock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProductController extends Controller
{
    /**
     * List products with pagination, search and filters.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $warehouseId = $request->integer('warehouse_id');

        $query = Product::query()
            ->with(['category', 'brand'])
            ->when(
                $warehouseId,
                fn ($q) => $q->withSum(['warehouseStocks as total_stock' => fn ($s) => $s->where('warehouse_id', $warehouseId)], 'quantity'),
                fn ($q) => $q->withSum('warehouseStocks as total_stock', 'quantity'),
            )
            ->withCount('serials as serials_count')
            ->latest();

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('internal_code', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%")
                    ->orWhereHas('serials', fn ($s) => $s->where('serial_number', 'like', "%{$search}%"));
            });
        }

        if ($categoryId = $request->integer('category_id')) {
            $query->where('category_id', $categoryId);
        }

        if ($brandId = $request->integer('brand_id')) {
            $query->where('brand_id', $brandId);
        }

        if ($request->has('status')) {
            $query->where('is_active', $request->boolean('status'));
        }

        $perPage = (int) $request->integer('per_page', 15);

        return ProductResource::collection($query->paginate($perPage));
    }

    /**
     * Create a new product.
     */
    public function store(ProductRequest $request): JsonResponse
    {
        $product = Product::create($request->validated())->refresh();

        return response()->json([
            'product' => new ProductResource($product->load(['category', 'brand'])),
        ], 201);
    }

    /**
     * Show a single product with its stock breakdown per warehouse.
     */
    public function show(Product $product): JsonResponse
    {
        $product->load(['category', 'brand', 'warehouseStocks.warehouse']);
        $product->loadSum('warehouseStocks as total_stock', 'quantity');
        $product->loadCount('serials as serials_count');

        return response()->json([
            'product' => new ProductResource($product),
            'stock_by_warehouse' => $product->warehouseStocks->map(fn (WarehouseStock $stock) => [
                'warehouse_id' => $stock->warehouse_id,
                'warehouse' => $stock->warehouse?->name,
                'quantity' => $stock->quantity,
            ]),
        ]);
    }

    /**
     * Update a product's data.
     */
    public function update(ProductRequest $request, Product $product): JsonResponse
    {
        $product->update($request->validated());

        return response()->json([
            'product' => new ProductResource($product->load(['category', 'brand'])),
        ]);
    }

    /**
     * Delete a product.
     */
    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json(['message' => 'Producto eliminado correctamente.']);
    }

    /**
     * List the stock movement history for a product.
     */
    public function stockHistory(Product $product): AnonymousResourceCollection
    {
        $movements = $product->stockMovements()
            ->with(['warehouse', 'user'])
            ->latest()
            ->paginate(20);

        return StockMovementResource::collection($movements);
    }

    /**
     * Register a stock movement (in / out / adjustment) for a product.
     */
    public function adjustStock(StockMovementRequest $request, Product $product): JsonResponse
    {
        $data = $request->validated();

        $movement = DB::transaction(function () use ($product, $data, $request) {
            $stock = WarehouseStock::query()->firstOrCreate(
                ['product_id' => $product->id, 'warehouse_id' => $data['warehouse_id']],
                ['quantity' => 0],
            );

            $newQuantity = match ($data['type']) {
                'in' => $stock->quantity + $data['quantity'],
                'out' => $stock->quantity - $data['quantity'],
                'adjustment' => $data['quantity'],
            };

            if ($newQuantity < 0) {
                throw ValidationException::withMessages([
                    'quantity' => 'No hay suficiente stock disponible en este almacén.',
                ]);
            }

            $stock->update(['quantity' => $newQuantity]);

            return StockMovement::create([
                'product_id' => $product->id,
                'warehouse_id' => $data['warehouse_id'],
                'user_id' => $request->user()?->id,
                'type' => $data['type'],
                'quantity' => $data['quantity'],
                'reason' => $data['reason'] ?? null,
            ]);
        });

        return response()->json([
            'movement' => new StockMovementResource($movement->load(['warehouse', 'user'])),
        ], 201);
    }

    /**
     * List the serial numbers registered for a product.
     */
    public function listSerials(Request $request, Product $product): AnonymousResourceCollection
    {
        $query = $product->serials()->with('warehouse')->latest();

        if ($warehouseId = $request->integer('warehouse_id')) {
            $query->where('warehouse_id', $warehouseId);
        }

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        return ProductSerialResource::collection($query->get());
    }

    /**
     * Register one or more serial numbers for a product.
     */
    public function storeSerials(StoreSerialsRequest $request, Product $product): AnonymousResourceCollection
    {
        $data = $request->validated();

        $serials = DB::transaction(function () use ($product, $data) {
            $created = collect($data['serial_numbers'])->map(fn (string $serial) => ProductSerial::create([
                'product_id' => $product->id,
                'warehouse_id' => $data['warehouse_id'] ?? null,
                'serial_number' => $serial,
                'status' => 'available',
            ]));

            if (! empty($data['warehouse_id'])) {
                $stock = WarehouseStock::query()->firstOrCreate(
                    ['product_id' => $product->id, 'warehouse_id' => $data['warehouse_id']],
                    ['quantity' => 0],
                );
                $stock->increment('quantity', $created->count());

                StockMovement::create([
                    'product_id' => $product->id,
                    'warehouse_id' => $data['warehouse_id'],
                    'type' => 'in',
                    'quantity' => $created->count(),
                    'reason' => 'Registro de series',
                ]);
            }

            return $created;
        });

        $serials = ProductSerial::query()
            ->whereIn('id', $serials->pluck('id'))
            ->with('warehouse')
            ->get();

        return ProductSerialResource::collection($serials);
    }

    /**
     * Remove a registered serial number.
     */
    public function destroySerial(Product $product, ProductSerial $serial): JsonResponse
    {
        abort_unless($serial->product_id === $product->id, 404);

        $serial->delete();

        return response()->json(['message' => 'Serie eliminada correctamente.']);
    }
}
