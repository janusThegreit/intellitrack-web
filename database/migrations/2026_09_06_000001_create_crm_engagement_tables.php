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
        // 1. Customer Follow-Ups & Reminders
        Schema::create('customer_follow_ups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->foreignId('customer_inquiry_id')->nullable()->constrained('customer_inquiries')->nullOnDelete();
            $table->string('title');
            $table->text('notes')->nullable();
            $table->date('scheduled_date');
            $table->string('due_time')->nullable();
            $table->enum('status', ['pending', 'completed', 'cancelled'])->default('pending');
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 2. Customer Interaction & Communication History
        Schema::create('customer_communications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->foreignId('customer_inquiry_id')->nullable()->constrained('customer_inquiries')->nullOnDelete();
            $table->enum('type', ['call', 'email', 'meeting', 'site_visit', 'sms'])->default('call');
            $table->enum('direction', ['inbound', 'outbound'])->default('outbound');
            $table->string('subject');
            $table->text('content');
            $table->string('outcome')->nullable();
            $table->timestamp('communicated_at')->useCurrent();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        // 3. Customer Satisfaction & Service Feedback
        Schema::create('customer_feedbacks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->foreignId('job_order_id')->nullable()->constrained('job_orders')->nullOnDelete();
            $table->foreignId('rental_id')->nullable()->constrained('rentals')->nullOnDelete();
            $table->unsignedTinyInteger('overall_rating')->default(5);
            $table->unsignedTinyInteger('equipment_condition_rating')->nullable()->default(5);
            $table->unsignedTinyInteger('operator_competence_rating')->nullable()->default(5);
            $table->unsignedTinyInteger('timeliness_rating')->nullable()->default(5);
            $table->text('comments')->nullable();
            $table->enum('status', ['published', 'under_review', 'addressed'])->default('published');
            $table->text('action_taken')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_feedbacks');
        Schema::dropIfExists('customer_communications');
        Schema::dropIfExists('customer_follow_ups');
    }
};
