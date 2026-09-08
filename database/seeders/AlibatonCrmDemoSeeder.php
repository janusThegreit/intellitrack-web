<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\CustomerCommunication;
use App\Models\CustomerFeedback;
use App\Models\CustomerFollowUp;
use App\Models\CustomerInquiry;
use App\Models\JobOrder;
use App\Models\Rental;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class AlibatonCrmDemoSeeder extends Seeder
{
    public function run(): void
    {
        $salesUser = User::where('role', 'sales_business_development')->first()
            ?? User::where('role', 'sales_manager')->first()
            ?? User::first();

        $manager = User::where('role', 'sales_manager')->first()
            ?? $salesUser;

        // Ensure key clients
        $c1 = Customer::firstOrCreate(
            ['email' => 'procurement@megaworld-demo.ph'],
            [
                'name' => 'Megaworld Prime Builders Corp.',
                'company_name' => 'Megaworld Prime Builders Corp.',
                'contact_person' => 'Engr. Roberto Dalisay',
                'phone' => '09178881234',
                'address' => 'BGC Corporate Center, Taguig',
                'customer_type' => 'corporate',
                'status' => 'active',
            ]
        );

        $c2 = Customer::firstOrCreate(
            ['email' => 'projects@dmci-demo.ph'],
            [
                'name' => 'DMCI Heavy Infrastructure Inc.',
                'company_name' => 'DMCI Heavy Infrastructure Inc.',
                'contact_person' => 'Arch. Maricel Santos',
                'phone' => '09187774567',
                'address' => 'DMCI Plaza, Makati City',
                'customer_type' => 'corporate',
                'status' => 'active',
            ]
        );

        $c3 = Customer::firstOrCreate(
            ['email' => 'logistics@cebuharbor-demo.ph'],
            [
                'name' => 'Cebu Harbor Commercial Towers',
                'company_name' => 'Cebu Harbor Commercial Towers',
                'contact_person' => 'Engr. Kenneth Tan',
                'phone' => '09196667890',
                'address' => 'North Reclamation Area, Cebu City',
                'customer_type' => 'business',
                'status' => 'active',
            ]
        );

        $inq1 = CustomerInquiry::first();
        $jobOrder = JobOrder::first();
        $rental = Rental::first();

        // 1. Follow-Ups & Reminders
        CustomerFollowUp::firstOrCreate(
            ['title' => 'Follow up on crane tie-in foundation inspection with Megaworld'],
            [
                'customer_id' => $c1->id,
                'customer_inquiry_id' => $inq1?->id,
                'notes' => 'Check with Engr. Dalisay regarding the structural clearance certificate for 45m crane mast section extension.',
                'scheduled_date' => Carbon::now()->addDays(2),
                'due_time' => '10:00 AM',
                'status' => 'pending',
                'priority' => 'urgent',
                'assigned_to' => $salesUser?->id,
                'created_by' => $manager?->id,
            ]
        );

        CustomerFollowUp::firstOrCreate(
            ['title' => 'Calamba Flyover girder launching mobilization date confirmation'],
            [
                'customer_id' => $c2->id,
                'notes' => 'Call Arch. Santos to finalize highway closure permit date with DPWH before mobilizing 250-Ton All-Terrain Crane.',
                'scheduled_date' => Carbon::now()->addDays(4),
                'due_time' => '02:30 PM',
                'status' => 'pending',
                'priority' => 'high',
                'assigned_to' => $salesUser?->id,
                'created_by' => $salesUser?->id,
            ]
        );

        CustomerFollowUp::firstOrCreate(
            ['title' => 'Client check-in on Cebu IT Park Luffing Crane performance'],
            [
                'customer_id' => $c3->id,
                'notes' => 'Weekly operational satisfaction review with Engr. Tan. Confirm scheduled preventive maintenance check.',
                'scheduled_date' => Carbon::now()->subDays(1),
                'due_time' => '11:00 AM',
                'status' => 'completed',
                'priority' => 'medium',
                'assigned_to' => $manager?->id,
                'created_by' => $manager?->id,
                'completed_at' => Carbon::now()->subDays(1),
            ]
        );

        // 2. Communications History
        CustomerCommunication::firstOrCreate(
            ['subject' => 'Discussion on 6-Ton Flat-Top Tower Crane Mobilization Timeline'],
            [
                'customer_id' => $c1->id,
                'customer_inquiry_id' => $inq1?->id,
                'type' => 'call',
                'direction' => 'outbound',
                'content' => "Phone conference with Engr. Roberto Dalisay regarding site access route via 30th street. Agreed that heavy transport trailers will arrive after 10:00 PM to comply with local traffic curfew.\nSent certified crane operator and rigger bio-data for safety accreditation.",
                'outcome' => 'Client approved delivery window; mobilization team notified.',
                'communicated_at' => Carbon::now()->subDays(3),
                'created_by' => $salesUser?->id,
            ]
        );

        CustomerCommunication::firstOrCreate(
            ['subject' => 'Ocular Site Inspection for Highway Outrigger Bearing Pads'],
            [
                'customer_id' => $c2->id,
                'type' => 'site_visit',
                'direction' => 'outbound',
                'content' => "Site inspection conducted at Calamba Bridge construction site with DMCI safety officer. Tested soil compaction for 250-Ton mobile crane outrigger pads. Recommended steel matting for reinforced weight distribution.",
                'outcome' => 'Safety engineer signed off on steel matting recommendation.',
                'communicated_at' => Carbon::now()->subDays(5),
                'created_by' => $manager?->id,
            ]
        );

        CustomerCommunication::firstOrCreate(
            ['subject' => 'Quotation Submission for Luffing Jib Crane Package'],
            [
                'customer_id' => $c3->id,
                'type' => 'email',
                'direction' => 'outbound',
                'content' => "Transmitted official quotation QT-2026-002 covering 90-day rental of Zoomlion L250-18 crane, comprehensive operator insurance, and 24/7 on-call field technician support.",
                'outcome' => 'Client acknowledged receipt and submitted for board expenditure approval.',
                'communicated_at' => Carbon::now()->subDays(8),
                'created_by' => $salesUser?->id,
            ]
        );

        // 3. Customer Feedback & CSAT Reviews
        CustomerFeedback::firstOrCreate(
            ['comments' => 'Exceptional lifting performance and flawless safety execution on our high-rise core wall pour. Operator Marcus is exceptionally skilled.'],
            [
                'customer_id' => $c1->id,
                'job_order_id' => $jobOrder?->id,
                'rental_id' => $rental?->id,
                'overall_rating' => 5,
                'equipment_condition_rating' => 5,
                'operator_competence_rating' => 5,
                'timeliness_rating' => 5,
                'status' => 'published',
                'action_taken' => 'Commended rigging and operations team during monthly safety meeting.',
                'created_by' => $salesUser?->id,
            ]
        );

        CustomerFeedback::firstOrCreate(
            ['comments' => 'Rapid mobilization and responsive customer support. The Zoomlion Luffing crane provided great reach in our constrained urban site.'],
            [
                'customer_id' => $c3->id,
                'overall_rating' => 5,
                'equipment_condition_rating' => 5,
                'operator_competence_rating' => 5,
                'timeliness_rating' => 5,
                'status' => 'published',
                'action_taken' => 'Customer confirmed contract extension for Phase 2.',
                'created_by' => $salesUser?->id,
            ]
        );

        CustomerFeedback::firstOrCreate(
            ['comments' => 'Heavy transport and crane operation was smooth. Minor delay on gate entry pass from security, but team adapted well to night shift offloading.'],
            [
                'customer_id' => $c2->id,
                'overall_rating' => 4,
                'equipment_condition_rating' => 5,
                'operator_competence_rating' => 4,
                'timeliness_rating' => 4,
                'status' => 'addressed',
                'action_taken' => 'Secured pre-approved RFID dispatch tags for all Alibaton transport trucks to eliminate gate delay.',
                'created_by' => $manager?->id,
            ]
        );
    }
}
