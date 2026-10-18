<?php

namespace App\Http\Controllers\Api\Quotations;

use App\Http\Controllers\Controller;
use App\Http\Requests\Quotations\ConvertQuotationRequest;
use App\Http\Requests\Quotations\QuotationRequest;
use App\Http\Resources\ContactResource;
use App\Http\Resources\ProductResource;
use App\Http\Resources\QuotationResource;
use App\Http\Resources\SalesOrderResource;
use App\Models\CompanySetting;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Services\Sales\SalesOrderService;
use App\Support\SaleLineCalculator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class QuotationController extends Controller
{
    private const LIST_DETAILS = ['contact', 'user'];

    public function __construct(private readonly SalesOrderService $salesOrders) {}

    /**
     * List quotations with search and filters.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Quotation::query()->with(self::LIST_DETAILS)->latest('issue_date')->latest('id');

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

        if ($from = $request->string('date_from')->toString()) {
            $query->whereDate('issue_date', '>=', $from);
        }

        if ($to = $request->string('date_to')->toString()) {
            $query->whereDate('issue_date', '<=', $to);
        }

        return QuotationResource::collection($query->paginate((int) $request->integer('per_page', 15)));
    }

    public function show(Quotation $quotation): JsonResponse
    {
        return response()->json(['quotation' => new QuotationResource($this->loadDetails($quotation))]);
    }

    public function store(QuotationRequest $request): JsonResponse
    {
        $data = $request->validated();
        $built = SaleLineCalculator::build($data['items']);

        $quotation = DB::transaction(function () use ($data, $built, $request) {
            $quotation = Quotation::create([
                'code' => $this->nextCode(),
                'contact_id' => $data['contact_id'],
                'warehouse_id' => $data['warehouse_id'] ?? null,
                'user_id' => $request->user()->id,
                'issue_date' => $data['issue_date'],
                'valid_until' => $data['valid_until'],
                'notes' => $data['notes'] ?? null,
                'status' => Quotation::STATUS_DRAFT,
                ...$built['totals'],
            ]);

            $this->saveItems($quotation, $built['lines']);

            return $quotation;
        });

        return response()->json(['quotation' => new QuotationResource($this->loadDetails($quotation))], 201);
    }

    /**
     * Edit a draft quotation. The item list is replaced as a whole.
     */
    public function update(QuotationRequest $request, Quotation $quotation): JsonResponse
    {
        $this->ensureStatus($quotation, [Quotation::STATUS_DRAFT], 'Solo se pueden editar cotizaciones en borrador.');

        $data = $request->validated();
        $built = SaleLineCalculator::build($data['items']);

        DB::transaction(function () use ($quotation, $data, $built) {
            $quotation->update([
                'contact_id' => $data['contact_id'],
                'warehouse_id' => $data['warehouse_id'] ?? null,
                'issue_date' => $data['issue_date'],
                'valid_until' => $data['valid_until'],
                'notes' => $data['notes'] ?? null,
                ...$built['totals'],
            ]);

            $quotation->items()->delete();
            $this->saveItems($quotation, $built['lines']);
        });

        return response()->json(['quotation' => new QuotationResource($this->loadDetails($quotation->fresh()))]);
    }

    public function approve(Quotation $quotation): JsonResponse
    {
        $this->ensureStatus($quotation, [Quotation::STATUS_DRAFT], 'Solo se pueden aprobar cotizaciones en borrador.');

        $quotation->update(['status' => Quotation::STATUS_APPROVED]);

        return response()->json(['quotation' => new QuotationResource($this->loadDetails($quotation))]);
    }

    public function reject(Quotation $quotation): JsonResponse
    {
        $this->ensureStatus(
            $quotation,
            [Quotation::STATUS_DRAFT, Quotation::STATUS_APPROVED],
            'Esta cotización ya no se puede rechazar.',
        );

        $quotation->update(['status' => Quotation::STATUS_REJECTED]);

        return response()->json(['quotation' => new QuotationResource($this->loadDetails($quotation))]);
    }

    /**
     * Turn an approved quotation into a sales order with the same items and
     * prices. Stock is reserved and missing units are marked "a demanda".
     */
    public function convertToOrder(ConvertQuotationRequest $request, Quotation $quotation): JsonResponse
    {
        $order = DB::transaction(function () use ($request, $quotation) {
            $quotation = Quotation::query()->with('items')->lockForUpdate()->findOrFail($quotation->id);
            $this->ensureStatus($quotation, [Quotation::STATUS_APPROVED], 'Solo se pueden convertir cotizaciones aprobadas.');

            $order = $this->salesOrders->create([
                'contact_id' => $quotation->contact_id,
                'warehouse_id' => $request->validated('warehouse_id'),
                'order_date' => today()->toDateString(),
                'expected_date' => $request->validated('expected_date'),
                'notes' => $quotation->notes,
                'items' => $quotation->items->map(fn (QuotationItem $item) => [
                    'product_id' => $item->product_id,
                    'quantity' => $item->quantity,
                    'unit_price' => (float) $item->unit_price,
                ])->all(),
            ], $request->user(), $quotation);

            $quotation->update(['status' => Quotation::STATUS_CONVERTED, 'converted_at' => now()]);

            return $order;
        });

        return response()->json([
            'sales_order' => new SalesOrderResource($order->load(['items.product', 'contact', 'warehouse', 'quotation'])),
        ], 201);
    }

    /**
     * Cart payload for invoicing an approved quotation directly in the POS.
     */
    public function posPayload(Request $request, Quotation $quotation): JsonResponse
    {
        $this->ensureStatus($quotation, [Quotation::STATUS_APPROVED], 'Solo se pueden facturar cotizaciones aprobadas.');

        $quotation->load(['contact', 'items.product' => fn ($q) => $q->withStock($request->integer('warehouse_id') ?: null)]);

        return response()->json([
            'quotation' => ['id' => $quotation->id, 'code' => $quotation->code],
            'contact' => new ContactResource($quotation->contact),
            'items' => $quotation->items->map(fn (QuotationItem $item) => [
                'product' => new ProductResource($item->product),
                'quantity' => $item->quantity,
                'unit_price' => (float) $item->unit_price,
            ]),
        ]);
    }

    /**
     * Payload for the printable proforma.
     */
    public function print(Quotation $quotation): JsonResponse
    {
        return response()->json([
            'company' => CompanySetting::query()->first(),
            'quotation' => new QuotationResource($quotation->load(['contact', 'user', 'items.product'])),
        ]);
    }

    private function loadDetails(Quotation $quotation): Quotation
    {
        return $quotation->load([
            'contact', 'warehouse', 'user', 'sale', 'salesOrder',
            'items.product' => fn ($q) => $q->withStock($quotation->warehouse_id),
        ]);
    }

    /**
     * @param  list<array<string, mixed>>  $lines
     */
    private function saveItems(Quotation $quotation, array $lines): void
    {
        foreach ($lines as $line) {
            QuotationItem::create([
                'quotation_id' => $quotation->id,
                'product_id' => $line['product_id'],
                'quantity' => $line['quantity'],
                'unit_price' => $line['unit_price'],
                'subtotal' => $line['subtotal'],
                'igv' => $line['igv'],
                'total' => $line['total'],
            ]);
        }
    }

    /**
     * @param  list<string>  $allowed
     */
    private function ensureStatus(Quotation $quotation, array $allowed, string $message): void
    {
        if (! in_array($quotation->status, $allowed, true)) {
            throw ValidationException::withMessages(['quotation' => $message]);
        }
    }

    private function nextCode(): string
    {
        $last = Quotation::query()->lockForUpdate()->orderByDesc('id')->first();
        $next = $last ? ((int) substr($last->code, 4)) + 1 : 1;

        return 'COT-'.str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }
}
