<?php

use Illuminate\Support\Facades\Route;
use IntelliTrack\Services\Project\Controllers\ProjectController;

Route::middleware(['correlation'])->group(function () {
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::post('/projects', [ProjectController::class, 'store']);
    Route::get('/projects/{id}', [ProjectController::class, 'show']);
    Route::put('/projects/{id}', [ProjectController::class, 'update']);
    Route::delete('/projects/{id}', [ProjectController::class, 'destroy']);
    
    // Project tasks
    Route::post('/projects/{id}/tasks', [ProjectController::class, 'storeTask']);
    Route::patch('/project-tasks/{taskId}/status', [ProjectController::class, 'updateTaskStatus']);
});
