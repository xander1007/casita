<?php

namespace App\Http\Controllers\Api\Cash;

use App\Http\Controllers\Controller;
use App\Http\Requests\Cash\CloseShiftRequest;
use App\Http\Requests\Cash\OpenShiftRequest;
use App\Http\Resources\CashShiftResource;
use App\Models\CashShift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class CashShiftController extends Controller
{
    /**
     * Return the authenticated user's currently open shift, if any.
     */
    public function current(Request $request): JsonResponse
    {
        $shift = CashShift::query()
            ->where('user_id', $request->user()->id)
            ->where('status', CashShift::STATUS_OPEN)
            ->with('cashRegister.warehouse')
            ->latest('opened_at')
            ->first();

        return response()->json(['shift' => $shift ? new CashShiftResource($shift) : null]);
    }

    /**
     * Open a new shift for the authenticated user.
     */
    public function open(OpenShiftRequest $request): JsonResponse
    {
        $user = $request->user();

        if (CashShift::query()->where('user_id', $user->id)->where('status', CashShift::STATUS_OPEN)->exists()) {
            throw ValidationException::withMessages([
                'cash_register_id' => 'Ya tienes una caja abierta. Ciérrala antes de abrir otra.',
            ]);
        }

        if (CashShift::query()->where('cash_register_id', $request->validated('cash_register_id'))->where('status', CashShift::STATUS_OPEN)->exists()) {
            throw ValidationException::withMessages([
                'cash_register_id' => 'Esta caja ya se encuentra abierta por otro usuario.',
            ]);
        }

        $shift = CashShift::create([
            'cash_register_id' => $request->validated('cash_register_id'),
            'user_id' => $user->id,
            'opening_balance' => $request->validated('opening_balance'),
            'status' => CashShift::STATUS_OPEN,
            'opened_at' => now(),
        ]);

        return response()->json([
            'shift' => new CashShiftResource($shift->load('cashRegister.warehouse')),
        ], 201);
    }

    /**
     * Close a shift, recording the physical cash count and computing the difference.
     */
    public function close(CloseShiftRequest $request, CashShift $shift): JsonResponse
    {
        if ($shift->status !== CashShift::STATUS_OPEN) {
            throw ValidationException::withMessages([
                'shift' => 'Esta caja ya se encuentra cerrada.',
            ]);
        }

        if ($shift->user_id !== $request->user()->id) {
            abort(403, 'Solo el usuario que abrió la caja puede cerrarla.');
        }

        $closingBalance = $request->validated('closing_balance');
        $expectedBalance = $shift->opening_balance + $shift->total_cash_sales;

        $shift->update([
            'closing_balance' => $closingBalance,
            'expected_balance' => $expectedBalance,
            'difference' => $closingBalance - $expectedBalance,
            'notes' => $request->validated('notes'),
            'status' => CashShift::STATUS_CLOSED,
            'closed_at' => now(),
        ]);

        return response()->json(['shift' => new CashShiftResource($shift->load('cashRegister.warehouse'))]);
    }

    /**
     * List the shift history with optional filters.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = CashShift::query()->with(['cashRegister.warehouse', 'user'])->latest('opened_at');

        if ($cashRegisterId = $request->integer('cash_register_id')) {
            $query->where('cash_register_id', $cashRegisterId);
        }

        if ($request->has('status')) {
            $query->where('status', $request->string('status'));
        }

        $perPage = (int) $request->integer('per_page', 15);

        return CashShiftResource::collection($query->paginate($perPage));
    }

    /**
     * Show a single shift.
     */
    public function show(CashShift $shift): JsonResponse
    {
        return response()->json([
            'shift' => new CashShiftResource($shift->load(['cashRegister.warehouse', 'user'])),
        ]);
    }
}
