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

class DashboardController extends Controller
{
    /**
     * Get dashboard summary
     */
    public function summary()
    {
        $userId = auth()->id();

        return response()->json([
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
        ]);
    }

    /**
     * Get recent activities
     */
    public function recentActivities(Request $request)
    {
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
