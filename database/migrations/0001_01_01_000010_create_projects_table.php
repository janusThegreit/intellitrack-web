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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('project_code')->unique();
            $table->string('project_name');
            $table->text('description')->nullable();
            $table->foreignId('customer_id')->constrained('customers')->onDelete('restrict');
            $table->foreignId('project_manager_id')->constrained('users')->onDelete('restrict');
            $table->timestamp('start_date');
            $table->timestamp('end_date')->nullable();
            $table->timestamp('deadline')->nullable();
            $table->enum('status', ['planning', 'active', 'on-hold', 'completed', 'cancelled'])->default('planning');
            $table->decimal('budget', 12, 2)->nullable();
            $table->decimal('spent_amount', 12, 2)->default(0);
            $table->integer('progress_percentage')->default(0);
            $table->text('objectives')->nullable();
            $table->text('deliverables')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
