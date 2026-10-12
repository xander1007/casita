<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    /**
     * The permissions available in the system, grouped by resource.
     *
     * @var array<string, list<string>>
     */
    private array $permissions = [
        'users' => ['view', 'create', 'update', 'delete', 'manage-roles', 'manage-status'],
        'roles' => ['view', 'create', 'update', 'delete'],
        'permissions' => ['view', 'assign'],
        'inventory' => ['view', 'manage', 'manage-stock'],
        'customers' => ['view', 'manage'],
        'cash' => ['open-close', 'view-history'],
        'series' => ['manage'],
        'pos' => ['access'],
        'sales' => ['view', 'annul'],
        'despatches' => ['view', 'create'],
        'purchases' => ['view', 'create', 'annul'],
        'services' => ['view', 'create', 'manage', 'deliver'],
        'reports' => ['view', 'export', 'sunat'],
    ];

    /**
     * Permissions granted to the "Administrador" role.
     *
     * @var list<string>
     */
    private array $adminPermissions = [
        'users.view',
        'users.create',
        'users.update',
        'users.manage-roles',
        'users.manage-status',
        'roles.view',
        'permissions.view',
        'inventory.view',
        'inventory.manage',
        'inventory.manage-stock',
        'customers.view',
        'customers.manage',
        'cash.open-close',
        'cash.view-history',
        'series.manage',
        'pos.access',
        'sales.view',
        'sales.annul',
        'despatches.view',
        'despatches.create',
        'purchases.view',
        'purchases.create',
        'purchases.annul',
        'services.view',
        'services.create',
        'services.manage',
        'services.deliver',
        'reports.view',
        'reports.export',
        'reports.sunat',
    ];

    /**
     * Permissions granted to the "Vendedor / Cajero" role.
     *
     * @var list<string>
     */
    private array $cashierPermissions = [
        'pos.access',
        'sales.view',
        'cash.open-close',
        'cash.view-history',
        'customers.view',
        'customers.manage',
        'inventory.view',
        'despatches.view',
        'despatches.create',
    ];

    /**
     * Permissions granted to the "Técnico" role.
     *
     * @var list<string>
     */
    private array $technicianPermissions = [
        'services.view',
        'services.create',
        'services.manage',
        'services.deliver',
        'inventory.view',
        'customers.view',
    ];

    /**
     * Seed roles and permissions.
     */
    public function run(): void
    {
        $allPermissionNames = [];

        foreach ($this->permissions as $resource => $actions) {
            foreach ($actions as $action) {
                $name = "{$resource}.{$action}";
                Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
                $allPermissionNames[] = $name;
            }
        }

        $superAdmin = Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'web']);
        $superAdmin->syncPermissions($allPermissionNames);

        $administrador = Role::firstOrCreate(['name' => 'Administrador', 'guard_name' => 'web']);
        $administrador->syncPermissions($this->adminPermissions);

        $cajero = Role::firstOrCreate(['name' => 'Vendedor / Cajero', 'guard_name' => 'web']);
        $cajero->syncPermissions($this->cashierPermissions);

        $tecnico = Role::firstOrCreate(['name' => 'Técnico', 'guard_name' => 'web']);
        $tecnico->syncPermissions($this->technicianPermissions);

        Role::firstOrCreate(['name' => 'Usuario', 'guard_name' => 'web']);
    }
}
