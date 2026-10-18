<?php

namespace App\Http\Controllers\Api\SalesOrders;

use App\Http\Controllers\Controller;
use App\Http\Requests\SalesOrders\CancelSalesOrderRequest;
use App\Http\Requests\SalesOrders\StoreSalesOrderRequest;
use App\Http\Resources\ContactResource;
use App\Http\Resources\ProductResource;
use App\Http\Resources\SalesOrderResource;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Services\Sales\SalesOrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class SalesOrderController extends Controller
{
    private const FULL_DETAILS = [
        'items.product',
        'items.allocations.purchaseDetail.purchase.supplier',
        'contact',
        'warehouse',
        'user',
        'quotation',
        'sale',
    ];

    public function __construct(private readonly SalesOrderService $salesOrders) {}

    /**
     * List sales orders with search and filters.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = SalesOrder::query()->with(['contact', 'warehouse', 'items'])->latest('order_date')->latest('id');

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhereHas('contact', fn ($c) => $c->where('name_or_business_name', 'like', "%{$search}%")
                        ->orWhere('document_number', 'like', "%{$search}%"));
            });
        }

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        if ($request->boolean('on_demand')) {
            $query->whereHas('items', fn ($i) => $i->where('on_demand_quantity', '>', 0));
        }

        if ($from = $request->string('date_from')->toString()) {
            $query->whereDate('order_date', '>=', $from);
        }

        if ($to = $request->string('date_to')->toString()) {
            $query->whereDate('order_date', '<=', $to);
        }

        return SalesOrderResource::collection($query->paginate((int) $request->integer('per_page', 15)));
    }

    public function show(SalesOrder $order): JsonResponse
    {
        return response()->json(['sales_order' => new SalesOrderResource($order->load(self::FULL_DETAILS))]);
    }

    public function store(StoreSalesOrderRequest $request): JsonResponse
    {
        $order = $this->salesOrders->create($request->validated(), $request->user());

        return response()->json(['sales_order' => new SalesOrderResource($order->load(self::FULL_DETAILS))], 201);
    }

    public function cancel(CancelSalesOrderRequest $request, SalesOrder $order): JsonResponse
    {
        $this->salesOrders->cancel($order, $request->user(), $request->validated('reason'));

        return response()->json(['sales_order' => new SalesOrderResource($order->fresh(self::FULL_DETAILS))]);
    }

    /**
     * On-demand lines waiting to be bought, with the quantity and a suggested supplier.
     */
    public function purchaseSuggestions(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->salesOrders->purchaseSuggestions($request->integer('warehouse_id') ?: null),
        ]);
    }

    /**
     * Cart payload for invoicing a ready order in the POS. Its units are
     * reserved, so the cart lines are fixed to the ordered quantities.
     */
    public function posPayload(SalesOrder $order): JsonResponse
    {
        if ($order->status !== SalesOrder::STATUS_READY) {
            throw ValidationException::withMessages([
                'order' => $order->status === SalesOrder::STATUS_PENDING
                    ? 'El pedido aún tiene productos a demanda por recibir.'
                    : 'Este pedido ya no se puede facturar.',
            ]);
        }

        $order->load(['contact', 'items.product']);

        return response()->json([
            'sales_order' => ['id' => $order->id, 'code' => $order->code, 'warehouse_id' => $order->warehouse_id],
            'contact' => new ContactResource($order->contact),
            'items' => $order->items->map(fn (SalesOrderItem $item) => [
                'product' => new ProductResource($item->product),
                'quantity' => $item->quantity,
                'unit_price' => (float) $item->unit_price,
            ]),
        ]);
    }
}
