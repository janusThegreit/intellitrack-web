<?php

namespace App\Policies;

use App\Models\User;
use App\Models\JobOrder;

class JobOrderPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() || $user->isManager() || $user->isStaff();
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, JobOrder $jobOrder): bool
    {
        return $user->isAdmin() || $user->isManager() || $user->isStaff() || 
               $user->id === $jobOrder->created_by || $user->id === $jobOrder->assigned_to;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->isManager() || $user->isStaff();
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, JobOrder $jobOrder): bool
    {
        return $user->isAdmin() || $user->isManager() || $user->id === $jobOrder->created_by;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, JobOrder $jobOrder): bool
    {
        return $user->isAdmin();
    }
}
