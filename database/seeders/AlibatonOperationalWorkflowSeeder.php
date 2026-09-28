<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\CustomerCommunication;
use App\Models\CustomerFeedback;
use App\Models\CustomerFollowUp;
use App\Models\CustomerInquiry;
use App\Models\Equipment;
use App\Models\JobOrder;
use App\Models\JobOrderItem;
use App\Models\Project;
use App\Models\Quotation;
use App\Models\Rental;
use App\Models\RentalRequirement;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class AlibatonOperationalWorkflowSeeder extends Seeder
{
    /**
     * Seed active operational workflows connecting real Alibaton equipment,
     * Philippine enterprise clients, inquiries, quotations, job orders, and rentals.
     */
    public function run(): void
    {
        // 1. Identify System Personnel
        $admin = User::where('role', 'administrator')->first() ?? User::first();
        $salesUser = User::where('role', 'sales_business_development')->first() ?? $admin;
        $manager = User::where('role', 'sales_manager')->first() ?? $admin;
        $opsUser = User::where('role', 'operations_technical')->first() ?? $admin;

        // 2. Fetch Representative Philippine Corporate Clients
        $megawide = Customer::where('customer_code', 'CUS-0001')->first();
        $eei = Customer::where('customer_code', 'CUS-0002')->first();
        $dmci = Customer::where('customer_code', 'CUS-0003')->first();
        $mdc = Customer::where('customer_code', 'CUS-0004')->first();
        $smc = Customer::where('customer_code', 'CUS-0005')->first();
        $dmw = Customer::where('customer_code', 'CUS-0006')->first();
        $rlc = Customer::where('customer_code', 'CUS-0007')->first();
        $smPrime = Customer::where('customer_code', 'CUS-0008')->first();
        $filinvest = Customer::where('customer_code', 'CUS-0009')->first();
        $century = Customer::where('customer_code', 'CUS-0010')->first();
        $taisei = Customer::where('customer_code', 'CUS-0022')->first();
        $megaworld = Customer::where('customer_code', 'CUS-0031')->first();
        $republicCement = Customer::where('customer_code', 'CUS-0049')->first();
        $primaryStructures = Customer::where('customer_code', 'CUS-0042')->first();

        // 3. Fetch Flagship Equipment
        $tcMct328 = Equipment::where('code', 'ALIB-TC-POT-MCT328')->first() ?? Equipment::first();
        $tcL140_8 = Equipment::where('code', 'ALIB-TC-L140-8')->first() ?? Equipment::first();
        $tcMct385 = Equipment::where('code', 'ALIB-TC-POT-MCT385')->first() ?? Equipment::first();
        $tcMct278 = Equipment::where('code', 'ALIB-TC-POT-MCT278')->first() ?? Equipment::first();
        $tcL140_10 = Equipment::where('code', 'ALIB-TC-L140-10')->first() ?? Equipment::first();
        $mcSany250 = Equipment::where('code', 'ALIB-MC-SANY250')->first() ?? Equipment::first();
        $hstSc200 = Equipment::where('code', 'ALIB-HST-SC200')->first() ?? Equipment::first();
        $boomTruck = Equipment::where('code', 'ALIB-LOG-ISZ-15T')->first() ?? Equipment::first();

        // =========================================================================
        // GROUP A: IN FIELD OPERATIONS (Active Work Orders with Cranes On Site)
        // =========================================================================

        // 1. MEGAWIDE - NSCR Malolos Viaduct Contract 01
        if ($megawide && $tcMct328) {
            $inq1 = CustomerInquiry::updateOrCreate(
                ['inquiry_number' => 'INQ-2026-0101'],
                [
                    'customer_id' => $megawide->id,
                    'source' => 'industry_partner',
                    'subject' => 'Tower Crane Fleet Requirement for NSCR Malolos Station Viaduct',
                    'details' => 'Requesting 16-Ton Topless Tower Crane with 75m jib for 12 months with full operator and riggers crew for elevated station segment launching.',
                    'status' => 'quoted',
                    'priority' => 'urgent',
                    'remarks' => 'Approved by DOTr Rail Project Management Office; site clearance confirmed.',
                    'created_by' => $salesUser->id,
                    'assigned_to' => $manager->id,
                ]
            );

            $req1 = RentalRequirement::updateOrCreate(
                ['requirement_number' => 'REQ-2026-0101'],
                [
                    'customer_inquiry_id' => $inq1->id,
                    'customer_id' => $megawide->id,
                    'equipment_id' => $tcMct328->id,
                    'crane_category' => 'flat_top',
                    'required_load' => 16.00,
                    'required_load_unit' => 'tons',
                    'required_radius' => 75.00,
                    'required_radius_unit' => 'm',
                    'required_height' => 55.00,
                    'required_height_unit' => 'm',
                    'required_from' => Carbon::now()->subMonths(3),
                    'required_until' => Carbon::now()->addMonths(9),
                    'services' => ['operator_and_riggers', 'erection_and_dismantling', 'maintenance_and_repair', 'logistic'],
                    'site_location' => 'NSCR Malolos Station Contract 01, Bulacan',
                    'notes' => 'Certified high-wind anchorage assembly and seismic tie-in calculations submitted to DOTr consultants.',
                    'status' => 'quoted',
                    'created_by' => $salesUser->id,
                    'assessed_by' => $opsUser->id,
                    'assessed_at' => Carbon::now()->subMonths(3)->subDays(10),
                ]
            );

            $jo1 = JobOrder::updateOrCreate(
                ['job_order_number' => 'JO-2026-0101'],
                [
                    'customer_id' => $megawide->id,
                    'created_by' => $salesUser->id,
                    'assigned_to' => $opsUser->id,
                    'service_type' => 'Tower Crane Rental & Rigging Operations',
                    'description' => 'Mobilization, erection, certification, and ongoing operation of Potain MCT328 L16 Topless Crane for NSCR Malolos Station.',
                    'status' => 'in-progress',
                    'priority' => 'urgent',
                    'scheduled_date' => Carbon::now()->subMonths(3),
                    'start_date' => Carbon::now()->subMonths(3),
                    'due_date' => Carbon::now()->addMonths(9),
                    'estimated_cost' => 7560000.00,
                    'actual_cost' => 2200000.00,
                    'total_amount' => 7560000.00,
                    'location' => 'NSCR Malolos Station Contract 01, Bulacan',
                    'equipment_count' => 1,
                    'operational_status' => 'On-Site Operational',
                    'dispatch_status' => 'Dispatched',
                    'operational_equipment_status' => 'Active On Site',
                    'operational_notes' => 'DOLE third-party load test passed with ABS Quality inspection tag.',
                ]
            );

            JobOrderItem::updateOrCreate(
                ['job_order_id' => $jo1->id, 'equipment_id' => $tcMct328->id],
                [
                    'quantity' => 1,
                    'unit_price' => 630000.00,
                    'unit' => 'month',
                    'total_price' => 7560000.00,
                    'notes' => 'Potain MCT328 L16 Topless Tower Crane (75m Jib, 16-Ton Capacity)',
                ]
            );

            $quot1 = Quotation::updateOrCreate(
                ['quotation_number' => 'QT-2026-0101'],
                [
                    'customer_id' => $megawide->id,
                    'created_by' => $salesUser->id,
                    'job_order_id' => $jo1->id,
                    'quotation_date' => Carbon::now()->subMonths(3)->subDays(15),
                    'valid_until' => Carbon::now()->subMonths(2),
                    'status' => 'accepted',
                    'description' => '12-Month rental of Potain MCT328 L16 Topless Tower Crane with operator and 2 riggers for NSCR viaduct construction.',
                    'subtotal' => 7560000.00,
                    'tax_rate' => 12.00,
                    'tax_amount' => 907200.00,
                    'total_amount' => 8467200.00,
                    'accepted_date' => Carbon::now()->subMonths(3)->subDays(5),
                    'approved_by' => $manager->id,
                    'approved_at' => Carbon::now()->subMonths(3)->subDays(8),
                ]
            );

            Rental::updateOrCreate(
                ['rental_number' => 'RNT-2026-0101'],
                [
                    'job_order_id' => $jo1->id,
                    'customer_id' => $megawide->id,
                    'equipment_id' => $tcMct328->id,
                    'quotation_id' => $quot1->id,
                    'quantity' => 1,
                    'rental_start_date' => Carbon::now()->subMonths(3),
                    'rental_end_date' => Carbon::now()->addMonths(9),
                    'status' => 'active',
                    'daily_rate' => 21000.00,
                    'rental_days' => 365,
                    'rental_cost' => 7560000.00,
                    'deposit_amount' => 1000000.00,
                    'total_amount' => 7560000.00,
                    'operational_status' => 'Active On Site',
                    'notes' => 'NSCR Malolos Viaduct Contract Package 01. Certified licensed crane operator on site daily.',
                ]
            );

            Project::updateOrCreate(
                ['project_code' => 'PRJ-NSCR-01'],
                [
                    'project_name' => 'North-South Commuter Railway (NSCR) Malolos Viaduct',
                    'description' => 'DOTr railway infrastructure contract spanning 14km elevated viaduct and passenger terminal structures.',
                    'customer_id' => $megawide->id,
                    'project_manager_id' => $manager->id,
                    'job_order_id' => $jo1->id,
                    'start_date' => Carbon::now()->subMonths(3),
                    'deadline' => Carbon::now()->addMonths(18),
                    'expected_end_date' => Carbon::now()->addMonths(18),
                    'location' => 'Malolos, Bulacan',
                    'requirements' => 'Heavy topless crane coverage, nighttime segment lifting, and DOLE accredited safety technicians.',
                    'required_equipment' => 'Potain MCT328 L16 Topless Tower Crane, 15T Boom Truck, 60T Lowbed Transporter',
                    'status' => 'active',
                    'budget' => 45000000.00,
                    'spent_amount' => 8467200.00,
                    'progress_percentage' => 35,
                ]
            );
        }

        // 2. EEI CORPORATION - Metro Manila Subway CP101 Shaft
        if ($eei && $tcMct278) {
            $jo2 = JobOrder::updateOrCreate(
                ['job_order_number' => 'JO-2026-0102'],
                [
                    'customer_id' => $eei->id,
                    'created_by' => $salesUser->id,
                    'assigned_to' => $opsUser->id,
                    'service_type' => 'Subway Shaft Hoisting & Rigging Support',
                    'description' => 'Heavy hoisting of concrete tunnel lining segments and soil muck skip buckets at Valenzuela launching shaft.',
                    'status' => 'in-progress',
                    'priority' => 'urgent',
                    'scheduled_date' => Carbon::now()->subMonths(2),
                    'start_date' => Carbon::now()->subMonths(2),
                    'due_date' => Carbon::now()->addMonths(10),
                    'estimated_cost' => 5760000.00,
                    'actual_cost' => 1920000.00,
                    'total_amount' => 5760000.00,
                    'location' => 'Metro Manila Subway CP101 Valenzuela Shaft Site',
                    'equipment_count' => 1,
                    'operational_status' => 'On-Site Operational',
                    'dispatch_status' => 'Dispatched',
                    'operational_equipment_status' => 'Active On Site',
                    'operational_notes' => 'Operates 24 hours in dual shifts to support continuous TBM excavation.',
                ]
            );

            JobOrderItem::updateOrCreate(
                ['job_order_id' => $jo2->id, 'equipment_id' => $tcMct278->id],
                [
                    'quantity' => 1,
                    'unit_price' => 480000.00,
                    'unit' => 'month',
                    'total_price' => 5760000.00,
                    'notes' => 'Potain MCT278 K12 Topless Tower Crane (70m Jib, 12-Ton Capacity)',
                ]
            );

            Rental::updateOrCreate(
                ['rental_number' => 'RNT-2026-0102'],
                [
                    'job_order_id' => $jo2->id,
                    'customer_id' => $eei->id,
                    'equipment_id' => $tcMct278->id,
                    'quantity' => 1,
                    'rental_start_date' => Carbon::now()->subMonths(2),
                    'rental_end_date' => Carbon::now()->addMonths(10),
                    'status' => 'active',
                    'daily_rate' => 16000.00,
                    'rental_days' => 365,
                    'rental_cost' => 5760000.00,
                    'deposit_amount' => 800000.00,
                    'total_amount' => 5760000.00,
                    'operational_status' => 'Active On Site',
                    'notes' => 'Valenzuela Depot underground shaft. Certified dual operators for continuous shift rotation.',
                ]
            );
        }

        // 3. MEGAWORLD - Uptown Skyscraper Tower BGC
        if ($megaworld && $tcL140_8) {
            $jo3 = JobOrder::updateOrCreate(
                ['job_order_number' => 'JO-2026-0103'],
                [
                    'customer_id' => $megaworld->id,
                    'created_by' => $salesUser->id,
                    'assigned_to' => $opsUser->id,
                    'service_type' => 'Skyscraper Luffing Tower Crane & Hoist Operation',
                    'description' => 'Complete structural lifting package including JHD140N-8 luffing crane and SC200/200 passenger hoist with internal climbing.',
                    'status' => 'in-progress',
                    'priority' => 'high',
                    'scheduled_date' => Carbon::now()->subMonths(1),
                    'start_date' => Carbon::now()->subMonths(1),
                    'due_date' => Carbon::now()->addMonths(14),
                    'estimated_cost' => 6720000.00,
                    'actual_cost' => 960000.00,
                    'total_amount' => 6720000.00,
                    'location' => 'Uptown Bonifacio, 36th Street, Taguig City',
                    'equipment_count' => 2,
                    'operational_status' => 'On-Site Operational',
                    'dispatch_status' => 'Dispatched',
                    'operational_equipment_status' => 'Active On Site',
                    'operational_notes' => 'First internal climbing telescoping scheduled at Floor 18 next month.',
                ]
            );

            JobOrderItem::updateOrCreate(
                ['job_order_id' => $jo3->id, 'equipment_id' => $tcL140_8->id],
                [
                    'quantity' => 1,
                    'unit_price' => 320000.00,
                    'unit' => 'month',
                    'total_price' => 4480000.00,
                    'notes' => 'JHD140N-8 Luffing Jib Tower Crane (50m Jib, 8-Ton Capacity)',
                ]
            );

            Rental::updateOrCreate(
                ['rental_number' => 'RNT-2026-0103'],
                [
                    'job_order_id' => $jo3->id,
                    'customer_id' => $megaworld->id,
                    'equipment_id' => $tcL140_8->id,
                    'quantity' => 1,
                    'rental_start_date' => Carbon::now()->subMonths(1),
                    'rental_end_date' => Carbon::now()->addMonths(14),
                    'status' => 'active',
                    'daily_rate' => 10666.67,
                    'rental_days' => 450,
                    'rental_cost' => 4480000.00,
                    'deposit_amount' => 650000.00,
                    'total_amount' => 4480000.00,
                    'operational_status' => 'Active On Site',
                    'notes' => 'BGC Uptown Tower Site. High wind shutdown threshold calibrated to 14 m/s.',
                ]
            );
        }

        // 4. REPUBLIC CEMENT - Norzagaray Plant Preheater Tower
        if ($republicCement && $tcMct385) {
            $jo4 = JobOrder::updateOrCreate(
                ['job_order_number' => 'JO-2026-0104'],
                [
                    'customer_id' => $republicCement->id,
                    'created_by' => $salesUser->id,
                    'assigned_to' => $opsUser->id,
                    'service_type' => 'Heavy Industrial Plant Lifting Operations',
                    'description' => 'Erection and operation of Potain MCT385 at 131.7m hook height for cement preheater tower construction.',
                    'status' => 'in-progress',
                    'priority' => 'high',
                    'scheduled_date' => Carbon::now()->subMonths(4),
                    'start_date' => Carbon::now()->subMonths(4),
                    'due_date' => Carbon::now()->addMonths(4),
                    'estimated_cost' => 6320000.00,
                    'actual_cost' => 3160000.00,
                    'total_amount' => 6320000.00,
                    'location' => 'Republic Cement Plant Expansion Site, Norzagaray, Bulacan',
                    'equipment_count' => 1,
                    'operational_status' => 'On-Site Operational',
                    'dispatch_status' => 'Dispatched',
                    'operational_equipment_status' => 'Active On Site',
                    'operational_notes' => 'Dustproof seal verification on slewing ring and motor control cabinet passed weekly check.',
                ]
            );

            JobOrderItem::updateOrCreate(
                ['job_order_id' => $jo4->id, 'equipment_id' => $tcMct385->id],
                [
                    'quantity' => 1,
                    'unit_price' => 790000.00,
                    'unit' => 'month',
                    'total_price' => 6320000.00,
                    'notes' => 'Potain MCT385 L20 Topless Tower Crane (75m Jib, 20-Ton Heavy Lift)',
                ]
            );

            Rental::updateOrCreate(
                ['rental_number' => 'RNT-2026-0105'],
                [
                    'job_order_id' => $jo4->id,
                    'customer_id' => $republicCement->id,
                    'equipment_id' => $tcMct385->id,
                    'quantity' => 1,
                    'rental_start_date' => Carbon::now()->subMonths(4),
                    'rental_end_date' => Carbon::now()->addMonths(4),
                    'status' => 'active',
                    'daily_rate' => 26333.33,
                    'rental_days' => 240,
                    'rental_cost' => 6320000.00,
                    'deposit_amount' => 900000.00,
                    'total_amount' => 6320000.00,
                    'operational_status' => 'Active On Site',
                    'notes' => 'Norzagaray Cement Plant. Potain MCT385 configured at 131.7m HUH with intermediate tie-ins.',
                ]
            );
        }

        // =========================================================================
        // GROUP B: REGISTRATION & QUEUE (Pending Authorization / Awaiting Sales Manager Release)
        // =========================================================================

        // 5. DMCI HOLDINGS - Skyway Stage 3 Segmental Girder Launching
        if ($dmci && $mcSany250) {
            $joPending1 = JobOrder::updateOrCreate(
                ['job_order_number' => 'JO-2026-0201'],
                [
                    'customer_id' => $dmci->id,
                    'created_by' => $salesUser->id,
                    'assigned_to' => $opsUser->id,
                    'service_type' => 'Heavy All-Terrain Mobile Crane Erection & Highway Lift',
                    'description' => 'Nighttime girder launching and viaduct bridge placement using Sany SAC2500S 250-Ton Mobile Crane with full outrigger steel matting.',
                    'status' => 'pending',
                    'priority' => 'urgent',
                    'scheduled_date' => Carbon::now()->addDays(5),
                    'start_date' => Carbon::now()->addDays(5),
                    'due_date' => Carbon::now()->addMonths(3),
                    'estimated_cost' => 4500000.00,
                    'actual_cost' => 0.00,
                    'total_amount' => 4500000.00,
                    'location' => 'Skyway Stage 3 Plaza Dilao Pier Segment, Manila',
                    'equipment_count' => 1,
                    'operational_status' => 'Pending Sales Manager Authorization',
                    'dispatch_status' => 'Awaiting Commercial Clearance',
                    'operational_equipment_status' => 'Ready for Mobilization',
                    'operational_notes' => 'DPWH road closure permit and MMDA traffic management clearance approved. Awaiting Sales Manager commercial sign-off.',
                ]
            );

            JobOrderItem::updateOrCreate(
                ['job_order_id' => $joPending1->id, 'equipment_id' => $mcSany250->id],
                [
                    'quantity' => 1,
                    'unit_price' => 1500000.00,
                    'unit' => 'month',
                    'total_price' => 4500000.00,
                    'notes' => 'Sany SAC2500S 250-Ton All-Terrain Heavy Mobile Crane (73m U-Shape Boom)',
                ]
            );

            Quotation::updateOrCreate(
                ['quotation_number' => 'QT-2026-0201'],
                [
                    'customer_id' => $dmci->id,
                    'created_by' => $salesUser->id,
                    'job_order_id' => $joPending1->id,
                    'quotation_date' => Carbon::now()->subDays(2),
                    'valid_until' => Carbon::now()->addDays(28),
                    'status' => 'under_review',
                    'description' => '3-Month Heavy Mobilization Package of Sany SAC2500S 250T Crane for Skyway Viaduct Girders.',
                    'subtotal' => 4500000.00,
                    'tax_rate' => 12.00,
                    'tax_amount' => 540000.00,
                    'total_amount' => 5040000.00,
                ]
            );
        }

        // 6. MAKATI DEVELOPMENT CORP (MDC) - Park Central Towers BGC
        if ($mdc && $tcMct385) {
            $joPending2 = JobOrder::updateOrCreate(
                ['job_order_number' => 'JO-2026-0202'],
                [
                    'customer_id' => $mdc->id,
                    'created_by' => $salesUser->id,
                    'assigned_to' => null,
                    'service_type' => 'Topless Heavy Tower Crane Commercial Lease',
                    'description' => 'Lease and erection of 20-Ton Potain MCT385 for high-rise residential superstructure at Makati Central Business District.',
                    'status' => 'draft',
                    'priority' => 'high',
                    'scheduled_date' => Carbon::now()->addDays(12),
                    'start_date' => Carbon::now()->addDays(12),
                    'due_date' => Carbon::now()->addMonths(12),
                    'estimated_cost' => 6800000.00,
                    'actual_cost' => 0.00,
                    'total_amount' => 6800000.00,
                    'location' => 'Paseo de Roxas cor. Makati Avenue, Makati City',
                    'equipment_count' => 1,
                    'operational_status' => 'Draft Registration in Commercial Queue',
                    'dispatch_status' => 'Unassigned',
                    'operational_equipment_status' => 'Awaiting Commercial Authorization',
                    'operational_notes' => 'Draft submitted by Sales BD. Credit limit verified at ₱25,000,000 (Net 60).',
                ]
            );

            JobOrderItem::updateOrCreate(
                ['job_order_id' => $joPending2->id, 'equipment_id' => $tcMct385->id],
                [
                    'quantity' => 1,
                    'unit_price' => 566666.67,
                    'unit' => 'month',
                    'total_price' => 6800000.00,
                    'notes' => 'Potain MCT385 L20 (20-Ton Max Capacity, 75m Jib Radius)',
                ]
            );
        }

        // 7. SAN MIGUEL CORPORATION (SMC INFRASTRUCTURE) - MRT-7 Transit Guideway
        if ($smc && $tcMct278) {
            $joPending3 = JobOrder::updateOrCreate(
                ['job_order_number' => 'JO-2026-0203'],
                [
                    'customer_id' => $smc->id,
                    'created_by' => $salesUser->id,
                    'assigned_to' => null,
                    'service_type' => 'Transit Guideway Pier Lifting & Crane Rigging',
                    'description' => 'Dedicated crane hoisting support along Commonwealth Avenue transit corridor for precast pier cap placement.',
                    'status' => 'pending',
                    'priority' => 'urgent',
                    'scheduled_date' => Carbon::now()->addDays(7),
                    'start_date' => Carbon::now()->addDays(7),
                    'due_date' => Carbon::now()->addMonths(8),
                    'estimated_cost' => 5200000.00,
                    'actual_cost' => 0.00,
                    'total_amount' => 5200000.00,
                    'location' => 'MRT-7 Station 8 Tandang Sora Station, Quezon City',
                    'equipment_count' => 1,
                    'operational_status' => 'Pending Sales Manager Authorization',
                    'dispatch_status' => 'Pending Dispatch Release',
                    'operational_equipment_status' => 'Reserved in Fleet Depot',
                    'operational_notes' => 'Night work curfew clearance granted by MMDA. Ready for Sales Manager final approval.',
                ]
            );

            JobOrderItem::updateOrCreate(
                ['job_order_id' => $joPending3->id, 'equipment_id' => $tcMct278->id],
                [
                    'quantity' => 1,
                    'unit_price' => 650000.00,
                    'unit' => 'month',
                    'total_price' => 5200000.00,
                    'notes' => 'Potain MCT278 K12 Topless Tower Crane (70m Jib, 12-Ton)',
                ]
            );
        }

        // 8. D.M. WENCESLAO & ASSOCIATES (DMWAI) - Aseana City BPO Complex
        if ($dmw && $hstSc200) {
            $joPending4 = JobOrder::updateOrCreate(
                ['job_order_number' => 'JO-2026-0204'],
                [
                    'customer_id' => $dmw->id,
                    'created_by' => $salesUser->id,
                    'assigned_to' => null,
                    'service_type' => 'Construction Passenger Hoist Dual Cage Lease',
                    'description' => 'Mobilization of SC200/200 Twin Cage 2-Ton Construction Elevator for high-rise BPO building exterior finishing.',
                    'status' => 'draft',
                    'priority' => 'medium',
                    'scheduled_date' => Carbon::now()->addDays(14),
                    'start_date' => Carbon::now()->addDays(14),
                    'due_date' => Carbon::now()->addMonths(6),
                    'estimated_cost' => 2100000.00,
                    'actual_cost' => 0.00,
                    'total_amount' => 2100000.00,
                    'location' => 'Aseana City Commercial District, Paranaque City',
                    'equipment_count' => 1,
                    'operational_status' => 'Draft Work Order',
                    'dispatch_status' => 'Unassigned',
                    'operational_equipment_status' => 'Depot Inspection Done',
                    'operational_notes' => 'Submitted by Sales BD for Sales Manager review. Net 30 payment terms requested.',
                ]
            );

            JobOrderItem::updateOrCreate(
                ['job_order_id' => $joPending4->id, 'equipment_id' => $hstSc200->id],
                [
                    'quantity' => 1,
                    'unit_price' => 350000.00,
                    'unit' => 'month',
                    'total_price' => 2100000.00,
                    'notes' => 'SC200/200 Twin Cage Passenger & Material Hoist (48-person capacity)',
                ]
            );
        }

        // =========================================================================
        // GROUP C: COMPLETED ORDERS (Historical Invoiced Work Orders with Feedback)
        // =========================================================================

        // 9. ROBINSONS LAND CORPORATION - Bridgetowne Commercial High-Rise
        if ($rlc && $tcL140_10) {
            $joComp1 = JobOrder::updateOrCreate(
                ['job_order_number' => 'JO-2026-0091'],
                [
                    'customer_id' => $rlc->id,
                    'created_by' => $salesUser->id,
                    'assigned_to' => $opsUser->id,
                    'service_type' => 'Urban Luffing Crane High-Rise Erection & Dismantling',
                    'description' => '9-Month heavy luffing tower crane structural hoisting and safe rooftop demobilization.',
                    'status' => 'completed',
                    'priority' => 'high',
                    'scheduled_date' => Carbon::now()->subMonths(10),
                    'start_date' => Carbon::now()->subMonths(10),
                    'due_date' => Carbon::now()->subDays(15),
                    'completion_date' => Carbon::now()->subDays(15),
                    'estimated_cost' => 5400000.00,
                    'actual_cost' => 5280000.00,
                    'total_amount' => 5400000.00,
                    'location' => 'Bridgetowne Destination Estate, C5 Road, Pasig City',
                    'equipment_count' => 1,
                    'operational_status' => 'Completed and Demobilized',
                    'dispatch_status' => 'Demobilized to Central Depot',
                    'operational_equipment_status' => 'Returned & Serviced',
                    'operational_notes' => 'Dismantling successfully completed on schedule with zero downtime. DOLE certificate closed out.',
                ]
            );

            JobOrderItem::updateOrCreate(
                ['job_order_id' => $joComp1->id, 'equipment_id' => $tcL140_10->id],
                [
                    'quantity' => 1,
                    'unit_price' => 600000.00,
                    'unit' => 'month',
                    'total_price' => 5400000.00,
                    'notes' => 'JHD140N-10 Luffing Jib Tower Crane (10-Ton Max Capacity)',
                ]
            );

            CustomerFeedback::updateOrCreate(
                ['job_order_id' => $joComp1->id],
                [
                    'customer_id' => $rlc->id,
                    'overall_rating' => 5,
                    'equipment_condition_rating' => 5,
                    'operator_competence_rating' => 5,
                    'timeliness_rating' => 5,
                    'comments' => 'Excellent service from Alibaton. Dismantling over active C5 traffic corridor was executed with precision and zero incidents.',
                    'status' => 'published',
                ]
            );
        }

        // 10. SM PRIME HOLDINGS - Mall of Asia Arena & Complex Expansion
        if ($smPrime && $mcSany250) {
            $joComp2 = JobOrder::updateOrCreate(
                ['job_order_number' => 'JO-2026-0092'],
                [
                    'customer_id' => $smPrime->id,
                    'created_by' => $salesUser->id,
                    'assigned_to' => $opsUser->id,
                    'service_type' => 'Heavy Long-Span Steel Truss Tandem Mobile Crane Lifting',
                    'description' => 'Multi-stage tandem lifting of 65-meter roof stadium trusses at MOA Complex expansion.',
                    'status' => 'completed',
                    'priority' => 'urgent',
                    'scheduled_date' => Carbon::now()->subMonths(6),
                    'start_date' => Carbon::now()->subMonths(6),
                    'due_date' => Carbon::now()->subDays(25),
                    'completion_date' => Carbon::now()->subDays(25),
                    'estimated_cost' => 9200000.00,
                    'actual_cost' => 9050000.00,
                    'total_amount' => 9200000.00,
                    'location' => 'Mall of Asia Complex, Seaside Boulevard, Pasay City',
                    'equipment_count' => 1,
                    'operational_status' => 'Completed and Invoiced',
                    'dispatch_status' => 'Demobilized',
                    'operational_equipment_status' => 'Depot Maintenance Ready',
                    'operational_notes' => 'Final acceptance certificate signed by SM Engineering Group. Full payment cleared.',
                ]
            );

            JobOrderItem::updateOrCreate(
                ['job_order_id' => $joComp2->id, 'equipment_id' => $mcSany250->id],
                [
                    'quantity' => 1,
                    'unit_price' => 1840000.00,
                    'unit' => 'month',
                    'total_price' => 9200000.00,
                    'notes' => 'Sany SAC2500S 250-Ton Heavy All-Terrain Mobile Crane',
                ]
            );

            CustomerFeedback::updateOrCreate(
                ['job_order_id' => $joComp2->id],
                [
                    'customer_id' => $smPrime->id,
                    'overall_rating' => 5,
                    'equipment_condition_rating' => 5,
                    'operator_competence_rating' => 5,
                    'timeliness_rating' => 5,
                    'comments' => 'Outstanding rigging engineering for our long-span roof trusses. Highly recommended for complex structural heavy lifts.',
                    'status' => 'published',
                ]
            );
        }

        // 11. FILINVEST LAND - Filinvest City Corporate Tower Alabang
        if ($filinvest && $tcMct278) {
            $joComp3 = JobOrder::updateOrCreate(
                ['job_order_number' => 'JO-2026-0093'],
                [
                    'customer_id' => $filinvest->id,
                    'created_by' => $salesUser->id,
                    'assigned_to' => $opsUser->id,
                    'service_type' => 'Topless Tower Crane High-Rise Concrete Pouring Package',
                    'description' => 'Complete structural lifting and concrete bucket hoisting for 32-storey commercial office tower.',
                    'status' => 'completed',
                    'priority' => 'medium',
                    'scheduled_date' => Carbon::now()->subMonths(8),
                    'start_date' => Carbon::now()->subMonths(8),
                    'due_date' => Carbon::now()->subDays(40),
                    'completion_date' => Carbon::now()->subDays(40),
                    'estimated_cost' => 3800000.00,
                    'actual_cost' => 3720000.00,
                    'total_amount' => 3800000.00,
                    'location' => 'Filinvest City Corporate Woods, Alabang, Muntinlupa',
                    'equipment_count' => 1,
                    'operational_status' => 'Completed & Reconciled',
                    'dispatch_status' => 'Demobilized to Depot',
                    'operational_equipment_status' => 'Available for Next Deployment',
                    'operational_notes' => 'Project delivered ahead of target completion date. Zero customer disputes.',
                ]
            );

            JobOrderItem::updateOrCreate(
                ['job_order_id' => $joComp3->id, 'equipment_id' => $tcMct278->id],
                [
                    'quantity' => 1,
                    'unit_price' => 475000.00,
                    'unit' => 'month',
                    'total_price' => 3800000.00,
                    'notes' => 'Potain MCT278 K12 Topless Tower Crane',
                ]
            );
        }

        // =========================================================================
        // RECALCULATE CUSTOMER TELEMETRY & FLOW STAGES
        // =========================================================================
        Customer::query()->chunkById(50, function ($customers) {
            foreach ($customers as $c) {
                $jobOrders = JobOrder::where('customer_id', $c->id)->get();
                $count = $jobOrders->count();
                $spending = (float) $jobOrders->sum('total_amount');
                $latest = $jobOrders->sortByDesc('created_at')->first();

                // Determine appropriate pipeline flow stage
                $stage = 'lead_acquisition';
                if ($jobOrders->where('status', 'in-progress')->count() > 0 || $jobOrders->where('status', 'completed')->count() > 0 || $c->bidding_status === 'awarded') {
                    $stage = 'awarded_contract';
                } elseif ($jobOrders->whereIn('status', ['pending', 'draft'])->count() > 0 || $c->bidding_status === 'bidding') {
                    $stage = 'bidding_proposal';
                } elseif ($c->accreditation_status === 'under_review' || $c->accreditation_status === 'pending') {
                    $stage = 'accreditation_review';
                } elseif (!empty($c->technical_requirements)) {
                    $stage = 'technical_scoping';
                }

                $c->update([
                    'total_job_orders' => $count > 0 ? $count : $c->total_job_orders,
                    'total_spending' => $spending > 0 ? $spending : $c->total_spending,
                    'last_order_date' => $latest ? $latest->created_at : $c->last_order_date,
                    'pipeline_stage' => $stage,
                ]);
            }
        });
    }
}
