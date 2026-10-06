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
                    'super_admin' => $rolesCount['super_admin'] ?? 0,
                    'admin' => ($rolesCount['admin'] ?? 0) + ($rolesCount['administrator'] ?? 0),
                    'sales_manager' => ($rolesCount['sales_manager'] ?? 0) + ($rolesCount['manager'] ?? 0),
                    'sales_business_development' => array_sum(array_intersect_key($rolesCount, array_flip([
                        'sales_business_development',
                        'sales_bd',
                        'operations_technical',
                        'operations_staff',
                        'technical_staff',
                        'staff',
                    ]))),
                    'client' => ($rolesCount['client'] ?? 0) + ($rolesCount['customer'] ?? 0),
                ],
                'total_audit_logs' => ActivityLog::count(),
                'maintenance_mode' => Cache::get('system_maintenance_mode', false),
                'recent_audit_logs' => ActivityLog::with('user')
                    ->latest()
                    ->limit(8)
                    ->get(),
            ];
        }

        $isSalesRole = $user && ($user->isSalesManager() || $user->isSalesBusinessDevelopment());
        $salesManagerSummary = null;

        if ($isSalesRole) {
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
                'pipeline_value' => $pipelineValue,
                'win_rate' => $winRate,
                'pending_approvals_count' => \App\Models\Quotation::where('status', 'under_review')->count(),
                'pending_approvals' => $pendingApprovals,
                'active_cranes_count' => $activeCranesCount,
                'total_cranes_count' => $totalCranesCount,
                'active_opportunities_count' => \App\Models\SalesOpportunity::whereNotIn('status', ['won', 'lost', 'closed'])->count(),
            ];
        }

        $isOperationsRole = $user && $user->isOperationsTechnical();
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
            'activity_chart' => $this->getActivityChart($user),
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
            'pending_quotations' => $salesManagerSummary['pending_approvals_count'] ?? 0,
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

    private function getActivityChart(User $user): array
    {
        $isAdmin = $user->isAdministrator();
        $table = $isAdmin ? 'activity_logs' : 'job_orders';
        $driver = DB::connection()->getDriverName();
        $periodExpression = match ($driver) {
            'pgsql' => "TO_CHAR(created_at, 'YYYY-MM')",
            'sqlite' => "strftime('%Y-%m', created_at)",
            'mysql' => "DATE_FORMAT(created_at, '%Y-%m')",
            'sqlsrv' => "FORMAT(created_at, 'yyyy-MM')",
            default => throw new \RuntimeException("Dashboard activity chart does not support the [{$driver}] database driver."),
        };
        $start = now()->startOfMonth()->subMonths(5);
        $end = now()->endOfMonth();

        $counts = DB::table($table)
            ->selectRaw("{$periodExpression} as period, COUNT(*) as total")
            ->whereBetween('created_at', [$start, $end])
            ->groupByRaw($periodExpression)
            ->get()
            ->keyBy('period');

        return [
            'title' => $isAdmin ? 'System Activity' : 'Job Orders Created',
            'source' => $isAdmin ? 'Activity log records' : 'Job order records by creation date',
            'points' => collect(range(0, 5))->map(function (int $offset) use ($start, $counts): array {
                $month = $start->copy()->addMonths($offset);

                return [
                    'label' => $month->format('M Y'),
                    'count' => (int) ($counts[$month->format('Y-m')]->total ?? 0),
                ];
            })->values(),
        ];
    }

    /**
     * Get recent activities
     */
    public function recentActivities(Request $request)
    {
        Gate::authorize('manage-users');
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
