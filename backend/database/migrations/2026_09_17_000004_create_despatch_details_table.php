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
        if (! Schema::hasTable('despatch_details')) {
            Schema::create('despatch_details', function (Blueprint $table) {
                $table->id();
                $table->foreignId('despatch_id')->constrained()->cascadeOnDelete();
                $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
                $table->string('code', 30)->nullable();
                $table->string('description');
                $table->decimal('quantity', 12, 3)->default(1);
                $table->string('unit_of_measure', 10)->default('NIU');
                $table->decimal('weight', 10, 2)->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('despatch_details');
    }
};
