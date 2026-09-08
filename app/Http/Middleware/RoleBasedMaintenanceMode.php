<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class RoleBasedMaintenanceMode
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $isMaintenanceMode = Cache::get('system_maintenance_mode', false);

        if ($isMaintenanceMode) {
            \Illuminate\Support\Facades\Log::info('Maintenance mode active for path: ' . $request->path());
            \Illuminate\Support\Facades\Log::info('Auth check: ' . (Auth::check() ? 'true' : 'false'));
            if (Auth::check()) {
                \Illuminate\Support\Facades\Log::info('Auth role: ' . Auth::user()->role);
            }

            // Allow if it's the login/logout route so users can still attempt to log in
            // Admins need to be able to log in during maintenance.
            if ($request->is('login') || $request->is('logout') || $request->is('api/login') || $request->is('maintenance')) {
                return $next($request);
            }

            // Allow if user is authenticated and is an administrator
            if (Auth::check() && Auth::user()->role === 'administrator') {
                return $next($request);
            }

            // Otherwise, block the request
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'System is currently undergoing maintenance.',
                ], 503);
            }

            $customMessage = Cache::get('system_maintenance_message', 'IntelliTrack is currently undergoing scheduled maintenance to improve our services and reliability. We apologize for any inconvenience.');
            return Inertia::render('Maintenance', [
                'custom_message' => $customMessage,
            ])->toResponse($request)->setStatusCode(503);
        }

        return $next($request);
    }
}
