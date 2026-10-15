<?php

namespace App\Http\Controllers\Api\Settlements;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settlements\AnnulPaymentSettlementRequest;
use App\Http\Requests\Settlements\StorePaymentSettlementRequest;
use App\Http\Resources\ContactResource;
use App\Http\Resources\PaymentSettlementResource;
use App\Models\Contact;
use App\Models\PaymentSettlement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class PaymentSettlementController extends Controller
{
    private const DETAILS = ['contact', 'user'];

    /**
     * List the registered settlements with search and filters.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = PaymentSettlement::query()->with(self::DETAILS)->latest('payment_date')->latest('id');

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('document_number', 'like', "%{$search}%")
                    ->orWhere('operation_number', 'like', "%{$search}%")
                    ->orWhereHas('contact', fn ($c) => $c->where('name_or_business_name', 'like', "%{$search}%")
                        ->orWhere('document_number', 'like', "%{$search}%"));
            });
        }

        foreach (['document_type', 'payment_method', 'status'] as $filter) {
            if ($value = $request->string($filter)->toString()) {
                $query->where($filter, $value);
            }
        }

        if ($from = $request->string('date_from')->toString()) {
            $query->whereDate('payment_date', '>=', $from);
        }

        if ($to = $request->string('date_to')->toString()) {
            $query->whereDate('payment_date', '<=', $to);
        }

        $perPage = (int) $request->integer('per_page', 15);

        return PaymentSettlementResource::collection($query->paginate($perPage));
    }

    public function show(PaymentSettlement $settlement): JsonResponse
    {
        return response()->json(['settlement' => new PaymentSettlementResource($settlement->load(self::DETAILS))]);
    }

    /**
     * Register the payment (cancelación) of a document.
     */
    public function store(StorePaymentSettlementRequest $request): JsonResponse
    {
        $settlement = PaymentSettlement::create([
            ...$request->validated(),
            'currency' => $request->validated('currency', 'PEN'),
            'user_id' => $request->user()->id,
            'status' => PaymentSettlement::STATUS_REGISTERED,
        ]);

        return response()->json([
            'settlement' => new PaymentSettlementResource($settlement->load(self::DETAILS)),
        ], 201);
    }

    /**
     * Annul a settlement registered by mistake. The record is kept for audit.
     */
    public function annul(AnnulPaymentSettlementRequest $request, PaymentSettlement $settlement): JsonResponse
    {
        if ($settlement->status === PaymentSettlement::STATUS_ANNULLED) {
            throw ValidationException::withMessages([
                'settlement' => 'Esta cancelación ya se encuentra anulada.',
            ]);
        }

        $settlement->update([
            'status' => PaymentSettlement::STATUS_ANNULLED,
            'annulled_at' => now(),
            'annulled_by' => $request->user()->id,
            'annulment_reason' => $request->validated('reason'),
        ]);

        return response()->json(['settlement' => new PaymentSettlementResource($settlement->fresh(self::DETAILS))]);
    }

    /**
     * Scoped contact search (clients and suppliers) for the settlement form.
     */
    public function contacts(Request $request): AnonymousResourceCollection
    {
        $query = Contact::query()->where('is_active', true)->orderBy('name_or_business_name');

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('name_or_business_name', 'like', "%{$search}%")
                    ->orWhere('document_number', 'like', "%{$search}%");
            });
        }

        return ContactResource::collection($query->limit(10)->get());
    }
}
