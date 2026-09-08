<?php

namespace IntelliTrack\Shared\Http;

use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Log;
use IntelliTrack\Shared\DTOs\UserContext;
use Exception;
use Throwable;

class ServiceClient
{
    protected string $serviceBaseUrl;
    protected string $serviceSecret;
    protected int $timeout;
    protected int $retryCount;

    public function __construct(string $serviceBaseUrl, ?string $serviceSecret = null, int $timeout = 5, int $retryCount = 2)
    {
        $this->serviceBaseUrl = rtrim($serviceBaseUrl, '/');
        $this->serviceSecret = $serviceSecret ?? config('services.microservices.internal_secret', 'secret-internal-token');
        $this->timeout = $timeout;
        $this->retryCount = $retryCount;
    }

    /**
     * Perform a GET request to a microservice.
     */
    public function get(string $path, array $query = [], ?UserContext $user = null): array
    {
        return $this->send('GET', $path, ['query' => $query], $user);
    }

    /**
     * Perform a POST request to a microservice.
     */
    public function post(string $path, array $data = [], ?UserContext $user = null): array
    {
        return $this->send('POST', $path, ['json' => $data], $user);
    }

    /**
     * Perform a PUT request to a microservice.
     */
    public function put(string $path, array $data = [], ?UserContext $user = null): array
    {
        return $this->send('PUT', $path, ['json' => $data], $user);
    }

    /**
     * Perform a PATCH request to a microservice.
     */
    public function patch(string $path, array $data = [], ?UserContext $user = null): array
    {
        return $this->send('PATCH', $path, ['json' => $data], $user);
    }

    /**
     * Perform a DELETE request to a microservice.
     */
    public function delete(string $path, array $data = [], ?UserContext $user = null): array
    {
        return $this->send('DELETE', $path, ['json' => $data], $user);
    }

    /**
     * Internal resilient HTTP request execution.
     */
    protected function send(string $method, string $path, array $options = [], ?UserContext $user = null): array
    {
        $url = $this->serviceBaseUrl . '/' . ltrim($path, '/');
        $correlationId = request()->header('X-Correlation-ID', (string) \Illuminate\Support\Str::uuid());

        $headers = [
            'Accept' => 'application/json',
            'X-Correlation-ID' => $correlationId,
            'X-Internal-Service' => config('app.name', 'unknown-service'),
            'X-Service-Token' => $this->serviceSecret,
        ];

        if ($user) {
            $headers = array_merge($headers, $user->toHeaders());
        } elseif (request()->header('X-User-Id')) {
            $headers['X-User-Id'] = request()->header('X-User-Id');
            $headers['X-User-Email'] = request()->header('X-User-Email', '');
            $headers['X-User-Name'] = request()->header('X-User-Name', '');
            $headers['X-User-Role'] = request()->header('X-User-Role', '');
            $headers['X-User-Permissions'] = request()->header('X-User-Permissions', '');
        }

        try {
            $response = Http::withHeaders($headers)
                ->timeout($this->timeout)
                ->retry($this->retryCount, 100, function (Exception $exception) {
                    return $exception instanceof \Illuminate\Http\Client\ConnectionException;
                })
                ->send($method, $url, $options);

            if (! $response->successful()) {
                Log::warning("Inter-service request [{$method} {$url}] failed with status {$response->status()}", [
                    'correlation_id' => $correlationId,
                    'response' => $response->body(),
                ]);
            }

            return [
                'status' => $response->status(),
                'success' => $response->successful(),
                'data' => $response->json(),
                'body' => $response->body(),
            ];
        } catch (Throwable $e) {
            Log::error("Inter-service call to [{$method} {$url}] threw an exception: {$e->getMessage()}", [
                'correlation_id' => $correlationId,
                'exception' => $e,
            ]);

            return [
                'status' => 503,
                'success' => false,
                'data' => null,
                'errors' => ['message' => 'Service temporarily unavailable', 'details' => $e->getMessage()],
            ];
        }
    }
}
