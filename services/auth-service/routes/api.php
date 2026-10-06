<?php

use Illuminate\Support\Facades\Route;
use IntelliTrack\Services\Auth\Controllers\AuthController;
use IntelliTrack\Services\Auth\Controllers\RoleController;
use IntelliTrack\Services\Auth\Controllers\UserController;

// Public authentication endpoints
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);

// Auth Service endpoints
Route::middleware(['correlation'])->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Roles and permissions
    Route::middleware('internal_auth')->group(function () {
        Route::get('/roles', [RoleController::class, 'index']);

        // User IAM operations
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
        Route::put('/users/{id}/role', [UserController::class, 'updateUserRole']);
        Route::patch('/users/{id}/status', [UserController::class, 'updateUserStatus']);
    });
});