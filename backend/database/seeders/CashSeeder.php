<?php

namespace Database\Seeders;

use App\Models\CashRegister;
use App\Models\DocumentSeries;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;

class CashSeeder extends Seeder
{
    /**
     * Seed the baseline cash registers and SUNAT document series.
     */
    public function run(): void
    {
        $mainWarehouse = Warehouse::query()->where('code', 'ALM-01')->first();
        $serviceWarehouse = Warehouse::query()->where('code', 'SVT-01')->first();

        $main = CashRegister::firstOrCreate(
            ['code' => 'CAJA-01'],
            ['name' => 'Caja Principal 01', 'warehouse_id' => $mainWarehouse?->id],
        );

        CashRegister::firstOrCreate(
            ['code' => 'CAJA-ST'],
            ['name' => 'Caja Servicio Técnico', 'warehouse_id' => $serviceWarehouse?->id],
        );

        DocumentSeries::firstOrCreate(
            ['series' => 'B001'],
            ['document_type' => '03', 'cash_register_id' => $main->id, 'current_correlative' => 0, 'is_active' => true],
        );

        DocumentSeries::firstOrCreate(
            ['series' => 'F001'],
            ['document_type' => '01', 'cash_register_id' => $main->id, 'current_correlative' => 0, 'is_active' => true],
        );

        DocumentSeries::firstOrCreate(
            ['series' => 'NV01'],
            ['document_type' => 'NV', 'cash_register_id' => $main->id, 'current_correlative' => 0, 'is_active' => true],
        );
    }
}
