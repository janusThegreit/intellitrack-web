<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\Client\Response as HttpResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Http;

class RoleController extends Controller
{
    public function index()
    {
        Gate::authorize('manage-users');

        $users = User::select([
            'id',
            'name',
            'email',
            'phone',
            'role',
            'avatar_url',
            'is_active',
            'last_login_at',
            'created_at',
        ])
            ->orderBy('name')
            ->get();

        $usersByRole = $users->groupBy(
            fn (User $user) => $user->canonicalRole()
        );

        $rolesDefinition = [
            [
                'key' => 'super_admin',
                'value' => 'super_admin',
                'name' => 'Super Admin',
                'label' => 'Super Admin',
                'badge' => 'System Owner',
                'tier' => 'Tier 1 — Full System Authority',
                'scope' => 'Complete IAM Governance & System Oversight',
                'description' => 'Unrestricted authority across all system modules, user provisioning, emergency maintenance mode, and platform administration.',
            ],
            [
                'key' => 'admin',
                'value' => 'admin',
                'name' => 'Admin',
                'label' => 'Admin',
                'badge' => 'Administrative Access',
                'tier' => 'Tier 2 — Administrative Management',
                'scope' => 'System Administration & Core Controls',
                'description' => 'Responsible primarily for system/user administration: user provisioning, role assignments, account activation/deactivation, and security audit monitoring.',
            ],
            [
                'key' => 'sales_manager',
                'value' => 'sales_manager',
                'name' => 'Sales Manager',
                'label' => 'Sales Manager',
                'badge' => 'Sales Management',
                'tier' => 'Tier 3 — Commercial Management',
                'scope' => 'Quotation Approval & Commercial Oversight',
                'description' => 'Reviews and approves commercial quotations, requests revisions, monitors customer pipelines, Job Orders, rentals, projects, and utilizes AI analytics and management reporting.',
            ],
            [
                'key' => 'sales_business_development',
                'value' => 'sales_business_development',
                'name' => 'Sales Business Development (SBD)',
                'label' => 'Sales Business Development',
                'badge' => 'Primary Sales User',
                'tier' => 'Tier 4 — Sales Operations',
                'scope' => 'Inquiry Intake, Quotations & Job Order Registration',
                'description' => 'Primary operational user for Sales & Commercial: processes customer inquiries, manages clients, drafts quotations, records rental requirements, and registers Job Orders for submission to Operations.',
            ],
            [
                'key' => 'client',
                'value' => 'client',
                'name' => 'Client',
                'label' => 'Client',
                'badge' => 'External Client',
                'tier' => 'External Role — Client Portal',
                'scope' => 'Client Self-Service & Own Records',
                'description' => 'External client account with access to company-specific inquiries, quotations, Job Orders, rentals, projects, documents, and other permitted client portal functions.',
            ],
        ];

        $enrichedRoles = collect($rolesDefinition)->map(
            function ($role) use ($usersByRole) {
                $assignedUsers = $usersByRole->get(
                    $role['key'],
                    collect()
                );

                $role['user_count'] = $assignedUsers->count();
                $role['active_count'] = $assignedUsers
                    ->where('is_active', true)
                    ->count();
                $role['users'] = $assignedUsers->values();

                return $role;
            }
        );

        $recentSecurityLogs = \App\Models\ActivityLog::whereIn(
            'action',
            [
                'role_elevation',
                'status_change',
                'created',
                'updated',
            ]
        )
            ->latest()
            ->limit(8)
            ->get([
                'id',
                'action',
                'description',
                'created_at',
                'ip_address',
                'user_id',
            ]);

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

        $this->authorizeTargetUser($user);
        $this->authorizeAuthServiceLink($user);

        $validated = $request->validate([
            'role' => [
                'required',
                'in:' . implode(',', $this->supportedRoles()),
            ],
        ]);

        $this->authorizeRoleAssignment($validated['role']);

        if (
            $user->id === auth()->id()
            && $validated['role'] !== $user->role
        ) {
            abort(
                422,
                'You cannot remove your own administrative privileges.'
            );
        }

        $oldRole = $user->role;

        $response = $this->authServiceRequest(
            'PUT',
            '/api/users/' . $user->auth_user_id . '/role',
            [
                'role' => $validated['role'],
            ]
        );

        if (!$response->successful()) {
            return $this->authServiceError($response);
        }

        $this->syncGatewayUser(
            $user,
            $response->json('data')
        );

        ActivityLogService::logSecurity(
            'role_elevation',
            "Role for user '{$user->name}' ({$user->email}) updated from '{$oldRole}' to '{$validated['role']}'.",
            auth()->user(),
            [
                'target_user_id' => $user->id,
                'target_user_name' => $user->name,
                'old_role' => $oldRole,
                'new_role' => $validated['role'],
            ]
        );

        return response()->json($user);
    }

