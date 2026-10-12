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
        Schema::table('technical_services', function (Blueprint $table) {
            if (! Schema::hasColumn('technical_services', 'device_password')) {
                $table->string('device_password')->nullable()->after('serial_number');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('technical_services', function (Blueprint $table) {
            if (Schema::hasColumn('technical_services', 'device_password')) {
                $table->dropColumn('device_password');
            }
        });
    }
};
