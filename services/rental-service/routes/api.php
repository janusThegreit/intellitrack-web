<?php

use Illuminate\Support\Facades\Route;
use IntelliTrack\Services\Rental\Controllers\RentalController;
use IntelliTrack\Services\Rental\Controllers\JobOrderController;

Route::middleware(['correlation'])->group(function () {
    // Rentals
    Route::get('/rentals', [RentalController::class, 'index']);
    Route::post('/rentals', [RentalController::class, 'store']);
    Route::get('/rentals/overdue', [RentalController::class, 'overdue']);
    Route::get('/rentals/{id}', [RentalController::class, 'show']);
    Route::post('/rentals/{id}/return', [RentalController::class, 'returnEquipment']);

    // Job Orders
    Route::get('/job-orders', [JobOrderController::class, 'index']);
    Route::post('/job-orders', [JobOrderController::class, 'store']);
    Route::get('/job-orders/{id}', [JobOrderController::class, 'show']);
    Route::put('/job-orders/{id}', [JobOrderController::class, 'update']);
    Route::patch('/job-orders/{id}/status', [JobOrderController::class, 'updateStatus']);
    Route::post('/job-orders/{id}/assign', [JobOrderController::class, 'assign']);
    Route::post('/job-orders/{id}/items', [JobOrderController::class, 'addItem']);
    Route::delete('/job-orders/{id}/items/{itemId}', [JobOrderController::class, 'deleteItem']);
});
