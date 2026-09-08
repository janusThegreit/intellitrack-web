<?php

use Illuminate\Support\Facades\Route;
use IntelliTrack\Services\Customer\Controllers\CustomerController;
use IntelliTrack\Services\Customer\Controllers\CustomerInquiryController;

Route::middleware(['correlation'])->group(function () {
    // Customers CRUD & Actions
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::get('/customers/{id}', [CustomerController::class, 'show']);
    Route::put('/customers/{id}', [CustomerController::class, 'update']);
    Route::delete('/customers/{id}', [CustomerController::class, 'destroy']);
    Route::post('/customers/{id}/archive', [CustomerController::class, 'archive']);
    Route::post('/customers/{id}/restore', [CustomerController::class, 'restore']);

    // Customer CRM Inquiries
    Route::get('/customer-inquiries', [CustomerInquiryController::class, 'index']);
    Route::post('/customer-inquiries', [CustomerInquiryController::class, 'store']);
    Route::get('/customer-inquiries/{id}', [CustomerInquiryController::class, 'show']);
    Route::put('/customer-inquiries/{id}', [CustomerInquiryController::class, 'update']);
    Route::delete('/customer-inquiries/{id}', [CustomerInquiryController::class, 'destroy']);
    Route::post('/customer-inquiries/{id}/status', [CustomerInquiryController::class, 'updateStatus']);
});
