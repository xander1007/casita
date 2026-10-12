<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreRoleRequest;
use App\Http\Requests\Admin\SyncPermissionsRequest;
use App\Http\Requests\Admin\UpdateRoleRequest;
use App\Http\Resources\RoleResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    /**
     * List all roles with their permissions.
     */
    public function index(): AnonymousResourceCollection
    {
        $roles = Role::query()
            ->with('permissions')
            ->orderBy('name')
            ->get();

        $this->attachUserCounts($roles);

        return RoleResource::collection($roles);
    }

    /**
     * Create a new role.
     */
    public function store(StoreRoleRequest $request): JsonResponse
    {
        $role = Role::create([
            'name' => $request->validated('name'),
            'guard_name' => 'web',
        ]);

        if ($permissions = $request->validated('permissions')) {
            // "roles.create" only grants creating an (empty) role; granting it
            // permissions at creation time is otherwise gated behind
            // "permissions.assign" via the dedicated sync endpoint, so enforce
            // the same check here to close the bypass.
            abort_unless($request->user()->can('permissions.assign'), 403, 'No tienes permiso para asignar permisos.');

            $role->syncPermissions($permissions);
        }

        return response()->json([
            'role' => new RoleResource($role->load('permissions')),
        ], 201);
    }

    /**
     * Show a single role.
     */
    public function show(Role $role): JsonResponse
    {
        $role->load('permissions');
        $this->attachUserCounts(collect([$role]));

        return response()->json([
            'role' => new RoleResource($role),
        ]);
    }

    /**
     * Rename a role.
     */
    public function update(UpdateRoleRequest $request, Role $role): JsonResponse
    {
        $this->guardProtectedRole($role);

        $role->update(['name' => $request->validated('name')]);

        return response()->json([
            'role' => new RoleResource($role->load('permissions')),
        ]);
    }

    /**
     * Sync the permissions assigned to a role.
     */
    public function syncPermissions(SyncPermissionsRequest $request, Role $role): JsonResponse
    {
        $role->syncPermissions($request->validated('permissions'));

        return response()->json([
            'role' => new RoleResource($role->load('permissions')),
        ]);
    }

    /**
     * Delete a role.
     */
    public function destroy(Role $role): JsonResponse
    {
        $this->guardProtectedRole($role);

        $role->delete();

        return response()->json(['message' => 'Rol eliminado correctamente.']);
    }

    /**
     * Manually attach a `users_count` attribute to each role.
     *
     * Spatie's Role::users() relation resolves the related model via the
     * *current default auth guard*, which Sanctum's `auth:sanctum` middleware
     * temporarily switches to "sanctum" for the request. That guard has no
     * user provider, so `withCount('users')` / `loadCount('users')` blow up
     * with "Class name must be a valid object or a string". Counting through
     * the pivot table directly sidesteps the relation entirely.
     *
     * @param  \Illuminate\Support\Collection<int, Role>  $roles
     */
    private function attachUserCounts($roles): void
    {
        $counts = DB::table('model_has_roles')
            ->select('role_id', DB::raw('count(*) as aggregate'))
            ->whereIn('role_id', $roles->pluck('id'))
            ->groupBy('role_id')
            ->pluck('aggregate', 'role_id');

        $roles->each(fn (Role $role) => $role->setAttribute('users_count', (int) ($counts[$role->id] ?? 0)));
    }

    /**
     * Prevent renaming/deleting the base roles the system relies on.
     */
    private function guardProtectedRole(Role $role): void
    {
        if (in_array($role->name, ['Super Admin', 'Usuario'], true)) {
            throw ValidationException::withMessages([
                'name' => 'Este rol es parte del sistema base y no puede modificarse.',
            ]);
        }
    }
}
