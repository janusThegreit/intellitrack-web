<?php

use Illuminate\Support\Facades\Route;
use IntelliTrack\Services\Notification\Controllers\NotificationController;
use IntelliTrack\Services\Notification\Controllers\ActivityLogController;

Route::middleware(['correlation'])->group(function () {
    // In-app notifications
    Route::get('/dashboard/notifications', [NotificationController::class, 'index']);
    Route::post('/dashboard/notifications', [NotificationController::class, 'store']);
    Route::patch('/dashboard/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/dashboard/notifications/read-all', [NotificationController::class, 'markAllAsRead']);

    // Activity Logs / Audit Trail
    Route::get('/dashboard/recent-activities', [ActivityLogController::class, 'index']);
    Route::get('/logs', [ActivityLogController::class, 'index']);
    Route::post('/logs', [ActivityLogController::class, 'store']);
});
