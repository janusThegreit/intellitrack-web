<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Customer;
use App\Models\Equipment;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create / ensure administrator user
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
            ['email' => 'admin@example.com'],
            [
                'name' => 'Administrator User',
                'first_name' => 'Administrator',
                'last_name' => 'Demo',
                'password' => Hash::make('password'),
                'phone' => '1234567890',
                'role' => 'administrator',
                'is_active' => true,
            ]
        );

        // Create / ensure sales manager user
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
            ['email' => 'manager@example.com'],
            [
                'name' => 'Sales Manager Demo',
                'first_name' => 'Sales',
                'last_name' => 'Manager',
                'password' => Hash::make('password'),
                'phone' => '0987654321',
                'role' => 'sales_manager',
                'is_active' => true,
            ]
        );

        // Create / ensure sales business development user
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
            ['email' => 'bd@example.com'],
            [
                'name' => 'Sales BD Demo',
                'first_name' => 'Sales',
                'last_name' => 'BD',
                'password' => Hash::make('password'),
                'phone' => '5555555555',
                'role' => 'sales_business_development',
                'is_active' => true,
            ]
        );

        // Create / ensure operations & technical staff user
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
        User::updateOrCreate(
            ['email' => 'tech@example.com'],
            [
                'name' => 'Operations Technical Demo',
                'first_name' => 'Operations',
                'last_name' => 'Technical',
                'password' => Hash::make('password'),
                'phone' => '09178882345',
                'role' => 'operations_technical',
                'is_active' => true,
            ]
        );

        // Create sample customers
        Customer::firstOrCreate(
            ['email' => 'contact@abcconstruction.com'],
            [
                'name' => 'ABC Construction Company',
                'phone' => '555-1111',
                'company_name' => 'ABC Construction',
                'contact_person' => 'John Doe',
                'address' => '123 Construction Ave',
                'city' => 'San Francisco',
                'province' => 'California',
                'postal_code' => '94102',
                'customer_type' => 'business',
                'status' => 'active',
            ]
        );

        Customer::firstOrCreate(
            ['email' => 'info@xyzlogistics.com'],
            [
                'name' => 'XYZ Logistics Ltd',
                'phone' => '555-2222',
                'company_name' => 'XYZ Logistics',
                'contact_person' => 'Jane Smith',
                'address' => '456 Logistics Blvd',
                'city' => 'Los Angeles',
                'province' => 'California',
                'postal_code' => '90001',
                'customer_type' => 'corporate',
                'status' => 'active',
            ]
        );

        // Create sample equipment
        Equipment::firstOrCreate(
            ['code' => 'EQ-CA00001'],
            [
                'name' => 'Excavator CAT 320',
                'description' => 'Heavy duty excavator for construction',
                'category' => 'Heavy Equipment',
                'rental_rate' => 500.00,
                'rental_unit' => 'day',
                'status' => 'available',
                'serial_number' => 'CAT-320-2024-001',
                'acquisition_date' => now()->subYear(),
                'purchase_price' => 150000.00,
                'current_value' => 120000.00,
                'quantity_available' => 2,
                'location' => 'Main Yard',
            ]
        );

        Equipment::firstOrCreate(
            ['code' => 'EQ-CR00002'],
            [
                'name' => 'Crane 50-Ton',
                'description' => 'Heavy-duty crane for lifting operations',
                'category' => 'Heavy Equipment',
                'rental_rate' => 800.00,
                'rental_unit' => 'day',
                'status' => 'available',
                'serial_number' => 'CRANE-50-2024-001',
                'acquisition_date' => now()->subYear(),
                'purchase_price' => 250000.00,
                'current_value' => 200000.00,
                'quantity_available' => 1,
                'location' => 'Main Yard',
            ]
        );

        Equipment::firstOrCreate(
            ['code' => 'EQ-TR00003'],
            [
                'name' => 'Truck 10-Ton',
                'description' => 'Heavy duty transport truck',
                'category' => 'Transportation',
                'rental_rate' => 200.00,
                'rental_unit' => 'day',
                'status' => 'available',
                'serial_number' => 'TRUCK-10-2024-001',
                'acquisition_date' => now()->subYear(),
                'purchase_price' => 80000.00,
                'current_value' => 60000.00,
                'quantity_available' => 5,
                'location' => 'Main Yard',
            ]
        );

        Equipment::firstOrCreate(
            ['code' => 'EQ-SC00004'],
            [
                'name' => 'Safety Equipment Kit',
                'description' => 'Complete safety gear set',
                'category' => 'Safety Equipment',
                'rental_rate' => 50.00,
                'rental_unit' => 'day',
                'status' => 'available',
                'quantity_available' => 20,
                'location' => 'Main Yard',
            ]
        );

        $this->call(AlibatonFleetAndRentalsSeeder::class);
        $this->call(AlibatonCrmDemoSeeder::class);
        require_once __DIR__ . '/ProjectDossierSeeder.php';
        $this->call(ProjectDossierSeeder::class);
    }
}
