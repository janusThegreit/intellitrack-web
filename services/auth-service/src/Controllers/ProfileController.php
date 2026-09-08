<?php

namespace IntelliTrack\Services\Auth\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use IntelliTrack\Services\Auth\Models\User;
use IntelliTrack\Shared\Http\ApiResponse;

class ProfileController extends Controller
{
    /**
     * Show current user profile.
     */
    public function show(Request $request)
    {
        $userId = $request->header('X-User-Id');
        $user = User::find($userId);

        if (! $user) {
            return ApiResponse::notFound('User not found.');
        }

        return ApiResponse::success($user);
    }

    /**
     * Update current user profile.
     */
    public function update(Request $request)
    {
        $userId = $request->header('X-User-Id');
        $user = User::find($userId);

        if (! $user) {
            return ApiResponse::notFound('User not found.');
        }

        $validator = Validator::make($request->all(), [
            'name' => 'nullable|string|max:255',
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'nickname' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors());
        }

        $user->update($request->only(['name', 'first_name', 'last_name', 'nickname', 'phone']));

        return ApiResponse::success($user, 'Profile updated successfully');
    }

    /**
     * Update password.
     */
    public function updatePassword(Request $request)
    {
        $userId = $request->header('X-User-Id');
        $user = User::find($userId);

        if (! $user) {
            return ApiResponse::notFound('User not found.');
        }

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors());
        }

        if (! Hash::check($request->current_password, $user->password)) {
            return ApiResponse::error('Current password does not match.', 422, null, 'INVALID_CURRENT_PASSWORD');
        }

        $user->update(['password' => Hash::make($request->password)]);

        return ApiResponse::success(null, 'Password updated successfully');
    }

    /**
     * Update avatar.
     */
    public function updateAvatar(Request $request)
    {
        $userId = $request->header('X-User-Id');
        $user = User::find($userId);

        if (! $user) {
            return ApiResponse::notFound('User not found.');
        }

        $validator = Validator::make($request->all(), [
            'avatar_url' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors());
        }

        $user->update(['avatar_url' => $request->avatar_url]);

        return ApiResponse::success($user, 'Avatar updated successfully');
    }
}
