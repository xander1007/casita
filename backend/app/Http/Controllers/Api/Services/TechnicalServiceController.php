<?php

namespace App\Http\Controllers\Api\Services;

use App\Http\Controllers\Controller;
use App\Http\Requests\Services\AddServiceItemRequest;
use App\Http\Requests\Services\DeliverTechnicalServiceRequest;
use App\Http\Requests\Services\StoreTechnicalServiceRequest;
use App\Http\Requests\Services\UpdateTechnicalServiceRequest;
use App\Http\Resources\ContactResource;
use App\Http\Resources\ProductResource;
use App\Http\Resources\TechnicalServiceResource;
use App\Models\Category;
use App\Models\CompanySetting;
use App\Models\Contact;
use App\Models\Product;
use App\Models\Sale;
use App\Models\StockMovement;
use App\Models\TechnicalService;
use App\Models\TechnicalServiceItem;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\WarehouseStock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TechnicalServiceController extends Controller
{
    /**
     * Terminal statuses that can no longer be modified through the normal update flow.
     */
    private const LOCKED_STATUSES = [TechnicalService::STATUS_DELIVERED, TechnicalService::STATUS_CANCELLED];

    /**
     * List service orders with search and status filters.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = TechnicalService::query()->with(['customer', 'technician'])->latest();

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('serial_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($c) use ($search) {
                        $c->where('name_or_business_name', 'like', "%{$search}%")
                            ->orWhere('document_number', 'like', "%{$search}%");
                    });
            });
        }

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        $perPage = (int) $request->integer('per_page', 15);

        return TechnicalServiceResource::collection($query->paginate($perPage));
    }

    /**
     * List active users available to assign as the responsible technician.
     */
    public function technicians(): JsonResponse
    {
        $users = User::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json(['data' => $users]);
    }

    /**
     * Search customers for the reception form (available to anyone who can open orders).
     */
    public function searchCustomers(Request $request): JsonResponse
    {
        $search = $request->string('search')->trim()->toString();

        $query = Contact::query()->where('is_active', true);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name_or_business_name', 'like', "%{$search}%")
                    ->orWhere('document_number', 'like', "%{$search}%");
            });
        }

        return response()->json(['data' => ContactResource::collection($query->limit(10)->get())]);
    }

    /**
     * List parts/products with their stock in the "Servicio Técnico" warehouse.
     */
    public function parts(Request $request): AnonymousResourceCollection
    {
        $warehouse = $this->serviceWarehouse();

        $query = Product::query()
            ->where('is_active', true)
            ->with(['category', 'brand'])
            ->withSum(
                ['warehouseStocks as total_stock' => fn ($s) => $s->where('warehouse_id', $warehouse->id)],
                'quantity',
            )
            ->latest();

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('internal_code', 'like', "%{$search}%");
            });
        }

        return ProductResource::collection($query->paginate((int) $request->integer('per_page', 20)));
    }

    /**
     * Receive a new device: creates (or reuses) the customer and opens the work order.
     */
    public function store(StoreTechnicalServiceRequest $request): JsonResponse
    {
        $data = $request->validated();
        $customer = $this->resolveCustomer($data);

        $service = DB::transaction(function () use ($data, $customer) {
            return TechnicalService::create([
                'code' => $this->nextCode(),
                'customer_id' => $customer->id,
                'technician_id' => $data['technician_id'] ?? null,
                'device_type' => $data['device_type'],
                'brand' => $data['brand'] ?? null,
                'model' => $data['model'] ?? null,
                'serial_number' => $data['serial_number'] ?? null,
                'device_password' => $data['device_password'] ?? null,
                'accessories' => $data['accessories'] ?? null,
                'reported_issue' => $data['reported_issue'],
                'status' => TechnicalService::STATUS_RECEIVED,
                'estimated_cost' => $data['estimated_cost'] ?? 0,
                'received_at' => now(),
            ]);
        });

        $service->load(['customer', 'technician']);

        return response()->json(['service' => new TechnicalServiceResource($service)], 201);
    }

    /**
     * Show a single service order with its items and related records.
     */
    public function show(TechnicalService $service): JsonResponse
    {
        $service->load(['customer', 'technician', 'items.product', 'sale']);

        return response()->json(['service' => new TechnicalServiceResource($service)]);
    }

    /**
     * Update device/customer data, the diagnosis, costs, or the workflow status.
     */
    public function update(UpdateTechnicalServiceRequest $request, TechnicalService $service): JsonResponse
    {
        if (in_array($service->status, self::LOCKED_STATUSES, true)) {
            throw ValidationException::withMessages([
                'status' => 'Esta orden ya fue entregada o cancelada y no puede modificarse.',
            ]);
        }

        $service->update($request->validated());
        $service->load(['customer', 'technician', 'items.product']);

        return response()->json(['service' => new TechnicalServiceResource($service)]);
    }

    /**
     * Add a part/product consumed from the "Servicio Técnico" warehouse, discounting stock.
     */
    public function addItem(AddServiceItemRequest $request, TechnicalService $service): JsonResponse
    {
        if (in_array($service->status, self::LOCKED_STATUSES, true)) {
            throw ValidationException::withMessages([
                'status' => 'No se pueden agregar repuestos a una orden entregada o cancelada.',
            ]);
        }

        $data = $request->validated();
        $product = Product::query()->findOrFail($data['product_id']);
        $warehouse = $this->serviceWarehouse();

        DB::transaction(function () use ($service, $product, $data, $warehouse, $request) {
            if (! $product->is_service) {
                $stock = WarehouseStock::query()
                    ->where('product_id', $product->id)
                    ->where('warehouse_id', $warehouse->id)
                    ->lockForUpdate()
                    ->first();

                if (! $stock || $stock->quantity < $data['quantity']) {
                    throw ValidationException::withMessages([
                        'quantity' => "No hay suficiente stock de \"{$product->name}\" en el almacén de Servicio Técnico.",
                    ]);
                }

                $stock->decrement('quantity', $data['quantity']);

                StockMovement::create([
                    'product_id' => $product->id,
                    'warehouse_id' => $warehouse->id,
                    'user_id' => $request->user()->id,
                    'type' => 'out',
                    'quantity' => $data['quantity'],
                    'reason' => "Orden de servicio {$service->code}",
                ]);
            }

            $unitPrice = (float) $product->sale_price;
            $subtotal = round($unitPrice * $data['quantity'], 2);

            TechnicalServiceItem::create([
                'technical_service_id' => $service->id,
                'product_id' => $product->id,
                'quantity' => $data['quantity'],
                'unit_price' => $unitPrice,
                'subtotal' => $subtotal,
            ]);
        });

        $service->load(['items.product']);

        return response()->json(['service' => new TechnicalServiceResource($service)], 201);
    }

    /**
     * Remove a part from the order and return it to the "Servicio Técnico" warehouse stock.
     */
    public function removeItem(Request $request, TechnicalService $service, TechnicalServiceItem $item): JsonResponse
    {
        if ($item->technical_service_id !== $service->id) {
            abort(404);
        }

        if (in_array($service->status, self::LOCKED_STATUSES, true)) {
            throw ValidationException::withMessages([
                'status' => 'No se pueden quitar repuestos de una orden entregada o cancelada.',
            ]);
        }

        $warehouse = $this->serviceWarehouse();

        DB::transaction(function () use ($service, $item, $warehouse, $request) {
            if (! $item->product->is_service) {
                WarehouseStock::query()
                    ->where('product_id', $item->product_id)
                    ->where('warehouse_id', $warehouse->id)
                    ->increment('quantity', $item->quantity);

                StockMovement::create([
                    'product_id' => $item->product_id,
                    'warehouse_id' => $warehouse->id,
                    'user_id' => $request->user()->id,
                    'type' => 'in',
                    'quantity' => $item->quantity,
                    'reason' => "Reverso de repuesto en orden de servicio {$service->code}",
                ]);
            }

            $item->delete();
        });

        $service->load(['items.product']);

        return response()->json(['service' => new TechnicalServiceResource($service)]);
    }

    /**
     * Return the reception/delivery ticket payload for printing.
     */
    public function receipt(TechnicalService $service): JsonResponse
    {
        $service->load(['customer', 'technician', 'items.product']);

        return response()->json([
            'company' => CompanySetting::query()->first(),
            'service' => new TechnicalServiceResource($service),
        ]);
    }

    /**
     * Return the payload the POS needs to charge a finished order: the customer,
     * the generic service line item, and the amount to collect.
     */
    public function chargePayload(TechnicalService $service): JsonResponse
    {
        if ($service->status !== TechnicalService::STATUS_REPAIRED) {
            throw ValidationException::withMessages([
                'status' => 'Solo las órdenes reparadas pueden enviarse a cobro.',
            ]);
        }

        $service->load('customer');

        $product = Product::query()->firstOrCreate(
            ['internal_code' => 'SERV-TEC'],
            [
                'category_id' => Category::query()->where('name', 'Servicios Técnicos')->value('id'),
                'name' => 'Servicio Técnico',
                'purchase_price' => 0,
                'sale_price' => 0,
                'unit_of_measure' => 'ZZ',
                'igv_affectation' => '10',
                'min_stock' => 0,
                'requires_serial' => false,
                'is_service' => true,
                'is_active' => true,
            ],
        );

        $amount = (float) ($service->final_cost ?? $service->estimated_cost);

        return response()->json([
            'service' => new TechnicalServiceResource($service),
            'product' => new ProductResource($product),
            'contact' => new ContactResource($service->customer),
            'amount' => $amount,
        ]);
    }

    /**
     * Link the POS sale that paid for the order and mark it as delivered.
     */
    public function deliver(DeliverTechnicalServiceRequest $request, TechnicalService $service): JsonResponse
    {
        if ($service->status !== TechnicalService::STATUS_REPAIRED) {
            throw ValidationException::withMessages([
                'status' => 'Solo las órdenes reparadas pueden marcarse como entregadas.',
            ]);
        }

        $sale = Sale::query()->findOrFail($request->validated('sale_id'));

        $service->update([
            'status' => TechnicalService::STATUS_DELIVERED,
            'delivered_at' => now(),
            'sale_id' => $sale->id,
        ]);

        $service->load(['customer', 'technician', 'items.product', 'sale']);

        return response()->json(['service' => new TechnicalServiceResource($service)]);
    }

    /**
     * Resolve the customer for a new order, creating a contact when none was selected.
     */
    private function resolveCustomer(array $data): Contact
    {
        if (! empty($data['customer_id'])) {
            return Contact::query()->findOrFail($data['customer_id']);
        }

        return Contact::query()->firstOrCreate(
            [
                'identity_document_type' => $data['customer_document_type'],
                'document_number' => $data['customer_document_number'],
            ],
            [
                'type' => 'client',
                'name_or_business_name' => $data['customer_name'],
                'phone' => $data['customer_phone'] ?? null,
                'is_active' => true,
            ],
        );
    }

    /**
     * The warehouse parts are consumed from when servicing equipment.
     */
    private function serviceWarehouse(): Warehouse
    {
        return Warehouse::query()->firstOrCreate(
            ['code' => 'SVT-01'],
            ['name' => 'Servicio Técnico'],
        );
    }

    /**
     * Generate the next correlative "ST-00001" style code, locking the last row.
     */
    private function nextCode(): string
    {
        $last = TechnicalService::query()->lockForUpdate()->orderByDesc('id')->first();
        $next = $last ? ((int) substr($last->code, 3)) + 1 : 1;

        return 'ST-'.str_pad((string) $next, 5, '0', STR_PAD_LEFT);
    }
}
