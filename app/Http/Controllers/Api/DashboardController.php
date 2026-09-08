<?php

namespace App\Http\Controllers\Api;

use App\Models\JobOrder;
use App\Models\Rental;
use App\Models\Customer;
use App\Models\Equipment;
use App\Models\Project;
use App\Models\Notification;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Gate;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get dashboard summary
     */
    public function summary()
    {
        Gate::authorize('view-core-dashboard');
        $user = auth()->user();
        $userId = $user?->id;

        $adminSummary = null;
        if ($user && ($user->isAdministrator() || $user->role === 'administrator')) {
            $rolesCount = User::select('role', DB::raw('count(*) as count'))
                ->groupBy('role')
                ->pluck('count', 'role')
                ->toArray();

            $adminSummary = [
                'total_users' => User::count(),
                'active_users' => User::where('is_active', true)->count(),
                'inactive_users' => User::where('is_active', false)->count(),
                'roles_breakdown' => [
                    'administrator' => $rolesCount['administrator'] ?? 0,
                    'sales_manager' => $rolesCount['sales_manager'] ?? 0,
                    'sales_business_development' => $rolesCount['sales_business_development'] ?? 0,
                    'staff' => $rolesCount['staff'] ?? 0,
                    'customer' => $rolesCount['customer'] ?? 0,
                ],
                'total_audit_logs' => ActivityLog::count(),
                'maintenance_mode' => Cache::get('system_maintenance_mode', false),
                'db_status' => 'Connected',
                'recent_audit_logs' => ActivityLog::with('user')
                    ->latest()
                    ->limit(8)
                    ->get(),
            ];
        }

        $isSalesRole = $user && in_array($user->role, ['sales_manager', 'sales_business_development', 'administrator']);
        $salesManagerSummary = null;

        if ($isSalesRole) {
            $ytdRevenue = (float) (
                JobOrder::where('status', 'completed')->whereYear('completion_date', now()->year)->sum('total_amount')
                + Rental::where('status', 'completed')->whereYear('created_at', now()->year)->sum('total_amount')
            );
            $prevYearRevenue = (float) (
                JobOrder::where('status', 'completed')->whereYear('completion_date', now()->subYear()->year)->sum('total_amount')
                + Rental::where('status', 'completed')->whereYear('created_at', now()->subYear()->year)->sum('total_amount')
            );
            $yoyGrowthPct = $prevYearRevenue > 0
                ? round((($ytdRevenue - $prevYearRevenue) / $prevYearRevenue) * 100, 1)
                : 0;

            $pipelineValue = (float) \App\Models\Quotation::whereIn('status', ['under_review', 'approved', 'sent', 'accepted'])->sum('total_amount');
            $quotationTotal = \App\Models\Quotation::count();
            $acceptedQuotations = \App\Models\Quotation::where('status', 'accepted')->count();
            $winRate = $quotationTotal > 0 ? round(($acceptedQuotations / $quotationTotal) * 100, 1) : 0;

            $pendingApprovals = \App\Models\Quotation::with('customer:id,name,company_name')
                ->where('status', 'under_review')
                ->latest()
                ->limit(6)
                ->get();

            $activeCranesCount = Equipment::where('category', 'like', '%crane%')
                ->where('status', 'rented')
                ->count();
            $totalCranesCount = Equipment::where('category', 'like', '%crane%')->count();

            $salesManagerSummary = [
                'ytd_revenue' => $ytdRevenue,
                'prev_year_revenue' => $prevYearRevenue,
                'yoy_growth_pct' => $yoyGrowthPct,
                'pipeline_value' => $pipelineValue,
                'win_rate' => $winRate,
                'pending_approvals_count' => \App\Models\Quotation::where('status', 'under_review')->count(),
                'pending_approvals' => $pendingApprovals,
                'active_cranes_count' => $activeCranesCount,
                'total_cranes_count' => $totalCranesCount,
                'active_opportunities_count' => \App\Models\SalesOpportunity::whereNotIn('status', ['won', 'lost', 'closed'])->count(),
            ];
        }

        $isOperationsRole = $user && in_array($user->role, ['operations_technical', 'administrator', 'staff']);
        $operationsSummary = null;

        if ($isOperationsRole) {
            $towerCranesCount = Equipment::where('category', 'like', '%crane%')->count();
            $cranesDeployed = Equipment::where('category', 'like', '%crane%')->where('status', 'rented')->count();
            $cranesMaintenance = Equipment::where('category', 'like', '%crane%')->where('status', 'maintenance')->count();
            $cranesAvailable = Equipment::where('category', 'like', '%crane%')->where('status', 'available')->count();

            $upcomingMaintenance = \App\Models\EquipmentMaintenance::with(['equipment', 'assignedTo'])
                ->whereIn('status', ['scheduled', 'in-progress'])
                ->orderBy('scheduled_date', 'asc')
                ->limit(6)
                ->get();

            $activeJobOrders = JobOrder::with(['customer', 'assignedTo'])
                ->whereIn('status', ['approved', 'in-progress', 'pending'])
                ->latest()
                ->limit(6)
                ->get();

            $activeProjects = Project::with(['customer', 'projectManager'])
                ->where('status', 'active')
                ->latest()
                ->limit(5)
                ->get();

            $operationsSummary = [
                'total_fleet' => Equipment::count(),
                'available_fleet' => Equipment::where('status', 'available')->count(),
                'deployed_fleet' => Equipment::where('status', 'rented')->count(),
                'maintenance_fleet' => Equipment::where('status', 'maintenance')->count(),
                'tower_cranes_count' => $towerCranesCount,
                'cranes_deployed' => $cranesDeployed,
                'cranes_maintenance' => $cranesMaintenance,
                'cranes_available' => $cranesAvailable,
                'active_job_orders_count' => JobOrder::whereIn('status', ['approved', 'in-progress'])->count(),
                'scheduled_maintenance_count' => \App\Models\EquipmentMaintenance::whereIn('status', ['scheduled', 'in-progress'])->count(),
                'completed_maintenance_count' => \App\Models\EquipmentMaintenance::where('status', 'completed')->count(),
                'upcoming_maintenance' => $upcomingMaintenance,
                'active_job_orders' => $activeJobOrders,
                'active_projects' => $activeProjects,
                'heavy_fleet' => Equipment::select('id', 'code', 'name', 'crane_model', 'category', 'status', 'maximum_load', 'maximum_load_unit', 'location')
                    ->where('category', 'like', '%crane%')
                    ->limit(8)
                    ->get(),
            ];
        }

        return response()->json([
            'admin_summary' => $adminSummary,
            'sales_manager_summary' => $salesManagerSummary,
            'operations_summary' => $operationsSummary,
            'total_customers' => Customer::count(),
            'active_job_orders' => JobOrder::whereIn('status', ['pending', 'approved', 'in-progress'])->count(),
            'active_rentals' => Rental::where('status', 'active')->count(),
            'overdue_rentals' => Rental::where('status', '!=', 'completed')
                ->where('status', '!=', 'cancelled')
                ->where('rental_end_date', '<', now())
                ->count(),
            'active_projects' => Project::where('status', 'active')->count(),
            'total_equipment' => Equipment::count(),
            'available_equipment' => Equipment::where('status', 'available')->count(),
            'revenue_this_month' => JobOrder::where('status', 'completed')
                ->whereMonth('completion_date', now()->month)
                ->whereYear('completion_date', now()->year)
                ->sum('total_amount'),
            'revenue_this_year' => JobOrder::where('status', 'completed')
                ->whereYear('completion_date', now()->year)
                ->sum('total_amount'),
            'pending_notifications' => Notification::where('user_id', $userId)
                ->whereNull('read_at')
                ->count(),
            'completion_status' => $this->getCompletionStatus(),
            'top_customers' => $this->getTopCustomers(),
            'recent_rentals' => Rental::with(['customer', 'equipment'])
                ->latest()
                ->limit(5)
                ->get(),
            'recent_inquiries' => \App\Models\CustomerInquiry::with('customer')
                ->latest()
                ->limit(5)
                ->get(),
            'recent_quotations' => \App\Models\Quotation::with(['customer', 'createdBy'])
                ->latest()
                ->limit(5)
                ->get(),
            'recent_job_orders' => JobOrder::with(['customer', 'assignedTo'])
                ->latest()
                ->limit(5)
                ->get(),
            'recent_projects' => Project::with('customer')
                ->latest()
                ->limit(5)
                ->get(),
        ]);
    }

    /**
     * Get recent activities
     */
    public function recentActivities(Request $request)
    {
        Gate::authorize('view-core-dashboard');
        $limit = $request->input('limit', 20);
        $activities = ActivityLog::with('user')
            ->latest()
            ->limit($limit)
            ->get();

        return response()->json($activities);
    }

    /**
     * Get user notifications
     */
    public function notifications(Request $request)
    {
        $userId = auth()->id();
        $unreadOnly = $request->boolean('unread_only', false);

        $query = Notification::where('user_id', $userId);

        if ($unreadOnly) {
            $query->whereNull('read_at');
        }

        $notifications = $query->latest()
            ->paginate($request->input('per_page', 15));

        return response()->json($notifications);
    }

    public function markNotificationRead(Notification $notification, Request $request)
    {
        abort_unless($notification->user_id === $request->user()->id, 403);
        $notification->markAsRead();

        return response()->json($notification->fresh());
    }

    public function markAllNotificationsRead(Request $request)
    {
        Notification::where('user_id', $request->user()->id)->whereNull('read_at')->update(['read_at' => now()]);

        return response()->json(['message' => 'Notifications marked as read.']);
    }

    /**
     * Get completion status
     */
    private function getCompletionStatus()
    {
        $totalJobs = JobOrder::count();
        $completedJobs = JobOrder::where('status', 'completed')->count();

        return [
            'total' => $totalJobs,
            'completed' => $completedJobs,
            'percentage' => $totalJobs > 0 ? round(($completedJobs / $totalJobs) * 100, 2) : 0,
        ];
    }

    /**
     * Get top customers
     */
    private function getTopCustomers()
    {
        return Customer::select('id', 'name', 'total_spending', 'total_job_orders')
            ->orderByDesc('total_spending')
            ->limit(5)
            ->get();
    }
}
