<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;
use Inertia\Response;
use App\Mail\LoginOtpMail;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;

class AuthController extends Controller
{
    private const MAX_LOGIN_ATTEMPTS = 5;
    private const LOCKOUT_DURATION_SECONDS = 120;

    public function showLoginForm(): Response
    {
        return Inertia::render('Auth/Login');
    }

    /**
     * Show the public client registration form.
     */
    public function showRegisterForm(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Authenticate credentials through the Auth Service, then apply the existing
     * Gateway-side session and optional email OTP flow.
     *
     * Security measures:
     * - Rate limiting: 5 attempts per 2 minutes per email+IP combination
     * - Password verification remains in the Auth Service
     * - Account deactivation check
     * - Existing email OTP flow when enabled and supported by the Gateway schema
     */
    public function login(Request $request): RedirectResponse|JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);
        $credentials['email'] = strtolower(trim($credentials['email']));

        $remember = $request->boolean('remember');
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

        try {
            $response = Http::timeout(5)
                ->acceptJson()
                ->post(rtrim(config('gateway.services.auth.base_url'), '/') . '/api/auth/login', [
                    'email' => $credentials['email'],
                    'password' => $credentials['password'],
                ]);
        } catch (\Throwable $e) {
            report($e);

            return back()->withErrors([
                'email' => 'Authentication service is currently unavailable. Please try again later.',
            ])->onlyInput('email');
        }

        if ($response->status() === 401) {
            RateLimiter::hit($throttleKey, self::LOCKOUT_DURATION_SECONDS);
            $user = User::where('email', $credentials['email'])->first();

            ActivityLogService::logSecurity('failed_login', "Failed sign-in attempt for email '{$credentials['email']}' (invalid Auth Service credentials).", $user, [
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

        if ($response->status() === 403) {
            RateLimiter::hit($throttleKey, self::LOCKOUT_DURATION_SECONDS);

            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Your account has been deactivated. Please contact your administrator.',
                ], 403);
            }

            return back()->withErrors([
                'email' => 'Your account has been deactivated. Please contact your administrator.',
            ])->onlyInput('email');
        }

        if (in_array($response->status(), [422, 429], true)) {
            $message = $response->json('message') ?? 'Unable to authenticate your account at this time.';

            if ($response->status() === 429 && $request->wantsJson()) {
                return response()->json(['message' => $message], 429);
            }

            return back()->withErrors(['email' => $message])->onlyInput('email');
        }

