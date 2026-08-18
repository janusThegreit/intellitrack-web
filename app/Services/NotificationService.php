<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Models\Rental;
use App\Models\JobOrder;
use App\Models\Project;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;

class NotificationService
{
    public function notifyRoles(array $roles, string $type, string $title, string $message, string $relatedModel, int $relatedId): void
    {
        User::whereIn('role', $roles)->where('is_active', true)->each(function (User $user) use ($type, $title, $message, $relatedModel, $relatedId) {
            $this->create($user, $type, $title, $message, $relatedModel, $relatedId);
        });
    }

    /**
     * Create notification for user
     */
    public function create(
        User $user,
        string $type,
        string $title,
        string $message,
        string $relatedModel = null,
        int $relatedId = null,
        array $data = null
    ): Notification {
        return Notification::create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'related_model' => $relatedModel,
            'related_id' => $relatedId,
            'data' => $data,
        ]);
    }

    /**
     * Create overdue rental notifications
     */
    public function notifyOverdueRentals(): void
    {
        $overdueRentals = Rental::where('status', '!=', 'completed')
            ->where('status', '!=', 'cancelled')
            ->where('rental_end_date', '<', now())
            ->get();

        foreach ($overdueRentals as $rental) {
            $managers = User::where('role', 'manager')->get();

            foreach ($managers as $manager) {
                $this->create(
                    $manager,
                    'urgent',
                    'Overdue Equipment Return',
                    "Equipment {$rental->equipment->name} for customer {$rental->customer->name} is overdue",
                    Rental::class,
                    $rental->id
                );
            }
        }
    }

    /**
     * Create upcoming deadline notifications
     */
    public function notifyUpcomingDeadlines(): void
    {
        $upcomingJobOrders = JobOrder::whereIn('status', ['pending', 'approved', 'in-progress'])
            ->where('due_date', '<=', now()->addDays(3))
            ->where('due_date', '>', now())
            ->get();

        foreach ($upcomingJobOrders as $jobOrder) {
            if ($jobOrder->assignedTo) {
                $this->create(
                    $jobOrder->assignedTo,
                    'warning',
                    'Job Order Deadline Approaching',
                    "Job Order {$jobOrder->job_order_number} is due in {$jobOrder->due_date->diffInDays()} days",
                    JobOrder::class,
                    $jobOrder->id
                );
            }
        }

        $upcomingProjects = Project::where('status', '!=', 'completed')
            ->where('deadline', '<=', now()->addDays(7))
            ->where('deadline', '>', now())
            ->get();

        foreach ($upcomingProjects as $project) {
            $this->create(
                $project->projectManager,
                'warning',
                'Project Deadline Approaching',
                "Project {$project->project_name} deadline is in {$project->deadline->diffInDays()} days",
                Project::class,
                $project->id
            );
        }
    }

    /**
     * Create equipment maintenance reminders
     */
    public function notifyMaintenanceDue(): void
    {
        $equipmentNeedingMaintenance = \App\Models\Equipment::where('status', '!=', 'maintenance')
            ->where('status', '!=', 'retired')
            ->where(function ($query) {
                $query->whereNull('last_maintenance')
                    ->orWhereDate('last_maintenance', '<=', now()->subMonths(3));
            })
            ->get();

        if ($equipmentNeedingMaintenance->count() > 0) {
            $managers = User::where('role', 'manager')->get();

            foreach ($managers as $manager) {
                $this->create(
                    $manager,
                    'info',
                    'Equipment Maintenance Due',
                    "{$equipmentNeedingMaintenance->count()} equipment items need maintenance check",
                    null,
                    null,
                    ['equipment_count' => $equipmentNeedingMaintenance->count()]
                );
            }
        }
    }

    /**
     * Get unread notifications for user
     */
    public function getUnreadNotifications(User $user, int $limit = 10): Collection
    {
        return $user->notifications()
            ->whereNull('read_at')
            ->latest()
            ->limit($limit)
            ->get();
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(Notification $notification): void
    {
        $notification->markAsRead();
    }

    /**
     * Mark all notifications as read for user
     */
    public function markAllAsRead(User $user): void
    {
        $user->notifications()
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }
}
