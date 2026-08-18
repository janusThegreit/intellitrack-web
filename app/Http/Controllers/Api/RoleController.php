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

        return response()->json(User::query()->select(['id', 'name', 'email', 'role', 'is_active', 'last_login_at', 'created_at'])->latest()->paginate(25));
    }

    public function updateUserStatus(Request $request, User $user)
    {
        Gate::authorize('manage-users');

        $data = $request->validate(['is_active' => ['required', 'boolean']]);
        $user->update($data);

        return response()->json($user);
    }
}
