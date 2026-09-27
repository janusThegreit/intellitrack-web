<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\PasswordResetRequest;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\NotificationService;
use App\Mail\PasswordResetLinkMail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetRequestController extends Controller
{
    /**
     * Public: User requests a password reset. A single-use link is automatically
     * generated and dispatched directly to their registered email address.
     * System Administrators are notified and audit logs are recorded.
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

        // Expire any previous uncompleted reset requests for this user
        PasswordResetRequest::where('user_id', $user->id)
            ->where('is_used', false)
            ->where('status', 'approved')
            ->update(['status' => 'expired']);

        // Generate 64-character cryptographically secure token valid for 60 minutes
        $token = Str::random(64);
        $tokenExpiresAt = now()->addMinutes(60);

        // Create new approved reset request record (retaining full audit history)
        $resetRequest = PasswordResetRequest::create([
            'user_id' => $user->id,
            'email' => $user->email,
            'reason' => $validated['reason'] ?? 'User requested self-service password reset from login portal.',
            'status' => 'approved',
            'token' => $token,
            'token_expires_at' => $tokenExpiresAt,
            'requested_at' => now(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        $resetUrl = url('/reset-password/' . $token);

        // Send Email directly to user's registered inbox
        try {
            Mail::to($user->email)->send(new PasswordResetLinkMail($user, $resetUrl, 60));
        } catch (\Throwable $e) {
            Log::error("Failed to send password reset email to {$user->email}: " . $e->getMessage());
        }

        // Inform all Administrator role users via NotificationService for real-time visibility
        $notificationService->notifyRoles(
            ['administrator'],
            'info',
            'Password Reset Link Sent: ' . $user->name,
            "User '{$user->name}' ({$user->email}) requested a password reset. A secure reset link was dispatched directly to their email on " . now()->format('M d, Y h:i A') . ".",
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

        // Security Activity Logging for complete audit history
        ActivityLogService::logSecurity(
            'password_reset_request',
            "Password reset link generated and dispatched to registered email for User '{$user->name}' ({$user->email}).",
            $user,
            [
                'request_id' => $resetRequest->id,
                'ip' => $request->ip(),
                'reason' => $validated['reason'] ?? null,
                'expires_at' => $tokenExpiresAt->toIso8601String(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "A secure password reset link has been sent to your registered email ({$user->email}). Please check your inbox and spam folder to set your new password.",
            'reset_url' => app()->environment('local') ? $resetUrl : null,
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

        $changedDateFormatted = now()->format('F j, Y \a\t g:i A');

        // Security Activity Logging (Permanent User & Admin Audit History)
        ActivityLogService::logSecurity(
            'password_reset_completed',
            "User '{$user->name}' ({$user->email}, Role: {$user->role}) changed their password on {$changedDateFormatted} via registered email reset link.",
            $user,
            [
                'request_id' => $resetRequest->id,
                'user_id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
                'changed_at' => now()->toIso8601String(),
                'formatted_date' => $changedDateFormatted,
                'ip' => $request->ip(),
            ]
        );

        // Notify all System Administrators so they know the user changed password on that day
        app(NotificationService::class)->notifyRoles(
            ['administrator'],
            'warning',
            "Password Changed: {$user->name}",
            "User '{$user->name}' ({$user->email}, Role: {$user->role}) successfully changed their password on {$changedDateFormatted}.",
            PasswordResetRequest::class,
            $resetRequest->id,
            [
                'user_id' => $user->id,
                'email' => $user->email,
                'changed_at' => now()->toIso8601String(),
            ]
        );

        return redirect('/login')->with('status', "Your password has been successfully updated on {$changedDateFormatted}! You can now sign in with your new password.");
    }
}
