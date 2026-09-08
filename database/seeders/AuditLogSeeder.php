<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\Customer;
use App\Models\Equipment;
use App\Models\JobOrder;
use App\Models\Quotation;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class AuditLogSeeder extends Seeder
{
    /**
     * Seed comprehensive, realistic audit log trail for administration role.
     */
    public function run(): void
    {
        $admin = User::where('role', 'administrator')->first() ?? User::first();
        $manager = User::where('role', 'sales_manager')->first() ?? $admin;
        $bd = User::where('role', 'sales_business_development')->first() ?? $admin;

        if (! $admin) {
            return;
        }

        $now = Carbon::now();

        $events = [
            // 1. Initial System Setup & Security baseline
            [
                'user_id' => $admin->id,
                'action' => 'login',
                'loggable_type' => User::class,
                'loggable_id' => $admin->id,
                'description' => "Administrator '{$admin->name}' authenticated via enterprise 2FA portal.",
                'old_values' => null,
                'new_values' => ['method' => 'password_plus_session', 'session_id' => 'sess_init_' . rand(1000, 9999)],
                'ip_address' => '192.168.1.10',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36',
                'created_at' => $now->copy()->subDays(14)->addHours(2),
            ],
            [
                'user_id' => $admin->id,
                'action' => 'system_maintenance',
                'loggable_type' => 'System',
                'loggable_id' => null,
                'description' => "Security policies baseline applied: enforced 12-character minimum password and rate-limiting throttles.",
                'old_values' => ['min_length' => 8, 'lockout_attempts' => 10],
                'new_values' => ['min_length' => 12, 'lockout_attempts' => 5, 'lockout_duration' => 120],
                'ip_address' => '192.168.1.10',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'created_at' => $now->copy()->subDays(13)->addHours(4),
            ],
            [
                'user_id' => $admin->id,
                'action' => 'role_elevation',
                'loggable_type' => User::class,
                'loggable_id' => $manager->id,
                'description' => "Role elevated for '{$manager->name}' ({$manager->email}) to sales_manager.",
                'old_values' => ['role' => 'staff'],
                'new_values' => ['role' => 'sales_manager'],
                'ip_address' => '192.168.1.10',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'created_at' => $now->copy()->subDays(12)->addHours(1),
            ],
            // 2. Business Operations & Fleet Audit
            [
                'user_id' => $manager->id,
                'action' => 'login',
                'loggable_type' => User::class,
                'loggable_id' => $manager->id,
                'description' => "Sales Manager '{$manager->name}' signed in from Makati Central Office.",
                'old_values' => null,
                'new_values' => ['ip' => '120.28.112.45', 'device' => 'Windows / Chrome'],
                'ip_address' => '120.28.112.45',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/127.0.0.0',
                'created_at' => $now->copy()->subDays(10)->addHours(3),
            ],
            [
                'user_id' => $manager->id,
                'action' => 'created',
                'loggable_type' => Customer::class,
                'loggable_id' => 1,
                'description' => "New enterprise client 'Megaworld Construction Corp' registered.",
                'old_values' => null,
                'new_values' => ['company' => 'Megaworld Construction Corp', 'tin' => '004-982-311-000', 'tier' => 'VIP'],
                'ip_address' => '120.28.112.45',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'created_at' => $now->copy()->subDays(9)->addHours(5),
            ],
            [
                'user_id' => $bd->id,
                'action' => 'created',
                'loggable_type' => Quotation::class,
                'loggable_id' => 101,
                'description' => "Draft quotation QT-2026-0042 prepared for 50-ton Zoomlion Tower Crane rental.",
                'old_values' => null,
                'new_values' => ['quotation_number' => 'QT-2026-0042', 'subtotal' => 450000.00, 'status' => 'draft'],
                'ip_address' => '112.198.74.88',
                'user_agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
                'created_at' => $now->copy()->subDays(8)->addHours(6),
            ],
            [
                'user_id' => $manager->id,
                'action' => 'approved',
                'loggable_type' => Quotation::class,
                'loggable_id' => 101,
                'description' => "Quotation QT-2026-0042 approved and transmitted to client procurement team.",
                'old_values' => ['status' => 'pending_approval'],
                'new_values' => ['status' => 'approved', 'approved_by' => $manager->name],
                'ip_address' => '120.28.112.45',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'created_at' => $now->copy()->subDays(7)->addHours(2),
            ],
            [
                'user_id' => $admin->id,
                'action' => 'created',
                'loggable_type' => JobOrder::class,
                'loggable_id' => 201,
                'description' => "Job Order JO-20260901-TWR4 generated for BGC High Street tower crane erection.",
                'old_values' => null,
                'new_values' => ['job_order_number' => 'JO-20260901-TWR4', 'priority' => 'urgent', 'status' => 'scheduled'],
                'ip_address' => '192.168.1.10',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'created_at' => $now->copy()->subDays(6)->addHours(4),
            ],
            [
                'user_id' => $admin->id,
                'action' => 'updated',
                'loggable_type' => Equipment::class,
                'loggable_id' => 1,
                'description' => "Potain MDT 178 Tower Crane status updated to In-Field (BGC Project Site).",
                'old_values' => ['status' => 'available', 'location' => 'Calamba Yard'],
                'new_values' => ['status' => 'rented', 'location' => 'Taguig BGC Sector 4'],
                'ip_address' => '192.168.1.10',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'created_at' => $now->copy()->subDays(5)->addHours(7),
            ],
            // 3. Security Alerts & Anomaly Detections
            [
                'user_id' => $admin->id,
                'action' => 'failed_login',
                'loggable_type' => 'Security',
                'loggable_id' => null,
                'description' => "Failed sign-in attempt from IP 203.177.15.82 targeting username 'root@intellitrack.local'.",
                'old_values' => null,
                'new_values' => ['target_user' => 'root', 'risk_score' => 'high', 'trigger' => 'unknown_account'],
                'ip_address' => '203.177.15.82',
                'user_agent' => 'Python-urllib/3.9',
                'created_at' => $now->copy()->subDays(4)->addHours(1),
            ],
            [
                'user_id' => $admin->id,
                'action' => 'blocked_login',
                'loggable_type' => 'Security',
                'loggable_id' => null,
                'description' => "Blocked login request for deactivated legacy account 'demo_operator@example.com'.",
                'old_values' => null,
                'new_values' => ['email' => 'demo_operator@example.com', 'reason' => 'account_suspended'],
                'ip_address' => '180.191.130.12',
                'user_agent' => 'Mozilla/5.0 (Android; Mobile)',
                'created_at' => $now->copy()->subDays(3)->addHours(8),
            ],
            [
                'user_id' => $admin->id,
                'action' => 'password_changed',
                'loggable_type' => User::class,
                'loggable_id' => $admin->id,
                'description' => "Administrator password rotated in accordance with 90-day compliance cycle.",
                'old_values' => null,
                'new_values' => ['reason' => 'quarterly_policy', 'forced_signout_others' => true],
                'ip_address' => '192.168.1.10',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'created_at' => $now->copy()->subDays(2)->addHours(3),
            ],
            [
                'user_id' => $admin->id,
                'action' => 'status_change',
                'loggable_type' => User::class,
                'loggable_id' => 7,
                'description' => "User account 'Sales BD Demo' deactivated due to contract transition.",
                'old_values' => ['is_active' => true],
                'new_values' => ['is_active' => false],
                'ip_address' => '192.168.1.10',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'created_at' => $now->copy()->subDays(1)->addHours(5),
            ],
            // 4. Recent Actions (Today & Last 12 hours)
            [
                'user_id' => $admin->id,
                'action' => 'login',
                'loggable_type' => User::class,
                'loggable_id' => $admin->id,
                'description' => "Administrator '{$admin->name}' logged in to System Administration Console.",
                'old_values' => null,
                'new_values' => ['ip' => '127.0.0.1', 'status' => 'authorized'],
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36',
                'created_at' => $now->copy()->subHours(3),
            ],
            [
                'user_id' => $manager->id,
                'action' => 'updated',
                'loggable_type' => Quotation::class,
                'loggable_id' => 102,
                'description' => "Commercial terms revised for Ayala Land Tower Crane mobilization project.",
                'old_values' => ['subtotal' => 620000.00],
                'new_values' => ['subtotal' => 595000.00, 'discount_authorized_by' => $manager->name],
                'ip_address' => '120.28.112.45',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'created_at' => $now->copy()->subHours(2),
            ],
            [
                'user_id' => $admin->id,
                'action' => 'scheduled',
                'loggable_type' => JobOrder::class,
                'loggable_id' => 201,
                'description' => "Inspection schedule confirmed for JO-20260901-TWR4 with Lead Safety Engineer.",
                'old_values' => ['scheduled_date' => null],
                'new_values' => ['scheduled_date' => $now->copy()->addDays(2)->toDateString()],
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'created_at' => $now->copy()->subMinutes(45),
            ],
        ];

        foreach ($events as $event) {
            ActivityLog::create($event);
        }
    }
}
