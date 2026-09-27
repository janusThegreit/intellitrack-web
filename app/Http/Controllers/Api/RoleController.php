<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;

class RoleController extends Controller
{
    public function index()
    {
        Gate::authorize('view-core-dashboard');

        $users = User::select(['id', 'name', 'email', 'phone', 'role', 'avatar_url', 'is_active', 'last_login_at', 'created_at'])
            ->orderBy('name')
            ->get();

        $usersByRole = $users->groupBy('role');

        $rolesDefinition = [
            [
                'key' => 'administrator',
                'value' => 'administrator',
                'name' => 'Administrator',
                'label' => 'Administrator',
                'badge' => 'System Admin',
                'tier' => 'System Administration',
                'scope' => 'User Management & IT Administration',
                'description' => 'Responsible primarily for system/user administration: user provisioning, role assignments, account activation/deactivation, and security audit monitoring.',
            ],
            [
                'key' => 'sales_manager',
                'value' => 'sales_manager',
                'name' => 'Sales Manager',
                'label' => 'Sales Manager',
                'badge' => 'Sales Management',
                'tier' => 'Commercial Management',
                'scope' => 'Quotation Approval & Commercial Oversight',
                'description' => 'Reviews and approves commercial quotations, requests revisions, monitors customer pipelines, Job Orders, rentals, projects, and utilizes AI analytics & management reporting.',
            ],
            [
                'key' => 'sales_business_development',
                'value' => 'sales_business_development',
                'name' => 'Sales Business Development (SBD)',
                'label' => 'Sales Business Development',
                'badge' => 'Primary Sales User',
                'tier' => 'Sales Operations',
                'scope' => 'Inquiry Intake, Quotations & Job Order Registration',
                'description' => 'Primary operational user for Sales & Commercial: processes customer inquiries (including Alibaton website), manages clients, drafts quotations, records rental requirements, and registers Job Orders for submission to Operations.',
            ],
        ];

        $enrichedRoles = collect($rolesDefinition)->map(function ($r) use ($usersByRole) {
            $assignedUsers = $usersByRole->get($r['key'], collect());
            $r['user_count'] = $assignedUsers->count();
            $r['active_count'] = $assignedUsers->where('is_active', true)->count();
            $r['users'] = $assignedUsers->values();
            return $r;
        });

        $recentSecurityLogs = \App\Models\ActivityLog::whereIn('action', ['role_elevation', 'status_change', 'created', 'updated'])
            ->latest()
            ->limit(8)
            ->get(['id', 'action', 'description', 'created_at', 'ip_address', 'user_id']);

        return response()->json([
            'roles' => $enrichedRoles,
            'total_users' => $users->count(),
            'total_roles' => count($rolesDefinition),
            'recent_audit_logs' => $recentSecurityLogs,
        ]);
    }

    public function updateUserRole(Request $request, User $user)
    {
        Gate::authorize('manage-users');

        $validated = $request->validate([
            'role' => ['required', 'in:administrator,sales_manager,sales_business_development,operations_technical,staff,customer'],
        ]);

        if ($user->id === auth()->id() && $validated['role'] !== 'administrator') {
            abort(422, 'You cannot remove your own administrator privileges.');
        }

        $oldRole = $user->role;
        $user->update(['role' => $validated['role']]);

        ActivityLogService::logSecurity('role_elevation', "Role for user '{$user->name}' ({$user->email}) updated from '{$oldRole}' to '{$validated['role']}'.", auth()->user(), [
            'target_user_id' => $user->id,
            'target_user_name' => $user->name,
            'old_role' => $oldRole,
            'new_role' => $validated['role'],
        ]);

        return response()->json($user);
    }

    public function users(Request $request)
    {
        Gate::authorize('manage-users');

        $query = User::query();

        // Apply filters
        if ($request->filled('search')) {
            $search = '%' . strtolower($request->input('search')) . '%';
            $query->where(function($q) use ($search) {
                $q->where(\Illuminate\Support\Facades\DB::raw('LOWER(name)'), 'like', $search)
                  ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(email)'), 'like', $search);
            });
        }
        if ($request->filled('role') && $request->input('role') !== 'all') {
            $query->where('role', $request->input('role'));
        }
        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('is_active', $request->input('status') === 'active');
        }

        $users = $query->select(['id', 'name', 'email', 'first_name', 'last_name', 'phone', 'role', 'is_active', 'last_login_at', 'created_at'])
            ->latest()
            ->paginate($request->input('per_page', 25));

        // Get Stats
        $total = User::count();
        $active = User::where('is_active', true)->count();
        $inactive = User::where('is_active', false)->count();
        $recent = User::where('created_at', '>=', now()->startOfMonth())->count();

