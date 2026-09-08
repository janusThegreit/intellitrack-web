<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Drop check constraint on status so 'prospect' is allowed (PostgreSQL only)
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_status_check');
        }

        Schema::table('customers', function (Blueprint $table) {
            $table->string('customer_code', 50)->nullable()->unique()->after('id');
            $table->string('business_reg_no', 100)->nullable()->after('company_name');
            $table->string('position', 100)->nullable()->after('contact_person');
            $table->string('mobile_number', 50)->nullable()->after('phone');
            $table->string('barangay', 100)->nullable()->after('address');
            $table->string('industry', 100)->nullable()->after('postal_code');
            $table->string('source', 100)->nullable()->after('customer_type');
            $table->string('status', 50)->default('active')->change();
        });

        // 2. Populate customer_code for existing customers
        $customers = DB::table('customers')->orderBy('id')->get();
        foreach ($customers as $c) {
            DB::table('customers')->where('id', $c->id)->update([
                'customer_code' => 'CUS-' . str_pad($c->id, 4, '0', STR_PAD_LEFT),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn([
                'customer_code',
                'business_reg_no',
                'position',
                'mobile_number',
                'barangay',
                'industry',
                'source',
            ]);
        });
    }
};
