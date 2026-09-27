<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use App\Mail\LoginOtpMail;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class AuthController extends Controller
{
    /**
     * Maximum login attempts before lockout.
     */
    private const MAX_LOGIN_ATTEMPTS = 5;

    /**
     * Lockout duration in seconds (2 minutes).
     */
    private const LOCKOUT_DURATION_SECONDS = 120;

    /**
     * Show the login form
     */
    public function showLoginForm(): Response
    {
        return Inertia::render('Auth/Login');
    }

    /**
     * Handle login request with rate limiting and 2FA Email OTP generation.
     *
     * Security measures:
     * - Rate limiting: 5 attempts per 2 minutes per email+IP combination
     * - Account deactivation check: blocks login for suspended accounts
     * - Password verification prior to dispatching OTP
     * - 6-Digit One-Time Password valid for 10 minutes
     * - Branded email notification via configured SMTP (e.g. free Gmail SMTP)
     */
    public function login(Request $request): RedirectResponse|JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $remember = $request->boolean('remember');

        // Rate limiting: prevent brute-force attacks
        $throttleKey = $this->throttleKey($request);

        if (RateLimiter::tooManyAttempts($throttleKey, self::MAX_LOGIN_ATTEMPTS)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            if ($request->wantsJson()) {
                return response()->json([
                    'message' => __('Too many login attempts. Please try again in :seconds seconds.', ['seconds' => $seconds]),
                ], 429);
            }

            return back()->withErrors([
                'email' => __('Too many login attempts. Please try again in :seconds seconds.', [
                    'seconds' => $seconds,
                ]),
            ])->onlyInput('email');
        }

        // Check if the user exists and is active before attempting authentication
        $user = User::where('email', $credentials['email'])->first();

        if ($user && !$user->is_active) {
            RateLimiter::hit($throttleKey, self::LOCKOUT_DURATION_SECONDS);

            ActivityLogService::logSecurity('blocked_login', "Blocked sign-in attempt for deactivated user account: '{$user->email}'.", $user, [
                'email' => $credentials['email'],
                'ip' => $request->ip(),
            ]);

            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Your account has been deactivated. Please contact your administrator.',
                ], 403);
            }

            return back()->withErrors([
                'email' => 'Your account has been deactivated. Please contact your administrator.',
            ])->onlyInput('email');
        }

        // Verify password against hashed password
        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            RateLimiter::hit($throttleKey, self::LOCKOUT_DURATION_SECONDS);

            ActivityLogService::logSecurity('failed_login', "Failed sign-in attempt for email '{$credentials['email']}' (invalid password/credentials).", $user, [
                'attempted_email' => $credentials['email'],
                'ip' => $request->ip(),
            ]);

            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'The provided credentials do not match our records.',
                ], 422);
            }

            return back()->withErrors([
                'email' => 'The provided credentials do not match our records.',
            ])->onlyInput('email');
        }

        // Password is valid! Clear failed login throttle
        RateLimiter::clear($throttleKey);

        // Generate cryptographically secure 6-digit OTP code
        $otp = (string) random_int(100000, 999999);
        $user->update([
            'two_factor_code' => Hash::make($otp),
            'two_factor_expires_at' => now()->addMinutes(10),
            'two_factor_attempts' => 0,
        ]);

        // Save remember choice and user id in session
        $request->session()->put('login_2fa_user_id', $user->id);
        $request->session()->put('login_2fa_remember', $remember);

        // Send Email OTP via Mailable
        try {
            Mail::to($user->email)->send(new LoginOtpMail($user, $otp, 10));
        } catch (\Throwable $e) {
            Log::error("Failed to send 2FA OTP email to {$user->email}: " . $e->getMessage());
        }

        // Log for development and debugging convenience
        Log::info("2FA OTP code generated for [{$user->email}]: {$otp}");

        ActivityLogService::logAuth($user, '2fa_challenge_sent', "2FA verification code dispatched to {$user->email}.", [
            'ip' => $request->ip(),
        ]);

        $maskedEmail = $this->maskEmail($user->email);

        if ($request->wantsJson()) {
            return response()->json([
                'otp_required' => true,
                'email' => $user->email,
                'masked_email' => $maskedEmail,
                'message' => "A 6-digit verification code has been sent to {$maskedEmail}.",
            ]);
        }

        return back()->with([
            'otp_required' => true,
            'email' => $user->email,
            'masked_email' => $maskedEmail,
            'status' => "A 6-digit verification code has been sent to {$maskedEmail}.",
        ]);
    }

    /**
     * Verify the 6-digit OTP code and authenticate the user.
     */
    public function verifyOtp(Request $request): RedirectResponse|JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'size:6'],
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user) {
            return $this->otpError($request, 'Invalid authentication session. Please sign in again.');
        }

        if (!$user->is_active) {
            return $this->otpError($request, 'Your account has been deactivated. Please contact your administrator.');
        }

        // Check if OTP exists and has not expired
        if (!$user->two_factor_code || !$user->two_factor_expires_at) {
            return $this->otpError($request, 'No active verification code found. Please request a new code.');
        }

        if (now()->gt($user->two_factor_expires_at)) {
            $user->update([
                'two_factor_code' => null,
                'two_factor_expires_at' => null,
            ]);
            return $this->otpError($request, 'The verification code has expired. Please request a new one.');
        }

        // Check attempts limit (max 5 attempts)
        if ($user->two_factor_attempts >= 5) {
            $user->update([
                'two_factor_code' => null,
                'two_factor_expires_at' => null,
            ]);
            return $this->otpError($request, 'Too many incorrect attempts. Please sign in again to receive a fresh code.');
        }

        // Validate code
        if (!Hash::check($validated['code'], $user->two_factor_code)) {
            $user->increment('two_factor_attempts');
            $remaining = 5 - $user->two_factor_attempts;
            return $this->otpError($request, "Incorrect verification code. {$remaining} attempt(s) remaining.");
        }

        // OTP IS VALID! Clear 2FA state
        $user->update([
            'two_factor_code' => null,
            'two_factor_expires_at' => null,
            'two_factor_attempts' => 0,
            'last_login_at' => now(),
        ]);

        $remember = $request->session()->pull('login_2fa_remember', false);
        $request->session()->forget('login_2fa_user_id');

        // Log the user in!
        Auth::login($user, $remember);
        $request->session()->regenerate();

        ActivityLogService::logAuth($user, 'login_2fa_success', "User '{$user->name}' successfully signed in with 2FA email verification.", [
            'role' => $user->role,
            'email' => $user->email,
            'ip' => $request->ip(),
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'redirect' => '/dashboard',
                'user' => $user,
            ]);
        }

        return redirect()->intended('/dashboard');
    }

    /**
     * Resend 2FA OTP code.
     */
    public function resendOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !$user->is_active) {
            return response()->json(['message' => 'Unable to resend code for this account.'], 400);
        }

        // Rate limit: 1 resend per 60 seconds
        $resendThrottleKey = 'resend-otp:' . $user->id;
        if (RateLimiter::tooManyAttempts($resendThrottleKey, 1)) {
            $seconds = RateLimiter::availableIn($resendThrottleKey);
            return response()->json([
                'message' => "Please wait {$seconds} seconds before requesting another code.",
            ], 429);
        }

        RateLimiter::hit($resendThrottleKey, 60);

        $otp = (string) random_int(100000, 999999);
        $user->update([
            'two_factor_code' => Hash::make($otp),
            'two_factor_expires_at' => now()->addMinutes(10),
            'two_factor_attempts' => 0,
        ]);

        try {
            Mail::to($user->email)->send(new LoginOtpMail($user, $otp, 10));
        } catch (\Throwable $e) {
            Log::error("Failed to resend 2FA OTP to {$user->email}: " . $e->getMessage());
        }

        Log::info("Resent 2FA OTP code for [{$user->email}]: {$otp}");

        ActivityLogService::logAuth($user, '2fa_code_resent', "Resent 2FA verification code to {$user->email}.", [
            'ip' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'A new 6-digit verification code has been sent to your email.',
        ]);
    }

    /**
     * Helper to return OTP verification errors.
     */
    private function otpError(Request $request, string $message, int $status = 422): RedirectResponse|JsonResponse
    {
        if ($request->wantsJson()) {
            return response()->json(['message' => $message], $status);
        }

        return back()->withErrors(['code' => $message]);
    }

    /**
     * Mask email for privacy display (e.g. jo***n@domain.com).
     */
    private function maskEmail(string $email): string
    {
        $parts = explode('@', $email);
        if (count($parts) !== 2) {
            return $email;
        }

        $name = $parts[0];
        $domain = $parts[1];

        $length = strlen($name);
        if ($length <= 2) {
            $maskedName = substr($name, 0, 1) . '*';
        } else {
            $maskedName = substr($name, 0, 2) . str_repeat('*', max(2, $length - 3)) . substr($name, -1);
        }

        return "{$maskedName}@{$domain}";
    }

    /**
     * Show registration form
     */
    public function showRegisterForm(): Response
    {
        return Inertia::render('Auth/Login');
    }

    /**
     * Handle registration request.
     *
     * Security measures:
     * - Strong password validation using Laravel's Password rule object
     * - New accounts default to inactive (is_active = false) requiring admin approval
     * - Default role is the lowest-privilege 'customer' role
     */
    public function register(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => [
                'required',
                'string',
                'confirmed',
                Password::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
                    ->uncompromised(),
            ],
            'first_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'first_name' => $validated['first_name'] ?? null,
            'last_name' => $validated['last_name'] ?? null,
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
            'role' => 'customer',       // Lowest-privilege role for self-registration
            'is_active' => false,       // Require admin approval before account activation
        ]);

        event(new Registered($user));

        ActivityLogService::logAuth($user, 'registered', "New user registration submitted for '{$user->name}' ({$user->email}), pending admin review.", [
            'role' => $user->role,
            'ip' => $request->ip(),
        ]);

        // Do NOT auto-login: account requires admin approval
        return redirect('/login')->with('status', 'Registration successful! Your account is pending administrator approval.');
    }

    /**
     * Handle logout with full session invalidation.
     */
    public function logout(Request $request): RedirectResponse
    {
        $user = Auth::user();
        if ($user) {
            ActivityLogService::logAuth($user, 'logout', "User '{$user->name}' ({$user->email}) logged out successfully.");
        }

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    /**
     * Generate a unique throttle key combining email and IP address.
     *
     * Using both email and IP prevents:
     * - Attackers from locking out legitimate users by flooding their email
     * - Bypassing rate limits by switching email addresses from same IP
     */
    private function throttleKey(Request $request): string
    {
        return Str::transliterate(
            Str::lower($request->input('email')) . '|' . $request->ip()
        );
    }
}
