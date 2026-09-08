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
                'badge' => 'Superadmin',
                'tier' => 'Tier 1 — Full IAM Superadmin',
                'scope' => 'Complete IAM Governance & System Oversight',
                'description' => 'Unrestricted authority across all system modules, user provisioning, emergency maintenance mode, and financial approvals.',
            ],
            [
                'key' => 'operations_technical',
                'value' => 'operations_technical',
                'name' => 'Operations & Technical Staff',
                'label' => 'Operations & Technical Staff',
                'badge' => 'Operations & Tech',
                'tier' => 'Tier 2 — Operations & Technical Authority',
                'scope' => 'Fleet Health, Crane Maintenance & Dispatch',
                'description' => 'Direct authority over tower crane status, routine and emergency maintenance logs, inspection checklists, and job order fulfillment.',
            ],
            [
                'key' => 'sales_manager',
                'value' => 'sales_manager',
                'name' => 'Sales Manager',
                'label' => 'Sales Manager',
                'badge' => 'Commercial Lead',
                'tier' => 'Tier 2 — Commercial Management Authority',
                'scope' => 'Commercial Pipelines & Quotation Approvals',
                'description' => 'Authorizes deal pricing, margin discounts, customer contracts, and oversees sales team pipeline performance.',
            ],
            [
                'key' => 'sales_business_development',
                'value' => 'sales_business_development',
                'name' => 'Sales Business Development',
                'label' => 'Sales Business Development',
                'badge' => 'Account Executive',
                'tier' => 'Tier 3 — Field Sales & Acquisition',
                'scope' => 'Client Inquiries, Lead Intake & Quotation Drafts',
                'description' => 'Captures incoming client inquiries, drafts initial equipment rental quotations, and maintains communications history.',
            ],
            [
                'key' => 'staff',
                'value' => 'staff',
                'name' => 'Operations Staff',
                'label' => 'Operations Staff',
                'badge' => 'Field Operations',
                'tier' => 'Tier 4 — Field Logistics & Support',
                'scope' => 'On-site Execution & Task Fulfillment',
                'description' => 'Handles assigned job order tasks, on-site equipment checklists, and rig mobilization/demobilization activities.',
            ],
            [
                'key' => 'customer',
                'value' => 'customer',
                'name' => 'Customer / Client Portal',
                'label' => 'Customer / Client Portal',
                'badge' => 'External Client',
                'tier' => 'Tier 5 — External Partner Portal',
                'scope' => 'Client Self-Service & Rental Visibility',
                'description' => 'External client account with view-only visibility into company-specific quotations, active job orders, and rental contracts.',
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
