<?php

namespace App\Providers;

use App\Models\Customer;
use App\Models\JobOrder;
use App\Models\Quotation;
use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Core Dashboard View
        Gate::define('view-core-dashboard', function (User $user) {
            return ($user->isAdministrator() || $user->isSalesManager() || $user->isSalesBusinessDevelopment()) && $user->is_active;
        });

        // CRM View & Management
        Gate::define('view-crm', function (User $user) {
            return ($user->isSalesManager() || $user->isSalesBusinessDevelopment()) && $user->is_active;
        });

        Gate::define('manage-crm', function (User $user) {
            return ($user->isSalesBusinessDevelopment() || $user->isSalesManager()) && $user->is_active;
        });

        // Client Management
        Gate::define('view-clients', function (User $user) {
            return ($user->isSalesManager() || $user->isSalesBusinessDevelopment() || $user->isAdministrator()) && $user->is_active;
        });

        Gate::define('manage-clients', function (User $user) {
            return ($user->isSalesBusinessDevelopment() || $user->isSalesManager() || $user->isAdministrator()) && $user->is_active;
        });

        Gate::define('manage-customers', function (User $user) {
            return ($user->isSalesBusinessDevelopment() || $user->isSalesManager() || $user->isAdministrator()) && $user->is_active;
        });

        Gate::define('view-customer', function (User $user, Customer $customer) {
            return ($user->isSalesBusinessDevelopment() || $user->isSalesManager() || $user->isAdministrator()) && $user->is_active;
        });

        // Quotations & Approvals: Strictly Sales Manager only for approval! SBD & Admin cannot approve.
        Gate::define('approve-quotations', function (User $user) {
            return $user->isSalesManager() && $user->is_active;
        });

        Gate::define('approve-quotation', function (User $user, Quotation $quotation) {
            if (! $user->isSalesManager() || ! $user->is_active) {
                return false;
            }

            // Separation of Duties: Creator cannot approve their own quotation
            if ($user->id === $quotation->created_by) {
                return false;
            }

            return true;
        });

        // Rental Requirements
        Gate::define('view-rentals', function (User $user) {
            return ($user->isSalesManager() || $user->isSalesBusinessDevelopment()) && $user->is_active;
        });

        Gate::define('manage-rentals', function (User $user) {
            return ($user->isSalesBusinessDevelopment() || $user->isSalesManager()) && $user->is_active;
        });

        // Projects (Customer-side)
        Gate::define('view-projects', function (User $user) {
            return ($user->isSalesManager() || $user->isSalesBusinessDevelopment()) && $user->is_active;
        });

        Gate::define('manage-projects', function (User $user) {
            return ($user->isSalesBusinessDevelopment() || $user->isSalesManager()) && $user->is_active;
        });

        // Job Orders
        Gate::define('manage-job-orders', function (User $user) {
            return ($user->isSalesBusinessDevelopment() || $user->isSalesManager()) && $user->is_active;
        });

        Gate::define('manage-job-order', function (User $user, JobOrder $jobOrder) {
            return ($user->isSalesManager() || $user->isSalesBusinessDevelopment() || $user->id === $jobOrder->created_by) && $user->is_active;
        });

        // Reports
        Gate::define('view-reports', function (User $user) {
            return ($user->isSalesManager() || $user->isSalesBusinessDevelopment()) && $user->is_active;
        });

        // AI Analytics: Sales Manager only
        Gate::define('view-ai-analytics', function (User $user) {
            return $user->isSalesManager() && $user->is_active;
        });

        // System & User Administration: Administrator only
        Gate::define('manage-users', function (User $user) {
            return $user->isAdministrator() && $user->is_active;
        });

        Gate::define('manage-system', function (User $user) {
            return $user->isAdministrator() && $user->is_active;
        });
    }
}
