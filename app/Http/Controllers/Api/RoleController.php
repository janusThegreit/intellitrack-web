<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class RoleController extends Controller
{
    public function index()
    {
        return response()->json([
            'roles' => [
                ['value' => 'administrator', 'label' => 'Administrator'],
                ['value' => 'sales_manager', 'label' => 'Sales Manager'],
                ['value' => 'sales_business_development', 'label' => 'Sales Business Development'],
            ],
        ]);
    }

    public function updateUserRole(Request $request, User $user)
    {
        Gate::authorize('manage-users');

        $validated = $request->validate([
            'role' => ['required', 'in:administrator,sales_manager,sales_business_development,staff,customer'],
        ]);

        $user->update(['role' => $validated['role']]);

        return response()->json($user);
    }

    public function users()
    {
        Gate::authorize('manage-users');

        $query = User::query();

        // Apply filters if needed
        if (request('search')) {
            $query->where(function($q) {
                $q->where('name', 'ilike', '%' . request('search') . '%')
                  ->orWhere('email', 'ilike', '%' . request('search') . '%');
            });
        }
        if (request('role') && request('role') !== 'all') {
            $query->where('role', request('role'));
        }
        if (request('status') && request('status') !== 'all') {
            $query->where('is_active', request('status') === 'active');
        }

        $users = $query->select(['id', 'name', 'email', 'role', 'is_active', 'last_login_at', 'created_at'])
            ->latest()
            ->paginate(25);

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

    public function store(Request $request)
    {
        Gate::authorize('manage-users');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'role' => 'required|in:administrator,sales_manager,sales_business_development,staff,customer',
            'password' => 'required|string|min:8',
        ]);

        $validated['password'] = \Illuminate\Support\Facades\Hash::make($validated['password']);
        $validated['is_active'] = true;

        $user = User::create($validated);

        return response()->json($user, 201);
    }

    public function update(Request $request, User $user)
    {
        Gate::authorize('manage-users');

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,'.$user->id,
            'role' => 'sometimes|in:administrator,sales_manager,sales_business_development,staff,customer',
            'password' => 'nullable|string|min:8',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = \Illuminate\Support\Facades\Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return response()->json($user);
    }

    public function destroy(User $user)
    {
        Gate::authorize('manage-users');

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

    public function updateUserStatus(Request $request, User $user)
    {
        Gate::authorize('manage-users');

        $data = $request->validate(['is_active' => ['required', 'boolean']]);
        $user->update($data);

        return response()->json($user);
    }
}