    public function users(Request $request)
    {
        Gate::authorize('manage-users');

        $query = User::query();

        if ($request->filled('search')) {
            $search = '%' . strtolower(
                $request->input('search')
            ) . '%';

            $query->where(function ($q) use ($search) {
                $q->where(
                    \Illuminate\Support\Facades\DB::raw('LOWER(name)'),
                    'like',
                    $search
                )
                ->orWhere(
                    \Illuminate\Support\Facades\DB::raw('LOWER(email)'),
                    'like',
                    $search
                )
                ->orWhere(
                    \Illuminate\Support\Facades\DB::raw(
                        "LOWER(COALESCE(nickname, ''))"
                    ),
                    'like',
                    $search
                )
                ->orWhere(
                    \Illuminate\Support\Facades\DB::raw(
                        "LOWER(COALESCE(first_name, ''))"
                    ),
                    'like',
                    $search
                )
                ->orWhere(
                    \Illuminate\Support\Facades\DB::raw(
                        "LOWER(COALESCE(last_name, ''))"
                    ),
                    'like',
                    $search
                )
                ->orWhere(
                    \Illuminate\Support\Facades\DB::raw(
                        "LOWER(COALESCE(phone, ''))"
                    ),
                    'like',
                    $search
                );
            });
        }

        if (
            $request->filled('role')
            && $request->input('role') !== 'all'
        ) {
            $query->whereIn(
                'role',
                $this->roleAliasesFor(
                    $request->input('role')
                )
            );
        }

        if (
            $request->filled('status')
            && $request->input('status') !== 'all'
        ) {
            $query->where(
                'is_active',
                $request->input('status') === 'active'
            );
        }

        $users = $query
            ->select([
                'id',
                'name',
                'email',
                'first_name',
                'last_name',
                'phone',
                'role',
                'is_active',
                'last_login_at',
                'created_at',
            ])
            ->latest()
            ->paginate(
                $request->input('per_page', 25)
            );

        $total = User::count();
        $active = User::where('is_active', true)->count();
        $inactive = User::where('is_active', false)->count();

        $recent = User::where(
            'created_at',
            '>=',
            now()->startOfMonth()
        )->count();

        return response()->json([
            'users' => $users,
            'stats' => [
                'total' => $total,
                'active' => $active,
                'inactive' => $inactive,
                'recent' => $recent,
            ],
        ]);
    }

