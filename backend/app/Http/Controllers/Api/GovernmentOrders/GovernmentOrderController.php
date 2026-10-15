<?php

namespace App\Http\Controllers\Api\GovernmentOrders;

use App\Http\Controllers\Controller;
use App\Http\Requests\GovernmentOrders\AnnulGovernmentOrderRequest;
use App\Http\Requests\GovernmentOrders\StoreGovernmentOrderRequest;
use App\Http\Resources\ContactResource;
use App\Http\Resources\GovernmentPurchaseOrderResource;
use App\Http\Resources\ProductResource;
use App\Http\Resources\WarehouseResource;
use App\Models\Contact;
use App\Models\GovernmentPurchaseOrder;
use App\Models\GovernmentPurchaseOrderItem;
use App\Models\Product;
use App\Models\Warehouse;
use App\Services\GovernmentOrderStockReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class GovernmentOrderController extends Controller
{
    private const DEFAULT_DETAILS = ['contact', 'warehouse', 'user'];

    private const FULL_DETAILS = ['items.product', 'contact', 'warehouse', 'user', 'annulledBy'];

    public function __construct(private readonly GovernmentOrderStockReport $stockReport) {}

    /**
     * List the registered government purchase orders with search and filters.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = GovernmentPurchaseOrder::query()->with(self::DEFAULT_DETAILS)->latest('issue_date')->latest('id');

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhere('siaf_number', 'like', "%{$search}%")
                    ->orWhereHas('contact', fn ($c) => $c->where('name_or_business_name', 'like', "%{$search}%")
                        ->orWhere('document_number', 'like', "%{$search}%"));
            });
        }

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        if ($from = $request->string('date_from')->toString()) {
            $query->whereDate('issue_date', '>=', $from);
        }

        if ($to = $request->string('date_to')->toString()) {
            $query->whereDate('issue_date', '<=', $to);
        }

        $perPage = (int) $request->integer('per_page', 15);

        return GovernmentPurchaseOrderResource::collection($query->paginate($perPage));
    }

    /**
     * Show an order with its items and the live stock-vs-purchase report.
     */
    public function show(GovernmentPurchaseOrder $order): JsonResponse
    {
        $order->load(self::FULL_DETAILS);

        return response()->json([
            'order' => new GovernmentPurchaseOrderResource($order),
            'stock_report' => $this->stockReport->build($order),
        ]);
    }

    /**
     * Only the stock-vs-purchase report, recalculated against current stock.
     */
    public function stockReport(GovernmentPurchaseOrder $order): JsonResponse
    {
        return response()->json(['stock_report' => $this->stockReport->build($order)]);
    }

    /**
     * Register a new order. It does not touch stock: stock only leaves the
     * warehouse when the goods are actually sold / dispatched.
     */
    public function store(StoreGovernmentOrderRequest $request): JsonResponse
    {
        $data = $request->validated();

        $lines = collect($data['items'])->map(fn (array $item) => [
            'product_id' => $item['product_id'],
            'quantity' => (int) $item['quantity'],
            'unit_price' => $item['unit_price'],
            'subtotal' => round($item['quantity'] * $item['unit_price'], 2),
        ]);

        $order = DB::transaction(function () use ($data, $lines, $request) {
            $order = GovernmentPurchaseOrder::create([
                'contact_id' => $data['contact_id'],
                'warehouse_id' => $data['warehouse_id'] ?? null,
                'user_id' => $request->user()->id,
                'order_number' => $data['order_number'],
                'siaf_number' => $data['siaf_number'] ?? null,
                'issue_date' => $data['issue_date'],
                'delivery_deadline' => $data['delivery_deadline'] ?? null,
                'total' => round($lines->sum('subtotal'), 2),
                'status' => GovernmentPurchaseOrder::STATUS_PENDING,
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($lines as $line) {
                GovernmentPurchaseOrderItem::create(['government_purchase_order_id' => $order->id, ...$line]);
            }

            return $order;
        });

        $order->load(self::FULL_DETAILS);

        return response()->json([
            'order' => new GovernmentPurchaseOrderResource($order),
            'stock_report' => $this->stockReport->build($order),
        ], 201);
    }

    /**
     * Mark a pending order as fully delivered to the entity.
     */
    public function markDelivered(GovernmentPurchaseOrder $order): JsonResponse
    {
        if ($order->status !== GovernmentPurchaseOrder::STATUS_PENDING) {
            throw ValidationException::withMessages([
                'order' => 'Solo se pueden marcar como entregadas las órdenes pendientes.',
            ]);
        }

        $order->update(['status' => GovernmentPurchaseOrder::STATUS_DELIVERED]);

        return response()->json(['order' => new GovernmentPurchaseOrderResource($order->fresh(self::FULL_DETAILS))]);
    }

    /**
     * Annul a pending order (e.g. the entity withdrew it).
     */
    public function annul(AnnulGovernmentOrderRequest $request, GovernmentPurchaseOrder $order): JsonResponse
    {
        if ($order->status !== GovernmentPurchaseOrder::STATUS_PENDING) {
            throw ValidationException::withMessages([
                'order' => 'Solo se pueden anular las órdenes pendientes.',
            ]);
        }

        $order->update([
            'status' => GovernmentPurchaseOrder::STATUS_ANNULLED,
            'annulled_at' => now(),
            'annulled_by' => $request->user()->id,
            'annulment_reason' => $request->validated('reason'),
        ]);

        return response()->json(['order' => new GovernmentPurchaseOrderResource($order->fresh(self::FULL_DETAILS))]);
    }

    /**
     * Scoped warehouse list for the order form.
     */
    public function warehouses(): AnonymousResourceCollection
    {
        return WarehouseResource::collection(Warehouse::query()->orderBy('name')->get());
    }

    /**
     * Scoped search of state entities (registered as clients) for the order form.
     */
    public function entities(Request $request): AnonymousResourceCollection
    {
        $query = Contact::query()
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
     * Scoped product search for the order form, including total stock.
     */
    public function products(Request $request): AnonymousResourceCollection
    {
        $query = Product::query()
            ->with(['category', 'brand'])
            ->withStock()
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
