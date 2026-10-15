<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProductCaseSensitiveSearchTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
        $user = User::factory()->create(['is_active' => true]);
        $user->assignRole('Super Admin');
        Sanctum::actingAs($user);

        foreach (['iPhone 15' => 'IPH-15', 'IPHONE Case' => 'cas-01', 'Cable 50%_off' => 'CBL-1'] as $name => $code) {
            Product::create([
                'name' => $name,
                'internal_code' => $code,
                'purchase_price' => 1,
                'sale_price' => 2,
                'unit_of_measure' => 'NIU',
                'igv_affectation' => '10',
                'requires_serial' => false,
                'is_service' => false,
                'is_active' => true,
            ]);
        }
    }

    /**
     * @return list<string>
     */
    private function search(string $url, string $term): array
    {
        return collect($this->getJson($url.'?search='.urlencode($term))->assertOk()->json('data'))
            ->pluck('name')->sort()->values()->all();
    }

    public function test_product_searches_respect_the_exact_case(): void
    {
        foreach (['/api/inventory/products', '/api/purchases/lookups/products', '/api/government-orders/lookups/products'] as $url) {
            $this->assertSame(['iPhone 15'], $this->search($url, 'iPhone'), $url);
            $this->assertSame(['IPHONE Case'], $this->search($url, 'IPHONE'), $url);
            $this->assertSame([], $this->search($url, 'iphone'), $url);
            $this->assertSame(['IPHONE Case'], $this->search($url, 'cas-'), $url);
            $this->assertSame([], $this->search($url, 'CAS-'), $url);
        }
    }

    public function test_wildcard_characters_are_matched_literally(): void
    {
        $this->assertSame(['Cable 50%_off'], $this->search('/api/inventory/products', '50%_'));
        $this->assertSame([], $this->search('/api/inventory/products', '5_%'));
    }
}
