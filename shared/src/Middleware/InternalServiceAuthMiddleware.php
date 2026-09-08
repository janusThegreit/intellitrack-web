<?php

namespace IntelliTrack\Shared\Middleware;

use Closure;
use Illuminate\Http\Request;
use IntelliTrack\Shared\Http\ApiResponse;
use Symfony\Component\HttpFoundation\Response;

class InternalServiceAuthMiddleware
{
    /**
     * Validate that the request originates from the API Gateway or another trusted internal microservice.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $expectedSecret = config('services.microservices.internal_secret', 'secret-internal-token');
        $receivedToken = $request->header('X-Service-Token');

        // If internal secret is configured and does not match, reject
        if ($expectedSecret && $receivedToken !== $expectedSecret) {
            return ApiResponse::unauthorized('Invalid or missing internal service authentication token.');
        }

        return $next($request);
    }
}
