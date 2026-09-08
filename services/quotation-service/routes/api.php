<?php

use Illuminate\Support\Facades\Route;
use IntelliTrack\Services\Quotation\Controllers\QuotationController;
use IntelliTrack\Services\Quotation\Controllers\RentalRequirementController;

Route::middleware(['correlation'])->group(function () {
    // Quotations CRUD & Lifecycle
    Route::get('/quotations', [QuotationController::class, 'index']);
    Route::post('/quotations', [QuotationController::class, 'store']);
    Route::get('/quotations/{id}', [QuotationController::class, 'show']);
    Route::post('/quotations/{id}/submit', [QuotationController::class, 'submit']);
    Route::post('/quotations/{id}/approve', [QuotationController::class, 'approve']);
    Route::post('/quotations/{id}/revise', [QuotationController::class, 'requestRevision']);
    Route::post('/quotations/{id}/send', [QuotationController::class, 'send']);
    Route::post('/quotations/{id}/accept', [QuotationController::class, 'accept']);
    Route::post('/quotations/{id}/reject', [QuotationController::class, 'reject']);

    // Rental Requirements
    Route::get('/rental-requirements', [RentalRequirementController::class, 'index']);
    Route::post('/rental-requirements', [RentalRequirementController::class, 'store']);
    Route::post('/rental-requirements/{id}/assess', [RentalRequirementController::class, 'assess']);
});
