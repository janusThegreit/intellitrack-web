<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Foundation\Auth\User;

class ActivityLogService
{
    /**
     * Log user activity
     */
    public static function log(
        User $user,
        string $action,
        string $model,
        int $modelId,
        string $description = null,
        array $oldValues = null,
        array $newValues = null
    ): ActivityLog {
        return ActivityLog::create([
            'user_id' => $user->id,
            'action' => $action,
            'loggable_type' => $model,
            'loggable_id' => $modelId,
            'description' => $description,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()->ip(),
            'user_agent' => request()->header('user-agent'),
        ]);
    }

    /**
     * Get recent activities
     */
    public static function getRecent(int $limit = 20)
    {
        return ActivityLog::with('user')
            ->latest()
            ->limit($limit)
            ->get();
    }

    /**
     * Get user activities
     */
    public static function getUserActivities(User $user, int $limit = 50)
    {
        return ActivityLog::where('user_id', $user->id)
            ->latest()
            ->limit($limit)
            ->get();
    }
}
