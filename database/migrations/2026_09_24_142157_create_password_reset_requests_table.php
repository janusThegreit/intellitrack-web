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
        Schema::create('password_reset_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('email')->index();
            $table->string('reason')->nullable();
            $table->string('status', 30)->default('pending'); // pending, approved, used, rejected, expired
            $table->string('token', 128)->nullable()->unique();
            $table->timestamp('requested_at')->useCurrent();
            $table->timestamp('token_expires_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_used')->default(false);
            $table->timestamp('used_at')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('password_reset_requests');
    }
};
