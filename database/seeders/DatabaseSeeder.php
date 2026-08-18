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
        // Create administrator user
        User::create([
            'name' => 'Administrator User',
            'first_name' => 'Administrator',
            'last_name' => 'User',
            'email' => 'admin@intellitrack.com',
            'password' => Hash::make('password123'),
            'phone' => '1234567890',
            'role' => 'administrator',
            'is_active' => true,
        ]);

        // Create sales manager user
        User::create([
            'name' => 'Sales Manager User',
            'first_name' => 'Sales',
            'last_name' => 'Manager',
            'email' => 'salesmanager@intellitrack.com',
            'password' => Hash::make('password123'),
            'phone' => '0987654321',
            'role' => 'sales_manager',
            'is_active' => true,
        ]);

        // Create sales business development user
        User::create([
            'name' => 'Sales BD User',
            'first_name' => 'Sales',
            'last_name' => 'Business Development',
            'email' => 'salesbd@intellitrack.com',
            'password' => Hash::make('password123'),
            'phone' => '5555555555',
            'role' => 'sales_business_development',
            'is_active' => true,
        ]);

        // Create sample customers
        Customer::create([
            'name' => 'ABC Construction Company',
            'email' => 'contact@abcconstruction.com',
            'phone' => '555-1111',
            'company_name' => 'ABC Construction',
            'contact_person' => 'John Doe',
            'address' => '123 Construction Ave',
            'city' => 'San Francisco',
            'province' => 'California',
            'postal_code' => '94102',
            'customer_type' => 'business',
            'status' => 'active',
        ]);

        Customer::create([
            'name' => 'XYZ Logistics Ltd',
            'email' => 'info@xyzlogistics.com',
            'phone' => '555-2222',
            'company_name' => 'XYZ Logistics',
            'contact_person' => 'Jane Smith',
            'address' => '456 Logistics Blvd',
            'city' => 'Los Angeles',
            'province' => 'California',
            'postal_code' => '90001',
            'customer_type' => 'corporate',
            'status' => 'active',
        ]);

        // Create sample equipment
        Equipment::create([
            'code' => 'EQ-CA00001',
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
        ]);

        Equipment::create([
            'code' => 'EQ-CR00002',
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
        ]);

        Equipment::create([
            'code' => 'EQ-TR00003',
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
        ]);

        Equipment::create([
            'code' => 'EQ-SC00004',
            'name' => 'Safety Equipment Kit',
            'description' => 'Complete safety gear set',
            'category' => 'Safety Equipment',
            'rental_rate' => 50.00,
            'rental_unit' => 'day',
            'status' => 'available',
            'quantity_available' => 20,
            'location' => 'Main Yard',
        ]);
    }
}
