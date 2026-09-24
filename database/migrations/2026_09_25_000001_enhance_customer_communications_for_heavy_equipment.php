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
        Schema::table('customer_communications', function (Blueprint $table) {
            $table->foreignId('quotation_id')->nullable()->after('customer_inquiry_id')->constrained('quotations')->nullOnDelete();
            $table->foreignId('project_id')->nullable()->after('quotation_id')->constrained('projects')->nullOnDelete();
            $table->string('site_location')->nullable()->after('outcome');
            $table->string('trailer_truck_accessible', 50)->nullable()->after('site_location'); // 'accessible', 'restricted', 'inaccessible'
            $table->text('trailer_access_notes')->nullable()->after('trailer_truck_accessible');
            $table->string('crane_setup_clearance', 50)->nullable()->after('trailer_access_notes'); // 'adequate', 'restricted', 'overhead_hazard'
            $table->text('crane_clearance_notes')->nullable()->after('crane_setup_clearance');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customer_communications', function (Blueprint $table) {
            $table->dropForeign(['quotation_id']);
            $table->dropForeign(['project_id']);
            $table->dropColumn([
                'quotation_id',
                'project_id',
                'site_location',
                'trailer_truck_accessible',
                'trailer_access_notes',
                'crane_setup_clearance',
                'crane_clearance_notes',
            ]);
        });
    }
};
