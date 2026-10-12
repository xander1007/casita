<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RolePermissionSeeder::class);
        $this->call(CompanySettingSeeder::class);
        $this->call(InventorySeeder::class);
        $this->call(ContactSeeder::class);
        $this->call(CashSeeder::class);

        $superAdmin = User::factory()->create([
            'name' => 'Super Admin',
            'email' => 'admin@casita.com.pe',
            'password' => 'Casita#2026$Admin',
        ]);
        $superAdmin->assignRole('Super Admin');
    }
}
