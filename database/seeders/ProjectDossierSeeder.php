<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Project;
use App\Models\ProjectTask;
use App\Models\Customer;
use App\Models\User;
use Carbon\Carbon;

class ProjectDossierSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::first();
        $adminId = $admin ? $admin->id : 1;

        $cebuCust = Customer::where('company_name', 'like', '%Cebu Harbor%')->first() ?? Customer::first();
        $dmciCust = Customer::where('company_name', 'like', '%DMCI%')->first() ?? Customer::first();
        $megaCust = Customer::where('company_name', 'like', '%Megaworld%')->first() ?? Customer::first();
        $abcCust = Customer::where('company_name', 'like', '%ABC%')->first() ?? Customer::first();

        // 1. Cebu Harbor Berth 4
        $p1 = Project::updateOrCreate(
            ['project_code' => 'PRJ-2026-CHB04'],
            [
                'project_name' => 'Cebu Harbor Berth 4 Heavy Lift & Container Crane Erection',
                'description' => 'Comprehensive rigging, marine pier foundation heavy lifts, and luffing tower crane erection for the international container terminal expansion in Cebu Port.',
                'customer_id' => $cebuCust->id,
                'project_manager_id' => $adminId,
                'start_date' => Carbon::parse('2026-01-15 08:00:00'),
                'end_date' => Carbon::parse('2026-10-30 18:00:00'),
                'deadline' => Carbon::parse('2026-10-30 18:00:00'),
                'status' => 'active',
                'budget' => 4850000.00,
                'spent_amount' => 3240000.00,
                'progress_percentage' => 72,
                'objectives' => 'Erect heavy tower crane units, hoist 65-ton pre-cast wharf blocks, and ensure zero-downtime port operations.',
                'deliverables' => 'Full site mobilization, load-tested tower crane certified by DOLE accredited inspector, pier foundation placement, and crane demobilization.',
            ]
        );

        $this->seedTasks($p1->id, [
            ['task_name' => 'Site Engineering Survey & Foundation Anchor Bolt Verification', 'priority' => 'high', 'status' => 'completed', 'progress_percentage' => 100, 'hours' => 32],
            ['task_name' => 'Mobilization of 250T All-Terrain Crane & Counterweights to Pier Site', 'priority' => 'critical', 'status' => 'completed', 'progress_percentage' => 100, 'hours' => 48],
            ['task_name' => 'Tower Crane Mast Assembly & Hook Height Calibration (60m)', 'priority' => 'critical', 'status' => 'completed', 'progress_percentage' => 100, 'hours' => 64],
            ['task_name' => 'Pre-cast Structural Girder Heavy Lifts (Section A & B)', 'priority' => 'high', 'status' => 'in-progress', 'progress_percentage' => 65, 'hours' => 80],
            ['task_name' => 'DOLE Safety Third-Party Load Testing & Site Clearance', 'priority' => 'medium', 'status' => 'todo', 'progress_percentage' => 0, 'hours' => 24],
        ], $adminId);

        // 2. DMCI High-Rise Sky Tower
        $p2 = Project::updateOrCreate(
            ['project_code' => 'PRJ-2026-DMCI01'],
            [
                'project_name' => 'DMCI High-Rise Sky Tower Rigging & Heavy Lift Operations',
                'description' => 'Long-term tower crane deployment, structural steel framing hoisting, and internal climbing operations for 48-storey mixed-use commercial tower.',
                'customer_id' => $dmciCust->id,
                'project_manager_id' => $adminId,
                'start_date' => Carbon::parse('2026-02-01 08:00:00'),
                'end_date' => Carbon::parse('2026-12-15 18:00:00'),
                'deadline' => Carbon::parse('2026-12-15 18:00:00'),
                'status' => 'active',
                'budget' => 6200000.00,
                'spent_amount' => 2950000.00,
                'progress_percentage' => 48,
                'objectives' => 'Deploy L250-18 luffing jib crane, execute daily batch concrete bucket lifts and structural steel positioning up to Level 48.',
                'deliverables' => 'Climbing mast frames, external wall anchors at floors 12, 24, and 36, daily crane telemetry, certified operator crew.',
            ]
        );

        $this->seedTasks($p2->id, [
            ['task_name' => 'Civil Works Tie-In & Foundation Slab Inspection', 'priority' => 'high', 'status' => 'completed', 'progress_percentage' => 100, 'hours' => 24],
            ['task_name' => 'Luffing Jib Mast Initial Erection Phase 1 (45m Height)', 'priority' => 'critical', 'status' => 'completed', 'progress_percentage' => 100, 'hours' => 56],
            ['task_name' => 'Daily Rigging & High-Rise Steel Infill Operations (Floors 1-20)', 'priority' => 'high', 'status' => 'in-progress', 'progress_percentage' => 50, 'hours' => 120],
            ['task_name' => 'Level 24 External Mast Tie-in Installation & Jacking Climb', 'priority' => 'critical', 'status' => 'todo', 'progress_percentage' => 0, 'hours' => 40],
            ['task_name' => 'Post-Construction Crane Dismantling & Ground Site Clearance', 'priority' => 'medium', 'status' => 'todo', 'progress_percentage' => 0, 'hours' => 48],
        ], $adminId);

        // 3. Megaworld Prime Commercial Mall
        $p3 = Project::updateOrCreate(
            ['project_code' => 'PRJ-2026-MPB02'],
            [
                'project_name' => 'Megaworld Prime Mall Steel Roof Truss Hoisting & Tandem Lift',
                'description' => 'Fast-track tandem crane lift for 52-meter long roof trusses spanning over the central atrium and grand cinema auditorium.',
                'customer_id' => $megaCust->id,
                'project_manager_id' => $adminId,
                'start_date' => Carbon::parse('2026-03-10 08:00:00'),
                'end_date' => Carbon::parse('2026-06-30 18:00:00'),
                'deadline' => Carbon::parse('2026-06-30 18:00:00'),
                'status' => 'active',
                'budget' => 2450000.00,
                'spent_amount' => 2100000.00,
                'progress_percentage' => 88,
                'objectives' => 'Execute high-precision tandem lift using 80-ton mobile crane and 50-ton rough-terrain crane without structural deflection.',
                'deliverables' => 'Engineered rigging plan, certified crane operators, structural weld positioning, and post-lift deflection reports.',
            ]
        );

        $this->seedTasks($p3->id, [
            ['task_name' => 'Dual Crane Tandem Lift Engineered Rigging Plan Sign-off', 'priority' => 'critical', 'status' => 'completed', 'progress_percentage' => 100, 'hours' => 20],
            ['task_name' => 'Delivery & Staging of 52m Steel Trusses on Site Pad', 'priority' => 'high', 'status' => 'completed', 'progress_percentage' => 100, 'hours' => 16],
            ['task_name' => 'Tandem Crane Hoisting of Main Atrium Roof Spine', 'priority' => 'critical', 'status' => 'completed', 'progress_percentage' => 100, 'hours' => 36],
            ['task_name' => 'Secondary Purlin & Mechanical Deck Lifts', 'priority' => 'medium', 'status' => 'in-progress', 'progress_percentage' => 75, 'hours' => 30],
            ['task_name' => 'Client Acceptance Inspection & Site Demobilization', 'priority' => 'low', 'status' => 'todo', 'progress_percentage' => 0, 'hours' => 12],
        ], $adminId);

        // 4. BGC Financial Center
        $p4 = Project::updateOrCreate(
            ['project_code' => 'PRJ-2026-BGC03'],
            [
                'project_name' => 'BGC Financial Center Sky Bridge Modular Lift & Installation',
                'description' => 'Architectural modular sky bridge installation connecting Towers A and B across 5th Avenue requiring specialized overnight tandem rigging.',
                'customer_id' => $dmciCust->id,
                'project_manager_id' => $adminId,
                'start_date' => Carbon::parse('2026-08-01 08:00:00'),
                'end_date' => Carbon::parse('2027-02-28 18:00:00'),
                'deadline' => Carbon::parse('2027-02-28 18:00:00'),
                'status' => 'planning',
                'budget' => 8750000.00,
                'spent_amount' => 450000.00,
                'progress_percentage' => 15,
                'objectives' => 'Secure MMDA road closure, simulate crane outrigger pressure, and execute 110-ton prefabricated bridge lift in 48-hour window.',
                'deliverables' => '3D Rigging CAD simulation, heavy transport escort, dual 250T crane mobilization, final bolting inspection.',
            ]
        );

        $this->seedTasks($p4->id, [
            ['task_name' => 'Structural Engineering Rigging CAD Simulation & Approval', 'priority' => 'critical', 'status' => 'completed', 'progress_percentage' => 100, 'hours' => 40],
            ['task_name' => 'MMDA Night Road Closure & City Traffic Rerouting Permits', 'priority' => 'high', 'status' => 'in-progress', 'progress_percentage' => 40, 'hours' => 30],
            ['task_name' => 'Asphalt Outrigger Bearing Pressure & Utility Scanning', 'priority' => 'high', 'status' => 'todo', 'progress_percentage' => 0, 'hours' => 20],
            ['task_name' => 'Weekend 48-Hour Tandem Modular Bridge Hoisting Window', 'priority' => 'critical', 'status' => 'todo', 'progress_percentage' => 0, 'hours' => 48],
            ['task_name' => 'Road Reopening, Site De-mobilization & Handover', 'priority' => 'medium', 'status' => 'todo', 'progress_percentage' => 0, 'hours' => 16],
        ], $adminId);

        // 5. Completed Warehouse
        $p5 = Project::updateOrCreate(
            ['project_code' => 'PRJ-2025-SBL01'],
            [
                'project_name' => 'Subic Bay Freezone Logistics Mega-Warehouse Erection',
                'description' => 'Erection of structural pre-engineered building (PEB) columns, steel frames, and gantry crane rail installation.',
                'customer_id' => $abcCust->id,
                'project_manager_id' => $adminId,
                'start_date' => Carbon::parse('2025-05-10 08:00:00'),
                'end_date' => Carbon::parse('2025-11-20 18:00:00'),
                'deadline' => Carbon::parse('2025-11-20 18:00:00'),
                'status' => 'completed',
                'budget' => 3100000.00,
                'spent_amount' => 3050000.00,
                'progress_percentage' => 100,
                'objectives' => 'Deliver complete 20,000 sqm warehouse structural steel erection on schedule.',
                'deliverables' => 'Full structural sign-off, gantry crane test certificate, complete demobilization.',
            ]
        );

        $this->seedTasks($p5->id, [
            ['task_name' => 'Pre-Engineered Column Rigging & Plumb Alignment', 'priority' => 'high', 'status' => 'completed', 'progress_percentage' => 100, 'hours' => 60],
            ['task_name' => 'Overhead 20-Ton Gantry Crane Rail Hoisting & Alignment', 'priority' => 'critical', 'status' => 'completed', 'progress_percentage' => 100, 'hours' => 45],
            ['task_name' => 'Final Structural Torque Inspection & Handover', 'priority' => 'medium', 'status' => 'completed', 'progress_percentage' => 100, 'hours' => 18],
        ], $adminId);
    }

    private function seedTasks(int $projectId, array $tasks, int $userId): void
    {
        foreach ($tasks as $t) {
            ProjectTask::updateOrCreate(
                [
                    'project_id' => $projectId,
                    'task_name' => $t['task_name'],
                ],
                [
                    'priority' => $t['priority'],
                    'status' => $t['status'],
                    'progress_percentage' => $t['progress_percentage'],
                    'assigned_to' => $userId,
                    'estimated_hours' => $t['hours'],
                    'actual_hours' => round($t['hours'] * ($t['progress_percentage'] / 100)),
                    'description' => 'Mandatory technical milestone phase for crane operations and safety compliance.',
                ]
            );
        }
    }
}
