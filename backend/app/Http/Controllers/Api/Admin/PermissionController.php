<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\PermissionResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    /**
     * List all permissions available in the system.
     */
    public function index(): AnonymousResourceCollection
    {
        return PermissionResource::collection(
            Permission::query()->orderBy('name')->get(),
        );
    }
}
