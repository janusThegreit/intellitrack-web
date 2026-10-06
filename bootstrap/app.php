<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

$apiRoutes = env('SERVICE_NAME') === 'auth-service'
    ? __DIR__.'/../services/auth-service/routes/api.php'
    : __DIR__.'/../routes/api.php';

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: $apiRoutes,
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->redirectGuestsTo('/login');
        $middleware->alias([
            'correlation' => \IntelliTrack\Shared\Middleware\CorrelationIdMiddleware::class,
            'internal_auth' => \IntelliTrack\Shared\Middleware\InternalServiceAuthMiddleware::class,
        ]);
        $middleware->web(append: [
            \IntelliTrack\Shared\Middleware\CorrelationIdMiddleware::class,
            \App\Http\Middleware\RoleBasedMaintenanceMode::class,
            \App\Http\Middleware\HandleInertiaRequests::class,
        ]);
        $middleware->api(append: [
            \IntelliTrack\Shared\Middleware\CorrelationIdMiddleware::class,
            \App\Http\Middleware\RoleBasedMaintenanceMode::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
