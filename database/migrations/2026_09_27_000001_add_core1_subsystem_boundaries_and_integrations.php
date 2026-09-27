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
            $table->foreignId('project_id')->nullable()->constrained('projects')->onDelete('set null');
            $table->foreignId('quotation_id')->nullable()->constrained('quotations')->onDelete('set null');
            $table->string('service_type')->nullable();
            $table->text('required_equipment')->nullable();
            $table->text('rental_requirements')->nullable();
            $table->text('job_requirements')->nullable();
            $table->text('special_instructions')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamp('operations_submitted_at')->nullable();
            $table->string('operational_status')->nullable()->default('Pending Submission to Operations');
            $table->string('dispatch_status')->nullable()->default('Unassigned');
            $table->string('operational_equipment_status')->nullable()->default('Awaiting Allocation');
            $table->text('operational_notes')->nullable();
            $table->string('status', 50)->default('draft')->change();
        });

        // 2. Extend projects with sales-side project fields
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check');
        }

        Schema::table('projects', function (Blueprint $table) {
            $table->string('location')->nullable();
            $table->timestamp('expected_end_date')->nullable();
            $table->text('requirements')->nullable();
            $table->text('required_equipment')->nullable();
            $table->text('remarks')->nullable();
            $table->foreignId('job_order_id')->nullable()->constrained('job_orders')->onDelete('set null');
            $table->string('status', 50)->default('planned')->change();
        });

        // 3. Extend rentals with rental requirements and operational status fields
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE rentals DROP CONSTRAINT IF EXISTS rentals_status_check');
        }

        Schema::table('rentals', function (Blueprint $table) {
            $table->foreignId('quotation_id')->nullable()->constrained('quotations')->onDelete('set null');
            $table->string('equipment_type')->nullable()->default('Crane'); // Crane, Truck
            $table->text('equipment_requirements')->nullable();
            $table->string('operational_status')->nullable()->default('Requested from Operations');
            $table->string('status', 50)->default('draft')->change();
        });

        // 4. Extend customers with Group 185 Master Data Integration tracking
        Schema::table('customers', function (Blueprint $table) {
            $table->timestamp('group185_synced_at')->nullable();
            $table->string('group185_reference_id', 100)->nullable();
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
