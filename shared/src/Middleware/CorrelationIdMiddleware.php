<?php

namespace IntelliTrack\Shared\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class CorrelationIdMiddleware
{
    /**
     * Handle an incoming request and ensure X-Correlation-ID is set.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $correlationId = $request->header('X-Correlation-ID');

        if (! $correlationId) {
            $correlationId = (string) Str::uuid();
            $request->headers->set('X-Correlation-ID', $correlationId);
        }

        // Attach correlation ID to logging context
        Log::withContext([
            'correlation_id' => $correlationId,
            'client_ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        $response = $next($request);

        // Append to outgoing response headers
        $response->headers->set('X-Correlation-ID', $correlationId);

        return $response;
    }
}
