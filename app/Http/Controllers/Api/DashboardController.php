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
                ],
                'total_audit_logs' => ActivityLog::count(),
                'maintenance_mode' => Cache::get('system_maintenance_mode', false),
                'db_status' => 'Connected (Operational)',
                'recent_audit_logs' => ActivityLog::with('user')
                    ->latest()
                    ->limit(8)
                    ->get(),
            ];
        }

        // 2. Sales Manager Dashboard Summary (Core 1 Management, Review, Approval & Analytics)
        $salesManagerSummary = null;
        if ($user && ($user->isSalesManager() || $user->role === 'sales_manager')) {
            $pipelineValue = (float) \App\Models\Quotation::whereIn('status', ['under_review', 'approved', 'sent', 'accepted'])->sum('total_amount');
            $quotationTotal = \App\Models\Quotation::count();
            $acceptedQuotations = \App\Models\Quotation::where('status', 'accepted')->count();
            $winRate = $quotationTotal > 0 ? round(($acceptedQuotations / $quotationTotal) * 100, 1) : 0;

            $pendingApprovals = \App\Models\Quotation::with('customer:id,name,company_name')
                ->where('status', 'under_review')
                ->latest()
                ->limit(6)
                ->get();

            $salesManagerSummary = [
                'total_customers' => Customer::count(),
                'active_clients' => Customer::where('status', 'active')->count(),
                'customer_inquiries_count' => \App\Models\CustomerInquiry::count(),
                'inquiries_breakdown' => [
                    'new' => \App\Models\CustomerInquiry::where('status', 'new')->count(),
                    'contacted' => \App\Models\CustomerInquiry::where('status', 'contacted')->count(),
                    'quoted' => \App\Models\CustomerInquiry::where('status', 'quoted')->count(),
                    'website' => \App\Models\CustomerInquiry::where('source', 'like', '%alibaton%')->orWhere('source', 'like', '%website%')->count(),
                ],
                'quotation_summary' => [
                    'total' => $quotationTotal,
                    'pending_approvals' => \App\Models\Quotation::where('status', 'under_review')->count(),
                    'approved' => \App\Models\Quotation::where('status', 'approved')->count(),
                    'sent' => \App\Models\Quotation::where('status', 'sent')->count(),
                    'accepted' => $acceptedQuotations,
                    'rejected' => \App\Models\Quotation::where('status', 'rejected')->count(),
                    'pipeline_value' => $pipelineValue,
                    'win_rate' => $winRate,
                ],
                'job_order_summary' => [
                    'total' => JobOrder::count(),
                    'registered' => JobOrder::where('status', 'registered')->count(),
                    'submitted_to_ops' => JobOrder::where('status', 'submitted')->count(),
                    'ongoing' => JobOrder::whereIn('status', ['in-progress', 'ongoing', 'confirmed', 'scheduled'])->count(),
                    'completed' => JobOrder::where('status', 'completed')->count(),
                ],
                'rental_summary' => [
                    'total_requests' => Rental::count(),
                    'active_rentals' => Rental::whereIn('status', ['active', 'confirmed', 'ongoing'])->count(),
                    'cranes_requested' => Rental::where('equipment_type', 'Crane')->orWhereNull('equipment_type')->count(),
                    'trucks_requested' => Rental::where('equipment_type', 'Truck')->count(),
                ],
                'active_projects_count' => Project::whereIn('status', ['active', 'ongoing', 'planned', 'confirmed'])->count(),
                'pending_approvals' => $pendingApprovals,
                'ai_insights' => [
                    'pipeline_health' => $winRate >= 50 ? 'Strong Conversion Rate' : 'Review Follow-up Velocity',
                    'inquiry_velocity' => \App\Models\CustomerInquiry::where('created_at', '>=', now()->subDays(7))->count() . ' new inquiries this week',
                    'operational_handoffs' => JobOrder::where('status', 'submitted')->count() . ' orders awaiting Core 2 dispatch confirmation',
                ],
            ];
        }

        // 3. Sales Business Development (SBD) Dashboard Summary (Primary Operational User)
        $sbdSummary = null;
        if ($user && ($user->isSalesBusinessDevelopment() || $user->role === 'sales_business_development')) {
            $sbdSummary = [
                'my_inquiries' => \App\Models\CustomerInquiry::where('assigned_to', $userId)->orWhereNull('assigned_to')->count(),
                'new_inquiries' => \App\Models\CustomerInquiry::where('status', 'new')->count(),
                'website_inquiries' => \App\Models\CustomerInquiry::where('source', 'like', '%alibaton%')->orWhere('source', 'like', '%website%')->count(),
                'my_quotations' => [
                    'drafts' => \App\Models\Quotation::where('created_by', $userId)->where('status', 'draft')->count(),
                    'under_review' => \App\Models\Quotation::where('created_by', $userId)->where('status', 'under_review')->count(),
                    'approved_ready_to_send' => \App\Models\Quotation::where('created_by', $userId)->where('status', 'approved')->count(),
                    'accepted_ready_for_jo' => \App\Models\Quotation::where('created_by', $userId)->where('status', 'accepted')->whereNull('job_order_id')->count(),
                ],
                'my_job_orders' => [
                    'registered' => JobOrder::where('created_by', $userId)->where('status', 'registered')->count(),
                    'submitted' => JobOrder::where('created_by', $userId)->where('status', 'submitted')->count(),
                    'ongoing' => JobOrder::where('created_by', $userId)->whereIn('status', ['in-progress', 'ongoing', 'scheduled'])->count(),
                ],
                'my_rental_requests' => Rental::whereHas('customer', fn ($q) => $q->whereNull('archived_at'))->count(),
                'active_projects' => Project::count(),
            ];
        }

        return response()->json([
            'admin_summary' => $adminSummary,
            'sales_manager_summary' => $salesManagerSummary,
            'sbd_summary' => $sbdSummary,
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
