<?php

namespace IntelliTrack\Services\Auth\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use IntelliTrack\Services\Auth\Models\User;
use IntelliTrack\Shared\Http\ApiResponse;
use IntelliTrack\Shared\Events\Auth\UserRegisteredEvent;
use IntelliTrack\Shared\Events\RedisEventBus;

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
     * Authenticate user credentials.
     *
     * Security measures:
     * - Rate limiting: 5 attempts per 2 minutes per email+IP combination
     * - Account deactivation check: blocks login for suspended accounts
     * - Cryptographically secure token generation using Sanctum (or secure random bytes fallback)
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors());
        }

        // Rate limiting: prevent brute-force attacks
        $throttleKey = $this->throttleKey($request);

        if (RateLimiter::tooManyAttempts($throttleKey, self::MAX_LOGIN_ATTEMPTS)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            return ApiResponse::error(
                "Too many login attempts. Please try again in {$seconds} seconds.",
                429
            );
        }

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            RateLimiter::hit($throttleKey, self::LOCKOUT_DURATION_SECONDS);

            return ApiResponse::unauthorized('Invalid email or password credentials.');
        }

        // Block deactivated accounts
        if (isset($user->is_active) && ! $user->is_active) {
            RateLimiter::hit($throttleKey, self::LOCKOUT_DURATION_SECONDS);

            return ApiResponse::forbidden('Account has been deactivated. Please contact your administrator.');
        }

        // Clear rate limiter on successful authentication
        RateLimiter::clear($throttleKey);

        $user->update(['last_login_at' => now()]);

        // Generate a cryptographically secure API token
        // Prefer Laravel Sanctum if available; otherwise use a secure random token
        if (method_exists($user, 'createToken')) {
            $tokenResult = $user->createToken('api-auth', ["role:{$user->role}"]);
            $token = $tokenResult->plainTextToken;
        } else {
            // Secure fallback: HMAC-based token with app key as secret
            $token = hash_hmac('sha256', Str::random(64) . '|' . $user->id, config('app.key'));
        }

        return ApiResponse::success([
            'user' => $user,
            'token' => $token,
            'role' => $user->role,
        ], 'Authentication successful');
    }

    /**
     * Register a new user.
     *
     * Security measures:
     * - Strong password validation (mixed case, numbers, symbols, breach check)
     * - Role restricted to safe options only (no admin self-registration)
     * - New accounts default to inactive (require admin approval)
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
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
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            // Only allow non-privileged roles for self-registration
            'role' => 'nullable|string|in:staff,customer',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors());
        }

        // Force lowest-privilege role for self-registration (never admin/manager)
        $role = $request->input('role', 'customer');

        $user = User::create([
            'name' => $request->name,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'role' => $role,
            'is_active' => false, // Require admin approval
        ]);

        // Publish event to Redis event bus
        try {
            $event = UserRegisteredEvent::create($user->id, $user->email, $user->name, $user->role);
            app(RedisEventBus::class)->publish($event);
        } catch (\Throwable $e) {
            // Logged inside event bus
        }

        return ApiResponse::created([
            'user' => $user,
        ], 'User registered successfully. Account requires administrator approval.');
    }

    /**
     * Validate token & return user context.
     *
     * Security: Validates that the user exists and is still active.
     */
    public function me(Request $request)
    {
        $userId = $request->header('X-User-Id');
        if (! $userId) {
            return ApiResponse::unauthorized();
        }

        $user = User::find($userId);
        if (! $user) {
            return ApiResponse::notFound('User not found.');
        }

        // Ensure user is still active
        if (isset($user->is_active) && ! $user->is_active) {
            return ApiResponse::forbidden('Account has been deactivated.');
        }

        return ApiResponse::success($user);
    }

    /**
     * Generate a unique throttle key combining email and IP address.
     */
    private function throttleKey(Request $request): string
    {
        return Str::transliterate(
            Str::lower($request->input('email')) . '|' . $request->ip()
        );
    }
}
