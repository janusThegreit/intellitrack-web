<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->string('project_location')->nullable()->after('address');
            $table->text('technical_requirements')->nullable()->after('project_location');
            $table->text('site_condition')->nullable()->after('technical_requirements');
            $table->decimal('estimated_budget', 12, 2)->nullable()->after('site_condition');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['project_location', 'technical_requirements', 'site_condition', 'estimated_budget']);
        });
    }
};