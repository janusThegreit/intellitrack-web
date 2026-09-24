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
        Schema::table('customer_follow_ups', function (Blueprint $table) {
            $table->foreignId('equipment_id')->nullable()->after('customer_inquiry_id')->constrained('equipment')->nullOnDelete();
            $table->foreignId('project_id')->nullable()->after('equipment_id')->constrained('projects')->nullOnDelete();
            $table->string('category', 50)->nullable()->after('priority');
            $table->boolean('is_permit_critical')->default(false)->after('category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customer_follow_ups', function (Blueprint $table) {
            $table->dropForeign(['equipment_id']);
            $table->dropForeign(['project_id']);
            $table->dropColumn([
                'equipment_id',
                'project_id',
                'category',
                'is_permit_critical',
            ]);
        });
    }
};
