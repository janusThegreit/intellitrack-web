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
        // 1. Extend job_orders with Core 1 and Core 2 handoff fields
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE job_orders DROP CONSTRAINT IF EXISTS job_orders_status_check');
        }

        Schema::table('job_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('job_orders', 'project_id')) {
                $table->foreignId('project_id')->nullable()->constrained('projects')->onDelete('set null');
            }
            if (!Schema::hasColumn('job_orders', 'quotation_id')) {
                $table->foreignId('quotation_id')->nullable()->constrained('quotations')->onDelete('set null');
            }
            if (!Schema::hasColumn('job_orders', 'service_type')) {
                $table->string('service_type')->nullable();
            }
            if (!Schema::hasColumn('job_orders', 'required_equipment')) {
                $table->text('required_equipment')->nullable();
            }
            if (!Schema::hasColumn('job_orders', 'rental_requirements')) {
                $table->text('rental_requirements')->nullable();
            }
            if (!Schema::hasColumn('job_orders', 'job_requirements')) {
                $table->text('job_requirements')->nullable();
            }
            if (!Schema::hasColumn('job_orders', 'special_instructions')) {
                $table->text('special_instructions')->nullable();
            }
            if (!Schema::hasColumn('job_orders', 'remarks')) {
                $table->text('remarks')->nullable();
            }
            if (!Schema::hasColumn('job_orders', 'operations_submitted_at')) {
                $table->timestamp('operations_submitted_at')->nullable();
            }
            if (!Schema::hasColumn('job_orders', 'operational_status')) {
                $table->string('operational_status')->nullable()->default('Pending Submission to Operations');
            }
            if (!Schema::hasColumn('job_orders', 'dispatch_status')) {
                $table->string('dispatch_status')->nullable()->default('Unassigned');
            }
            if (!Schema::hasColumn('job_orders', 'operational_equipment_status')) {
                $table->string('operational_equipment_status')->nullable()->default('Awaiting Allocation');
            }
            if (!Schema::hasColumn('job_orders', 'operational_notes')) {
                $table->text('operational_notes')->nullable();
            }
            $table->string('status', 50)->default('draft')->change();
        });

        // 2. Extend projects with sales-side project fields
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check');
        }

        Schema::table('projects', function (Blueprint $table) {
            if (!Schema::hasColumn('projects', 'location')) {
                $table->string('location')->nullable();
            }
            if (!Schema::hasColumn('projects', 'expected_end_date')) {
                $table->timestamp('expected_end_date')->nullable();
            }
            if (!Schema::hasColumn('projects', 'requirements')) {
                $table->text('requirements')->nullable();
            }
            if (!Schema::hasColumn('projects', 'required_equipment')) {
                $table->text('required_equipment')->nullable();
            }
            if (!Schema::hasColumn('projects', 'remarks')) {
                $table->text('remarks')->nullable();
            }
            if (!Schema::hasColumn('projects', 'job_order_id')) {
                $table->foreignId('job_order_id')->nullable()->constrained('job_orders')->onDelete('set null');
            }
            $table->string('status', 50)->default('planned')->change();
        });

        // 3. Extend rentals with rental requirements and operational status fields
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE rentals DROP CONSTRAINT IF EXISTS rentals_status_check');
        }

        Schema::table('rentals', function (Blueprint $table) {
            if (!Schema::hasColumn('rentals', 'quotation_id')) {
                $table->foreignId('quotation_id')->nullable()->constrained('quotations')->onDelete('set null');
            }
            if (!Schema::hasColumn('rentals', 'equipment_type')) {
                $table->string('equipment_type')->nullable()->default('Crane'); // Crane, Truck
            }
            if (!Schema::hasColumn('rentals', 'equipment_requirements')) {
                $table->text('equipment_requirements')->nullable();
            }
            if (!Schema::hasColumn('rentals', 'operational_status')) {
                $table->string('operational_status')->nullable()->default('Requested from Operations');
            }
            $table->string('status', 50)->default('draft')->change();
        });

        // 4. Extend customers with Group 185 Master Data Integration tracking
        Schema::table('customers', function (Blueprint $table) {
            if (!Schema::hasColumn('customers', 'group185_synced_at')) {
                $table->timestamp('group185_synced_at')->nullable();
            }
            if (!Schema::hasColumn('customers', 'group185_reference_id')) {
                $table->string('group185_reference_id', 100)->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['group185_synced_at', 'group185_reference_id']);
        });

        Schema::table('rentals', function (Blueprint $table) {
            $table->dropForeign(['quotation_id']);
            $table->dropColumn(['quotation_id', 'equipment_type', 'equipment_requirements', 'operational_status']);
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->dropForeign(['job_order_id']);
            $table->dropColumn(['location', 'expected_end_date', 'requirements', 'required_equipment', 'remarks', 'job_order_id']);
        });

        Schema::table('job_orders', function (Blueprint $table) {
            $table->dropForeign(['project_id']);
            $table->dropForeign(['quotation_id']);
            $table->dropColumn([
                'project_id', 'quotation_id', 'service_type', 'required_equipment',
                'rental_requirements', 'job_requirements', 'special_instructions',
                'remarks', 'operations_submitted_at', 'operational_status',
                'dispatch_status', 'operational_equipment_status', 'operational_notes'
            ]);
        });
    }
};
