<?php

use Illuminate\Support\Facades\Route;
use IntelliTrack\Services\Gateway\Controllers\GatewayProxyController;
use IntelliTrack\Services\Gateway\Controllers\AggregatorController;

// Gateway Health check
Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'gateway' => 'IntelliTrack-ApiGateway',
        'timestamp' => now()->toIso8601String(),
    ]);
});

// Composite & Aggregated Endpoints
Route::get('/dashboard/summary', [AggregatorController::class, 'dashboardSummary']);
Route::get('/search', [AggregatorController::class, 'search']);

// Service 1: Auth & IAM Service (Port 8001)
Route::any('/auth/{path?}', function ($path = '') {
    return app(GatewayProxyController::class)->proxy(request(), 'auth', 'auth/' . $path);
})->where('path', '.*');

Route::any('/users/{path?}', function ($path = '') {
    return app(GatewayProxyController::class)->proxy(request(), 'auth', 'users/' . $path);
})->where('path', '.*');

Route::any('/roles/{path?}', function ($path = '') {
    return app(GatewayProxyController::class)->proxy(request(), 'auth', 'roles/' . $path);
})->where('path', '.*');

Route::any('/profile/{path?}', function ($path = '') {
    return app(GatewayProxyController::class)->proxy(request(), 'auth', 'profile/' . $path);
})->where('path', '.*');

// Service 2: Customer & CRM Service (Port 8002)
Route::any('/customers/{path?}', function ($path = '') {
    return app(GatewayProxyController::class)->proxy(request(), 'customer', 'customers/' . $path);
})->where('path', '.*');

Route::any('/customer-inquiries/{path?}', function ($path = '') {
    return app(GatewayProxyController::class)->proxy(request(), 'customer', 'customer-inquiries/' . $path);
})->where('path', '.*');

// Service 3: Inventory & Equipment Service (Port 8003)
Route::any('/equipment/{path?}', function ($path = '') {
    return app(GatewayProxyController::class)->proxy(request(), 'inventory', 'equipment/' . $path);
})->where('path', '.*');

// Service 4: Quotation & Commercial Service (Port 8004)
Route::any('/quotations/{path?}', function ($path = '') {
    return app(GatewayProxyController::class)->proxy(request(), 'quotation', 'quotations/' . $path);
})->where('path', '.*');

Route::any('/rental-requirements/{path?}', function ($path = '') {
    return app(GatewayProxyController::class)->proxy(request(), 'quotation', 'rental-requirements/' . $path);
})->where('path', '.*');

// Service 5: Rental & Operations Service (Port 8005)
Route::any('/rentals/{path?}', function ($path = '') {
    return app(GatewayProxyController::class)->proxy(request(), 'rental', 'rentals/' . $path);
})->where('path', '.*');

Route::any('/job-orders/{path?}', function ($path = '') {
    return app(GatewayProxyController::class)->proxy(request(), 'rental', 'job-orders/' . $path);
})->where('path', '.*');

// Service 6: Project Management Service (Port 8006)
Route::any('/projects/{path?}', function ($path = '') {
    return app(GatewayProxyController::class)->proxy(request(), 'project', 'projects/' . $path);
})->where('path', '.*');

Route::any('/project-tasks/{path?}', function ($path = '') {
    return app(GatewayProxyController::class)->proxy(request(), 'project', 'project-tasks/' . $path);
})->where('path', '.*');

// Service 7: Notification & Audit Service (Port 8007)
Route::any('/dashboard/notifications/{path?}', function ($path = '') {
    return app(GatewayProxyController::class)->proxy(request(), 'notification', 'dashboard/notifications/' . $path);
})->where('path', '.*');

Route::any('/dashboard/recent-activities', function () {
    return app(GatewayProxyController::class)->proxy(request(), 'notification', 'dashboard/recent-activities');
});

Route::any('/logs/{path?}', function ($path = '') {
    return app(GatewayProxyController::class)->proxy(request(), 'notification', 'logs/' . $path);
})->where('path', '.*');

// Service 8: Analytics & Reporting Service (Port 8008)
Route::any('/analytics/{path?}', function ($path = '') {
    return app(GatewayProxyController::class)->proxy(request(), 'analytics', 'analytics/' . $path);
})->where('path', '.*');

Route::any('/reports/{path?}', function ($path = '') {
    return app(GatewayProxyController::class)->proxy(request(), 'analytics', 'reports/' . $path);
})->where('path', '.*');
