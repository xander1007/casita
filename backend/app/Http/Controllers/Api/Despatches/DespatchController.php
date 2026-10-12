<?php

namespace App\Http\Controllers\Api\Despatches;

use App\Http\Controllers\Controller;
use App\Http\Requests\Despatches\StoreDespatchRequest;
use App\Http\Resources\DespatchResource;
use App\Models\CompanySetting;
use App\Models\Despatch;
use App\Models\DespatchDetail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class DespatchController extends Controller
{
    /**
     * The fixed SUNAT series used for the "Guía de Remisión Electrónica Remitente".
     */
    private const SERIES = 'T001';

    /**
     * List despatch guides with search and filters.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Despatch::query()->with(['contact', 'referenceSale'])->latest();

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('number', 'like', "%{$search}%")
                    ->orWhereHas('contact', fn ($c) => $c->where('name_or_business_name', 'like', "%{$search}%"));
            });
        }

        $perPage = (int) $request->integer('per_page', 15);

        return DespatchResource::collection($query->paginate($perPage));
    }

    /**
     * Issue a new despatch guide with its transported items.
     */
    public function store(StoreDespatchRequest $request): JsonResponse
    {
        $data = $request->validated();

        $despatch = DB::transaction(function () use ($data, $request) {
            $last = Despatch::query()->where('series', self::SERIES)->lockForUpdate()->orderByDesc('number')->first();
            $number = $last ? $last->number + 1 : 1;

            $despatch = Despatch::create([
                'series' => self::SERIES,
                'number' => $number,
                'contact_id' => $data['contact_id'],
                'reference_sale_id' => $data['reference_sale_id'] ?? null,
                'user_id' => $request->user()->id,
                'starting_address' => $data['starting_address'],
                'arrival_address' => $data['arrival_address'],
                'transport_reason' => $data['transport_reason'],
                'gross_weight' => $data['gross_weight'] ?? null,
                'package_count' => $data['package_count'] ?? null,
                'vehicle_plate' => $data['vehicle_plate'] ?? null,
                'vehicle_brand' => $data['vehicle_brand'] ?? null,
                'driver_dni' => $data['driver_dni'] ?? null,
                'driver_license' => $data['driver_license'] ?? null,
                'order_number' => $data['order_number'] ?? null,
                'observations' => $data['observations'] ?? null,
                'status' => Despatch::STATUS_ISSUED,
                'emission_date' => now()->toDateString(),
                'transport_start_date' => $data['transport_start_date'],
                'delivery_date' => $data['delivery_date'] ?? null,
            ]);

            foreach ($data['items'] as $item) {
                DespatchDetail::create([
                    'despatch_id' => $despatch->id,
                    'product_id' => $item['product_id'] ?? null,
                    'code' => $item['code'] ?? null,
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_of_measure' => $item['unit_of_measure'],
                    'weight' => $item['weight'] ?? null,
                ]);
            }

            return $despatch;
        });

        $despatch->load(['contact', 'referenceSale', 'user', 'details']);

        return response()->json(['despatch' => new DespatchResource($despatch)], 201);
    }

    /**
     * Show a single despatch guide with its full detail.
     */
    public function show(Despatch $despatch): JsonResponse
    {
        $despatch->load(['contact', 'referenceSale', 'user', 'details']);

        return response()->json(['despatch' => new DespatchResource($despatch)]);
    }

    /**
     * Return the formatted payload for the A4 print preview.
     */
    public function print(Despatch $despatch): JsonResponse
    {
        $despatch->load(['contact', 'referenceSale', 'user', 'details']);

        return response()->json([
            'company' => CompanySetting::query()->first(),
            'despatch' => new DespatchResource($despatch),
        ]);
    }
}
