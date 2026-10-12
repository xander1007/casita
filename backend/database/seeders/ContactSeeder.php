<?php

namespace Database\Seeders;

use App\Models\Contact;
use Illuminate\Database\Seeder;

class ContactSeeder extends Seeder
{
    /**
     * Seed the generic walk-in customer used for quick sales.
     */
    public function run(): void
    {
        Contact::firstOrCreate(
            ['identity_document_type' => '1', 'document_number' => '00000000'],
            [
                'type' => 'client',
                'name_or_business_name' => 'Clientes Varios',
                'is_active' => true,
            ],
        );
    }
}
