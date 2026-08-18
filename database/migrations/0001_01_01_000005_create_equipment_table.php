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
        Schema::create('equipment', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category')->nullable();
            $table->decimal('rental_rate', 10, 2)->nullable();
            $table->string('rental_unit')->default('day'); // day, week, month, hourly
            $table->enum('status', ['available', 'rented', 'maintenance', 'damaged', 'retired'])->default('available');
            $table->string('serial_number')->nullable()->unique();
            $table->date('acquisition_date')->nullable();
            $table->decimal('purchase_price', 12, 2)->nullable();
            $table->decimal('current_value', 12, 2)->nullable();
            $table->integer('quantity_available')->default(1);
            $table->string('location')->nullable();
            $table->string('image_url')->nullable();
            $table->timestamp('last_maintenance')->nullable();
            $table->text('specifications')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('equipment');
    }
};
