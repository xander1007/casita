<?php

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PaymentSettlementTest extends TestCase
{
    use RefreshDatabase;

    private Contact $contact;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
        $user = User::factory()->create(['is_active' => true]);
        $user->assignRole('Super Admin');
        Sanctum::actingAs($user);

        $this->contact = Contact::create([
            'type' => 'client',
            'identity_document_type' => '6',
            'document_number' => '20131370998',
            'name_or_business_name' => 'Gobierno Regional de Prueba',
        ]);
    }

    private function payload(array $overrides = []): array
    {
        return [
            'contact_id' => $this->contact->id,
            'document_type' => 'factura',
            'document_number' => 'F001-000123',
            'amount' => 1500.50,
            'operation_number' => '00123456',
            'payment_date' => '2026-10-10',
            'payment_method' => 'transfer',
            'bank' => 'BCP',
            'account' => '191-1234567-0-12',
            ...$overrides,
        ];
    }

    public function test_registers_a_settlement_with_all_payment_fields(): void
    {
        $this->postJson('/api/settlements', $this->payload())
            ->assertCreated()
            ->assertJsonPath('settlement.operation_number', '00123456')
            ->assertJsonPath('settlement.payment_date', '2026-10-10')
            ->assertJsonPath('settlement.payment_method', 'transfer')
            ->assertJsonPath('settlement.bank', 'BCP')
            ->assertJsonPath('settlement.account', '191-1234567-0-12')
            ->assertJsonPath('settlement.currency', 'PEN')
            ->assertJsonPath('settlement.status', 'registered');
    }

    public function test_operation_number_is_optional_but_the_other_fields_are_required(): void
    {
        $this->postJson('/api/settlements', $this->payload(['operation_number' => '', 'document_type' => 'letra']))
            ->assertCreated()
            ->assertJsonPath('settlement.operation_number', null);

        $this->postJson('/api/settlements', $this->payload([
            'payment_date' => null, 'payment_method' => null, 'bank' => '  ', 'account' => null,
        ]))->assertUnprocessable()
            ->assertJsonValidationErrors(['payment_date', 'payment_method', 'bank', 'account']);

        $this->postJson('/api/settlements', $this->payload(['document_type' => 'boleta', 'payment_method' => 'bitcoin']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['document_type', 'payment_method']);
    }

    public function test_the_same_bank_operation_cannot_be_registered_twice_unless_annulled(): void
    {
        $id = $this->postJson('/api/settlements', $this->payload())->assertCreated()->json('settlement.id');

        $this->postJson('/api/settlements', $this->payload(['document_number' => 'F001-000124']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('operation_number');

        // Same operation number at a different bank is a different operation.
        $this->postJson('/api/settlements', $this->payload(['bank' => 'Interbank']))->assertCreated();

        $this->postJson("/api/settlements/{$id}/annul", ['reason' => 'Registrado por error'])
            ->assertOk()
            ->assertJsonPath('settlement.status', 'annulled');

        $this->postJson('/api/settlements', $this->payload(['document_number' => 'F001-000124']))->assertCreated();
    }

    public function test_payment_date_cannot_be_in_the_future(): void
    {
        $this->postJson('/api/settlements', $this->payload(['payment_date' => now()->addDay()->toDateString()]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('payment_date');
    }
}
