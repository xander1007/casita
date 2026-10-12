<?php

namespace App\Http\Controllers\Api\Purchases;

use App\Http\Controllers\Controller;
use App\Http\Requests\Purchases\AnnulPurchaseRequest;
use App\Http\Requests\Purchases\StorePurchaseRequest;
use App\Http\Resources\ContactResource;
use App\Http\Resources\ProductResource;
use App\Http\Resources\PurchaseResource;
use App\Http\Resources\WarehouseResource;
use App\Models\Contact;
use App\Models\Product;
use App\Models\ProductSerial;
use App\Models\Purchase;
use App\Models\PurchaseDetail;
use App\Models\StockMovement;
use App\Models\Warehouse;
use App\Models\WarehouseStock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PurchaseController extends Controller
{
    private const DEFAULT_DETAILS = ['supplier', 'warehouse', 'user'];

    private const FULL_DETAILS = ['details.product', 'details.serials', 'supplier', 'warehouse', 'user', 'annulledBy'];

    /**
     * List the purchase history with search and filters.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Purchase::query()->with(self::DEFAULT_DETAILS)->latest();

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('document_number', 'like', "%{$search}%")
                    ->orWhereHas('supplier', fn ($s) => $s->where('name_or_business_name', 'like', "%{$search}%"));
            });
        }

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        if ($from = $request->string('date_from')->toString()) {
            $query->whereDate('purchase_date', '>=', $from);
        }

        if ($to = $request->string('date_to')->toString()) {
            $query->whereDate('purchase_date', '<=', $to);
        }

        $perPage = (int) $request->integer('per_page', 15);

        return PurchaseResource::collection($query->paginate($perPage));
    }

    /**
     * Show a single purchase with its full detail.
     */
    public function show(Purchase $purchase): JsonResponse
    {
        $purchase->load(self::FULL_DETAILS);

        return response()->json(['purchase' => new PurchaseResource($purchase)]);
    }

    /**
     * Process a purchase in a single database transaction: increments stock,
     * updates the product's cost price, and registers any serial numbers.
     */
    public function store(StorePurchaseRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();

        $products = Product::query()->whereIn('id', collect($data['items'])->pluck('product_id'))->get()->keyBy('id');

        $lines = [];
        $subtotal = 0.0;

        foreach ($data['items'] as $item) {
            $product = $products->get($item['product_id']);

            if (! $product) {
                throw ValidationException::withMessages(['items' => 'Uno de los productos ya no existe.']);
            }

            $serialNumbers = $item['serial_numbers'] ?? [];

            if ($product->requires_serial && count($serialNumbers) !== (int) $item['quantity']) {
                throw ValidationException::withMessages([
                    'items' => "El producto \"{$product->name}\" requiere registrar exactamente {$item['quantity']} número(s) de serie.",
                ]);
            }

            $lineSubtotal = round($item['quantity'] * $item['unit_cost'], 2);
            $subtotal += $lineSubtotal;

            $lines[] = [
                'product' => $product,
                'quantity' => $item['quantity'],
                'unit_cost' => $item['unit_cost'],
                'subtotal' => $lineSubtotal,
                'serial_numbers' => $serialNumbers,
            ];
        }

        $subtotal = round($subtotal, 2);
        $igv = round($subtotal * 0.18, 2);
        $total = round($subtotal + $igv, 2);

        $purchase = DB::transaction(function () use ($data, $user, $lines, $subtotal, $igv, $total) {
            $purchase = Purchase::create([
                'supplier_id' => $data['supplier_id'],
                'warehouse_id' => $data['warehouse_id'],
                'user_id' => $user->id,
                'document_type' => $data['document_type'],
                'document_number' => $data['document_number'],
                'purchase_date' => $data['purchase_date'],
                'subtotal' => $subtotal,
                'igv' => $igv,
                'total' => $total,
                'status' => Purchase::STATUS_COMPLETED,
            ]);

            foreach ($lines as $line) {
                $product = $line['product'];

                $detail = PurchaseDetail::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $product->id,
                    'quantity' => $line['quantity'],
                    'unit_cost' => $line['unit_cost'],
                    'subtotal' => $line['subtotal'],
                ]);

                $product->update(['purchase_price' => $line['unit_cost']]);

                if ($product->is_service) {
                    continue;
                }

                $stock = WarehouseStock::query()->firstOrCreate(
                    ['product_id' => $product->id, 'warehouse_id' => $data['warehouse_id']],
                    ['quantity' => 0],
                );
                $stock->increment('quantity', $line['quantity']);

                StockMovement::create([
                    'product_id' => $product->id,
                    'warehouse_id' => $data['warehouse_id'],
                    'user_id' => $user->id,
                    'type' => 'in',
                    'quantity' => $line['quantity'],
                    'reason' => "Compra {$data['document_number']}",
                ]);

                foreach ($line['serial_numbers'] as $serialNumber) {
                    ProductSerial::create([
                        'product_id' => $product->id,
                        'warehouse_id' => $data['warehouse_id'],
                        'purchase_detail_id' => $detail->id,
                        'serial_number' => $serialNumber,
                        'status' => 'available',
                    ]);
                }
            }

            return $purchase;
        });

        return response()->json([
            'purchase' => new PurchaseResource($purchase->load(self::FULL_DETAILS)),
        ], 201);
    }

    /**
     * Annul a purchase: reverses the stock increment and removes the serials
     * it registered, provided none of them have already been used.
     */
    public function annul(AnnulPurchaseRequest $request, Purchase $purchase): JsonResponse
    {
        if ($purchase->status === Purchase::STATUS_ANNULLED) {
            throw ValidationException::withMessages([
                'purchase' => 'Esta compra ya se encuentra anulada.',
            ]);
        }

        DB::transaction(function () use ($request, $purchase) {
            $purchase->load('details.product', 'details.serials');

            foreach ($purchase->details as $detail) {
                $product = $detail->product;

                if ($product->is_service) {
                    continue;
                }

                if ($product->requires_serial) {
                    $unavailable = $detail->serials->firstWhere('status', '!=', 'available');

                    if ($unavailable) {
                        throw ValidationException::withMessages([
                            'purchase' => "No se puede anular: la serie \"{$unavailable->serial_number}\" de \"{$product->name}\" ya fue utilizada.",
                        ]);
                    }
                }

                $stock = WarehouseStock::query()
                    ->where('product_id', $product->id)
                    ->where('warehouse_id', $purchase->warehouse_id)
                    ->lockForUpdate()
                    ->first();

                if (! $stock || $stock->quantity < $detail->quantity) {
                    throw ValidationException::withMessages([
                        'purchase' => "No se puede anular: el stock actual de \"{$product->name}\" es insuficiente para revertir la compra.",
                    ]);
                }

                $stock->decrement('quantity', $detail->quantity);

                StockMovement::create([
                    'product_id' => $product->id,
                    'warehouse_id' => $purchase->warehouse_id,
                    'user_id' => $request->user()->id,
                    'type' => 'out',
                    'quantity' => $detail->quantity,
                    'reason' => "Anulación de compra {$purchase->document_number}",
                ]);

                if ($product->requires_serial) {
                    ProductSerial::query()->where('purchase_detail_id', $detail->id)->delete();
                }
            }

            $purchase->update([
                'status' => Purchase::STATUS_ANNULLED,
                'annulled_at' => now(),
                'annulled_by' => $request->user()->id,
                'annulment_reason' => $request->validated('reason'),
            ]);
        });

        return response()->json([
            'purchase' => new PurchaseResource($purchase->fresh(self::FULL_DETAILS)),
        ]);
    }

    /**
     * Scoped warehouse list for the purchase form's destination selector.
     */
    public function warehouses(): AnonymousResourceCollection
    {
        return WarehouseResource::collection(Warehouse::query()->orderBy('name')->get());
    }

    /**
     * Scoped supplier search for the purchase form.
     */
    public function suppliers(Request $request): AnonymousResourceCollection
    {
        $query = Contact::query()
            ->where(fn ($q) => $q->where('type', 'supplier')->orWhere('type', 'both'))
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
     * Scoped product search for the purchase form.
     */
    public function products(Request $request): AnonymousResourceCollection
    {
        $query = Product::query()->with(['category', 'brand'])->where('is_active', true)->latest();

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('internal_code', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        return ProductResource::collection($query->limit(20)->get());
    }
}