        if (! $response->successful()) {
            report(new \RuntimeException('Auth Service returned HTTP ' . $response->status()));

            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Authentication service is currently unavailable. Please try again later.',
                ], 503);
            }

            return back()->withErrors([
                'email' => 'Authentication service is currently unavailable. Please try again later.',
            ])->onlyInput('email');
        }

        $payload = $response->json();
        $authData = is_array($payload) && ($payload['success'] ?? false) === true
            ? ($payload['data'] ?? null)
            : null;

        if (
            ! is_array($authData)
            || ! is_array($authData['user'] ?? null)
            || ! is_numeric($authData['user']['id'] ?? null)
            || (int) $authData['user']['id'] < 1
            || ! filter_var($authData['user']['email'] ?? null, FILTER_VALIDATE_EMAIL)
            || ! is_string($authData['user']['role'] ?? null)
            || ! array_key_exists('is_active', $authData['user'])
            || ! is_bool($authData['user']['is_active'])
        ) {
            report(new \RuntimeException('Auth Service returned an invalid authentication response.'));

            if ($request->wantsJson()) {
                return response()->json(['message' => 'Unable to complete authentication. Please try again.'], 502);
            }

            return back()->withErrors([
                'email' => 'Unable to complete authentication. Please try again.',
            ])->onlyInput('email');
        }

        try {
            $user = $this->syncGatewayUserFromAuthService($authData['user'], $authData);
        } catch (\RuntimeException $e) {
            report($e);

            if ($request->wantsJson()) {
                return response()->json(['message' => 'Unable to synchronize your account. Please contact support.'], 500);
            }

            return back()->withErrors([
                'email' => 'Unable to synchronize your account. Please contact support.',
            ])->onlyInput('email');
        }

        if (! $user->is_active) {
            RateLimiter::hit($throttleKey, self::LOCKOUT_DURATION_SECONDS);

            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Your account has been deactivated. Please contact your administrator.',
                ], 403);
            }

            return back()->withErrors([
                'email' => 'Your account has been deactivated. Please contact your administrator.',
            ])->onlyInput('email');
        }

        // Credentials were verified by the Auth Service; clear the Gateway throttle.
        RateLimiter::clear($throttleKey);

        $has2FaColumns = Schema::hasColumn('users', 'two_factor_code');
        $is2FaEnabled = filter_var(config('auth.2fa_enabled', true), FILTER_VALIDATE_BOOLEAN);

        // If 2FA is not explicitly enabled or migration is not yet applied, sign in directly!
        if (! $is2FaEnabled || ! $has2FaColumns) {
            Auth::login($user, $remember);

if (! $request->wantsJson()) {
    $request->session()->regenerate();
}
            if (Schema::hasColumn('users', 'last_login_at')) {
                $user->update(['last_login_at' => now()]);
            }

            ActivityLogService::logAuth($user, 'login', "User '{$user->name}' signed in successfully.", [
                'role' => $user->role,
                'email' => $user->email,
                'ip' => $request->ip(),
            ]);

            $redirect = $user->isClient() ? '/portal' : '/dashboard';
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'redirect' => $redirect,
                    'user' => $user,
                ]);
            }

            return $user->isClient() ? redirect('/portal') : redirect()->intended('/dashboard');
        }

        // Generate cryptographically secure 6-digit OTP code
        $otp = (string) random_int(100000, 999999);
        try {
            $user->update([
                'two_factor_code' => Hash::make($otp),
                'two_factor_expires_at' => now()->addMinutes(10),
                'two_factor_attempts' => 0,
            ]);
        } catch (\Throwable $e) {
            Log::warning("Failed to save 2FA OTP for {$user->email}: {$e->getMessage()}. Falling back to direct login.");
            Auth::login($user, $remember);

if (! $request->wantsJson()) {
    $request->session()->regenerate();
}

            $redirect = $user->isClient() ? '/portal' : '/dashboard';
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'redirect' => $redirect,
                    'user' => $user,
                ]);
            }

            return $user->isClient() ? redirect('/portal') : redirect()->intended('/dashboard');
        }

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

        $request->sessiAuth::login($user, $remember);on()->regenerate();

        ActivityLogService::logAuth($user, 'login_2fa_success', "User '{$user->name}' successfully signed in with 2FA email verification.", [
            'role' => $user->role,
            'email' => $user->email,
            'ip' => $request->ip(),
        ]);

        $redirect = $user->isClient() ? '/portal' : '/dashboard';
        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'redirect' => $redirect,
                'user' => $user,
            ]);
        }

        return $user->isClient() ? redirect('/portal') : redirect()->intended('/dashboard');
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

    public function register(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'company_name' => ['required', 'string', 'max:255'],
            'contact_person' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:1000'],
            'project_location' => ['nullable', 'string', 'max:500'],
            'role' => ['prohibited'],
        ]);
        $validated['email'] = strtolower(trim($validated['email']));

        try {
            $response = Http::timeout(5)
                ->acceptJson()
                ->post(rtrim(config('gateway.services.auth.base_url'), '/') . '/api/auth/register', [
                    'name' => $validated['contact_person'],
                    'email' => $validated['email'],
                    'password' => $validated['password'],
                    'password_confirmation' => $request->input('password_confirmation'),
                    'phone' => $validated['phone'] ?? null,
                ]);
        } catch (\Throwable $e) {
            report($e);

            return back()->withErrors([
                'email' => 'Authentication service is currently unavailable. Please try again later.',
            ])->onlyInput('company_name', 'contact_person', 'email');
        }

        if ($response->status() === 422) {
            $errors = $response->json('errors');

            return back()
                ->withErrors(is_array($errors) ? $errors : [
                    'email' => $response->json('message') ?? 'Unable to register your account.',
                ])
                ->onlyInput('company_name', 'contact_person', 'email');
        }

        if (! $response->successful()) {
            report(new \RuntimeException('Auth Service registration returned HTTP ' . $response->status()));

            return back()->withErrors([
                'email' => 'Unable to register your account at this time.',
            ])->onlyInput('company_name', 'contact_person', 'email');
        }

        $payload = $response->json();
        $authUser = is_array($payload) && ($payload['success'] ?? false) === true
            ? ($payload['data']['user'] ?? null)
            : null;

        if (
            ! is_array($authUser)
            || ! is_numeric($authUser['id'] ?? null)
            || (int) $authUser['id'] < 1
            || ! filter_var($authUser['email'] ?? null, FILTER_VALIDATE_EMAIL)
            || strtolower((string) $authUser['email']) !== $validated['email']
            || ! is_string($authUser['role'] ?? null)
            || ! in_array(strtolower(trim($authUser['role'])), ['client', 'customer'], true)
            || ! array_key_exists('is_active', $authUser)
            || ! is_bool($authUser['is_active'])
        ) {
            report(new \RuntimeException('Auth Service returned an invalid registration response.'));

            return back()->withErrors([
                'email' => 'Unable to complete registration. Please try again.',
            ])->onlyInput('company_name', 'contact_person', 'email');
        }

        try {
            $user = $this->syncGatewayUserFromAuthService($authUser, $payload['data'], false);
        } catch (\RuntimeException $e) {
            report($e);

            return back()->withErrors([
                'email' => 'Your account was registered but could not be synchronized. Please contact support.',
            ])->onlyInput('company_name', 'contact_person', 'email');
        }

        $customer = Customer::withTrashed()->firstOrNew(['email' => strtolower($validated['email'])]);
        $customer->fill([
            'name' => $validated['company_name'],
            'company_name' => $validated['company_name'],
            'contact_person' => $validated['contact_person'],
            'email' => strtolower($validated['email']),
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
            'project_location' => $validated['project_location'] ?? null,
            'customer_type' => 'business',
            'status' => 'active',
            'source' => 'Client Portal',
        ]);
        $customer->save();
        if ($customer->trashed()) {
            $customer->restore();
        }

        $user->update(['client_id' => $customer->id]);

        ActivityLogService::logAuth($user, 'registered', "Client '{$user->name}' registered on the public portal.", [
            'email' => $user->email,
        ]);

        return redirect()->route('login')->with('status', 'Registration successful. Please sign in.');
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }

    protected function syncGatewayUserFromAuthService(array $authUser, array $authData, bool $login = true): User
    {
        $email = strtolower((string) ($authUser['email'] ?? ''));
        $authUserId = (int) ($authUser['id'] ?? 0);
        $gatewayUser = User::where('auth_user_id', $authUserId)->first();
        $emailUser = User::where('email', $email)->first();

        if ($gatewayUser && $emailUser && $gatewayUser->getKey() !== $emailUser->getKey()) {
            throw new \RuntimeException('Auth Service identity conflicts with an existing Gateway email record.');
        }

        if (! $gatewayUser) {
            $gatewayUser = $emailUser;
        }

        if ($gatewayUser && $gatewayUser->auth_user_id !== null && (int) $gatewayUser->auth_user_id !== $authUserId) {
            throw new \RuntimeException('Gateway user is already linked to a different Auth Service identity.');
        }

        $gatewayUser ??= new User();

        $firstName = $authUser['first_name'] ?? null;
        $lastName = $authUser['last_name'] ?? null;
        $name = $authUser['name'] ?? trim(($firstName ?? '') . ' ' . ($lastName ?? '')) ?: $email;

        $gatewayUser->fill([
            'auth_user_id' => $authUserId,
            'name' => $name,
            'email' => $email,
            'password' => null,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'nickname' => $authUser['nickname'] ?? null,
            'phone' => $authUser['phone'] ?? null,
            'avatar_url' => $authUser['avatar_url'] ?? null,
            'role' => $this->normalizeRole($authUser['role'] ?? $authData['role'] ?? null),
            'client_id' => $authUser['client_id'] ?? $gatewayUser->client_id ?? null,
            'is_active' => (bool) $authUser['is_active'],
            'last_login_at' => $login ? now() : $gatewayUser->last_login_at,
        ]);

        $gatewayUser->save();

        return $gatewayUser;
    }

    protected function normalizeRole(?string $role): string
    {
        $normalized = strtolower(trim((string) $role));

        return match ($normalized) {
            'super_admin', 'super-admin' => 'super_admin',
            'admin', 'administrator' => 'admin',
            'sales_manager', 'manager' => 'sales_manager',
            'sales_business_development', 'sales-business-development', 'sales_bd' => 'sales_business_development',
            'client', 'customer' => 'client',
            'operations_technical', 'operations_staff', 'technical_staff', 'staff' => 'operations_technical',
            default => throw new \RuntimeException('Auth Service returned an unrecognized user role.'),
        };
    }

    protected function throttleKey(Request $request): string
    {
        return sha1(strtolower((string) $request->input('email')) . '|' . $request->ip());
    }
}
