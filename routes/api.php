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
use App\Http\Controllers\Auth\AuthController;

Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);

Route::middleware(['web', 'auth'])->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('profile', [ProfileController::class, 'show']);
    Route::put('profile', [ProfileController::class, 'update']);
    Route::post('profile/avatar', [ProfileController::class, 'updateAvatar']);
    Route::put('profile/password', [ProfileController::class, 'updatePassword']);
    Route::get('search', [GlobalSearchController::class, 'index']);

    // Customer Routes
    Route::apiResource('customers', CustomerController::class);
    Route::post('customers/{customer}/archive', [CustomerController::class, 'archive']);
    Route::post('customers/{customer}/restore', [CustomerController::class, 'restore']);
    Route::get('customers/{customer}/job-orders', [CustomerController::class, 'jobOrders']);
    Route::get('customers/{customer}/rentals', [CustomerController::class, 'rentals']);
    Route::get('customers/{customer}/quotations', [CustomerController::class, 'quotations']);

    // CRM Inquiry Routes
    Route::apiResource('customer-inquiries', \App\Http\Controllers\Api\CustomerInquiryController::class);
    Route::post('customer-inquiries/{customerInquiry}/status', [\App\Http\Controllers\Api\CustomerInquiryController::class, 'updateStatus']);

    // Tower crane rental requirements
    Route::apiResource('rental-requirements', RentalRequirementController::class);
    Route::post('rental-requirements/{rentalRequirement}/assess', [RentalRequirementController::class, 'assess']);

    // Equipment Routes
    Route::apiResource('equipment', EquipmentController::class);
    Route::get('equipment/{equipment}/rentals', [EquipmentController::class, 'rentals']);
    Route::get('equipment/{equipment}/maintenance', [EquipmentController::class, 'maintenance']);
    Route::post('equipment/{equipment}/maintenance', [EquipmentController::class, 'scheduleMaintenance']);

    // Job Order Routes
    Route::apiResource('job-orders', JobOrderController::class);
    Route::post('job-orders/{jobOrder}/items', [JobOrderController::class, 'addItem']);
    Route::put('job-orders/{jobOrder}/items/{item}', [JobOrderController::class, 'updateItem']);
    Route::delete('job-orders/{jobOrder}/items/{item}', [JobOrderController::class, 'deleteItem']);
    Route::patch('job-orders/{jobOrder}/status', [JobOrderController::class, 'updateStatus']);
    Route::post('job-orders/{jobOrder}/assign', [JobOrderController::class, 'assign']);

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

    // Project Routes
    Route::apiResource('projects', ProjectController::class);
    Route::apiResource('projects.tasks', ProjectController::class);
    Route::patch('project-tasks/{task}/status', [ProjectController::class, 'updateTaskStatus']);

    // Dashboard
    Route::get('dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('dashboard/recent-activities', [DashboardController::class, 'recentActivities']);
    Route::get('dashboard/notifications', [DashboardController::class, 'notifications']);
    Route::patch('dashboard/notifications/{notification}/read', [DashboardController::class, 'markNotificationRead']);
    Route::post('dashboard/notifications/read-all', [DashboardController::class, 'markAllNotificationsRead']);

    // Role and access control
    Route::get('roles', [RoleController::class, 'index']);
    Route::put('users/{user}/role', [RoleController::class, 'updateUserRole']);
    Route::get('users', [RoleController::class, 'users']);
    Route::patch('users/{user}/status', [RoleController::class, 'updateUserStatus']);

    // AI analytics decision-support data
    Route::get('analytics/summary', [SalesAnalyticsController::class, 'summary']);

    // Reports
    Route::get('reports/job-orders', [ReportController::class, 'jobOrderReport']);
    Route::get('reports/rentals', [ReportController::class, 'rentalReport']);
    Route::get('reports/customers', [ReportController::class, 'customerReport']);
    Route::get('reports/revenue', [ReportController::class, 'revenueReport']);
});
