<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\PasswordResetRequest;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetRequestController extends Controller
{
    /**
     * Public: User requests a password reset from the administrator.
     */
    public function submitRequest(Request $request, NotificationService $notificationService): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'No account was found with the specified work email address.',
            ], 404);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Your account is deactivated. Please contact your system administrator directly.',
            ], 403);
        }

        // Check if an active, unused request is already pending or has an active unexpired link
        $existing = PasswordResetRequest::where('user_id', $user->id)
            ->where('is_used', false)
            ->whereIn('status', ['pending', 'approved'])
            ->where(function ($query) {
                $query->whereNull('token_expires_at')
                      ->orWhere('token_expires_at', '>', now());
            })
            ->latest()
            ->first();

        if ($existing) {
            if ($existing->status === 'approved' && !empty($existing->token)) {
                return response()->json([
                    'success' => true,
                    'already_exists' => true,
                    'message' => 'An active, one-time reset link has already been authorized by your administrator. Please contact your administrator to receive your link.',
                ]);
            }

            return response()->json([
                'success' => true,
                'already_exists' => true,
                'message' => 'A password reset request is already pending review with the System Administrator. Please wait for them to generate your link.',
            ]);
        }

        // Create new request
        $resetRequest = PasswordResetRequest::create([
            'user_id' => $user->id,
            'email' => $user->email,
            'reason' => $validated['reason'] ?? 'User requested password reset from login portal.',
            'status' => 'pending',
            'requested_at' => now(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        // Inform all Administrator role users via NotificationService
        $notificationService->notifyRoles(
            ['administrator'],
            'urgent',
            'Password Reset Requested: ' . $user->name,
            "User '{$user->name}' ({$user->email}) has requested a password reset. Open User Management to generate a secure one-time link.",
            PasswordResetRequest::class,
            $resetRequest->id,
            [
                'request_id' => $resetRequest->id,
                'email' => $user->email,
                'user_name' => $user->name,
                'role' => $user->role,
                'requested_at' => now()->toIso8601String(),
                'action_url' => '/users',
            ]
        );

        // Security Activity Logging
        ActivityLogService::logSecurity(
            'password_reset_request',
            "User '{$user->name}' ({$user->email}) submitted a password reset request awaiting administrator link generation.",
            $user,
            [
                'request_id' => $resetRequest->id,
                'ip' => $request->ip(),
                'reason' => $validated['reason'] ?? null,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Password reset request submitted successfully! An administrator has been notified. They will generate and provide you with a secure, one-time reset link.',
        ]);
    }

    /**
     * Admin: List all password reset requests.
     */
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('manage-users');

        // Automatically update expired requests that were not used
        PasswordResetRequest::where('status', 'approved')
            ->where('is_used', false)
            ->whereNotNull('token_expires_at')
            ->where('token_expires_at', '<', now())
            ->update(['status' => 'expired']);

        $requests = PasswordResetRequest::with([
                'user:id,name,email,role,avatar_url,is_active',
                'approvedBy:id,name,email'
            ])
            ->latest('requested_at')
            ->get();

        $stats = [
            'total' => $requests->count(),
            'pending' => $requests->where('status', 'pending')->count(),
            'approved' => $requests->where('status', 'approved')->where('is_used', false)->count(),
            'used' => $requests->where('is_used', true)->count(),
        ];

        return response()->json([
            'requests' => $requests,
            'stats' => $stats,
        ]);
    }

    /**
     * Admin: Generate a single-use password reset link for a request.
     */
    public function generateLink(Request $request, PasswordResetRequest $passwordResetRequest): JsonResponse
    {
        Gate::authorize('manage-users');

        if ($passwordResetRequest->is_used) {
            return response()->json([
                'success' => false,
                'message' => 'This request has already been used and cannot be regenerated. The user must submit a new request.',
            ], 422);
        }

        // Generate a 64-character cryptographically secure token
        $token = Str::random(64);

        $passwordResetRequest->update([
            'token' => $token,
            'token_expires_at' => now()->addHours(24),
            'status' => 'approved',
            'approved_by' => auth()->id(),
        ]);

        $resetUrl = url('/reset-password/' . $token);

        ActivityLogService::logSecurity(
            'password_reset_link_generated',
            "Administrator generated one-time reset link for '{$passwordResetRequest->email}'.",
            auth()->user(),
            [
                'request_id' => $passwordResetRequest->id,
                'target_email' => $passwordResetRequest->email,
                'expires_at' => $passwordResetRequest->token_expires_at->toIso8601String(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'One-time password reset link generated successfully!',
            'token' => $token,
            'reset_url' => $resetUrl,
            'expires_at' => $passwordResetRequest->token_expires_at->toIso8601String(),
            'request' => $passwordResetRequest->fresh(['user', 'approvedBy']),
        ]);
    }

    /**
     * Admin: Reject / Cancel a password reset request.
     */
    public function reject(Request $request, PasswordResetRequest $passwordResetRequest): JsonResponse
    {
        Gate::authorize('manage-users');

        if ($passwordResetRequest->is_used) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot reject a request that has already been completed.',
            ], 422);
        }

        $passwordResetRequest->update([
            'status' => 'rejected',
            'token' => null,
        ]);

        ActivityLogService::logSecurity(
            'password_reset_request_rejected',
            "Administrator rejected password reset request for '{$passwordResetRequest->email}'.",
            auth()->user(),
            ['request_id' => $passwordResetRequest->id]
        );

        return response()->json([
            'success' => true,
            'message' => 'Password reset request has been rejected.',
            'request' => $passwordResetRequest->fresh(['user', 'approvedBy']),
        ]);
    }

    /**
     * Public: Show the one-time reset password page.
     */
    public function showResetForm(string $token): Response
    {
        $resetRequest = PasswordResetRequest::where('token', $token)->with('user')->first();

        // Check if token doesn't exist at all
        if (!$resetRequest) {
            return Inertia::render('Auth/ResetPassword', [
                'tokenStatus' => 'invalid',
                'message' => 'This password reset link is invalid or does not exist. Please request a new reset link from your administrator.',
            ]);
        }

        // Check if this single-use link was ALREADY used
        if ($resetRequest->is_used) {
            return Inertia::render('Auth/ResetPassword', [
                'tokenStatus' => 'already_used',
                'message' => 'This one-time password reset link has already been used and cannot be reused. As an enterprise security safeguard, each link expires immediately after use. If you need to reset your password again, please submit a brand new request to your administrator.',
                'usedAt' => $resetRequest->used_at?->diffForHumans(),
            ]);
        }

        // Check if link has expired
        if ($resetRequest->isExpired()) {
            return Inertia::render('Auth/ResetPassword', [
                'tokenStatus' => 'expired',
                'message' => 'This one-time password reset link has expired (24-hour limit exceeded). Please submit a new request to your administrator.',
            ]);
        }

        // Token is valid and ready for single-use
        return Inertia::render('Auth/ResetPassword', [
            'tokenStatus' => 'valid',
            'token' => $token,
            'email' => $resetRequest->email,
            'userName' => $resetRequest->user->name,
            'expiresAt' => $resetRequest->token_expires_at?->toIso8601String(),
        ]);
    }

    /**
     * Public: Execute the one-time password reset and permanently deactivate the link.
     */
    public function resetPassword(Request $request): RedirectResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
            'password' => [
                'required',
                'string',
                'confirmed',
                Password::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
            ],
        ]);

        $resetRequest = PasswordResetRequest::where('token', $request->token)->first();

        if (!$resetRequest) {
            return back()->withErrors([
                'password' => 'Invalid or unrecognized reset token.',
            ]);
        }

        // CRITICAL CHECK: Has it already been used?
        if ($resetRequest->is_used) {
            return back()->withErrors([
                'password' => 'This one-time reset link has already been used and is permanently inactive. Please submit a new request to your administrator.',
            ]);
        }

        // Check if expired
        if ($resetRequest->isExpired()) {
            return back()->withErrors([
                'password' => 'This reset link has expired. Please submit a new request to your administrator.',
            ]);
        }

        $user = $resetRequest->user;

        // Update user password
        $user->password = Hash::make($request->password);
        $user->save();

        // IMMEDIATELY BURN THE TOKEN & MARK AS USED (SINGLE USE GUARANTEE)
        $resetRequest->update([
            'is_used' => true,
            'used_at' => now(),
            'status' => 'used',
            'token' => null, // Burn token so it cannot ever be used again
        ]);

        // Security Activity Logging
        ActivityLogService::logSecurity(
            'password_reset_completed',
            "User '{$user->name}' ({$user->email}) successfully reset their password using one-time administrator link.",
            $user,
            [
                'request_id' => $resetRequest->id,
                'ip' => $request->ip(),
            ]
        );

        return redirect('/login')->with('status', 'Your password has been successfully updated! Your one-time link is now deactivated. You can now sign in with your new password.');
    }
}
