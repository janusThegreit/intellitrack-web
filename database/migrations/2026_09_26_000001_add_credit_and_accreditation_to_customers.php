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
        Schema::table('customers', function (Blueprint $table) {
            $table->string('payment_terms', 50)->default('Net 30')->after('status');
            $table->decimal('credit_limit', 14, 2)->default(500000.00)->after('payment_terms');
            $table->string('accreditation_status', 50)->default('accredited')->after('credit_limit');
            $table->date('accreditation_valid_until')->nullable()->after('accreditation_status');
        });

        // Set realistic enterprise credit terms and accreditation for demo clients
        DB::table('customers')->where('id', 4)->update([
            'payment_terms' => 'Net 60',
            'credit_limit' => 15000000.00,
            'accreditation_status' => 'accredited',
            'accreditation_valid_until' => now()->addMonths(18)->toDateString(),
        ]);

        DB::table('customers')->where('id', 5)->update([
            'payment_terms' => 'Net 60',
            'credit_limit' => 25000000.00,
            'accreditation_status' => 'accredited',
            'accreditation_valid_until' => now()->addMonths(24)->toDateString(),
        ]);

        DB::table('customers')->where('id', 1)->update([
            'payment_terms' => 'Net 30',
            'credit_limit' => 5000000.00,
            'accreditation_status' => 'accredited',
            'accreditation_valid_until' => now()->addMonths(12)->toDateString(),
        ]);

        DB::table('customers')->where('id', 2)->update([
            'payment_terms' => 'Net 15',
            'credit_limit' => 2000000.00,
            'accreditation_status' => 'under_review',
            'accreditation_valid_until' => now()->addMonths(6)->toDateString(),
        ]);

        // Make customer_inquiry_id nullable on rental_requirements so technical requirements can be initiated directly
        Schema::table('rental_requirements', function (Blueprint $table) {
            $table->foreignId('customer_inquiry_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rental_requirements', function (Blueprint $table) {
            $table->foreignId('customer_inquiry_id')->nullable(false)->change();
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn([
                'payment_terms',
                'credit_limit',
                'accreditation_status',
                'accreditation_valid_until',
            ]);
        });
    }
};
