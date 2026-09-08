<?php

namespace IntelliTrack\Services\Auth\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use IntelliTrack\Services\Auth\Models\User;
use IntelliTrack\Shared\Http\ApiResponse;

class UserController extends Controller
{
    /**
     * List all users.
     */
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('name')->paginate($request->input('per_page', 25));

        return ApiResponse::success($users);
    }

    /**
     * Show single user.
     */
    public function show($id)
    {
        $user = User::find($id);
        if (! $user) {
            return ApiResponse::notFound('User not found.');
        }

        return ApiResponse::success($user);
    }

    /**
     * Create user (Admin).
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|string|in:administrator,sales_manager,sales_business_development,staff,customer',
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors());
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'phone' => $request->phone,
            'is_active' => true,
        ]);

        return ApiResponse::created($user, 'User created successfully');
    }

    /**
     * Update user.
     */
    public function update(Request $request, $id)
    {
        $user = User::find($id);
        if (! $user) {
            return ApiResponse::notFound('User not found.');
        }

        $validator = Validator::make($request->all(), [
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|string|email|max:255|unique:users,email,' . $id,
            'role' => 'nullable|string|in:administrator,sales_manager,sales_business_development,staff,customer',
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:8',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors());
        }

        $data = $request->only(['name', 'email', 'role', 'first_name', 'last_name', 'phone']);
        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return ApiResponse::success($user, 'User updated successfully');
    }

    /**
     * Update user role.
     */
    public function updateUserRole(Request $request, $id)
    {
        $user = User::find($id);
        if (! $user) {
            return ApiResponse::notFound('User not found.');
        }

        $validator = Validator::make($request->all(), [
            'role' => 'required|string|in:administrator,sales_manager,sales_business_development,staff,customer',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors());
        }

        $user->update(['role' => $request->role]);

        return ApiResponse::success($user, 'User role updated successfully');
    }

    /**
     * Update user status (activate/deactivate).
     */
    public function updateUserStatus(Request $request, $id)
    {
        $user = User::find($id);
        if (! $user) {
            return ApiResponse::notFound('User not found.');
        }

        $validator = Validator::make($request->all(), [
            'is_active' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors());
        }

        $user->update(['is_active' => $request->is_active]);

        return ApiResponse::success($user, 'User status updated successfully');
    }

    /**
     * Delete user.
     */
    public function destroy($id)
    {
        $user = User::find($id);
        if (! $user) {
            return ApiResponse::notFound('User not found.');
        }

        $user->delete();

        return ApiResponse::success(null, 'User deleted successfully');
    }
}
