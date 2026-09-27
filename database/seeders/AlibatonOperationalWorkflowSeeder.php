<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\CustomerCommunication;
use App\Models\CustomerFeedback;
use App\Models\CustomerFollowUp;
use App\Models\CustomerInquiry;
use App\Models\Equipment;
use App\Models\JobOrder;
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
        $taisei = Customer::where('customer_code', 'CUS-0022')->first();
        $megaworld = Customer::where('customer_code', 'CUS-0031')->first();
        $republicCement = Customer::where('customer_code', 'CUS-0049')->first();
        $primaryStructures = Customer::where('customer_code', 'CUS-0042')->first();

        // 3. Fetch Flagship Equipment
        $tcMct328 = Equipment::where('code', 'ALIB-TC-POT-MCT328')->first() ?? Equipment::first();
        $tcL140_8 = Equipment::where('code', 'ALIB-TC-L140-8')->first() ?? Equipment::first();
        $tcMct385 = Equipment::where('code', 'ALIB-TC-POT-MCT385')->first() ?? Equipment::first();
        $tcMct278 = Equipment::where('code', 'ALIB-TC-POT-MCT278')->first() ?? Equipment::first();
        $mcSany250 = Equipment::where('code', 'ALIB-MC-SANY250')->first() ?? Equipment::first();
        $hstSc200 = Equipment::where('code', 'ALIB-HST-SC200')->first() ?? Equipment::first();
        $boomTruck = Equipment::where('code', 'ALIB-LOG-ISZ-15T')->first() ?? Equipment::first();

        // =========================================================================
        // WORKFLOW 1: MEGAWIDE - North-South Commuter Railway (NSCR) Viaduct Package
        // =========================================================================
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

            $quot1->items()->updateOrCreate(
                ['description' => 'Potain MCT328 L16 Topless Tower Crane - Monthly Lease (12 Months)'],
                [
                    'equipment_id' => $tcMct328->id,
                    'quantity' => 1,
                    'rental_duration' => 12,
                    'rental_duration_unit' => 'month',
                    'unit_rate' => 630000.00,
                    'line_total' => 7560000.00,
                ]
            );

            $rent1 = Rental::updateOrCreate(
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
                    'objectives' => 'Maintain 99.5% crane operational uptime for elevated girder placement across railway contract.',
                    'deliverables' => 'Full lifting logsheets, monthly preventive maintenance certification, and safe load compliance.',
                ]
            );
        }

        // =========================================================================
        // WORKFLOW 2: EEI & TAISEI - Metro Manila Subway Project (CP101 Shaft)
        // =========================================================================
        if ($eei && $tcMct278) {
            $inq2 = CustomerInquiry::updateOrCreate(
                ['inquiry_number' => 'INQ-2026-0102'],
                [
                    'customer_id' => $eei->id,
                    'source' => 'bidding',
                    'subject' => 'Underground Shaft Hoisting Crane for Metro Manila Subway CP101',
                    'details' => '12-Ton Potain MCT278 Topless Tower Crane required at Valenzuela Depot tunnel boring machine (TBM) launching shaft.',
                    'status' => 'quoted',
                    'priority' => 'urgent',
                    'remarks' => 'Joint Venture requirement with Taisei Corporation and Shimizu Corporation.',
                    'created_by' => $salesUser->id,
                    'assigned_to' => $manager->id,
                ]
            );

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

            $rent2 = Rental::updateOrCreate(
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

            Project::updateOrCreate(
                ['project_code' => 'PRJ-MMSP-01'],
                [
                    'project_name' => 'Metro Manila Subway Project CP101 Tunnel Launching Shaft',
                    'description' => 'The Philippines first underground mass transit railway project; shaft excavation and TBM assembly.',
                    'customer_id' => $eei->id,
                    'project_manager_id' => $manager->id,
                    'job_order_id' => $jo2->id,
                    'start_date' => Carbon::now()->subMonths(2),
                    'deadline' => Carbon::now()->addMonths(24),
                    'expected_end_date' => Carbon::now()->addMonths(24),
                    'location' => 'Valenzuela City, Metro Manila',
                    'requirements' => 'Continuous 24-hour shaft hoisting, automated overload warning systems, and bi-weekly wire rope magnetic inspection.',
                    'required_equipment' => 'Potain MCT278 K12 Topless Tower Crane, Sany SAC2500S Mobile Crane',
                    'status' => 'active',
                    'budget' => 60000000.00,
                    'spent_amount' => 5760000.00,
                    'progress_percentage' => 28,
                    'objectives' => 'Ensure zero unplanned downtime during tunnel segment lowering and muck removal cycles.',
                    'deliverables' => 'Full operational logsheets, daily safety pre-start checklists, and JICA audit compliance reports.',
                ]
            );
        }

        // =========================================================================
        // WORKFLOW 3: MEGAWORLD - Uptown Modern Skyscraper Tower (BGC Taguig)
        // =========================================================================
        if ($megaworld && $tcL140_8 && $hstSc200) {
            $inq3 = CustomerInquiry::updateOrCreate(
                ['inquiry_number' => 'INQ-2026-0103'],
                [
                    'customer_id' => $megaworld->id,
                    'source' => 'direct_inquiry',
                    'subject' => 'High-Rise Luffing Crane & Twin Passenger Hoist for 54-Storey Tower',
                    'details' => 'Need compact footprint JHD140N-8 Luffing Crane with internal climbing kit and SC200/200 twin cage passenger hoist.',
                    'status' => 'quoted',
                    'priority' => 'high',
                    'remarks' => 'Zero property-line swing over adjacent retail restaurants strictly enforced.',
                    'created_by' => $salesUser->id,
                    'assigned_to' => $manager->id,
                ]
            );

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

            Rental::updateOrCreate(
                ['rental_number' => 'RNT-2026-0104'],
                [
                    'job_order_id' => $jo3->id,
                    'customer_id' => $megaworld->id,
                    'equipment_id' => $hstSc200->id,
                    'quantity' => 1,
                    'rental_start_date' => Carbon::now()->subMonths(1),
                    'rental_end_date' => Carbon::now()->addMonths(14),
                    'status' => 'active',
                    'daily_rate' => 5333.33,
                    'rental_days' => 450,
                    'rental_cost' => 2240000.00,
                    'deposit_amount' => 300000.00,
                    'total_amount' => 2240000.00,
                    'operational_status' => 'Active On Site',
                    'notes' => 'SC200/200 Twin Cage. 48 passenger vertical access capacity certified by DOLE-NCR.',
                ]
            );
        }

        // =========================================================================
        // WORKFLOW 4: REPUBLIC CEMENT - Preheater Tower Expansion (Norzagaray)
        // =========================================================================
        if ($republicCement && $tcMct385) {
            $inq4 = CustomerInquiry::updateOrCreate(
                ['inquiry_number' => 'INQ-2026-0104'],
                [
                    'customer_id' => $republicCement->id,
                    'source' => 'industry_partner',
                    'subject' => 'Potain MCT385 Heavy Tower Crane for Kiln Tower Construction',
                    'details' => '20-Ton topless crane with 75m jib radius and 131.7m hook height for heavy steel framing on industrial kiln expansion.',
                    'status' => 'quoted',
                    'priority' => 'high',
                    'remarks' => 'Plant maintenance window requires uninterrupted erection schedule.',
                    'created_by' => $salesUser->id,
                    'assigned_to' => $manager->id,
                ]
            );

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
        // CRM INTERACTIONS: Customer Follow-Ups, Communications & Feedback
        // =========================================================================
        if ($megawide) {
            CustomerFollowUp::updateOrCreate(
                ['title' => 'NSCR Malolos Viaduct monthly preventive maintenance and anchor tie-in inspection'],
                [
                    'customer_id' => $megawide->id,
                    'notes' => 'Coordinate with Engr. Bautista for scheduled 4-hour maintenance window on Potain MCT328 slewing motor and winch brakes.',
                    'scheduled_date' => Carbon::now()->addDays(3),
                    'due_time' => '09:00 AM',
                    'status' => 'pending',
                    'priority' => 'high',
                    'assigned_to' => $opsUser->id,
                    'created_by' => $manager->id,
                ]
            );

            CustomerCommunication::create([
                'customer_id' => $megawide->id,
                'created_by' => $salesUser->id,
                'type' => 'meeting',
                'direction' => 'outbound',
                'subject' => 'NSCR Viaduct Segment Launching Performance Review',
                'content' => 'Met with Megawide heavy equipment team. Crane operational uptime at 99.8% over the past 90 days. Client requested proposal for additional boom truck unit.',
                'outcome' => 'Satisfactory; additional proposal requested',
                'communicated_at' => Carbon::now()->subDays(5),
            ]);

            CustomerFeedback::create([
                'customer_id' => $megawide->id,
                'overall_rating' => 5,
                'equipment_condition_rating' => 5,
                'operator_competence_rating' => 5,
                'timeliness_rating' => 5,
                'comments' => 'Alibaton operators and technical support team have shown exemplary discipline on the DOTr railway site. Zero safety incidents.',
                'status' => 'published',
            ]);
        }

        if ($eei) {
            CustomerFollowUp::updateOrCreate(
                ['title' => 'Subway CP101 Valenzuela shaft wire rope magnetic NDT inspection certificate'],
                [
                    'customer_id' => $eei->id,
                    'notes' => 'Submit third-party non-destructive testing (NDT) certificate to EEI Safety Department and JICA supervision team.',
                    'scheduled_date' => Carbon::now()->addDays(5),
                    'due_time' => '02:00 PM',
                    'status' => 'pending',
                    'priority' => 'urgent',
                    'assigned_to' => $opsUser->id,
                    'created_by' => $salesUser->id,
                ]
            );

            CustomerCommunication::create([
                'customer_id' => $eei->id,
                'created_by' => $salesUser->id,
                'type' => 'email',
                'direction' => 'outbound',
                'subject' => 'Submission of DOLE Safety Inspection Sticker - Subway Shaft Crane',
                'content' => 'Sent updated DOLE Bureau of Working Conditions crane testing certification and operator TESDA NC II credentials to Engr. Alcantara.',
                'outcome' => 'Documents submitted and acknowledged',
                'communicated_at' => Carbon::now()->subDays(3),
            ]);
        }
    }
}
