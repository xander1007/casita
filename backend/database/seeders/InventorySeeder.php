<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;

class InventorySeeder extends Seeder
{
    /**
     * Seed baseline categories, brands and warehouses.
     */
    public function run(): void
    {
        foreach (['Computadoras', 'Laptops', 'Componentes', 'Impresoras', 'Periféricos', 'Accesorios', 'Servicios Técnicos'] as $name) {
            Category::firstOrCreate(['name' => $name]);
        }

        foreach (['HP', 'Dell', 'Lenovo', 'ASUS', 'Kingston', 'Epson', 'Canon', 'Genérico'] as $name) {
            Brand::firstOrCreate(['name' => $name]);
        }

        Warehouse::firstOrCreate(
            ['code' => 'ALM-01'],
            ['name' => 'Almacén Principal', 'address' => 'JR. LIBERTAD NRO. 502 - MOYOBAMBA'],
        );

        Warehouse::firstOrCreate(
            ['code' => 'SVT-01'],
            ['name' => 'Servicio Técnico'],
        );
    }
}
