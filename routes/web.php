<?php

use App\Http\Controllers\AiController;
use App\Http\Controllers\Auth\AuthController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return view('welcome');
});

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->name('login.store');
    Route::post('/register', [AuthController::class, 'register'])->name('register.store');
});

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', fn () => Inertia::render('Dashboard'))->middleware('can:view-core-dashboard')->name('dashboard');
    Route::get('/crm', fn () => Inertia::render('CRM/Index'))->middleware('can:view-crm')->name('crm');
    Route::get('/inquiries', fn () => Inertia::render('CRM/Index'))->middleware('can:view-crm')->name('inquiries');
    Route::get('/sales-opportunities', fn () => Inertia::render('CRM/Opportunities'))->middleware('can:view-crm')->name('sales-opportunities');
    Route::get('/crm/quotations', fn () => Inertia::render('CRM/Quotations'))->middleware('can:view-crm')->name('crm.quotations');
    Route::get('/quotations', fn () => Inertia::render('CRM/Quotations'))->middleware('can:view-crm')->name('quotations');
    Route::get('/clients', fn () => Inertia::render('Customers/Index'))->middleware('can:view-clients')->name('clients');
    Route::get('/customers', fn () => Inertia::render('Customers/Index'))->middleware('can:view-clients')->name('customers');
    Route::get('/rental-requirements', fn () => Inertia::render('RentalRequirements/Index'))->middleware('can:view-rentals')->name('rental-requirements');
    Route::get('/job-orders', fn () => Inertia::render('JobOrders/Index'))->middleware('can:manage-job-orders')->name('job-orders');
    Route::get('/projects', fn () => Inertia::render('Projects/Index'))->middleware('can:view-projects')->name('projects');
    Route::get('/record/{type}/{id}', fn (string $type, int $id) => Inertia::render('Records/Show', ['type' => $type, 'recordId' => $id]))->middleware('can:view-core-dashboard')->name('record.show');
    Route::get('/reports', fn () => Inertia::render('Reports/Index'))->middleware('can:view-core-dashboard')->name('reports');
    Route::get('/ai-analytics', fn () => Inertia::render('AiAnalytics/Index'))->middleware('can:view-reports')->name('ai-analytics');
    Route::get('/users', fn () => Inertia::render('Users/Index'))->middleware('can:manage-users')->name('users');
    Route::get('/settings', fn () => Inertia::render('Settings/Index'))->name('settings');
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
});

Route::get('/ai', [AiController::class, 'index'])->name('ai.index');
Route::post('/ai/ask', [AiController::class, 'askAi'])->name('ai.ask');