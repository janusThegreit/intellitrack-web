<?php

namespace IntelliTrack\Services\Notification\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;
use IntelliTrack\Services\Notification\Models\ActivityLog;
use IntelliTrack\Shared\Http\ApiResponse;

class ActivityLogController extends Controller
{
    /**
     * List activity logs.
     */
    public function index(Request $request)
    {
        $query = ActivityLog::query();

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        if ($request->filled('loggable_type')) {
            $query->where('loggable_type', $request->loggable_type);
        }

        if ($request->filled('loggable_id')) {
            $query->where('loggable_id', $request->loggable_id);
        }

        $logs = $query->latest()->paginate($request->input('per_page', 25));

        return ApiResponse::success($logs);
    }

    /**
     * Record new activity log entry.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'nullable|integer',
            'action' => 'required|string|max:100',
            'description' => 'required|string',
            'loggable_type' => 'nullable|string',
            'loggable_id' => 'nullable|integer',
            'properties' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors());
        }

        $data = $validator->validated();
        $data['user_id'] = $data['user_id'] ?? $request->header('X-User-Id');
        $data['ip_address'] = $request->ip();
        $data['user_agent'] = $request->userAgent();

        $log = ActivityLog::create($data);

        return ApiResponse::created($log, 'Activity recorded');
    }
}
