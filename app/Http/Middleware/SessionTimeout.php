<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Services\ActivityLogService;
use Symfony\Component\HttpFoundation\Response;

class SessionTimeout
{
    /**
     * Inactivity timeout duration in seconds (5 minutes = 300 seconds).
     */
    public const TIMEOUT_SECONDS = 300;

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            $lastActivity = $request->session()->get('last_activity_timestamp');

            if ($lastActivity && (time() - $lastActivity > self::TIMEOUT_SECONDS)) {
                $user = Auth::user();
                if ($user) {
                    try {
                        ActivityLogService::logAuth(
                            $user,
                            'session_timeout',
                            "User '{$user->name}' was automatically logged out due to 5 minutes of inactivity."
                        );
                    } catch (\Throwable $e) {
                        // Suppress log failure to ensure logout always succeeds
                    }
                }

                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                if ($request->expectsJson() || $request->is('api/*')) {
                    return response()->json([
                        'message' => 'Your session has timed out due to 5 minutes of inactivity. Please log in again.',
                        'timeout' => true,
                    ], 401);
                }

                return redirect()->route('login', ['timeout' => 1]);
            }

            $request->session()->put('last_activity_timestamp', time());
        }

        return $next($request);
    }
}
