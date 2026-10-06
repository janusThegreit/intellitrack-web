<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'client_id')) {
                $table->foreignId('client_id')
                    ->nullable()
                    ->after('role')
                    ->constrained('customers')
                    ->nullOnDelete();
            }
        });

        // Update Postgres role check constraint if on Postgres
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;');
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role::text = ANY (ARRAY[
                'super_admin'::character varying,
                'admin'::character varying,
                'administrator'::character varying,
                'sales_manager'::character varying,
                'sales_business_development'::character varying,
                'client'::character varying,
                'customer'::character varying,
                'operations_technical'::character varying,
                'staff'::character varying
            ]::text[]));");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'client_id')) {
                $table->dropConstrainedForeignId('client_id');
            }
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;');
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role::text = ANY (ARRAY[
                'administrator'::character varying,
                'sales_manager'::character varying,
                'sales_business_development'::character varying,
                'operations_technical'::character varying,
                'staff'::character varying,
                'customer'::character varying
            ]::text[]));");
        }
    }
};
