<?php

namespace IntelliTrack\Services\Auth\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use IntelliTrack\Shared\Http\ApiResponse;

class RoleController extends Controller
{
    /**
     * Get system roles and their permission definitions.
     */
    public function index()
    {
        $roles = [
            [
                'id' => 'super_admin',
                'name' => 'Super Admin',
                'description' => 'Unrestricted access to all modules, users, security, and settings.',
                'permissions' => ['all'],
            ],
            [
                'id' => 'admin',
                'name' => 'Admin',
                'description' => 'User and system administration, distinct from Super Admin.',
                'permissions' => ['manage-users', 'manage-system-settings', 'view-core-dashboard', 'view-crm'],
            ],
            [
                'id' => 'sales_manager',
                'name' => 'Sales Manager',
                'description' => 'Manage sales opportunities, approve quotations, customer accounts, and reports.',
                'permissions' => ['view-crm', 'manage-quotations', 'approve-quotations', 'view-clients', 'view-reports'],
            ],
            [
                'id' => 'sales_business_development',
                'name' => 'Sales & Business Development',
                'description' => 'Create inquiries, draft quotations, manage customer relations.',
                'permissions' => ['view-crm', 'create-quotations', 'view-clients'],
            ],
            [
                'id' => 'client',
                'name' => 'Client',
                'description' => 'View quotations, rental history, and submit inquiries.',
                'permissions' => ['view-own-quotations', 'view-own-rentals', 'submit-inquiry'],
            ],
        ];

        return ApiResponse::success($roles);
    }
}
