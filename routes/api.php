<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\EquipmentController;
use App\Http\Controllers\Api\JobOrderController;
use App\Http\Controllers\Api\RentalController;
use App\Http\Controllers\Api\QuotationController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\RentalRequirementController;
use App\Http\Controllers\Api\SalesAnalyticsController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\GlobalSearchController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Auth\AuthController;

Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:5,1');

Route::middleware(['web', 'auth'])->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('profile', [ProfileController::class, 'show']);
    Route::put('profile', [ProfileController::class, 'update']);
    Route::post('profile/avatar', [ProfileController::class, 'updateAvatar']);
    Route::put('profile/password', [ProfileController::class, 'updatePassword']);
    Route::get('search', [GlobalSearchController::class, 'index']);

    // System Settings & Maintenance Mode
    Route::get('system/maintenance', function (Illuminate\Http\Request $request) {
        if ($request->user()->role !== 'administrator') {
            abort(403, 'Unauthorized action.');
        }

        $dbStatus = 'Operational';
        try {
            \Illuminate\Support\Facades\DB::connection()->getPdo();
        } catch (\Throwable $e) {
            $dbStatus = 'Degraded: ' . $e->getMessage();
        }

        return response()->json([
            'enabled' => \Illuminate\Support\Facades\Cache::get('system_maintenance_mode', false),
            'broadcast_message' => \Illuminate\Support\Facades\Cache::get('system_maintenance_message', 'IntelliTrack is currently undergoing scheduled maintenance to improve our services and reliability. We apologize for any inconvenience.'),
            'started_at' => \Illuminate\Support\Facades\Cache::get('system_maintenance_started_at', null),
            'telemetry' => [
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
                'environment' => app()->environment(),
                'db_status' => $dbStatus,
                'cache_driver' => config('cache.default'),
                'server_time' => now()->toIso8601String(),
                'admin_count' => \App\Models\User::where('role', 'administrator')->count(),
                'total_users' => \App\Models\User::count(),
            ],
        ]);
    });

    Route::post('system/maintenance', function (Illuminate\Http\Request $request) {
        if ($request->user()->role !== 'administrator') {
            abort(403, 'Unauthorized action.');
        }

        $isEnabled = $request->boolean('enabled');
        $broadcastMessage = $request->input('broadcast_message');

        \Illuminate\Support\Facades\Cache::put('system_maintenance_mode', $isEnabled);

        if ($broadcastMessage) {
            \Illuminate\Support\Facades\Cache::put('system_maintenance_message', $broadcastMessage);
        }

        if ($isEnabled) {
            if (! \Illuminate\Support\Facades\Cache::has('system_maintenance_started_at')) {
                \Illuminate\Support\Facades\Cache::put('system_maintenance_started_at', now()->toIso8601String());
            }
        } else {
            \Illuminate\Support\Facades\Cache::forget('system_maintenance_started_at');
        }

        \App\Services\ActivityLogService::logSecurity(
            'system_maintenance',
            'System maintenance mode was ' . ($isEnabled ? 'ACTIVATED (Restricted)' : 'DEACTIVATED (Online)') . ' by administrator.',
            $request->user(),
            [
                'enabled' => $isEnabled,
                'broadcast_message' => $broadcastMessage,
            ]
        );

        return response()->json([
            'message' => 'System maintenance mode ' . ($isEnabled ? 'activated successfully' : 'deactivated successfully') . '.',
            'enabled' => $isEnabled,
            'broadcast_message' => \Illuminate\Support\Facades\Cache::get('system_maintenance_message'),
        ]);
    });

    // Customer Routes
    Route::get('customers/export', [CustomerController::class, 'export']);
    Route::apiResource('customers', CustomerController::class);
    Route::post('customers/{customer}/archive', [CustomerController::class, 'archive']);
    Route::post('customers/{customer}/restore', [CustomerController::class, 'restore']);
    Route::get('customers/{customer}/job-orders', [CustomerController::class, 'jobOrders']);
    Route::get('customers/{customer}/rentals', [CustomerController::class, 'rentals']);
    Route::get('customers/{customer}/quotations', [CustomerController::class, 'quotations']);

    // CRM Engagement Routes (Follow-ups, Communications, Feedback, Metrics)
    Route::get('crm/metrics', [\App\Http\Controllers\Api\CrmEngagementController::class, 'metrics']);
    Route::get('crm/follow-ups', [\App\Http\Controllers\Api\CrmEngagementController::class, 'indexFollowUps']);
    Route::post('crm/follow-ups', [\App\Http\Controllers\Api\CrmEngagementController::class, 'storeFollowUp']);
    Route::patch('crm/follow-ups/{followUp}/complete', [\App\Http\Controllers\Api\CrmEngagementController::class, 'completeFollowUp']);
    Route::delete('crm/follow-ups/{followUp}', [\App\Http\Controllers\Api\CrmEngagementController::class, 'destroyFollowUp']);

    Route::get('crm/communications', [\App\Http\Controllers\Api\CrmEngagementController::class, 'indexCommunications']);
    Route::post('crm/communications', [\App\Http\Controllers\Api\CrmEngagementController::class, 'storeCommunication']);

    Route::get('crm/feedback', [\App\Http\Controllers\Api\CrmEngagementController::class, 'indexFeedback']);
    Route::post('crm/feedback', [\App\Http\Controllers\Api\CrmEngagementController::class, 'storeFeedback']);

    // CRM Inquiry Routes
    Route::apiResource('customer-inquiries', \App\Http\Controllers\Api\CustomerInquiryController::class);
    Route::post('customer-inquiries/{customerInquiry}/status', [\App\Http\Controllers\Api\CustomerInquiryController::class, 'updateStatus']);
    Route::post('customer-inquiries/{customerInquiry}/convert-to-quotation', [\App\Http\Controllers\Api\CustomerInquiryController::class, 'convertToQuotation']);

    // Tower crane rental requirements
    Route::apiResource('rental-requirements', RentalRequirementController::class);
    Route::post('rental-requirements/{rentalRequirement}/assess', [RentalRequirementController::class, 'assess']);

    // Equipment Routes
    Route::apiResource('equipment', EquipmentController::class);
    Route::get('equipment/{equipment}/rentals', [EquipmentController::class, 'rentals']);
    Route::get('equipment/{equipment}/maintenance', [EquipmentController::class, 'maintenance']);
    Route::post('equipment/{equipment}/maintenance', [EquipmentController::class, 'scheduleMaintenance']);
    Route::post('equipment/{equipment}/deploy', [EquipmentController::class, 'deploy']);
    Route::post('equipment/{equipment}/demobilize', [EquipmentController::class, 'demobilize']);
    Route::post('equipment/{equipment}/complete-maintenance', [EquipmentController::class, 'completeMaintenance']);

    // Job Order Routes
    Route::apiResource('job-orders', JobOrderController::class);
    Route::post('job-orders/{jobOrder}/items', [JobOrderController::class, 'addItem']);
    Route::put('job-orders/{jobOrder}/items/{item}', [JobOrderController::class, 'updateItem']);
    Route::delete('job-orders/{jobOrder}/items/{item}', [JobOrderController::class, 'deleteItem']);
    Route::patch('job-orders/{jobOrder}/status', [JobOrderController::class, 'updateStatus']);
    Route::post('job-orders/{jobOrder}/assign', [JobOrderController::class, 'assign']);
    Route::post('job-orders/{jobOrder}/schedule', [JobOrderController::class, 'schedule']);

    // Rental Routes
    Route::apiResource('rentals', RentalController::class);
    Route::post('rentals/{rental}/return', [RentalController::class, 'returnEquipment']);
    Route::get('rentals/overdue', [RentalController::class, 'overdue']);

    // Quotation Routes
    Route::apiResource('quotations', QuotationController::class);
    Route::post('quotations/{quotation}/submit', [QuotationController::class, 'submitForApproval']);
    Route::post('quotations/{quotation}/approve', [QuotationController::class, 'approve']);
    Route::post('quotations/{quotation}/revise', [QuotationController::class, 'requestRevision']);
    Route::post('quotations/{quotation}/send', [QuotationController::class, 'send']);
    Route::post('quotations/{quotation}/accept', [QuotationController::class, 'accept']);
    Route::post('quotations/{quotation}/reject', [QuotationController::class, 'reject']);
    Route::post('quotations/{quotation}/customer-response', [QuotationController::class, 'recordCustomerResponse']);
    Route::post('quotations/{quotation}/convert-to-job-order', [QuotationController::class, 'convertToJobOrder']);
    Route::post('quotations/{quotation}/convert-to-project', [QuotationController::class, 'convertToProject']);

    // Project Routes
    Route::apiResource('projects', ProjectController::class);
    Route::get('projects/{project}/tasks', [ProjectController::class, 'indexTasks']);
    Route::post('projects/{project}/tasks', [ProjectController::class, 'storeTask']);
    Route::patch('project-tasks/{task}/status', [ProjectController::class, 'updateTaskStatus']);

    // Dashboard
    Route::get('dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('dashboard/recent-activities', [DashboardController::class, 'recentActivities']);
    Route::get('dashboard/notifications', [DashboardController::class, 'notifications']);
    Route::patch('dashboard/notifications/{notification}/read', [DashboardController::class, 'markNotificationRead']);
    Route::post('dashboard/notifications/read-all', [DashboardController::class, 'markAllNotificationsRead']);

    // Role and access control
    Route::get('roles', [RoleController::class, 'index']);
    Route::get('assignable-staff', [RoleController::class, 'assignableStaff']);
    Route::get('users', [RoleController::class, 'users']);
    Route::get('users/{user}', [RoleController::class, 'show']);
    Route::post('users', [RoleController::class, 'store']);
    Route::put('users/{user}', [RoleController::class, 'update']);
    Route::delete('users/{user}', [RoleController::class, 'destroy']);
    Route::put('users/{user}/role', [RoleController::class, 'updateUserRole']);
    Route::patch('users/{user}/status', [RoleController::class, 'updateUserStatus']);

    // Security & System Audit Logs
    Route::get('logs', [AuditLogController::class, 'index']);
    Route::get('logs/export', [AuditLogController::class, 'export']);
    Route::get('logs/{log}', [AuditLogController::class, 'show']);

    // AI analytics decision-support data
    Route::get('analytics/summary', [SalesAnalyticsController::class, 'summary']);
    Route::post('analytics/copilot', [SalesAnalyticsController::class, 'copilot']);

    // Reports
    Route::get('reports/job-orders', [ReportController::class, 'jobOrderReport']);
    Route::get('reports/rentals', [ReportController::class, 'rentalReport']);
    Route::get('reports/customers', [ReportController::class, 'customerReport']);
    Route::get('reports/revenue', [ReportController::class, 'revenueReport']);
});
