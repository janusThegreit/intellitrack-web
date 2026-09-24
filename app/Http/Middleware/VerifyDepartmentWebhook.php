<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyDepartmentWebhook
{
    /**
     * Handle an incoming request from an external department system.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $expectedSecret = config('departments.webhook_secret');

        // Check header: X-Department-Key, X-Service-Token, or Bearer token
        $providedKey = $request->header('X-Department-Key')
            ?: $request->header('X-Service-Token')
            ?: $request->bearerToken();

        if (empty($expectedSecret) || $providedKey !== $expectedSecret) {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized: Invalid or missing department webhook authentication key.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        return $next($request);
    }
}
