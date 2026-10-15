<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SalesFixtures;
use Tests\TestCase;

class QuotationTest extends TestCase
{
    use RefreshDatabase, SalesFixtures;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpSales();
    }

    private function payload(array $items, array $overrides = []): array
    {
        return [
            'contact_id' => $this->customer->id,
            'warehouse_id' => $this->warehouse->id,
            'issue_date' => today()->toDateString(),
            'valid_until' => today()->addDays(15)->toDateString(),
            'items' => $items,
            ...$overrides,
        ];
    }

    public function test_creates_and_edits_a_draft_quotation_with_igv_breakdown(): void
    {
        $taxed = $this->product('GRA');
        $exonerated = $this->product('EXO', ['igv_affectation' => '20']);

        $quotation = $this->postJson('/api/quotations', $this->payload([
            ['product_id' => $taxed->id, 'quantity' => 2, 'unit_price' => 118],
            ['product_id' => $exonerated->id, 'quantity' => 1, 'unit_price' => 50],
        ]))->assertCreated()->json('quotation');

        $this->assertSame('COT-000001', $quotation['code']);
        $this->assertSame('draft', $quotation['status']);
        $this->assertEquals(200, $quotation['op_taxed']);
        $this->assertEquals(50, $quotation['op_exonerated']);
        $this->assertEquals(36, $quotation['igv']);
        $this->assertEquals(286, $quotation['total']);

        $this->putJson("/api/quotations/{$quotation['id']}", $this->payload([
            ['product_id' => $taxed->id, 'quantity' => 1, 'unit_price' => 100],
        ]))->assertOk()
            ->assertJsonCount(1, 'quotation.items')
            ->assertJsonPath('quotation.total', 100);

        $this->postJson("/api/quotations/{$quotation['id']}/approve")->assertOk()->assertJsonPath('quotation.status', 'approved');

        $this->putJson("/api/quotations/{$quotation['id']}", $this->payload([
            ['product_id' => $taxed->id, 'quantity' => 1, 'unit_price' => 1],
        ]))->assertUnprocessable();
    }

    public function test_approved_quotation_converts_into_a_sales_order_without_reentering_items(): void
    {
        $laptop = $this->product('LAP');
        $this->setStock($laptop, 1);

        $id = $this->postJson('/api/quotations', $this->payload([
            ['product_id' => $laptop->id, 'quantity' => 3, 'unit_price' => 99.5],
        ]))->json('quotation.id');

        $this->postJson("/api/quotations/{$id}/convert-to-order", ['warehouse_id' => $this->warehouse->id])
            ->assertUnprocessable();

        $this->postJson("/api/quotations/{$id}/approve");

        $order = $this->postJson("/api/quotations/{$id}/convert-to-order", ['warehouse_id' => $this->warehouse->id])
            ->assertCreated()->json('sales_order');

        $this->assertSame('PED-000001', $order['code']);
        $this->assertSame($this->customer->id, $order['contact']['id']);
        $this->assertSame(['id' => $id, 'code' => 'COT-000001'], $order['quotation']);
        $this->assertSame(3, $order['items'][0]['quantity']);
        $this->assertEquals(99.5, $order['items'][0]['unit_price']);
        $this->assertSame(1, $order['items'][0]['reserved_quantity']);
        $this->assertSame(2, $order['items'][0]['on_demand_quantity']);

        $this->getJson("/api/quotations/{$id}")
            ->assertJsonPath('quotation.status', 'converted')
            ->assertJsonPath('quotation.sales_order.code', 'PED-000001');

        $this->postJson("/api/quotations/{$id}/convert-to-order", ['warehouse_id' => $this->warehouse->id])
            ->assertUnprocessable();
    }

    public function test_approved_quotation_is_invoiced_directly_in_the_pos(): void
    {
        $mouse = $this->product('MOU');
        $this->setStock($mouse, 10);
        $this->openCashShift();

        $id = $this->postJson('/api/quotations', $this->payload([
            ['product_id' => $mouse->id, 'quantity' => 2, 'unit_price' => 25],
        ]))->json('quotation.id');

        $this->getJson("/api/pos/quotations/{$id}")->assertUnprocessable();
        $this->sell([['product_id' => $mouse->id, 'quantity' => 2, 'unit_price' => 25]], ['quotation_id' => $id])
            ->assertUnprocessable()->assertJsonValidationErrors('quotation_id');

        $this->postJson("/api/quotations/{$id}/approve");

        $this->getJson("/api/pos/quotations/{$id}?warehouse_id={$this->warehouse->id}")
            ->assertOk()
            ->assertJsonPath('items.0.unit_price', 25)
            ->assertJsonPath('items.0.product.available_stock', 10);

        $this->sell([['product_id' => $mouse->id, 'quantity' => 2, 'unit_price' => 25]], ['quotation_id' => $id])
            ->assertCreated();

        $this->getJson("/api/quotations/{$id}")
            ->assertJsonPath('quotation.status', 'converted')
            ->assertJsonPath('quotation.sale.document_number', 'F001-000001');
        $this->assertSame(['quantity' => 8, 'reserved_quantity' => 0], $this->stockOf($mouse));
    }

    public function test_rejected_quotation_cannot_be_approved(): void
    {
        $id = $this->postJson('/api/quotations', $this->payload([
            ['product_id' => $this->product('X')->id, 'quantity' => 1, 'unit_price' => 1],
        ]))->json('quotation.id');

        $this->postJson("/api/quotations/{$id}/reject")->assertOk()->assertJsonPath('quotation.status', 'rejected');
        $this->postJson("/api/quotations/{$id}/approve")->assertUnprocessable();
    }
}
