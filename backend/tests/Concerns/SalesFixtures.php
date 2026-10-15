<?php

namespace Tests\Concerns;

use App\Models\CashRegister;
use App\Models\CashShift;
use App\Models\Contact;
use App\Models\DocumentSeries;
use App\Models\Product;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\WarehouseStock;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\Sanctum;

trait SalesFixtures
{
    protected User $user;

    protected Contact $customer;

    protected Contact $supplier;

    protected Warehouse $warehouse;

    protected function setUpSales(): void
    {
        $this->seed(RolePermissionSeeder::class);
        $this->user = User::factory()->create(['is_active' => true]);
        $this->user->assignRole('Super Admin');
        Sanctum::actingAs($this->user);

        $this->customer = Contact::create([
            'type' => 'client', 'identity_document_type' => '6',
            'document_number' => '20100000001', 'name_or_business_name' => 'Cliente SAC', 'is_active' => true,
        ]);
        $this->supplier = Contact::create([
            'type' => 'supplier', 'identity_document_type' => '6',
            'document_number' => '20100000002', 'name_or_business_name' => 'Mayorista SAC', 'is_active' => true,
        ]);
        $this->warehouse = Warehouse::create(['name' => 'Tienda', 'code' => 'TDA', 'is_active' => true]);
    }

    protected function product(string $code, array $attributes = []): Product
    {
        return Product::create([
            'name' => "Producto {$code}",
            'internal_code' => $code,
            'purchase_price' => 50,
            'sale_price' => 118,
            'unit_of_measure' => 'NIU',
            'igv_affectation' => '10',
            'requires_serial' => false,
            'is_service' => false,
            'is_active' => true,
            ...$attributes,
        ]);
    }

    protected function setStock(Product $product, int $quantity, ?Warehouse $warehouse = null): void
    {
        WarehouseStock::create([
            'product_id' => $product->id,
            'warehouse_id' => ($warehouse ?? $this->warehouse)->id,
            'quantity' => $quantity,
            'reserved_quantity' => 0,
        ]);
    }

    /**
     * @return array{quantity: int, reserved_quantity: int}
     */
    protected function stockOf(Product $product, ?Warehouse $warehouse = null): array
    {
        $stock = WarehouseStock::query()
            ->where('product_id', $product->id)
            ->where('warehouse_id', ($warehouse ?? $this->warehouse)->id)
            ->first();

        return ['quantity' => $stock?->quantity ?? 0, 'reserved_quantity' => $stock?->reserved_quantity ?? 0];
    }

    protected function openCashShift(?Warehouse $warehouse = null): void
    {
        $register = CashRegister::create([
            'name' => 'Caja 1', 'code' => 'C1', 'warehouse_id' => ($warehouse ?? $this->warehouse)->id, 'is_active' => true,
        ]);
        DocumentSeries::create([
            'cash_register_id' => $register->id, 'document_type' => '01', 'series' => 'F001',
            'current_correlative' => 0, 'is_active' => true,
        ]);
        CashShift::create([
            'cash_register_id' => $register->id, 'user_id' => $this->user->id,
            'opening_balance' => 0, 'status' => CashShift::STATUS_OPEN, 'opened_at' => now(),
        ]);
    }

    /**
     * @param  list<array{product_id: int, quantity: int, unit_price: float|int}>  $items
     */
    protected function sell(array $items, array $extra = []): TestResponse
    {
        $total = collect($items)->sum(fn ($i) => $i['quantity'] * $i['unit_price']);

        return $this->postJson('/api/pos/sales', [
            'contact_id' => $this->customer->id,
            'document_type' => '01',
            'items' => $items,
            'payments' => [['payment_method' => 'cash', 'amount' => $total]],
            ...$extra,
        ]);
    }

    protected function purchase(array $items): TestResponse
    {
        return $this->postJson('/api/purchases', [
            'supplier_id' => $this->supplier->id,
            'warehouse_id' => $this->warehouse->id,
            'document_type' => 'factura',
            'document_number' => 'F001-'.random_int(1000, 99999),
            'purchase_date' => today()->toDateString(),
            'items' => $items,
        ]);
    }
}
