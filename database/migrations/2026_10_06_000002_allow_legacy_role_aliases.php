<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;');
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role::text = ANY (ARRAY[
            'super_admin'::character varying,
            'admin'::character varying,
            'administrator'::character varying,
            'sales_manager'::character varying,
            'manager'::character varying,
            'sales_business_development'::character varying,
            'sales_bd'::character varying,
            'client'::character varying,
            'customer'::character varying,
            'operations_technical'::character varying,
            'operations_staff'::character varying,
            'technical_staff'::character varying,
            'staff'::character varying
        ]::text[]));");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

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
};
