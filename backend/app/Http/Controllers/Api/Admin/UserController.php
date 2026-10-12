<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\SyncRolesRequest;
use App\Http\Requests\Admin\UpdateStatusRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    /**
     * List users with pagination and optional filters.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = User::query()->with('roles')->latest();

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($role = $request->string('role')->trim()->toString()) {
            $query->whereHas('roles', fn ($q) => $q->where('name', $role));
        }

        if ($request->has('status')) {
            $query->where('is_active', $request->boolean('status'));
        }

        $perPage = (int) $request->integer('per_page', 15);

        return UserResource::collection($query->paginate($perPage));
    }

    /**
     * Create a new user.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'password' => $request->validated('password'),
            'is_active' => $request->boolean('is_active', true),
        ]);

        if ($roles = $request->validated('roles')) {
            // "users.create" only grants creating the account; assigning roles is a
            // separate privilege so a caller can't smuggle in a Super Admin role
            // for an account they control.
            abort_unless($request->user()->can('users.manage-roles'), 403, 'No tienes permiso para asignar roles.');

            $user->syncRoles($roles);
        }

        return response()->json([
            'user' => new UserResource($user->load('roles')),
        ], 201);
    }

    /**
     * Show a single user.
     */
    public function show(User $user): JsonResponse
    {
        return response()->json([
            'user' => new UserResource($user->load('roles')),
        ]);
    }

    /**
     * Update a user's basic data.
     */
    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $data = $request->safe()->only(['name', 'email']);

        if ($password = $request->validated('password')) {
            $data['password'] = Hash::make($password);
        }

        $user->update($data);

        return response()->json([
            'user' => new UserResource($user->load('roles')),
        ]);
    }

    /**
     * Enable or disable a user.
     */
    public function updateStatus(UpdateStatusRequest $request, User $user): JsonResponse
    {
        if ($user->is($request->user()) && ! $request->boolean('is_active')) {
            throw ValidationException::withMessages([
                'is_active' => 'No puedes deshabilitar tu propia cuenta.',
            ]);
        }

        $user->update(['is_active' => $request->boolean('is_active')]);

        return response()->json([
            'user' => new UserResource($user->load('roles')),
        ]);
    }

    /**
     * Sync the roles assigned to a user.
     */
    public function syncRoles(SyncRolesRequest $request, User $user): JsonResponse
    {
        $user->syncRoles($request->validated('roles'));

        return response()->json([
            'user' => new UserResource($user->load('roles')),
        ]);
    }

    /**
     * Delete a user permanently.
     */
    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($user->is($request->user())) {
            throw ValidationException::withMessages([
                'user' => 'No puedes eliminar tu propia cuenta.',
            ]);
        }

        $user->syncRoles([]);
        $user->syncPermissions([]);
        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'Usuario eliminado correctamente.']);
    }
}
