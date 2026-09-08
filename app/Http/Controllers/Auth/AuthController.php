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
     * Handle login request with rate limiting and account status validation.
     *
     * Security measures:
     * - Rate limiting: 5 attempts per 2 minutes per email+IP combination
     * - Account deactivation check: blocks login for suspended accounts
     * - Session regeneration: prevents session fixation attacks
     */
    public function login(Request $request): RedirectResponse
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

            return back()->withErrors([
                'email' => 'Your account has been deactivated. Please contact your administrator.',
            ])->onlyInput('email');
        }

        if (Auth::attempt($credentials, $remember)) {
            RateLimiter::clear($throttleKey);

            $request->session()->regenerate();

            /** @var User $authenticatedUser */
            $authenticatedUser = $request->user();
            $authenticatedUser->update(['last_login_at' => now()]);

            ActivityLogService::logAuth($authenticatedUser, 'login', "User '{$authenticatedUser->name}' successfully signed in.", [
                'role' => $authenticatedUser->role,
                'email' => $authenticatedUser->email,
                'ip' => $request->ip(),
            ]);

            return redirect()->intended('/dashboard');
        }

        // Increment rate limiter on failed attempt
        RateLimiter::hit($throttleKey, self::LOCKOUT_DURATION_SECONDS);

        ActivityLogService::logSecurity('failed_login', "Failed sign-in attempt for email '{$credentials['email']}' (invalid password/credentials).", $user, [
            'attempted_email' => $credentials['email'],
            'ip' => $request->ip(),
        ]);

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ])->onlyInput('email');
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
