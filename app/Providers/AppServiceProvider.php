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
        Gate::define('view-core-dashboard', function (User $user) {
            return $user->isAdministrator() || $user->isSalesManager() || $user->isSalesBusinessDevelopment();
        });

        Gate::define('view-crm', function (User $user) {
            return $user->isAdministrator() || $user->isSalesManager() || $user->isSalesBusinessDevelopment();
        });

        Gate::define('manage-crm', function (User $user) {
            return $user->isAdministrator() || $user->isSalesBusinessDevelopment();
        });

        Gate::define('view-clients', function (User $user) {
            return $user->isAdministrator() || $user->isSalesManager() || $user->isSalesBusinessDevelopment();
        });

        Gate::define('manage-clients', function (User $user) {
            return $user->isAdministrator() || $user->isSalesBusinessDevelopment();
        });

        Gate::define('view-rentals', function (User $user) {
            return $user->isAdministrator() || $user->isSalesManager() || $user->isSalesBusinessDevelopment();
        });

        Gate::define('manage-rentals', function (User $user) {
            return $user->isAdministrator() || $user->isSalesBusinessDevelopment();
        });

        Gate::define('view-projects', function (User $user) {
            return $user->isAdministrator() || $user->isSalesManager() || $user->isSalesBusinessDevelopment();
        });

        Gate::define('manage-projects', function (User $user) {
            return $user->isAdministrator() || $user->isSalesBusinessDevelopment();
        });

        Gate::define('manage-customers', function (User $user) {
            return $user->isAdministrator() || $user->isSalesBusinessDevelopment();
        });

        Gate::define('approve-quotations', function (User $user) {
            return $user->isAdministrator() || $user->isSalesManager();
        });

        Gate::define('manage-job-orders', function (User $user) {
            return $user->isAdministrator() || $user->isSalesBusinessDevelopment() || $user->isSalesManager();
        });

        Gate::define('view-reports', function (User $user) {
            return $user->isAdministrator() || $user->isSalesManager() || $user->isSalesBusinessDevelopment();
        });

        Gate::define('manage-users', function (User $user) {
            return $user->isAdministrator();
        });

        Gate::define('view-customer', function (User $user, Customer $customer) {
            return $user->isAdministrator() || $user->isSalesBusinessDevelopment() || $user->isSalesManager();
        });

        Gate::define('approve-quotation', function (User $user, Quotation $quotation) {
            if (! $user->isAdministrator() && ! $user->isSalesManager()) {
                return false;
            }

            if ($user->id === $quotation->created_by) {
                return false;
            }

            return true;
        });

        Gate::define('manage-job-order', function (User $user, JobOrder $jobOrder) {
            return $user->isAdministrator() || $user->isSalesManager() || $user->isSalesBusinessDevelopment() || $user->id === $jobOrder->created_by;
        });
    }
}
