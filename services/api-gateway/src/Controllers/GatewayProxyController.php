<?php

namespace IntelliTrack\Services\Gateway\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use IntelliTrack\Shared\Http\ApiResponse;

class GatewayProxyController extends Controller
{
    /**
     * Dynamically proxy incoming requests to the target downstream microservice.
     */
    public function proxy(Request $request, string $serviceKey, string $path = '')
    {
        $services = config('gateway.services', config('services.microservices.services', []));

        if (! isset($services[$serviceKey])) {
            return ApiResponse::notFound("Target microservice [{$serviceKey}] not registered in API Gateway.");
        }

        $serviceConfig = $services[$serviceKey];
        $baseUrl = rtrim($serviceConfig['base_url'], '/');
        $timeout = $serviceConfig['timeout'] ?? 5;

        // Build target downstream URL
        $targetUrl = $baseUrl . '/api/' . ltrim($path, '/');
        $correlationId = $request->header('X-Correlation-ID', (string) Str::uuid());
        $secret = config('gateway.internal_secret', 'secret-internal-token');

        // Forward headers
        $forwardHeaders = [
            'Accept' => 'application/json',
            'X-Correlation-ID' => $correlationId,
            'X-Service-Token' => $secret,
            'X-Forwarded-For' => $request->ip(),
            'User-Agent' => $request->userAgent() ?? 'IntelliTrack-ApiGateway',
        ];

        // Propagate authenticated user info if present
        if ($request->user()) {
            $user = $request->user();
            $forwardHeaders['X-User-Id'] = (string) $user->id;
            $forwardHeaders['X-User-Email'] = $user->email;
            $forwardHeaders['X-User-Name'] = $user->name;
            $forwardHeaders['X-User-Role'] = $user->role ?? 'customer';
        } elseif ($request->header('X-User-Id')) {
            $forwardHeaders['X-User-Id'] = $request->header('X-User-Id');
            $forwardHeaders['X-User-Email'] = $request->header('X-User-Email', '');
            $forwardHeaders['X-User-Name'] = $request->header('X-User-Name', '');
            $forwardHeaders['X-User-Role'] = $request->header('X-User-Role', '');
        }

        $method = $request->method();
        $query = $request->query();

        try {
            $httpClient = Http::withHeaders($forwardHeaders)->timeout($timeout);

            if (in_array($method, ['POST', 'PUT', 'PATCH'])) {
                $response = $httpClient->send($method, $targetUrl, [
                    'query' => $query,
                    'json' => $request->all(),
                ]);
            } else {
                $response = $httpClient->send($method, $targetUrl, [
                    'query' => $query,
                ]);
            }

            return response($response->body(), $response->status())
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'X-Correlation-ID' => $correlationId,
                    'X-Proxied-By' => 'IntelliTrack-Gateway',
                ]);
        } catch (\Throwable $e) {
            return ApiResponse::error(
                "Downstream microservice [{$serviceKey}] is currently unavailable.",
                503,
                ['exception' => $e->getMessage()],
                'SERVICE_UNAVAILABLE'
            );
        }
    }
}
