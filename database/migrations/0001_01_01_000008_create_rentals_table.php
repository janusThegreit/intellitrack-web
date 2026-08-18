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
        Schema::create('rentals', function (Blueprint $table) {
            $table->id();
            $table->string('rental_number')->unique();
            $table->foreignId('job_order_id')->nullable()->constrained('job_orders')->onDelete('set null');
            $table->foreignId('customer_id')->constrained('customers')->onDelete('restrict');
            $table->foreignId('equipment_id')->constrained('equipment')->onDelete('restrict');
            $table->integer('quantity')->default(1);
            $table->timestamp('rental_start_date');
            $table->timestamp('rental_end_date')->nullable();
            $table->timestamp('actual_return_date')->nullable();
            $table->enum('status', ['active', 'completed', 'overdue', 'cancelled'])->default('active');
            $table->decimal('daily_rate', 10, 2);
            $table->integer('rental_days')->default(1);
            $table->decimal('rental_cost', 12, 2)->nullable();
            $table->decimal('deposit_amount', 12, 2)->default(0);
            $table->decimal('deposit_returned', 12, 2)->default(0);
            $table->decimal('additional_charges', 12, 2)->default(0);
            $table->decimal('total_amount', 12, 2)->nullable();
            $table->text('damage_notes')->nullable();
            $table->text('notes')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rentals');
    }
};
