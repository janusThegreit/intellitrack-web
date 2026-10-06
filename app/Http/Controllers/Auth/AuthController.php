<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    private const MAX_LOGIN_ATTEMPTS = 5;
    private const LOCKOUT_DURATION_SECONDS = 120;

    public function showLoginForm(): Response
    {
        return Inertia::render('Auth/Login');
    }

    public function showRegisterForm(): Response
    {
        return Inertia::render('Auth/Register');
    }

    public function login(Request $request): RedirectResponse
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

            return back()->withErrors([
                'email' => 'The provided credentials do not match our records.',
            ])->onlyInput('email');
        }

        if ($response->status() === 403) {
            RateLimiter::hit($throttleKey, self::LOCKOUT_DURATION_SECONDS);

            return back()->withErrors([
                'email' => 'Your account has been deactivated. Please contact your administrator.',
            ])->onlyInput('email');
        }

        if ($response->status() === 422 || $response->status() === 429) {
            return back()->withErrors([
                'email' => $response->json('message') ?? 'Unable to authenticate your account at this time.',
            ])->onlyInput('email');
        }

        if (! $response->successful()) {
            report(new \RuntimeException('Auth Service returned HTTP ' . $response->status()));

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

            return back()->withErrors([
                'email' => 'Unable to complete authentication. Please try again.',
            ])->onlyInput('email');
        }

        $authUser = $authData['user'];
        try {
            $gatewayUser = $this->syncGatewayUserFromAuthService($authUser, $authData);
        } catch (\RuntimeException $e) {
            report($e);

            return back()->withErrors([
                'email' => 'Unable to synchronize your account. Please contact support.',
            ])->onlyInput('email');
        }

        if (! $gatewayUser->is_active) {
            RateLimiter::hit($throttleKey, self::LOCKOUT_DURATION_SECONDS);

            return back()->withErrors([
                'email' => 'Your account has been deactivated. Please contact your administrator.',
            ])->onlyInput('email');
        }

        Auth::login($gatewayUser, $remember);
        RateLimiter::clear($throttleKey);
        $request->session()->regenerate();
        $gatewayUser->update(['last_login_at' => now()]);

        ActivityLogService::logAuth($gatewayUser, 'login', "User '{$gatewayUser->name}' successfully signed in.", [
            'role' => $gatewayUser->role,
            'email' => $gatewayUser->email,
            'ip' => $request->ip(),
        ]);

        return redirect($gatewayUser->isClient() ? '/portal' : '/dashboard');
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
            || ! is_string($authUser['role'] ?? null)
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