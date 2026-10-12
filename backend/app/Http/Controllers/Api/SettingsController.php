<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CompanySetting;
use Illuminate\Http\JsonResponse;

class SettingsController extends Controller
{
    /**
     * Return the company's identity/profile data.
     */
    public function company(): JsonResponse
    {
        $settings = CompanySetting::query()->first();

        return response()->json([
            'company' => $settings ? [
                'ruc' => $settings->ruc,
                'legal_name' => $settings->legal_name,
                'address' => $settings->address,
                'phones' => $settings->phones,
                'emails' => $settings->emails,
                'slogan' => $settings->slogan,
            ] : null,
        ]);
    }
}
