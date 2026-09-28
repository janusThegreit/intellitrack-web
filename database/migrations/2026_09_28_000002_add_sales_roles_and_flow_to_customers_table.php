<?php

use App\Models\Customer;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            if (!Schema::hasColumn('customers', 'assigned_sales_bd_id')) {
                $table->foreignId('assigned_sales_bd_id')
                    ->nullable()
                    ->after('contact_person')
                    ->constrained('users')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('customers', 'sales_manager_id')) {
                $table->foreignId('sales_manager_id')
                    ->nullable()
                    ->after('assigned_sales_bd_id')
                    ->constrained('users')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('customers', 'pipeline_stage')) {
                $table->string('pipeline_stage', 50)
                    ->default('lead_acquisition')
                    ->after('status');
            }
        });

        // Ensure Core Sales Roles exist before assigning
        $salesBd = User::where('role', 'sales_business_development')
            ->orWhere('email', 'salesbd@intellitrack.com')
            ->first();

        $salesManager = User::where('role', 'sales_manager')
            ->orWhere('email', 'salesmanager@intellitrack.com')
            ->first();

        // If customers table has fewer than 50 real corporate clients on live server, seed them safely!
        if (Customer::count() < 50) {
            try {
                Artisan::call('db:seed', [
                    '--class' => 'Database\\Seeders\\PhilippineRealCustomersSeeder',
                    '--force' => true,
                ]);
            } catch (\Throwable $e) {
                // Seeder execution fallback
            }
        }

        // Link all clients to Sales BD and Sales Manager and set initial flow process stage
        if ($salesBd || $salesManager) {
            Customer::query()->chunkById(100, function ($customers) use ($salesBd, $salesManager) {
                foreach ($customers as $customer) {
                    $stage = 'lead_acquisition';
                    if ($customer->status === 'active' || $customer->bidding_status === 'awarded') {
                        $stage = 'awarded_contract';
                    } elseif ($customer->bidding_status === 'bidding' || $customer->bidding_status === 'negotiation') {
                        $stage = 'bidding_proposal';
                    } elseif ($customer->accreditation_status === 'under_review' || $customer->accreditation_status === 'pending') {
                        $stage = 'accreditation_review';
                    } elseif (!empty($customer->technical_requirements)) {
                        $stage = 'technical_scoping';
                    }

                    $customer->update([
                        'assigned_sales_bd_id' => $customer->assigned_sales_bd_id ?? $salesBd?->id,
                        'sales_manager_id' => $customer->sales_manager_id ?? $salesManager?->id,
                        'pipeline_stage' => $customer->pipeline_stage ?: $stage,
                    ]);
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            if (Schema::hasColumn('customers', 'assigned_sales_bd_id')) {
                $table->dropForeign(['assigned_sales_bd_id']);
                $table->dropColumn('assigned_sales_bd_id');
            }

            if (Schema::hasColumn('customers', 'sales_manager_id')) {
                $table->dropForeign(['sales_manager_id']);
                $table->dropColumn('sales_manager_id');
            }

            if (Schema::hasColumn('customers', 'pipeline_stage')) {
                $table->dropColumn('pipeline_stage');
            }
        });
    }
};
