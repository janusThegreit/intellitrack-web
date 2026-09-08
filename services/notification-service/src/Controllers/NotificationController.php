<?php

namespace IntelliTrack\Services\Notification\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;
use IntelliTrack\Services\Notification\Models\Notification;
use IntelliTrack\Shared\Http\ApiResponse;

class NotificationController extends Controller
{
    /**
     * Get user notifications.
     */
    public function index(Request $request)
    {
        $userId = (int) $request->header('X-User-Id', 1);
        $unreadOnly = $request->boolean('unread_only', false);

        $query = Notification::where('user_id', $userId);

        if ($unreadOnly) {
            $query->whereNull('read_at');
        }

        $notifications = $query->latest()->paginate($request->input('per_page', 20));

        return ApiResponse::success($notifications);
    }

    /**
     * Dispatch notification to user.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|integer',
            'type' => 'required|string|in:info,success,warning,danger',
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'notifiable_type' => 'nullable|string',
            'notifiable_id' => 'nullable|integer',
            'data' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors());
        }

        $notification = Notification::create($validator->validated());

        return ApiResponse::created($notification, 'Notification sent');
    }

    /**
     * Mark single notification as read.
     */
    public function markAsRead(Request $request, $id)
    {
        $userId = (int) $request->header('X-User-Id', 1);
        $notification = Notification::where('user_id', $userId)->find($id);

        if (! $notification) {
            return ApiResponse::notFound('Notification not found.');
        }

        $notification->markAsRead();

        return ApiResponse::success($notification, 'Notification marked as read');
    }

    /**
     * Mark all notifications as read for the user.
     */
    public function markAllAsRead(Request $request)
    {
        $userId = (int) $request->header('X-User-Id', 1);
        Notification::where('user_id', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return ApiResponse::success(null, 'All notifications marked as read');
    }
}
