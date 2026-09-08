<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AuditLogController extends Controller
{
    /**
     * Display a listing of audit logs with search, filtering, and summary metrics.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        $query = ActivityLog::with('user:id,name,email,role');

        // Text Search
        if ($request->filled('search')) {
            $search = '%' . strtolower(trim($request->input('search'))) . '%';
            $query->where(function ($q) use ($search) {
                $q->where(DB::raw('LOWER(action)'), 'like', $search)
                  ->orWhere(DB::raw('LOWER(description)'), 'like', $search)
                  ->orWhere(DB::raw('LOWER(loggable_type)'), 'like', $search)
                  ->orWhere('ip_address', 'like', $search)
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where(DB::raw('LOWER(name)'), 'like', $search)
                         ->orWhere(DB::raw('LOWER(email)'), 'like', $search);
                  });
            });
        }

        // Action Filter
        if ($request->filled('action') && $request->input('action') !== 'all') {
            $action = $request->input('action');
            if ($action === 'security') {
                $query->whereIn('action', [
                    'failed_login', 'blocked_login', 'security_alert',
                    'role_elevation', 'password_changed', 'status_change',
                    'token_revoked', 'permission_denied'
                ]);
            } elseif ($action === 'auth') {
                $query->whereIn('action', ['login', 'logout', 'failed_login', 'blocked_login', 'registered']);
            } elseif ($action === 'mutations') {
                $query->whereIn('action', ['created', 'updated', 'deleted']);
            } else {
                $query->where('action', $action);
            }
        }

        // User Filter
        if ($request->filled('user_id') && $request->input('user_id') !== 'all') {
            $query->where('user_id', $request->input('user_id'));
        }

        // Entity / Module Filter
        if ($request->filled('entity') && $request->input('entity') !== 'all') {
            $entity = $request->input('entity');
            $query->where('loggable_type', 'like', '%' . $entity . '%');
        }

        // Date Filter
        if ($request->filled('date_range')) {
            $range = $request->input('date_range');
            if ($range === 'today') {
                $query->whereDate('created_at', Carbon::today());
            } elseif ($range === '7d') {
                $query->where('created_at', '>=', Carbon::now()->subDays(7));
            } elseif ($range === '30d') {
                $query->where('created_at', '>=', Carbon::now()->subDays(30));
            }
        } elseif ($request->filled('date_from') && $request->filled('date_to')) {
            $query->whereBetween('created_at', [
                Carbon::parse($request->input('date_from'))->startOfDay(),
                Carbon::parse($request->input('date_to'))->endOfDay(),
            ]);
        }

        // Summary KPI Metrics
        $totalLogs = ActivityLog::count();
        $todayLogs = ActivityLog::whereDate('created_at', Carbon::today())->count();
        $securityEvents = ActivityLog::whereIn('action', [
            'failed_login', 'blocked_login', 'security_alert',
            'role_elevation', 'password_changed', 'status_change'
        ])->count();
        $uniqueActors = ActivityLog::distinct('user_id')->count('user_id');

        // Paginate results
        $perPage = (int) $request->input('per_page', 20);
        $logs = $query->latest('id')->paginate($perPage);

        // List of all system users for the actor filter dropdown
        $users = User::select('id', 'name', 'email', 'role')->orderBy('name')->get();

        return response()->json([
            'logs' => $logs,
            'stats' => [
                'total_logs' => $totalLogs,
                'today_logs' => $todayLogs,
                'security_events' => $securityEvents,
                'unique_actors' => $uniqueActors,
            ],
            'users' => $users,
        ]);
    }

    /**
     * Show detailed audit record including diffs.
     */
    public function show(Request $request, ActivityLog $log): JsonResponse
    {
        $this->authorizeAdmin($request);

        $log->load('user:id,name,email,role');

        return response()->json([
            'log' => $log,
        ]);
    }

    /**
     * Export audit logs to CSV.
     */
    public function export(Request $request): StreamedResponse
    {
        $this->authorizeAdmin($request);

        $query = ActivityLog::with('user:id,name,email,role');

        if ($request->filled('action') && $request->input('action') !== 'all') {
            $query->where('action', $request->input('action'));
        }
        if ($request->filled('user_id') && $request->input('user_id') !== 'all') {
            $query->where('user_id', $request->input('user_id'));
        }
        if ($request->filled('date_range')) {
            $range = $request->input('date_range');
            if ($range === 'today') {
                $query->whereDate('created_at', Carbon::today());
            } elseif ($range === '7d') {
                $query->where('created_at', '>=', Carbon::now()->subDays(7));
            } elseif ($range === '30d') {
                $query->where('created_at', '>=', Carbon::now()->subDays(30));
            }
        }

        $fileName = 'intellitrack_audit_logs_' . date('Y-m-d_His') . '.csv';

        return response()->streamDownload(function () use ($query) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'Log ID',
                'Timestamp (UTC)',
                'Actor Name',
                'Actor Email',
                'Actor Role',
                'Action',
                'Entity Target',
                'Entity ID',
                'Description',
                'IP Address',
                'User Agent',
            ]);

            $query->latest('id')->chunk(200, function ($logs) use ($handle) {
                foreach ($logs as $log) {
                    $entityName = $log->loggable_type ? class_basename($log->loggable_type) : 'System';
                    fputcsv($handle, [
                        $log->id,
                        $log->created_at?->toIso8601String() ?? '',
                        $log->user?->name ?? 'System',
                        $log->user?->email ?? 'system@intellitrack.local',
                        $log->user?->role ?? 'system',
                        $log->action,
                        $entityName,
                        $log->loggable_id ?? 'N/A',
                        $log->description,
                        $log->ip_address,
                        $log->user_agent,
                    ]);
                }
            });

            fclose($handle);
        }, $fileName, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
        ]);
    }

    /**
     * Ensure current user has administrator role.
     */
    private function authorizeAdmin(Request $request): void
    {
        $user = $request->user();
        if (! $user || $user->role !== 'administrator') {
            abort(403, 'Access denied. Security audit trails are restricted to system administrators.');
        }
    }
}
