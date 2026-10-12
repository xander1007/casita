<?php

namespace Database\Seeders;

use App\Models\CompanySetting;
use Illuminate\Database\Seeder;

class CompanySettingSeeder extends Seeder
{
    /**
     * Seed the company's identity/profile data.
     */
    public function run(): void
    {
        CompanySetting::updateOrCreate(
            ['id' => 1],
            [
                'ruc' => '20404135377',
                'legal_name' => 'LA CASITA DE LA COMPUTADORA S.R.LTDA.',
                'address' => 'JR. LIBERTAD NRO. 502 - SAN MARTIN MOYOBAMBA MOYOBAMBA',
                'phones' => ['(42)562001', '564344', '942488514', '942930282', '942930283'],
                'emails' => ['meche.ruiz@casita.com.pe', 'maribel.robles@casita.com.pe'],
                'slogan' => 'SOMOS SOLUCIÓN COMPRE GARANTÍA, COMPRE EN LA REGIÓN',
            ],
        );
    }
}
