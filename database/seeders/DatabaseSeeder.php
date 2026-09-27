<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's core production accounts.
     * Cleaned of all fictional demo/dummy clients and equipment.
     */
    public function run(): void
    {
        // Primary Owner & Administrator
        User::updateOrCreate(
            ['email' => 'johnnerrycamarig@gmail.com'],
            [
                'name' => 'John Nerry Camarig',
                'first_name' => 'John Nerry',
                'last_name' => 'Camarig',
                'password' => Hash::make('Intellitrack2026@'),
                'phone' => '1234567890',
                'role' => 'administrator',
                'is_active' => true,
            ]
        );

        // Core Team Roles
        User::updateOrCreate(
            ['email' => 'admin@intellitrack.com'],
            [
                'name' => 'Administrator User',
                'first_name' => 'Administrator',
                'last_name' => 'User',
                'password' => Hash::make('password'),
                'phone' => '1234567890',
                'role' => 'administrator',
                'is_active' => true,
            ]
        );

        User::updateOrCreate(
            ['email' => 'salesmanager@intellitrack.com'],
            [
                'name' => 'Sales Manager User',
                'first_name' => 'Sales',
                'last_name' => 'Manager',
                'password' => Hash::make('password'),
                'phone' => '0987654321',
                'role' => 'sales_manager',
                'is_active' => true,
            ]
        );

        User::updateOrCreate(
            ['email' => 'salesbd@intellitrack.com'],
            [
                'name' => 'Sales BD User',
                'first_name' => 'Sales',
                'last_name' => 'Business Development',
                'password' => Hash::make('password'),
                'phone' => '5555555555',
                'role' => 'sales_business_development',
                'is_active' => true,
            ]
        );

        User::updateOrCreate(
            ['email' => 'operations@intellitrack.com'],
            [
                'name' => 'Engr. Marlon Ramos',
                'first_name' => 'Marlon',
                'last_name' => 'Ramos',
                'password' => Hash::make('password'),
                'phone' => '09178882345',
                'role' => 'operations_technical',
                'is_active' => true,
            ]
        );

        // Official Real Data Seeders (Alibaton Fleet & Philippine Real Enterprise Clients)
        $this->call([
            AlibatonRealEquipmentSeeder::class,
            PhilippineRealCustomersSeeder::class,
            AlibatonOperationalWorkflowSeeder::class,
        ]);
    }
}
