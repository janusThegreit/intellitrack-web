<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class ActivityLogService
{
    /**
     * Log user activity with flexible parameters.
     */
    public static function log(
        ?User $user,
        string $action,
        ?string $model = null,
        ?int $modelId = null,
        ?string $description = null,
        ?array $oldValues = null,
        ?array $newValues = null
    ): ActivityLog {
        $userId = $user ? $user->id : (auth()->id() ?? User::where('role', 'administrator')->value('id') ?? 1);

        return ActivityLog::create([
            'user_id' => $userId,
            'action' => $action,
            'loggable_type' => $model,
            'loggable_id' => $modelId,
            'description' => $description,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()->ip() ?? '127.0.0.1',
            'user_agent' => request()->header('user-agent') ?? 'System/Internal',
        ]);
    }

    /**
     * Convenience helper for Authentication events.
     */
    public static function logAuth(User $user, string $action, string $description, ?array $details = null): ActivityLog
    {
        return self::log(
            $user,
            $action,
            User::class,
            $user->id,
            $description,
            null,
            $details
        );
    }

    /**
     * Convenience helper for Security and IAM events.
     */
    public static function logSecurity(string $action, string $description, ?User $user = null, ?array $details = null): ActivityLog
    {
        return self::log(
            $user,
            $action,
            'Security',
            $user?->id,
            $description,
            null,
            $details
        );
    }

    /**
     * Convenience helper for Eloquent Model mutations.
     */
    public static function logEntity(
        User $user,
        string $action,
        Model $entity,
        string $description,
        ?array $oldValues = null,
        ?array $newValues = null
    ): ActivityLog {
        return self::log(
            $user,
            $action,
            get_class($entity),
            $entity->getKey(),
            $description,
            $oldValues,
            $newValues
        );
    }

    /**
     * Get recent activities.
     */
    public static function getRecent(int $limit = 20)
    {
        return ActivityLog::with('user:id,name,email,role')
            ->latest()
            ->limit($limit)
            ->get();
    }

    /**
     * Get user activities.
     */
    public static function getUserActivities(User $user, int $limit = 50)
    {
        return ActivityLog::where('user_id', $user->id)
            ->latest()
            ->limit($limit)
            ->get();
    }
}
