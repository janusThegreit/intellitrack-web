<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_opportunities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->restrictOnDelete();
            $table->foreignId('customer_inquiry_id')->nullable()->constrained()->nullOnDelete();
            $table->string('opportunity_number')->unique();
            $table->string('title');
            $table->decimal('estimated_value', 12, 2)->nullable();
            $table->date('expected_close_date')->nullable();
            $table->enum('status', ['open', 'qualified', 'proposal', 'won', 'lost'])->default('open');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::table('quotations', function (Blueprint $table) {
            $table->foreignId('sales_opportunity_id')->nullable()->after('customer_id')->constrained()->nullOnDelete();
            $table->string('customer_response')->nullable()->after('rejected_at');
            $table->timestamp('customer_response_at')->nullable()->after('customer_response');
        });

        Schema::create('quotation_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quotation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('equipment_id')->nullable()->constrained('equipment')->nullOnDelete();
            $table->string('description');
            $table->unsignedInteger('quantity')->default(1);
            $table->unsignedInteger('rental_duration')->nullable();
            $table->string('rental_duration_unit', 20)->nullable();
            $table->decimal('unit_rate', 12, 2)->default(0);
            $table->decimal('additional_charges', 12, 2)->default(0);
            $table->decimal('line_total', 12, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('quotation_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quotation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action');
            $table->string('old_status')->nullable();
            $table->string('new_status')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quotation_history');
        Schema::dropIfExists('quotation_items');
        Schema::table('quotations', function (Blueprint $table) {
            $table->dropConstrainedForeignId('sales_opportunity_id');
            $table->dropColumn(['customer_response', 'customer_response_at']);
        });
        Schema::dropIfExists('sales_opportunities');
    }
};