        return response()->json([
            'users' => $users,
            'stats' => [
                'total' => $total,
                'active' => $active,
                'inactive' => $inactive,
                'recent' => $recent
            ]
        ]);
    }

    public function show(User $user)
    {
        Gate::authorize('manage-users');

        $assignedJobsCount = \App\Models\JobOrder::where('assigned_to', $user->id)->count();
        $managedProjectsCount = \App\Models\Project::where('project_manager_id', $user->id)->count();
        $assignedTasksCount = \App\Models\ProjectTask::where('assigned_to', $user->id)->count();
        $quotationsCount = \App\Models\Quotation::where('created_by', $user->id)->count();
        $activityLogsCount = \App\Models\ActivityLog::where('user_id', $user->id)->count();

        $recentLogs = \App\Models\ActivityLog::where('user_id', $user->id)
            ->latest()
            ->limit(6)
            ->get(['id', 'action', 'description', 'created_at', 'ip_address']);

        return response()->json([
            'user' => $user,
            'metrics' => [
                'assigned_jobs' => $assignedJobsCount,
                'managed_projects' => $managedProjectsCount,
                'assigned_tasks' => $assignedTasksCount,
                'quotations' => $quotationsCount,
                'activity_logs' => $activityLogsCount,
            ],
            'recent_logs' => $recentLogs,
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('manage-users');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'role' => 'required|in:administrator,sales_manager,sales_business_development,operations_technical,staff,customer',
            'password' => 'required|string|min:8',
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:30',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $validated['is_active'] = true;

        $user = User::create($validated);

        ActivityLogService::log(auth()->user(), 'created', User::class, $user->id, "New user account '{$user->name}' ({$user->email}) created with role '{$user->role}'.", null, [
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'is_active' => true,
        ]);

        return response()->json($user, 201);
    }

    public function update(Request $request, User $user)
    {
        Gate::authorize('manage-users');

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,'.$user->id,
            'role' => 'sometimes|in:administrator,sales_manager,sales_business_development,operations_technical,staff,customer',
            'password' => 'nullable|string|min:8',
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:30',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($user->id === auth()->id() && isset($validated['role']) && $validated['role'] !== 'administrator') {
            abort(422, 'You cannot remove your own administrator privileges.');
        }

        $oldValues = $user->only(['name', 'email', 'role', 'phone', 'first_name', 'last_name', 'is_active']);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        ActivityLogService::log(auth()->user(), 'updated', User::class, $user->id, "User account '{$user->name}' ({$user->email}) was updated by administrator.", $oldValues, $user->only(['name', 'email', 'role', 'phone', 'first_name', 'last_name', 'is_active']));

        return response()->json($user);
    }

    public function destroy(User $user)
    {
        Gate::authorize('manage-users');

        if ($user->id === auth()->id()) {
            abort(422, 'You cannot delete your own account.');
        }

        if ($user->isAdministrator() && User::where('role', 'administrator')->count() <= 1) {
            abort(422, 'Cannot delete the only remaining administrator.');
        }

        $deletedName = $user->name;
        $deletedEmail = $user->email;
        $deletedRole = $user->role;
        $userId = $user->id;

        $user->delete();

        ActivityLogService::log(auth()->user(), 'deleted', User::class, $userId, "User account '{$deletedName}' ({$deletedEmail}, {$deletedRole}) deleted by administrator.", [
            'deleted_user_name' => $deletedName,
            'deleted_user_email' => $deletedEmail,
            'deleted_user_role' => $deletedRole,
        ]);

        return response()->json(['message' => 'User deleted successfully']);
    }

    public function updateUserStatus(Request $request, User $user)
    {
        Gate::authorize('manage-users');

        $data = $request->validate(['is_active' => ['required', 'boolean']]);

        if ($user->id === auth()->id() && ! $data['is_active']) {
            abort(422, 'You cannot deactivate your own account.');
        }

        $statusText = $data['is_active'] ? 'activated' : 'deactivated';
        $user->update($data);

        ActivityLogService::logSecurity('status_change', "User account '{$user->name}' ({$user->email}) was {$statusText} by administrator.", auth()->user(), [
            'target_user_id' => $user->id,
            'is_active' => $data['is_active'],
        ]);

        return response()->json($user);
    }

    public function assignableStaff()
    {
        Gate::authorize('view-core-dashboard');

        $staff = User::where('is_active', true)
            ->whereIn('role', ['staff', 'operations_technical', 'sales_business_development', 'sales_manager', 'administrator'])
            ->select('id', 'name', 'email', 'role')
            ->orderBy('name')
            ->get();

        return response()->json($staff);
    }
}
