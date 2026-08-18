<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('equipment', function (Blueprint $table) {
            $table->string('crane_model')->nullable()->after('name');
            $table->string('crane_category')->nullable()->after('category');
            $table->decimal('maximum_load', 10, 2)->nullable()->after('crane_category');
            $table->string('maximum_load_unit', 20)->nullable()->after('maximum_load');
            $table->decimal('maximum_radius', 10, 2)->nullable()->after('maximum_load_unit');
            $table->string('maximum_radius_unit', 20)->nullable()->after('maximum_radius');
            $table->decimal('final_height', 10, 2)->nullable()->after('maximum_radius_unit');
            $table->string('final_height_unit', 20)->nullable()->after('final_height');
            $table->json('rental_services')->nullable()->after('specifications');
        });

        Schema::create('rental_requirements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_inquiry_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('equipment_id')->nullable()->constrained('equipment')->nullOnDelete();
            $table->foreignId('quotation_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('job_order_id')->nullable()->constrained()->nullOnDelete();
            $table->string('requirement_number')->unique();
            $table->string('crane_category');
            $table->decimal('required_load', 10, 2)->nullable();
            $table->string('required_load_unit', 20)->nullable();
            $table->decimal('required_radius', 10, 2)->nullable();
            $table->string('required_radius_unit', 20)->nullable();
            $table->decimal('required_height', 10, 2)->nullable();
            $table->string('required_height_unit', 20)->nullable();
            $table->date('required_from')->nullable();
            $table->date('required_until')->nullable();
            $table->json('services')->nullable();
            $table->text('site_location')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['draft', 'assessed', 'equipment_selected', 'quoted', 'job_order_requested', 'coordinating', 'closed'])->default('draft');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('assessed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('assessed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rental_requirements');

        Schema::table('equipment', function (Blueprint $table) {
            $table->dropColumn([
                'crane_model', 'crane_category', 'maximum_load', 'maximum_load_unit',
                'maximum_radius', 'maximum_radius_unit', 'final_height', 'final_height_unit', 'rental_services',
            ]);
        });
    }
};