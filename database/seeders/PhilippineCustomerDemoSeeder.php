<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\CustomerInquiry;
use App\Models\Equipment;
use App\Models\JobOrder;
use App\Models\Project;
use App\Models\Quotation;
use App\Models\Rental;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class PhilippineCustomerDemoSeeder extends Seeder
{
    public function run(): void
    {
        $salesUser = User::firstOrCreate(
            ['email' => 'salesbd@alibaton-demo.local'],
            [
                'name' => 'Maria Santos',
                'first_name' => 'Maria',
                'last_name' => 'Santos',
                'phone' => '09171234567',
                'role' => 'sales_business_development',
                'is_active' => true,
                'password' => Hash::make('password123'),
            ],
        );

        $manager = User::firstOrCreate(
            ['email' => 'salesmanager@alibaton-demo.local'],
            [
                'name' => 'Jose Reyes',
                'first_name' => 'Jose',
                'last_name' => 'Reyes',
                'phone' => '09179876543',
                'role' => 'sales_manager',
                'is_active' => true,
                'password' => Hash::make('password123'),
            ],
        );

        $customers = collect([
            ['name' => 'Northgate Development Corporation', 'email' => 'contact@northgate-demo.ph', 'phone' => '09175550101', 'company_name' => 'Northgate Development Corporation', 'contact_person' => 'Angela Cruz', 'address' => 'Bonifacio Global City', 'city' => 'Taguig', 'province' => 'Metro Manila', 'postal_code' => '1634', 'customer_type' => 'corporate', 'status' => 'active', 'notes' => 'Fictional Philippine demo client for a mixed-use development.', 'total_job_orders' => 2, 'total_spending' => 1850000, 'last_order_date' => now()->subDays(12)],
            ['name' => 'Cebu Harbor Builders, Inc.', 'email' => 'projects@cebuharbor-demo.ph', 'phone' => '09175550102', 'company_name' => 'Cebu Harbor Builders, Inc.', 'contact_person' => 'Ramon Villanueva', 'address' => 'North Reclamation Area', 'city' => 'Cebu City', 'province' => 'Cebu', 'postal_code' => '6000', 'customer_type' => 'corporate', 'status' => 'active', 'notes' => 'Fictional Philippine demo client for a commercial project.', 'total_job_orders' => 1, 'total_spending' => 960000, 'last_order_date' => now()->subMonth()],
            ['name' => 'Davao Prime Structures', 'email' => 'admin@davaoprime-demo.ph', 'phone' => '09175550103', 'company_name' => 'Davao Prime Structures', 'contact_person' => 'Liza Fernandez', 'address' => 'Lanang Business District', 'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'customer_type' => 'business', 'status' => 'active', 'notes' => 'Fictional Philippine demo client for a residential tower.', 'total_job_orders' => 1, 'total_spending' => 720000, 'last_order_date' => now()->subMonths(2)],
            ['name' => 'Pampanga Industrial Estates', 'email' => 'leasing@pampangaindustrial-demo.ph', 'phone' => '09175550104', 'company_name' => 'Pampanga Industrial Estates', 'contact_person' => 'Carlo Mendoza', 'address' => 'Clark Freeport Zone', 'city' => 'Mabalacat', 'province' => 'Pampanga', 'postal_code' => '2010', 'customer_type' => 'corporate', 'status' => 'active', 'notes' => 'Fictional Philippine demo client for a warehouse project.', 'total_job_orders' => 0, 'total_spending' => 0, 'last_order_date' => null],
            ['name' => 'Iloilo Cityworks Construction', 'email' => 'procurement@iloilocityworks-demo.ph', 'phone' => '09175550105', 'company_name' => 'Iloilo Cityworks Construction', 'contact_person' => 'Nina Flores', 'address' => 'Mandurriao District', 'city' => 'Iloilo City', 'province' => 'Iloilo', 'postal_code' => '5000', 'customer_type' => 'business', 'status' => 'active', 'notes' => 'Fictional Philippine demo client for an office complex.', 'total_job_orders' => 0, 'total_spending' => 0, 'last_order_date' => null],
        ])->map(fn (array $data) => Customer::updateOrCreate(['email' => $data['email']], $data));

        $towerCrane = Equipment::firstOrCreate(
            ['code' => 'TC-HH-DEMO-01'],
            [
                'name' => 'Tower Crane Demo Asset',
                'crane_model' => 'Demo Hammerhead Crane',
                'category' => 'tower_crane',
                'crane_category' => 'hammerhead',
                'description' => 'Fictional demonstration equipment record. Verify catalog specifications before operational use.',
                'status' => 'rented',
                'rental_rate' => 45000,
                'rental_unit' => 'day',
                'quantity_available' => 1,
                'location' => 'Quezon City Yard',
                'rental_services' => ['operator_and_riggers', 'maintenance_and_repair', 'logistic'],
            ],
        );

        $inquiries = [
            [$customers[0], 'INQ-DEMO-001', 'Tower crane requirement for mixed-use development', 'referral', 'qualified', 'high', 'Taguig City'],
            [$customers[1], 'INQ-DEMO-002', 'Commercial project crane rental inquiry', 'website', 'quoted', 'medium', 'Cebu City'],
            [$customers[3], 'INQ-DEMO-003', 'Warehouse development equipment requirement', 'email', 'contacted', 'medium', 'Mabalacat, Pampanga'],
        ];

        foreach ($inquiries as [$customer, $number, $subject, $source, $status, $priority, $location]) {
            $inquiry = CustomerInquiry::firstOrCreate(
                ['inquiry_number' => $number],
                ['customer_id' => $customer->id, 'source' => $source, 'subject' => $subject, 'details' => "Fictional demo inquiry for a construction site in {$location}.", 'status' => $status, 'priority' => $priority, 'remarks' => 'Demo record for Core 1 workflow.', 'created_by' => $salesUser->id, 'assigned_to' => $salesUser->id],
            );
            $inquiry->history()->firstOrCreate(['action' => 'created'], ['user_id' => $salesUser->id, 'notes' => 'Demo client inquiry received.', 'new_status' => $status]);
        }

        $jobOrder = JobOrder::firstOrCreate(
            ['job_order_number' => 'JO-DEMO-001'],
            ['customer_id' => $customers[0]->id, 'created_by' => $salesUser->id, 'assigned_to' => $manager->id, 'description' => 'Sales-side monitoring for the Taguig mixed-use development crane requirement.', 'status' => 'in-progress', 'priority' => 'high', 'scheduled_date' => now()->subDays(25), 'start_date' => now()->subDays(15), 'due_date' => now()->addDays(40), 'estimated_cost' => 900000, 'total_amount' => 900000, 'location' => 'Taguig City', 'equipment_count' => 1],
        );

        $quotation = Quotation::firstOrCreate(
            ['quotation_number' => 'QT-DEMO-001'],
            ['customer_id' => $customers[0]->id, 'created_by' => $salesUser->id, 'job_order_id' => $jobOrder->id, 'quotation_date' => now()->subDays(30), 'valid_until' => now()->addDays(15), 'status' => 'accepted', 'description' => 'Tower crane rental and operator support for a mixed-use development.', 'subtotal' => 900000, 'tax_rate' => 0, 'tax_amount' => 0, 'discount_amount' => 0, 'total_amount' => 900000, 'accepted_date' => now()->subDays(18), 'approved_by' => $manager->id, 'approved_at' => now()->subDays(22)],
        );
        $quotation->items()->firstOrCreate(['description' => 'Tower crane rental with operator and riggers'], ['equipment_id' => $towerCrane->id, 'quantity' => 1, 'rental_duration' => 20, 'rental_duration_unit' => 'day', 'unit_rate' => 45000, 'additional_charges' => 0, 'line_total' => 900000]);
        $quotation->history()->firstOrCreate(['action' => 'customer_accepted'], ['user_id' => $salesUser->id, 'old_status' => 'sent', 'new_status' => 'accepted', 'notes' => 'Demo client accepted quotation.']);

        Rental::firstOrCreate(
            ['rental_number' => 'RNT-DEMO-001'],
            ['job_order_id' => $jobOrder->id, 'customer_id' => $customers[0]->id, 'equipment_id' => $towerCrane->id, 'quantity' => 1, 'rental_start_date' => now()->subDays(15), 'rental_end_date' => now()->addDays(40), 'status' => 'active', 'daily_rate' => 45000, 'rental_days' => 56, 'rental_cost' => 2520000, 'deposit_amount' => 0, 'total_amount' => 2520000, 'notes' => 'Fictional active rental for sales monitoring.'],
        );

        Project::firstOrCreate(
            ['project_code' => 'PRJ-DEMO-001'],
            ['project_name' => 'Taguig Mixed-Use Development', 'description' => 'Fictional project for Core 1 sales-side monitoring.', 'customer_id' => $customers[0]->id, 'project_manager_id' => $manager->id, 'start_date' => now()->subDays(30), 'deadline' => now()->addMonths(5), 'status' => 'active', 'budget' => 12000000, 'spent_amount' => 2400000, 'progress_percentage' => 25, 'objectives' => 'Coordinate client sales requirements and approved crane rental.', 'deliverables' => 'Sales-side client updates and rental status monitoring.'],
        );
    }
}