    public function show(User $user)
    {
        Gate::authorize('manage-users');

        $this->authorizeTargetUser($user);

        $assignedJobsCount = \App\Models\JobOrder::where(
            'assigned_to',
            $user->id
        )->count();

        $managedProjectsCount = \App\Models\Project::where(
            'project_manager_id',
            $user->id
        )->count();

        $assignedTasksCount = \App\Models\ProjectTask::where(
            'assigned_to',
            $user->id
        )->count();

        $quotationsCount = \App\Models\Quotation::where(
            'created_by',
            $user->id
        )->count();

        $activityLogsCount = \App\Models\ActivityLog::where(
            'user_id',
            $user->id
        )->count();

        $recentLogs = \App\Models\ActivityLog::where(
            'user_id',
            $user->id
        )
            ->latest()
            ->limit(6)
            ->get([
                'id',
                'action',
                'description',
                'created_at',
                'ip_address',
            ]);

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
            'role' => 'required|in:' .
                implode(',', $this->supportedRoles()),
            'password' => 'required|string|min:8',
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:30',
        ]);

        $this->authorizeRoleAssignment(
            $validated['role']
        );

        $response = $this->authServiceRequest(
            'POST',
            '/api/users',
            $validated
        );

        if (!$response->successful()) {
            return $this->authServiceError($response);
        }

        $authUser = $response->json('data');

        $user = $this->syncGatewayUser(
            null,
            $authUser
        );

        ActivityLogService::log(
            auth()->user(),
            'created',
            User::class,
            $user->id,
            "New user account '{$user->name}' ({$user->email}) created with role '{$user->role}'.",
            null,
            [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'is_active' => true,
            ]
        );

        return response()->json(
            $user,
            201
        );
    }

    public function update(Request $request, User $user)
    {
        Gate::authorize('manage-users');

        $this->authorizeTargetUser($user);
        $this->authorizeAuthServiceLink($user);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
            'role' => 'sometimes|in:' .
                implode(',', $this->supportedRoles()),
            'password' => 'nullable|string|min:8',
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:30',
            'is_active' => 'sometimes|boolean',
        ]);

        if (isset($validated['role'])) {
            $this->authorizeRoleAssignment(
                $validated['role']
            );
        }

        if (
            $user->id === auth()->id()
            && isset($validated['role'])
            && $validated['role'] !== $user->role
        ) {
            abort(
                422,
                'You cannot remove your own administrator privileges.'
            );
        }

        $newStatus = $validated['is_active'] ?? null;

        unset($validated['is_active']);

        if (
            $user->id === auth()->id()
            && $newStatus === false
        ) {
            abort(
                422,
                'You cannot deactivate your own account.'
            );
        }

        $oldValues = $user->only([
            'name',
            'email',
            'role',
            'phone',
            'first_name',
            'last_name',
            'is_active',
        ]);

        $response = $this->authServiceRequest(
            'PUT',
            '/api/users/' . $user->auth_user_id,
            $validated
        );

        if (!$response->successful()) {
            return $this->authServiceError($response);
        }

        $authUser = $response->json('data');

        if (
            $newStatus !== null
            && $newStatus !== $user->is_active
        ) {
            $statusResponse = $this->authServiceRequest(
                'PATCH',
                '/api/users/' . $user->auth_user_id . '/status',
                [
                    'is_active' => $newStatus,
                ]
            );

            if (!$statusResponse->successful()) {
                return $this->authServiceError(
                    $statusResponse
                );
            }

            $authUser = $statusResponse->json('data');
        }

        $this->syncGatewayUser(
            $user,
            $authUser
        );

        ActivityLogService::log(
            auth()->user(),
            'updated',
            User::class,
            $user->id,
            "User account '{$user->name}' ({$user->email}) was updated by administrator.",
            $oldValues,
            $user->only([
                'name',
                'email',
                'role',
                'phone',
                'first_name',
                'last_name',
                'is_active',
            ])
        );

        return response()->json($user);
    }

    public function destroy(User $user)
    {
        Gate::authorize('manage-users');

        $this->authorizeTargetUser($user);
        $this->authorizeAuthServiceLink($user);

        if ($user->id === auth()->id()) {
            abort(
                422,
                'You cannot delete your own account.'
            );
        }

        if (
            $user->isAdministrator()
            && User::whereIn(
                'role',
                [
                    'super_admin',
                    'admin',
                    'administrator',
                ]
            )->count() <= 1
        ) {
            abort(
                422,
                'Cannot delete the only remaining administrator.'
            );
        }

        $deletedName = $user->name;
        $deletedEmail = $user->email;
        $deletedRole = $user->role;
        $userId = $user->id;

        $response = $this->authServiceRequest(
            'DELETE',
            '/api/users/' . $user->auth_user_id
        );

        if (!$response->successful()) {
            return $this->authServiceError($response);
        }

        $user->delete();

        ActivityLogService::log(
            auth()->user(),
            'deleted',
            User::class,
            $userId,
            "User account '{$deletedName}' ({$deletedEmail}, {$deletedRole}) deleted by administrator.",
            [
                'deleted_user_name' => $deletedName,
                'deleted_user_email' => $deletedEmail,
                'deleted_user_role' => $deletedRole,
            ]
        );

        return response()->json([
            'message' => 'User deleted successfully',
        ]);
    }

    public function updateUserStatus(
        Request $request,
        User $user
    ) {
        Gate::authorize('manage-users');

        $this->authorizeTargetUser($user);
        $this->authorizeAuthServiceLink($user);

        $data = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        if (
            $user->id === auth()->id()
            && !$data['is_active']
        ) {
            abort(
                422,
                'You cannot deactivate your own account.'
            );
        }

        $statusText = $data['is_active']
            ? 'activated'
            : 'deactivated';

        $response = $this->authServiceRequest(
            'PATCH',
            '/api/users/' . $user->auth_user_id . '/status',
            $data
        );

        if (!$response->successful()) {
            return $this->authServiceError($response);
        }

        $this->syncGatewayUser(
            $user,
            $response->json('data')
        );

        ActivityLogService::logSecurity(
            'status_change',
            "User account '{$user->name}' ({$user->email}) was {$statusText} by administrator.",
            auth()->user(),
            [
                'target_user_id' => $user->id,
                'is_active' => $data['is_active'],
            ]
        );

        return response()->json($user);
    }

    public function assignableStaff()
    {
        Gate::authorize('manage-job-orders');

        $staff = User::where(
            'is_active',
            true
        )
            ->whereIn(
                'role',
                [
                    'staff',
                    'operations_technical',
                    'sales_business_development',
                    'sales_manager',
                    'admin',
                    'administrator',
                ]
            )
            ->select(
                'id',
                'name',
                'email',
                'role'
            )
            ->orderBy('name')
            ->get();

        return response()->json($staff);
    }

    public function revokeSessions(
        Request $request,
        User $user
    ) {
        Gate::authorize('manage-users');

        $user->forceFill([
            'remember_token' => \Illuminate\Support\Str::random(60),
            'two_factor_attempts' => 0,
        ])->save();

        ActivityLogService::logSecurity(
            'session_revocation',
            "Active sessions and authorization tokens for user '{$user->name}' ({$user->email}) were revoked by administrator.",
            auth()->user(),
            [
                'target_user_id' => $user->id,
                'revoked_at' => now()->toIso8601String(),
            ]
        );

        return response()->json([
            'message' => "All active sessions for {$user->name} have been revoked.",
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    public function resetMfa(
        Request $request,
        User $user
    ) {
        Gate::authorize('manage-users');

        $user->forceFill([
            'two_factor_code' => null,
            'two_factor_expires_at' => null,
            'two_factor_attempts' => 0,
        ])->save();

        ActivityLogService::logSecurity(
            'mfa_reset',
            "Two-factor authentication challenges for user '{$user->name}' ({$user->email}) were reset by administrator.",
            auth()->user(),
            [
                'target_user_id' => $user->id,
                'reset_at' => now()->toIso8601String(),
            ]
        );

        return response()->json([
            'message' => "2FA challenge reset successfully for {$user->name}. Next login will require verification.",
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    private function authorizeTargetUser(User $target): void
    {
        if (
            $target->isSuperAdmin()
            && !auth()->user()->isSuperAdmin()
        ) {
            abort(
                403,
                'Only a Super Admin can manage a Super Admin account.'
            );
        }
    }

    private function authorizeRoleAssignment(
        string $role
    ): void {
        if (
            $role === 'super_admin'
            && !auth()->user()->isSuperAdmin()
        ) {
            abort(
                403,
                'Only a Super Admin can assign the Super Admin role.'
            );
        }
    }

    private function supportedRoles(): array
    {
        return [
            'super_admin',
            'admin',
            'administrator',
            'sales_manager',
            'manager',
            'sales_business_development',
            'sales_bd',
            'client',
            'customer',
            'operations_technical',
            'operations_staff',
            'technical_staff',
            'staff',
        ];
    }

    private function roleAliasesFor(
        string $role
    ): array {
        return match (User::canonicalRoleFor($role)) {
            'super_admin' => [
                'super_admin',
            ],

            'admin' => [
                'admin',
                'administrator',
            ],

            'sales_manager' => [
                'sales_manager',
                'manager',
            ],

            'sales_business_development' => [
                'sales_business_development',
                'sales_bd',
                'operations_technical',
                'operations_staff',
                'technical_staff',
                'staff',
            ],

            'client' => [
                'client',
                'customer',
            ],

            default => [
                $role,
            ],
        };
    }

    private function authorizeAuthServiceLink(
        User $user
    ): void {
        if (!$user->auth_user_id) {
            abort(
                422,
                'This account is not linked to the Auth Service and cannot be managed here.'
            );
        }
    }

    private function authServiceRequest(
        string $method,
        string $path,
        array $payload = []
    ): HttpResponse {
        try {
            return Http::timeout(5)
                ->acceptJson()
                ->withHeader(
                    'X-Service-Token',
                    config(
                        'services.microservices.internal_secret'
                    )
                )
                ->send(
                    $method,
                    rtrim(
                        config(
                            'gateway.services.auth.base_url'
                        ),
                        '/'
                    ) . $path,
                    $payload === []
                        ? []
                        : ['json' => $payload],
                );
        } catch (
            \Illuminate\Http\Client\ConnectionException $exception
        ) {
            report($exception);

            abort(
                502,
                'Authentication service is currently unavailable. Please try again later.'
            );
        }
    }

    private function authServiceError(
        HttpResponse $response
    ) {
        if (
            $response->status() === 422
            || $response->status() === 404
            || $response->status() === 409
        ) {
            return response()->json(
                $response->json(),
                $response->status()
            );
        }

        report(
            new \RuntimeException(
                'Auth Service IAM request returned HTTP ' .
                $response->status()
            )
        );

        return response()->json([
            'message' =>
                'Authentication service is currently unavailable. Please try again later.',
        ], 502);
    }

    private function syncGatewayUser(
        ?User $user,
        mixed $authUser
    ): User {
        if (
            !is_array($authUser)
            || !is_numeric($authUser['id'] ?? null)
            || (int) $authUser['id'] < 1
            || !filter_var(
                $authUser['email'] ?? null,
                FILTER_VALIDATE_EMAIL
            )
            || !is_string($authUser['role'] ?? null)
            || !array_key_exists(
                'is_active',
                $authUser
            )
            || !is_bool(
                $authUser['is_active']
            )
        ) {
            report(
                new \RuntimeException(
                    'Auth Service returned an invalid IAM user response.'
                )
            );

            abort(
                502,
                'Unable to synchronize the account from the Authentication Service.'
            );
        }

        $user ??=
            User::where(
                'auth_user_id',
                (int) $authUser['id']
            )->first()
            ?? User::where(
                'email',
                $authUser['email']
            )->first()
            ?? new User();

        $user->forceFill([
            'auth_user_id' => (int) $authUser['id'],
            'name' => $authUser['name']
                ?? trim(
                    ($authUser['first_name'] ?? '')
                    . ' '
                    . ($authUser['last_name'] ?? '')
                ),
            'email' => $authUser['email'],
            'first_name' => $authUser['first_name'] ?? null,
            'last_name' => $authUser['last_name'] ?? null,
            'phone' => $authUser['phone'] ?? null,
            'role' => $authUser['role'],
            'client_id' => $authUser['client_id'] ?? null,
            'is_active' => $authUser['is_active'],
            'last_login_at' => $authUser['last_login_at'] ?? null,
            'password' => null,
        ])->save();

        return $user;
    }
}