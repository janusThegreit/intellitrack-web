<?php

namespace IntelliTrack\Shared\Http;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class ApiResponse
{
    /**
     * Return a standardized success JSON response.
     */
    public static function success(
        mixed $data = null,
        string $message = 'Success',
        int $code = Response::HTTP_OK,
        array $meta = []
    ): JsonResponse {
        $correlationId = request()->header('X-Correlation-ID', (string) \Illuminate\Support\Str::uuid());

        $payload = [
            'success' => true,
            'message' => $message,
            'data' => $data,
            'meta' => array_merge([
                'timestamp' => now()->toIso8601String(),
                'correlation_id' => $correlationId,
            ], $meta),
        ];

        return response()->json($payload, $code)
            ->header('X-Correlation-ID', $correlationId);
    }

    /**
     * Return a standardized created (201) JSON response.
     */
    public static function created(
        mixed $data = null,
        string $message = 'Resource created successfully'
    ): JsonResponse {
        return self::success($data, $message, Response::HTTP_CREATED);
    }

    /**
     * Return a standardized error JSON response.
     */
    public static function error(
        string $message = 'An error occurred',
        int $code = Response::HTTP_BAD_REQUEST,
        mixed $errors = null,
        string $errorCode = 'ERROR'
    ): JsonResponse {
        $correlationId = request()->header('X-Correlation-ID', (string) \Illuminate\Support\Str::uuid());

        $payload = [
            'success' => false,
            'message' => $message,
            'error_code' => $errorCode,
            'errors' => $errors,
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'correlation_id' => $correlationId,
            ],
        ];

        return response()->json($payload, $code)
            ->header('X-Correlation-ID', $correlationId);
    }

    /**
     * Return an unauthorized (401) response.
     */
    public static function unauthorized(string $message = 'Unauthorized'): JsonResponse
    {
        return self::error($message, Response::HTTP_UNAUTHORIZED, null, 'UNAUTHORIZED');
    }

    /**
     * Return a forbidden (403) response.
     */
    public static function forbidden(string $message = 'Forbidden access'): JsonResponse
    {
        return self::error($message, Response::HTTP_FORBIDDEN, null, 'FORBIDDEN');
    }

    /**
     * Return a not found (404) response.
     */
    public static function notFound(string $message = 'Resource not found'): JsonResponse
    {
        return self::error($message, Response::HTTP_NOT_FOUND, null, 'NOT_FOUND');
    }

    /**
     * Return an unprocessable entity (422) validation response.
     */
    public static function validationError(mixed $errors, string $message = 'Validation failed'): JsonResponse
    {
        return self::error($message, Response::HTTP_UNPROCESSABLE_ENTITY, $errors, 'VALIDATION_ERROR');
    }
}
