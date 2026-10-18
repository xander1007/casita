<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\SalesOrder;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SalesFixtures;
use Tests\TestCase;

class SalesOrderOnDemandTest extends TestCase
{
    use RefreshDatabase, SalesFixtures;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpSales();
    }

    private function createOrder(Product $product, int $quantity, float $price = 118): array
    {
        return $this->postJson('/api/sales-orders', [
            'contact_id' => $this->customer->id,
            'warehouse_id' => $this->warehouse->id,
            'order_date' => today()->toDateString(),
            'items' => [['product_id' => $product->id, 'quantity' => $quantity, 'unit_price' => $price]],
        ])->assertCreated()->json('sales_order');
    }

    public function test_order_reserves_available_stock_and_marks_the_rest_on_demand(): void
    {
        $laptop = $this->product('LAP');
        $this->setStock($laptop, 3);

        $order = $this->createOrder($laptop, 5);

        $this->assertSame('pending', $order['status']);
        $this->assertSame(3, $order['items'][0]['reserved_quantity']);
        $this->assertSame(2, $order['items'][0]['on_demand_quantity']);
        $this->assertSame(2, $order['items'][0]['pending_quantity']);
        $this->assertTrue($order['has_on_demand']);
        $this->assertSame(['quantity' => 3, 'reserved_quantity' => 3], $this->stockOf($laptop));

        // Reserved units are no longer sellable to other customers.
        $this->getJson("/api/inventory/products?warehouse_id={$this->warehouse->id}")
            ->assertJsonPath('data.0.available_stock', 0);

        $this->openCashShift();
        $this->sell([['product_id' => $laptop->id, 'quantity' => 1, 'unit_price' => 118]])
            ->assertUnprocessable()->assertJsonValidationErrors('items');
    }

    public function test_back_to_back_purchase_fills_the_order_and_it_is_invoiced_from_the_pos(): void
    {
        $laptop = $this->product('LAP');
        $this->setStock($laptop, 1);
        $order = $this->createOrder($laptop, 3);
        $itemId = $order['items'][0]['id'];

        $suggestions = $this->getJson('/api/purchases/lookups/on-demand')->assertOk()->json('data');
        $this->assertCount(1, $suggestions);
        $this->assertSame(2, $suggestions[0]['quantity_to_buy']);

        // Buying more than needed: the surplus stays as free stock.
        $this->purchase([[
            'product_id' => $laptop->id, 'quantity' => 4, 'unit_cost' => 50,
            'allocations' => [['sales_order_item_id' => $itemId, 'quantity' => 2]],
        ]])->assertCreated()->assertJsonPath('purchase.details.0.allocations.0.order_code', $order['code']);

        $this->getJson("/api/sales-orders/{$order['id']}")
            ->assertJsonPath('sales_order.status', 'ready')
            ->assertJsonPath('sales_order.items.0.received_quantity', 2)
            ->assertJsonPath('sales_order.items.0.purchases.0.supplier', 'Mayorista SAC');
        $this->assertSame(['quantity' => 5, 'reserved_quantity' => 3], $this->stockOf($laptop));
        $this->assertSame([], $this->getJson('/api/sales-orders/purchase-suggestions')->json('data'));

        $this->openCashShift();
        $this->getJson("/api/pos/sales-orders/{$order['id']}")->assertOk()->assertJsonPath('items.0.quantity', 3);

        $this->sell([['product_id' => $laptop->id, 'quantity' => 3, 'unit_price' => 118]], ['sales_order_id' => $order['id']])
            ->assertCreated();

        $this->assertSame(['quantity' => 2, 'reserved_quantity' => 0], $this->stockOf($laptop));
        $this->getJson("/api/sales-orders/{$order['id']}")
            ->assertJsonPath('sales_order.status', 'completed')
            ->assertJsonPath('sales_order.sale.document_number', 'F001-000001');
    }

    public function test_pending_order_cannot_be_invoiced_and_must_be_sold_to_its_customer(): void
    {
        $laptop = $this->product('LAP');
        $this->openCashShift();

        $order = $this->createOrder($laptop, 1);
        $this->getJson("/api/pos/sales-orders/{$order['id']}")->assertUnprocessable();

        $this->purchase([[
            'product_id' => $laptop->id, 'quantity' => 1, 'unit_cost' => 50,
            'allocations' => [['sales_order_item_id' => $order['items'][0]['id'], 'quantity' => 1]],
        ]])->assertCreated();

        $other = $this->customer->replicate(['document_number'])->fill(['document_number' => '20100000009']);
        $other->save();

        $this->sell([['product_id' => $laptop->id, 'quantity' => 1, 'unit_price' => 118]], [
            'sales_order_id' => $order['id'], 'contact_id' => $other->id,
        ])->assertUnprocessable()->assertJsonValidationErrors('contact_id');

        // The failed sale rolled back: the reservation is intact.
        $this->assertSame(['quantity' => 1, 'reserved_quantity' => 1], $this->stockOf($laptop));
    }

    public function test_invoicing_an_order_requires_its_exact_products_and_quantities(): void
    {
        $laptop = $this->product('LAP');
        $mouse = $this->product('MOU');
        $this->setStock($laptop, 5);
        $this->setStock($mouse, 5);
        $this->openCashShift();

        $order = $this->createOrder($laptop, 2);

        $this->sell([['product_id' => $laptop->id, 'quantity' => 1, 'unit_price' => 118]], ['sales_order_id' => $order['id']])
            ->assertUnprocessable()->assertJsonValidationErrors('items');

        $this->sell([
            ['product_id' => $laptop->id, 'quantity' => 2, 'unit_price' => 118],
            ['product_id' => $mouse->id, 'quantity' => 1, 'unit_price' => 20],
        ], ['sales_order_id' => $order['id']])->assertUnprocessable()->assertJsonValidationErrors('items');

        $this->assertSame(['quantity' => 5, 'reserved_quantity' => 2], $this->stockOf($laptop));
    }

    public function test_allocations_are_validated_against_the_order(): void
    {
        $laptop = $this->product('LAP');
        $mouse = $this->product('MOU');
        $itemId = $this->createOrder($laptop, 2)['items'][0]['id'];

        $this->purchase([[
            'product_id' => $laptop->id, 'quantity' => 5, 'unit_cost' => 50,
            'allocations' => [['sales_order_item_id' => $itemId, 'quantity' => 3]],
        ]])->assertUnprocessable();

        $this->purchase([[
            'product_id' => $mouse->id, 'quantity' => 2, 'unit_cost' => 5,
            'allocations' => [['sales_order_item_id' => $itemId, 'quantity' => 2]],
        ]])->assertUnprocessable();

        $this->purchase([[
            'product_id' => $laptop->id, 'quantity' => 1, 'unit_cost' => 50,
            'allocations' => [['sales_order_item_id' => $itemId, 'quantity' => 2]],
        ]])->assertUnprocessable();

        $otherWarehouse = Warehouse::create(['name' => 'Almacén 2', 'code' => 'AL2', 'is_active' => true]);
        $this->postJson('/api/purchases', [
            'supplier_id' => $this->supplier->id, 'warehouse_id' => $otherWarehouse->id,
            'document_type' => 'factura', 'document_number' => 'F9-1', 'purchase_date' => today()->toDateString(),
            'items' => [[
                'product_id' => $laptop->id, 'quantity' => 2, 'unit_cost' => 50,
                'allocations' => [['sales_order_item_id' => $itemId, 'quantity' => 2]],
            ]],
        ])->assertUnprocessable();

        // Nothing was half-written by the rejected purchases.
        $this->assertSame(['quantity' => 0, 'reserved_quantity' => 0], $this->stockOf($laptop));
    }

    public function test_cancelling_an_order_releases_its_reservation(): void
    {
        $laptop = $this->product('LAP');
        $this->setStock($laptop, 1);
        $order = $this->createOrder($laptop, 2);

        $this->purchase([[
            'product_id' => $laptop->id, 'quantity' => 1, 'unit_cost' => 50,
            'allocations' => [['sales_order_item_id' => $order['items'][0]['id'], 'quantity' => 1]],
        ]])->assertCreated();
        $this->assertSame(['quantity' => 2, 'reserved_quantity' => 2], $this->stockOf($laptop));

        $this->postJson("/api/sales-orders/{$order['id']}/cancel", ['reason' => 'Cliente desistió'])
            ->assertOk()->assertJsonPath('sales_order.status', 'cancelled');

        $this->assertSame(['quantity' => 2, 'reserved_quantity' => 0], $this->stockOf($laptop));
        $this->postJson("/api/sales-orders/{$order['id']}/cancel", ['reason' => 'x'])->assertUnprocessable();
    }

    public function test_annulling_a_back_to_back_purchase_returns_the_units_to_pending(): void
    {
        $laptop = $this->product('LAP');
        $order = $this->createOrder($laptop, 2);

        $purchaseId = $this->purchase([[
            'product_id' => $laptop->id, 'quantity' => 2, 'unit_cost' => 50,
            'allocations' => [['sales_order_item_id' => $order['items'][0]['id'], 'quantity' => 2]],
        ]])->assertCreated()->json('purchase.id');
        $this->assertSame('ready', SalesOrder::find($order['id'])->status);

        $this->postJson("/api/purchases/{$purchaseId}/annul", ['reason' => 'Error'])->assertOk();

        $this->assertSame(['quantity' => 0, 'reserved_quantity' => 0], $this->stockOf($laptop));
        $this->getJson("/api/sales-orders/{$order['id']}")
            ->assertJsonPath('sales_order.status', 'pending')
            ->assertJsonPath('sales_order.items.0.pending_quantity', 2);
    }

    public function test_reserved_units_cannot_be_removed_by_a_manual_adjustment(): void
    {
        $laptop = $this->product('LAP');
        $this->setStock($laptop, 5);
        $this->createOrder($laptop, 3);

        $this->postJson("/api/inventory/products/{$laptop->id}/stock-movements", [
            'warehouse_id' => $this->warehouse->id, 'type' => 'out', 'quantity' => 3, 'reason' => 'Merma',
        ])->assertUnprocessable()->assertJsonValidationErrors('quantity');

        $this->postJson("/api/inventory/products/{$laptop->id}/stock-movements", [
            'warehouse_id' => $this->warehouse->id, 'type' => 'out', 'quantity' => 2, 'reason' => 'Merma',
        ])->assertCreated();
    }
}
