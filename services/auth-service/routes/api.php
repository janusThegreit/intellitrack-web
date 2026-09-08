<?php

use Illuminate\Support\Facades\Route;
use IntelliTrack\Services\Auth\Controllers\AuthController;
use IntelliTrack\Services\Auth\Controllers\UserController;
use IntelliTrack\Services\Auth\Controllers\ProfileController;
use IntelliTrack\Services\Auth\Controllers\RoleController;

// Public auth endpoints
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);

// Internal service / Authenticated endpoints
Route::middleware(['correlation'])->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    
    // Profile
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'updatePassword']);
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar']);

    // Roles & Permissions
    Route::get('/roles', [RoleController::class, 'index']);

    // Users IAM CRUD
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
    Route::put('/users/{id}/role', [UserController::class, 'updateUserRole']);
    Route::patch('/users/{id}/status', [UserController::class, 'updateUserStatus']);
});
