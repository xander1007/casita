<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Defensive: only adds the columns that are actually missing, so this
     * migration is safe to run even if a previous partial migration already
     * created some of them.
     */
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (! Schema::hasColumn('sales', 'payment_condition')) {
                $table->string('payment_condition', 10)->default('CONTADO')->after('status');
            }

            if (! Schema::hasColumn('sales', 'amount_in_words')) {
                $table->string('amount_in_words')->nullable()->after('total');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (Schema::hasColumn('sales', 'payment_condition')) {
                $table->dropColumn('payment_condition');
            }

            if (Schema::hasColumn('sales', 'amount_in_words')) {
                $table->dropColumn('amount_in_words');
            }
        });
    }
};
