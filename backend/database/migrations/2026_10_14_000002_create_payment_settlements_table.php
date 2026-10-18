<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payment_settlements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contact_id')->constrained();
            $table->foreignId('user_id')->constrained();
            $table->string('document_type', 20);
            $table->string('document_number', 30);
            $table->string('currency', 3)->default('PEN');
            $table->decimal('amount', 12, 2);
            $table->string('operation_number', 50)->nullable();
            $table->date('payment_date');
            $table->string('payment_method', 20);
            $table->string('bank', 100);
            $table->string('account', 50);
            $table->text('notes')->nullable();
            $table->string('status')->default('registered');
            $table->timestamp('annulled_at')->nullable();
            $table->foreignId('annulled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('annulment_reason')->nullable();
            $table->timestamps();

            $table->index(['document_type', 'document_number']);
            $table->index('payment_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_settlements');
    }
};
