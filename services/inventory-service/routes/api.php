<?php

use Illuminate\Support\Facades\Route;
use IntelliTrack\Services\Inventory\Controllers\EquipmentController;

Route::middleware(['correlation'])->group(function () {
    Route::get('/equipment', [EquipmentController::class, 'index']);
    Route::post('/equipment', [EquipmentController::class, 'store']);
    Route::get('/equipment/{id}', [EquipmentController::class, 'show']);
    Route::put('/equipment/{id}', [EquipmentController::class, 'update']);
    Route::delete('/equipment/{id}', [EquipmentController::class, 'destroy']);
    
    // Maintenance sub-routes
    Route::get('/equipment/{id}/maintenance', [EquipmentController::class, 'maintenance']);
    Route::post('/equipment/{id}/maintenance', [EquipmentController::class, 'scheduleMaintenance']);
});
