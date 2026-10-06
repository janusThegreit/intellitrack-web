<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
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

            // Role-based destination: Client users go to Client Portal, Internal users go to Enterprise Dashboard
            if ($authenticatedUser->isClient()) {
                return redirect()->intended('/portal');
            }

            return redirect()->intended('/dashboard');
        }

        // Increment rate limiter on failed attempt
        RateLimiter::hit($throttleKey, self::LOCKOUT_DURATION_SECONDS);

        ActivityLogSerpublic function login(Request $request): RedirectResponse
{
    $credentials = $request->validate([
        'email' => ['required', 'email'],
        'password' => ['required'],
    ]);

    $remember = $request->boolean('remember');

    // Rate limiting at the Gateway level
    $throttleKey = $this->throttleKey($request);

    if (RateLimiter::tooManyAttempts($throttleKey, self::MAX_LOGIN_ATTEMPTS)) {
        $seconds = RateLimiter::availableIn($throttleKey);

        return back()->withErrors([
            'email' => __('Too many login attempts. Please try again in :seconds seconds.', [
                'seconds' => $seconds,
            ]),
        ])->onlyInput('email');
    }

    try {
        /*
         * Authentication is handled by the Auth Service.
         * The Gateway must never access the Auth Service database directly.
         */
        $response = Http::timeout(5)
            ->acceptJson()
            ->withHeaders([
                'X-Internal-Secret' => config('gateway.internal_secret'),
            ])
            ->post(
                rtrim(config('gateway.services.auth.base_url'), '/') . '/api/auth/login',
                [
                    'email' => $credentials['email'],
                    'password' => $credentials['password'],
                ]
            );
    } catch (\Throwable $e) {
        report($e);

        return back()->withErrors([
            'email' => 'Authentication service is currently unavailable. Please try again later.',
        ])->onlyInput('email');
    }

    /*
     * Auth Service rejected the credentials.
     */
    if ($response->status() === 401) {
        RateLimiter::hit($throttleKey, self::LOCKOUT_DURATION_SECONDS);

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ])->onlyInput('email');
    }

    /*
     * Auth Service rejected a deactivated account.
     */
    if ($response->status() === 403) {
        RateLimiter::hit($throttleKey, self::LOCKOUT_DURATION_SECONDS);

        return back()->withErrors([
            'email' => 'Your account has been deactivated. Please contact your administrator.',
        ])->onlyInput('email');
    }

    /*
     * Handle validation or rate-limit errors from Auth Service.
     */
    if ($response->status() === 422 || $response->status() === 429) {
        $message = $response->json('message')
            ?? 'Unable to authenticate your account at this time.';

        return back()->withErrors([
            'email' => $message,
        ])->onlyInput('email');
    }

    /*
     * Handle unexpected Auth Service errors.
     */
    if (! $response->successful()) {
        report(new \RuntimeException(
            'Auth Service returned HTTP ' . $response->status()
        ));

        return back()->withErrors([
            'email' => 'Authentication service is currently unavailable. Please try again later.',
        ])->onlyInput('email');
    }

    $authData = $response->json('data');

    if (! is_array($authData) || empty($authData['user'])) {
        report(new \RuntimeException('Auth Service returned an invalid authentication response.'));

        return back()->withErrors([
            'email' => 'Unable to complete authentication. Please try again.',
        ])->onlyInput('email');
    }

    $authUser = $authData['user'];

    /*
     * Create the Gateway's local authenticated session.
     *
     * The Gateway does not need the Auth Service database.
     * It only needs a local user representation for Laravel's
     * session-based authorization and role checks.
     */
    $user = new User();

    $user->forceFill([
        'id' => $authUser['id'],
        'name' => $authUser['name'] ?? '',
        'email' => $authUser['email'],
        'first_name' => $authUser['first_name'] ?? null,
        'last_name' => $authUser['last_name'] ?? null,
        'nickname' => $authUser['nickname'] ?? null,
        'phone' => $authUser['phone'] ?? null,
        'avatar_url' => $authUser['avatar_url'] ?? null,
        'role' => $authUser['role'] ?? $authData['role'] ?? null,
        'client_id' => $authUser['client_id'] ?? null,
        'is_active' => $authUser['is_active'] ?? true,
    ]);

    /*
     * Store the authenticated user in the Gateway session.
     */
    Auth::login($user, $remember);

    RateLimiter::clear($throttleKey);

    $request->session()->regenerate();

    return redirect()->intended(
        $user->isClient() ? '/portal' : '/dashboard'
    );
}
    }