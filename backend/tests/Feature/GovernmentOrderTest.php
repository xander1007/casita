<?php

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\Product;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\WarehouseStock;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GovernmentOrderTest extends TestCase
{
    use RefreshDatabase;

    private Contact $entity;

    private Warehouse $main;

    private Warehouse $secondary;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
        $user = User::factory()->create(['is_active' => true]);
        $user->assignRole('Super Admin');
        Sanctum::actingAs($user);

        $this->entity = Contact::create([
            'type' => 'client',
            'identity_document_type' => '6',
            'document_number' => '20131370998',
            'name_or_business_name' => 'Municipalidad Distrital de Prueba',
        ]);
        $this->main = Warehouse::create(['name' => 'Principal', 'code' => 'PRI']);
        $this->secondary = Warehouse::create(['name' => 'Secundario', 'code' => 'SEC']);
    }

    private function product(string $code, array $attributes = []): Product
    {
        return Product::create([
            'name' => "Producto {$code}",
            'internal_code' => $code,
            'purchase_price' => 10,
            'sale_price' => 15,
            'unit_of_measure' => 'NIU',
            'igv_affectation' => '10',
            'requires_serial' => false,
            'is_service' => false,
            ...$attributes,
        ]);
    }

    private function stock(Product $product, Warehouse $warehouse, int $quantity): void
    {
        WarehouseStock::create(['product_id' => $product->id, 'warehouse_id' => $warehouse->id, 'quantity' => $quantity]);
    }

    public function test_report_compares_requested_items_with_stock_across_all_warehouses(): void
    {
        $complete = $this->product('A');
        $partial = $this->product('B', ['purchase_price' => 4.5]);
        $missing = $this->product('C', ['purchase_price' => 2]);
        $service = $this->product('D', ['is_service' => true]);

        $this->stock($complete, $this->main, 6);
        $this->stock($complete, $this->secondary, 4);
        $this->stock($partial, $this->main, 3);
        $this->stock($missing, $this->main, -2);

        $response = $this->postJson('/api/government-orders', [
            'contact_id' => $this->entity->id,
            'order_number' => 'OC-2026-0001',
            'issue_date' => '2026-10-01',
            'items' => [
                ['product_id' => $complete->id, 'quantity' => 10, 'unit_price' => 20],
                ['product_id' => $partial->id, 'quantity' => 5, 'unit_price' => 8],
                ['product_id' => $missing->id, 'quantity' => 4, 'unit_price' => 3],
                ['product_id' => $service->id, 'quantity' => 1, 'unit_price' => 100],
                // Same product on a second line is aggregated in the report.
                ['product_id' => $partial->id, 'quantity' => 2, 'unit_price' => 8],
            ],
        ])->assertCreated();

        $response->assertJsonPath('order.total', 368)
            ->assertJsonPath('order.status', 'pending');

        $lines = collect($response->json('stock_report.lines'))->keyBy('product_id');

        $this->assertSame(['required' => 10, 'available' => 10, 'to_buy' => 0, 'status' => 'complete'],
            collect($lines[$complete->id])->only('required', 'available', 'to_buy', 'status')->all());
        $this->assertSame(['required' => 7, 'available' => 3, 'to_buy' => 4, 'status' => 'partial'],
            collect($lines[$partial->id])->only('required', 'available', 'to_buy', 'status')->all());
        $this->assertSame(['required' => 4, 'available' => 0, 'to_buy' => 4, 'status' => 'missing'],
            collect($lines[$missing->id])->only('required', 'available', 'to_buy', 'status')->all());
        $this->assertSame(0, $lines[$service->id]['to_buy']);
        $this->assertSame('service', $lines[$service->id]['status']);

        $response->assertJsonPath('stock_report.summary.units_to_buy', 8)
            ->assertJsonPath('stock_report.summary.lines_to_buy', 2)
            ->assertJsonPath('stock_report.summary.estimated_purchase_cost', 26)
            ->assertJsonPath('stock_report.summary.can_fulfill', false);
    }

    public function test_report_only_counts_the_order_warehouse_when_one_is_set(): void
    {
        $product = $this->product('A');
        $this->stock($product, $this->main, 2);
        $this->stock($product, $this->secondary, 50);

        $response = $this->postJson('/api/government-orders', [
            'contact_id' => $this->entity->id,
            'warehouse_id' => $this->main->id,
            'order_number' => 'OC-2',
            'issue_date' => '2026-10-01',
            'items' => [['product_id' => $product->id, 'quantity' => 5, 'unit_price' => 1]],
        ])->assertCreated();

        $response->assertJsonPath('stock_report.lines.0.available', 2)
            ->assertJsonPath('stock_report.lines.0.to_buy', 3);

        // The report is live: new stock is reflected without editing the order.
        WarehouseStock::query()->where('warehouse_id', $this->main->id)->update(['quantity' => 9]);

        $this->getJson('/api/government-orders/'.$response->json('order.id').'/stock-report')
            ->assertOk()
            ->assertJsonPath('stock_report.lines.0.to_buy', 0)
            ->assertJsonPath('stock_report.summary.can_fulfill', true);
    }

    public function test_order_number_is_unique_per_entity_and_status_transitions_are_guarded(): void
    {
        $product = $this->product('A');
        $payload = [
            'contact_id' => $this->entity->id,
            'order_number' => 'OC-9',
            'issue_date' => '2026-10-01',
            'items' => [['product_id' => $product->id, 'quantity' => 1, 'unit_price' => 1]],
        ];

        $id = $this->postJson('/api/government-orders', $payload)->assertCreated()->json('order.id');
        $this->postJson('/api/government-orders', $payload)->assertUnprocessable()->assertJsonValidationErrors('order_number');

        $this->postJson("/api/government-orders/{$id}/deliver")->assertOk()->assertJsonPath('order.status', 'delivered');
        $this->postJson("/api/government-orders/{$id}/annul", ['reason' => 'x'])->assertUnprocessable();
    }
}
