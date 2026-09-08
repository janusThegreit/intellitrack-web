<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\CustomerInquiry;
use App\Models\Equipment;
use App\Models\JobOrder;
use App\Models\Quotation;
use App\Models\Rental;
use App\Models\RentalRequirement;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class AlibatonFleetAndRentalsSeeder extends Seeder
{
    public function run(): void
    {
        $salesUser = User::where('role', 'sales_business_development')->first()
            ?? User::where('role', 'sales_manager')->first()
            ?? User::first();

        $manager = User::where('role', 'sales_manager')->first()
            ?? $salesUser;

        // 1. Ensure Clients
        $c1 = Customer::updateOrCreate(
            ['email' => 'procurement@megaworld-demo.ph'],
            [
                'name' => 'Megaworld Prime Builders Corp.',
                'company_name' => 'Megaworld Prime Builders Corp.',
                'contact_person' => 'Engr. Roberto Dalisay',
                'phone' => '09178881234',
                'address' => 'BGC Corporate Center, 30th Street',
                'city' => 'Taguig City',
                'province' => 'Metro Manila',
                'postal_code' => '1634',
                'customer_type' => 'corporate',
                'status' => 'active',
                'notes' => 'Key commercial contractor for high-rise commercial & residential towers.',
            ]
        );

        $c2 = Customer::updateOrCreate(
            ['email' => 'projects@dmci-demo.ph'],
            [
                'name' => 'DMCI Heavy Infrastructure Inc.',
                'company_name' => 'DMCI Heavy Infrastructure Inc.',
                'contact_person' => 'Arch. Maricel Santos',
                'phone' => '09187774567',
                'address' => 'DMCI Plaza, Pasong Tamo Ext.',
                'city' => 'Makati City',
                'province' => 'Metro Manila',
                'postal_code' => '1231',
                'customer_type' => 'corporate',
                'status' => 'active',
                'notes' => 'Major infrastructure projects across Luzon corridors.',
            ]
        );

        $c3 = Customer::updateOrCreate(
            ['email' => 'logistics@cebuharbor-demo.ph'],
            [
                'name' => 'Cebu Harbor Commercial Towers',
                'company_name' => 'Cebu Harbor Commercial Towers',
                'contact_person' => 'Engr. Kenneth Tan',
                'phone' => '09196667890',
                'address' => 'North Reclamation Area',
                'city' => 'Cebu City',
                'province' => 'Cebu',
                'postal_code' => '6000',
                'customer_type' => 'business',
                'status' => 'active',
                'notes' => 'Commercial high-rise hotel and retail complex.',
            ]
        );

        // 2. Heavy Fleet Equipment (Alibaton Standard Flagship Units)
        $eq1 = Equipment::updateOrCreate(
            ['code' => 'EQ-TC-001'],
            [
                'name' => 'Zoomlion TC6013A-6 Flat-Top Tower Crane',
                'category' => 'tower_crane',
                'crane_category' => 'flat_top',
                'crane_model' => 'Zoomlion TC6013A-6',
                'description' => 'Flagship 6-Ton Flat-Top Tower Crane with 60m jib radius and frequency-controlled hoist system.',
                'rental_rate' => 45000.00,
                'rental_unit' => 'day',
                'status' => 'rented',
                'serial_number' => 'ZL-TC6013-2023-01',
                'acquisition_date' => Carbon::parse('2023-03-15'),
                'purchase_price' => 6500000.00,
                'current_value' => 5800000.00,
                'quantity_available' => 1,
                'location' => 'BGC High Street West Site, Taguig',
                'maximum_load' => 6.00,
                'maximum_load_unit' => 'tons',
                'maximum_radius' => 60.00,
                'maximum_radius_unit' => 'm',
                'final_height' => 140.00,
                'final_height_unit' => 'm',
                'rental_services' => ['operator_and_riggers', 'maintenance_and_repair', 'erection_and_dismantling', 'logistic'],
            ]
        );

        $eq2 = Equipment::updateOrCreate(
            ['code' => 'EQ-TC-002'],
            [
                'name' => 'Zoomlion L250-18 Luffing Jib Tower Crane',
                'category' => 'tower_crane',
                'crane_category' => 'luffing',
                'crane_model' => 'Zoomlion L250-18',
                'description' => '18-Ton heavy luffing jib tower crane engineered for narrow urban sites and high-rise core walls.',
                'rental_rate' => 65000.00,
                'rental_unit' => 'day',
                'status' => 'rented',
                'serial_number' => 'ZL-L250-2023-04',
                'acquisition_date' => Carbon::parse('2023-06-20'),
                'purchase_price' => 12000000.00,
                'current_value' => 10800000.00,
                'quantity_available' => 1,
                'location' => 'Cebu IT Park High-Rise Hub, Cebu City',
                'maximum_load' => 18.00,
                'maximum_load_unit' => 'tons',
                'maximum_radius' => 55.00,
                'maximum_radius_unit' => 'm',
                'final_height' => 180.00,
                'final_height_unit' => 'm',
                'rental_services' => ['operator_and_riggers', 'maintenance_and_repair', 'engineering_consultancy'],
            ]
        );

        $eq3 = Equipment::updateOrCreate(
            ['code' => 'EQ-MC-001'],
            [
                'name' => 'Sany SAC2500S 250-Ton All-Terrain Crane',
                'category' => 'mobile_crane',
                'crane_category' => 'all_terrain',
                'crane_model' => 'Sany SAC2500S',
                'description' => '250-Ton all-terrain heavy mobile crane with 73m U-shape telescopic main boom and quick rigging.',
                'rental_rate' => 85000.00,
                'rental_unit' => 'day',
                'status' => 'available',
                'serial_number' => 'SN-SAC250-2024-01',
                'acquisition_date' => Carbon::parse('2024-01-10'),
                'purchase_price' => 28000000.00,
                'current_value' => 26500000.00,
                'quantity_available' => 1,
                'location' => 'Alibaton Heavy Fleet Depot, Valenzuela',
                'maximum_load' => 250.00,
                'maximum_load_unit' => 'tons',
                'maximum_radius' => 78.00,
                'maximum_radius_unit' => 'm',
                'final_height' => 105.00,
                'final_height_unit' => 'm',
                'rental_services' => ['operator_and_riggers', 'logistic'],
            ]
        );

        $eq4 = Equipment::updateOrCreate(
            ['code' => 'EQ-MC-002'],
            [
                'name' => 'Tadano GR-800EX 80-Ton Rough Terrain Crane',
                'category' => 'mobile_crane',
                'crane_category' => 'rough_terrain',
                'crane_model' => 'Tadano GR-800EX',
                'description' => '80-Ton rough terrain crane featuring 47m 5-section boom for petrochemical and industrial installations.',
                'rental_rate' => 38000.00,
                'rental_unit' => 'day',
                'status' => 'available',
                'serial_number' => 'TD-GR800-2023-09',
                'acquisition_date' => Carbon::parse('2023-08-12'),
                'purchase_price' => 14500000.00,
                'current_value' => 13200000.00,
                'quantity_available' => 2,
                'location' => 'Alibaton Heavy Fleet Depot, Valenzuela',
                'maximum_load' => 80.00,
                'maximum_load_unit' => 'tons',
                'maximum_radius' => 47.00,
                'maximum_radius_unit' => 'm',
                'final_height' => 62.00,
                'final_height_unit' => 'm',
                'rental_services' => ['operator_and_riggers', 'maintenance_and_repair'],
            ]
        );

        $eq5 = Equipment::updateOrCreate(
            ['code' => 'EQ-BT-001'],
            [
                'name' => 'Isuzu Giga 10-Wheeler Telescopic Boom Truck',
                'category' => 'Transportation',
                'crane_category' => 'boom_truck',
                'crane_model' => 'Isuzu Giga 15T Boom Truck',
                'description' => 'Heavy logistics truck with 15-Ton telescopic boom crane for material hauling and swift offloading.',
                'rental_rate' => 18000.00,
                'rental_unit' => 'day',
                'status' => 'rented',
                'serial_number' => 'ISZ-GIGA-2023-11',
                'acquisition_date' => Carbon::parse('2023-11-05'),
                'purchase_price' => 4800000.00,
                'current_value' => 4200000.00,
                'quantity_available' => 3,
                'location' => 'Clark North Logistics Hub, Pampanga',
                'maximum_load' => 15.00,
                'maximum_load_unit' => 'tons',
                'maximum_radius' => 22.00,
                'maximum_radius_unit' => 'm',
                'final_height' => 25.00,
                'final_height_unit' => 'm',
                'rental_services' => ['operator_and_riggers', 'logistic'],
            ]
        );

        $eq6 = Equipment::updateOrCreate(
            ['code' => 'EQ-EX-001'],
            [
                'name' => 'Caterpillar 320 GC Hydraulic Excavator',
                'category' => 'Heavy Equipment',
                'crane_category' => 'excavator',
                'crane_model' => 'CAT 320 GC',
                'description' => '20-Ton standard hydraulic excavator for high-efficiency earthmoving, deep foundation excavation.',
                'rental_rate' => 14000.00,
                'rental_unit' => 'day',
                'status' => 'maintenance',
                'serial_number' => 'CAT-320GC-2024-03',
                'acquisition_date' => Carbon::parse('2024-02-14'),
                'purchase_price' => 5200000.00,
                'current_value' => 4900000.00,
                'quantity_available' => 2,
                'location' => 'Fleet Maintenance Yard, Meycauayan',
                'maximum_load' => 20.00,
                'maximum_load_unit' => 'tons',
                'rental_services' => ['maintenance_and_repair'],
            ]
        );

        // 3. Client Inquiries
        $inq1 = CustomerInquiry::firstOrCreate(
            ['inquiry_number' => 'INQ-2026-001'],
            [
                'customer_id' => $c1->id,
                'source' => 'referral',
                'subject' => 'Tower Crane Requirement for 45-Storey BGC Tower Project',
                'details' => 'Need 6-Ton Flat-Top Tower Crane for 45-storey mixed-use development with full operator and riggers crew.',
                'status' => 'qualified',
                'priority' => 'high',
                'remarks' => 'Mobilization required by mid-month. Priority client.',
                'created_by' => $salesUser?->id,
                'assigned_to' => $manager?->id,
            ]
        );

        $inq2 = CustomerInquiry::firstOrCreate(
            ['inquiry_number' => 'INQ-2026-002'],
            [
                'customer_id' => $c2->id,
                'source' => 'website',
                'subject' => '250-Ton Mobile Crane for Flyover Girder Launching',
                'details' => 'Requesting heavy lifting assessment for 85-Ton precast concrete girders along South Luzon Expressway.',
                'status' => 'new',
                'priority' => 'urgent',
                'remarks' => 'Night shift mobilization required for highway safety clearance.',
                'created_by' => $salesUser?->id,
                'assigned_to' => $salesUser?->id,
            ]
        );

        // 4. Rental Requirements (Assessment Queue)
        RentalRequirement::firstOrCreate(
            ['requirement_number' => 'REQ-2026-001'],
            [
                'customer_inquiry_id' => $inq1->id,
                'customer_id' => $c1->id,
                'equipment_id' => $eq1->id,
                'crane_category' => 'flat_top',
                'required_load' => 6.00,
                'required_load_unit' => 'tons',
                'required_radius' => 60.00,
                'required_radius_unit' => 'm',
                'required_height' => 140.00,
                'required_height_unit' => 'm',
                'required_from' => Carbon::now()->subDays(20),
                'required_until' => Carbon::now()->addMonths(4),
                'services' => ['operator_and_riggers', 'maintenance_and_repair', 'erection_and_dismantling'],
                'site_location' => 'Bonifacio Global City, Taguig',
                'notes' => 'Assessed and certified for foundation crane tie-in.',
                'status' => 'equipment_selected',
                'created_by' => $salesUser?->id,
                'assessed_by' => $manager?->id,
                'assessed_at' => Carbon::now()->subDays(18),
            ]
        );

        RentalRequirement::firstOrCreate(
            ['requirement_number' => 'REQ-2026-002'],
            [
                'customer_inquiry_id' => $inq2->id,
                'customer_id' => $c2->id,
                'equipment_id' => $eq3->id,
                'crane_category' => 'all_terrain',
                'required_load' => 85.00,
                'required_load_unit' => 'tons',
                'required_radius' => 28.00,
                'required_radius_unit' => 'm',
                'required_height' => 35.00,
                'required_height_unit' => 'm',
                'required_from' => Carbon::now()->addDays(5),
                'required_until' => Carbon::now()->addDays(20),
                'services' => ['operator_and_riggers', 'logistic'],
                'site_location' => 'Calamba Flyover Bridge Project, Laguna',
                'notes' => 'Requires dual rigging and highway road closure permits.',
                'status' => 'draft',
                'created_by' => $salesUser?->id,
            ]
        );

        // 5. Active Rentals
        Rental::firstOrCreate(
            ['rental_number' => 'RNT-2026-001'],
            [
                'customer_id' => $c1->id,
                'equipment_id' => $eq1->id,
                'quantity' => 1,
                'rental_start_date' => Carbon::now()->subDays(15),
                'rental_end_date' => Carbon::now()->addDays(75),
                'status' => 'active',
                'daily_rate' => 45000.00,
                'rental_days' => 90,
                'rental_cost' => 4050000.00,
                'deposit_amount' => 500000.00,
                'total_amount' => 4050000.00,
                'notes' => 'BGC High Street West Tower site. Certified operator and 2 riggers on-site.',
            ]
        );

        Rental::firstOrCreate(
            ['rental_number' => 'RNT-2026-002'],
            [
                'customer_id' => $c3->id,
                'equipment_id' => $eq2->id,
                'quantity' => 1,
                'rental_start_date' => Carbon::now()->subDays(30),
                'rental_end_date' => Carbon::now()->addDays(60),
                'status' => 'active',
                'daily_rate' => 65000.00,
                'rental_days' => 90,
                'rental_cost' => 5850000.00,
                'deposit_amount' => 750000.00,
                'total_amount' => 5850000.00,
                'notes' => 'Cebu IT Park Commercial Project. 18-Ton heavy luffing configuration.',
            ]
        );

        Rental::firstOrCreate(
            ['rental_number' => 'RNT-2026-003'],
            [
                'customer_id' => $c2->id,
                'equipment_id' => $eq5->id,
                'quantity' => 1,
                'rental_start_date' => Carbon::now()->subDays(7),
                'rental_end_date' => Carbon::now()->addDays(23),
                'status' => 'active',
                'daily_rate' => 18000.00,
                'rental_days' => 30,
                'rental_cost' => 540000.00,
                'deposit_amount' => 100000.00,
                'total_amount' => 540000.00,
                'notes' => 'Clark North Logistics Hub transport and offloading package.',
            ]
        );
    }
}
