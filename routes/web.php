<?php

use App\Http\Controllers\AiController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\PasswordResetRequestController;
use App\Http\Controllers\ClientPortalController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (Auth::check()) {
        $user = Auth::user();

        if ($user?->isClient()) {
            return redirect('/portal');
        }

        return redirect('/dashboard');
    }

    return Inertia::render('LandingPage');
})->name('home');

Route::get('/maintenance', fn () => Inertia::render('Maintenance'))->name('maintenance');

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login');
    Route::get('/register', [AuthController::class, 'showRegisterForm'])->name('register');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1')->name('login.store');
    Route::post('/login/verify-otp', [AuthController::class, 'verifyOtp'])->middleware('throttle:15,1')->name('login.verify-otp');
    Route::post('/login/resend-otp', [AuthController::class, 'resendOtp'])->middleware('throttle:5,1')->name('login.resend-otp');
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1')->name('register.store');
    
    // Administrator-Assisted Password Reset Routes
    Route::post('/password/request-reset', [PasswordResetRequestController::class, 'submitRequest'])->middleware('throttle:10,1')->name('password.request');
    Route::get('/reset-password/{token}', [PasswordResetRequestController::class, 'showResetForm'])->name('password.reset');
    Route::post('/reset-password', [PasswordResetRequestController::class, 'resetPassword'])->middleware('throttle:10,1')->name('password.update');
});

Route::middleware('auth')->group(function () {
    Route::get('/portal', [ClientPortalController::class, 'dashboard'])->middleware('can:access-client-portal')->name('portal');
    Route::get('/portal/profile', [ClientPortalController::class, 'profile'])->middleware('can:access-client-portal')->name('portal.profile');
    Route::get('/portal/inquiries', [ClientPortalController::class, 'inquiries'])->middleware('can:access-client-portal')->name('portal.inquiries');
    Route::post('/portal/inquiries', [ClientPortalController::class, 'storeInquiry'])->middleware('can:access-client-portal')->name('portal.inquiries.store');
    Route::get('/portal/quotations', [ClientPortalController::class, 'quotations'])->middleware('can:access-client-portal')->name('portal.quotations');
    Route::get('/portal/job-orders', [ClientPortalController::class, 'jobOrders'])->middleware('can:access-client-portal')->name('portal.job-orders');
    Route::get('/portal/rentals', [ClientPortalController::class, 'rentals'])->middleware('can:access-client-portal')->name('portal.rentals');
    Route::get('/portal/projects', [ClientPortalController::class, 'projects'])->middleware('can:access-client-portal')->name('portal.projects');
    Route::get('/portal/feedback', [ClientPortalController::class, 'feedback'])->middleware('can:access-client-portal')->name('portal.feedback');
    Route::post('/portal/feedback', [ClientPortalController::class, 'storeFeedback'])->middleware('can:access-client-portal')->name('portal.feedback.store');
    Route::put('/portal/profile', [ClientPortalController::class, 'updateProfile'])->middleware('can:access-client-portal')->name('portal.profile.update');
    Route::get('/dashboard', fn () => Inertia::render('Dashboard'))->middleware('can:view-core-dashboard')->name('dashboard');
    Route::get('/crm', fn () => Inertia::render('CRM/Index'))->middleware('can:view-crm')->name('crm');
    Route::get('/inquiries', fn () => Inertia::render('CRM/Index'))->middleware('can:view-crm')->name('inquiries');
    Route::get('/sales-opportunities', fn () => Inertia::render('CRM/Opportunities'))->middleware('can:view-crm')->name('sales-opportunities');
    Route::get('/crm/quotations', fn () => Inertia::render('CRM/Quotations'))->middleware('can:view-crm')->name('crm.quotations');
    Route::get('/quotations', fn () => Inertia::render('CRM/Quotations'))->middleware('can:view-crm')->name('quotations');
    Route::get('/clients', fn () => Inertia::render('Customers/Index'))->middleware('can:view-clients')->name('clients');
    Route::get('/customers', fn () => Inertia::render('Customers/Index'))->middleware('can:view-clients')->name('customers');
    Route::get('/crm/customers', fn () => Inertia::render('Customers/Index'))->middleware('can:view-clients')->name('crm.customers');
    Route::get('/crm/inquiries', fn () => Inertia::render('CRM/Index'))->middleware('can:view-crm')->name('crm.inquiries');
    Route::get('/crm/follow-ups', fn () => Inertia::render('CRM/FollowUps'))->middleware('can:view-crm')->name('crm.follow-ups');
    Route::get('/crm/communications', fn () => Inertia::render('CRM/Communications'))->middleware('can:view-crm')->name('crm.communications');
    Route::get('/crm/feedback', fn () => Inertia::render('CRM/Feedback'))->middleware('can:view-crm')->name('crm.feedback');

    Route::get('/rental-requirements', fn () => Inertia::render('Rentals/Index'))->middleware('can:view-rentals')->name('rental-requirements');
    Route::get('/equipment', fn () => Inertia::render('Rentals/Index'))->middleware('can:view-rentals')->name('equipment');
    Route::get('/equipment/availability', fn () => Inertia::render('Rentals/Index'))->middleware('can:view-rentals')->name('equipment.availability');
    Route::get('/rentals', fn () => Inertia::render('Rentals/Index'))->middleware('can:view-rentals')->name('rentals');
    Route::get('/fleet-rentals', fn () => Inertia::render('Rentals/Index'))->middleware('can:view-rentals')->name('fleet-rentals');

    Route::get('/job-orders', fn () => Inertia::render('JobOrders/Index'))->middleware('can:manage-job-orders')->name('job-orders');
    Route::get('/job-orders/requests', fn () => Inertia::render('JobOrders/Index', ['view' => 'requests']))->middleware('can:manage-job-orders')->name('job-orders.requests');
    Route::get('/job-orders/tracking', fn () => Inertia::render('JobOrders/Index', ['view' => 'tracking']))->middleware('can:manage-job-orders')->name('job-orders.tracking');
    Route::get('/job-orders/completion', fn () => Inertia::render('JobOrders/Index', ['view' => 'completion']))->middleware('can:manage-job-orders')->name('job-orders.completion');
    Route::get('/projects', fn () => Inertia::render('Projects/Index'))->middleware('can:view-projects')->name('projects');
    Route::get('/record/{type}/{id}', fn (string $type, int $id) => Inertia::render('Records/Show', ['type' => $type, 'recordId' => $id]))->middleware('can:view-core-dashboard')->name('record.show');
    Route::get('/reports', fn () => Inertia::render('Reports/Index'))->middleware('can:view-reports')->name('reports');
    Route::get('/ai-analytics', fn () => Inertia::render('AiAnalytics/Index'))->middleware('can:view-ai-analytics')->name('ai-analytics');
    Route::get('/users', fn () => Inertia::render('Users/Index'))->middleware('can:manage-users')->name('users');
    Route::get('/roles', fn () => Inertia::render('Roles/Index'))->middleware('can:manage-users')->name('roles');
    Route::get('/logs', fn () => Inertia::render('Logs/Index'))->middleware('can:manage-users')->name('logs');
    Route::get('/settings', fn () => Inertia::render('Settings/Index'))->middleware('can:manage-system-settings')->name('settings');
    Route::get('/ai', [AiController::class, 'index'])->middleware('can:view-reports')->name('ai.index');
    Route::post('/ai/ask', [AiController::class, 'askAi'])->middleware('can:view-reports')->name('ai.ask');
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
});