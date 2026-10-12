<?php

namespace App\Http\Controllers\Api\Cash;

use App\Http\Controllers\Controller;
use App\Http\Resources\CashRegisterResource;
use App\Models\CashRegister;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CashRegisterController extends Controller
{
    /**
     * List the active cash registers, for the shift-opening selector.
     */
    public function index(): AnonymousResourceCollection
    {
        return CashRegisterResource::collection(
            CashRegister::query()->with('warehouse')->where('is_active', true)->orderBy('name')->get(),
        );
    }
}
