<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Defensive: creates the base table only if it doesn't exist yet, then
     * adds each SUNAT-required column guarded by Schema::hasColumn() so this
     * migration never tries to duplicate a column that already exists.
     */
    public function up(): void
    {
        if (! Schema::hasTable('despatches')) {
            Schema::create('despatches', function (Blueprint $table) {
                $table->id();
                $table->string('series', 10);
                $table->unsignedInteger('number');
                $table->foreignId('contact_id')->constrained();
                $table->foreignId('user_id')->constrained();
                $table->string('status')->default('issued');
                $table->timestamps();

                $table->unique(['series', 'number']);
            });
        }

        Schema::table('despatches', function (Blueprint $table) {
            if (! Schema::hasColumn('despatches', 'reference_sale_id')) {
                $table->foreignId('reference_sale_id')->nullable()->after('contact_id')
                    ->constrained('sales')->nullOnDelete();
            }

            if (! Schema::hasColumn('despatches', 'starting_address')) {
                $table->string('starting_address')->nullable();
            }

            if (! Schema::hasColumn('despatches', 'arrival_address')) {
                $table->string('arrival_address')->nullable();
            }

            if (! Schema::hasColumn('despatches', 'transport_reason')) {
                $table->string('transport_reason')->nullable();
            }

            if (! Schema::hasColumn('despatches', 'gross_weight')) {
                $table->decimal('gross_weight', 10, 2)->nullable();
            }

            if (! Schema::hasColumn('despatches', 'package_count')) {
                $table->unsignedInteger('package_count')->nullable();
            }

            if (! Schema::hasColumn('despatches', 'vehicle_plate')) {
                $table->string('vehicle_plate', 20)->nullable();
            }

            if (! Schema::hasColumn('despatches', 'vehicle_brand')) {
                $table->string('vehicle_brand', 50)->nullable();
            }

            if (! Schema::hasColumn('despatches', 'driver_dni')) {
                $table->string('driver_dni', 20)->nullable();
            }

            if (! Schema::hasColumn('despatches', 'driver_license')) {
                $table->string('driver_license', 20)->nullable();
            }

            if (! Schema::hasColumn('despatches', 'order_number')) {
                $table->string('order_number')->nullable();
            }

            if (! Schema::hasColumn('despatches', 'observations')) {
                $table->text('observations')->nullable();
            }

            if (! Schema::hasColumn('despatches', 'emission_date')) {
                $table->date('emission_date')->nullable();
            }

            if (! Schema::hasColumn('despatches', 'transport_start_date')) {
                $table->date('transport_start_date')->nullable();
            }

            if (! Schema::hasColumn('despatches', 'delivery_date')) {
                $table->date('delivery_date')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('despatches');
    }
};
