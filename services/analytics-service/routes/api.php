<?php

use Illuminate\Support\Facades\Route;
use IntelliTrack\Services\Analytics\Controllers\SalesAnalyticsController;
use IntelliTrack\Services\Analytics\Controllers\ReportController;

Route::middleware(['correlation'])->group(function () {
    // Sales analytics
    Route::get('/analytics/summary', [SalesAnalyticsController::class, 'summary']);

    // BI Reports
    Route::get('/reports/job-orders', [ReportController::class, 'jobOrderReport']);
    Route::get('/reports/rentals', [ReportController::class, 'rentalReport']);
    Route::get('/reports/customers', [ReportController::class, 'customerReport']);
    Route::get('/reports/revenue', [ReportController::class, 'revenueReport']);
});
