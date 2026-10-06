<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Equipment;
use App\Models\JobOrder;
use App\Models\Project;
use App\Models\Quotation;
use App\Models\Rental;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as ClientRequest;
use Tests\TestCase;
use Illuminate\Support\Facades\Http;

class SecurityAndRbacTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_role_is_denied_access_to_admin_and_management_endpoints(): void
    {
        $customerUser = User::factory()->create(['role' => 'customer']);

        $this->actingAs($customerUser)->getJson('/api/users')->assertForbidden();
        $this->actingAs($customerUser)->postJson('/api/customers', ['name' => 'Hack Corp'])->assertForbidden();
        $this->actingAs($customerUser)->postJson('/api/equipment', ['name' => 'Hack Crane'])->assertForbidden();
        $this->actingAs($customerUser)->postJson('/api/job-orders', ['description' => 'Hack JO'])->assertForbidden();
        $this->actingAs($customerUser)->postJson('/api/quotations', ['description' => 'Hack QT'])->assertForbidden();
        $this->actingAs($customerUser)->postJson('/api/projects', ['project_name' => 'Hack PRJ'])->assertForbidden();
    }

    public function test_sales_bd_can_create_customer_and_job_order_but_cannot_manage_users(): void
    {
        $salesBd = User::factory()->create(['role' => 'sales_business_development']);

        // Cannot manage users
        $this->actingAs($salesBd)->getJson('/api/users')->assertForbidden();
        $this->actingAs($salesBd)->postJson('/api/users', [
            'name' => 'New User',
            'email' => 'new@example.com',
            'role' => 'administrator',
            'password' => 'password123',
        ])->assertForbidden();

        // Can create customer
        $customerResponse = $this->actingAs($salesBd)->postJson('/api/customers', [
            'name' => 'Valid Client',
            'email' => 'client@example.com',
            'customer_type' => 'business',
        ]);
        $customerResponse->assertCreated();
        $customerId = $customerResponse->json('id');

        // Can create job order
        $this->actingAs($salesBd)->postJson('/api/job-orders', [
            'customer_id' => $customerId,
            'description' => 'Install crane foundation',
            'status' => 'pending',
            'priority' => 'high',
        ])->assertCreated();
    }

    public function test_quotation_cannot_be_approved_by_its_creator_unless_superadmin(): void
    {
        $salesManager = User::factory()->create(['role' => 'sales_manager']);
        $customer = Customer::create([
            'name' => 'Test Client',
            'email' => 'test@client.com',
            'customer_type' => 'corporate',
        ]);

        $quotation = Quotation::create([
            'quotation_number' => 'QT-TEST-001',
            'customer_id' => $customer->id,
            'created_by' => $salesManager->id,
            'quotation_date' => now(),
            'status' => 'under_review',
            'subtotal' => 10000,
            'total_amount' => 10000,
        ]);

        // Sales manager who created it cannot approve it
        $this->actingAs($salesManager)->postJson("/api/quotations/{$quotation->id}/approve")
            ->assertStatus(403);

        // Another sales manager can approve it
        $anotherManager = User::factory()->create(['role' => 'sales_manager']);
        $this->actingAs($anotherManager)->postJson("/api/quotations/{$quotation->id}/approve")
            ->assertOk()
            ->assertJsonPath('status', 'approved');
    }

    public function test_admin_cannot_delete_or_deactivate_self_and_cannot_delete_last_admin(): void
    {
        $admin = User::factory()->create(['role' => 'administrator']);

        // Cannot self-delete
        $this->actingAs($admin)->deleteJson("/api/users/{$admin->id}")
            ->assertStatus(422);

        // Cannot self-deactivate
        $this->actingAs($admin)->patchJson("/api/users/{$admin->id}/status", ['is_active' => false])
            ->assertStatus(422);

        // Cannot remove own admin role
        $this->actingAs($admin)->putJson("/api/users/{$admin->id}/role", ['role' => 'customer'])
            ->assertStatus(422);
    }

    public function test_global_search_returns_case_insensitive_matches(): void
    {
        $user = User::factory()->create(['role' => 'sales_business_development']);
        Customer::create([
            'name' => 'Megawide Construction',
            'email' => 'procurement@megawide.com',
            'customer_type' => 'corporate',
        ]);

        $response = $this->actingAs($user)->getJson('/api/search?q=megawide');
        $response->assertOk();
        $this->assertNotEmpty($response->json('data'));
    }

    public function test_super_admin_can_access_internal_modules_and_admin_pages(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        $this->actingAs($superAdmin)->get('/settings')->assertOk();
        $this->actingAs($superAdmin)->get('/reports')->assertOk();
        $this->actingAs($superAdmin)->get('/rental-requirements')->assertOk();
        $this->actingAs($superAdmin)->getJson('/api/roles')->assertOk();
        $this->actingAs($superAdmin)->getJson('/api/users')->assertOk();
    }

    public function test_super_admin_can_access_all_existing_module_pages_and_apis(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        foreach ([
            '/dashboard',
            '/crm',
            '/customers',
            '/job-orders',
            '/rental-requirements',
            '/equipment',
            '/rentals',
            '/projects',
            '/ai-analytics',
            '/reports',
            '/users',
            '/roles',
            '/logs',
            '/settings',
            '/portal',
            '/portal/profile',
            '/portal/inquiries',
            '/portal/quotations',
            '/portal/job-orders',
            '/portal/rentals',
            '/portal/projects',
            '/portal/feedback',
        ] as $path) {
            $this->actingAs($superAdmin)->get($path)->assertOk();
        }

        foreach ([
            '/api/users',
            '/api/roles',
            '/api/system/maintenance',
            '/api/customers',
            '/api/customer-inquiries',
            '/api/crm/follow-ups',
            '/api/crm/communications',
            '/api/crm/feedback',
            '/api/job-orders',
            '/api/equipment',
            '/api/rental-requirements',
            '/api/rentals',
            '/api/quotations',
            '/api/projects',
            '/api/reports/customers',
            '/api/analytics/summary',
            '/api/logs',
        ] as $path) {
            $this->actingAs($superAdmin)->getJson($path)->assertOk();
        }
    }

    public function test_all_five_canonical_roles_can_sign_in_through_the_auth_service(): void
    {
        $rolesByEmail = [
            'superadmin@example.test' => 'super_admin',
            'admin@example.test' => 'admin',
            'manager@example.test' => 'sales_manager',
            'salesbd@example.test' => 'sales_business_development',
            'client@example.test' => 'client',
        ];

        Http::fake(function (ClientRequest $request) use ($rolesByEmail) {
            $email = $request['email'];
            $role = $rolesByEmail[$email];

            return Http::response([
                'success' => true,
                'data' => [
                    'user' => [
                        'id' => array_search($email, array_keys($rolesByEmail), true) + 1,
                        'name' => $role,
                        'email' => $email,
                        'role' => $role,
                        'is_active' => true,
                    ],
                    'role' => $role,
                ],
            ]);
        });

        foreach ($rolesByEmail as $email => $role) {
            $this->post('/login', [
                'email' => $email,
                'password' => 'valid-password',
            ])->assertRedirect($role === 'client' ? '/portal' : '/dashboard');

            $this->assertDatabaseHas('users', [
                'email' => $email,
                'role' => $role,
                'auth_user_id' => array_search($email, array_keys($rolesByEmail), true) + 1,
            ]);

            $this->post('/logout')->assertRedirect('/login');
        }

        Http::assertSentCount(5);
    }

    public function test_canonical_roles_are_enforced_on_direct_pages_and_module_apis(): void
    {
        $cases = [
            'super_admin' => [
                'pages' => ['/settings' => 200, '/reports' => 200, '/rental-requirements' => 200, '/portal' => 200],
                'apis' => ['/api/roles' => 200, '/api/users' => 200, '/api/job-orders' => 200, '/api/reports/customers' => 200],
            ],
            'admin' => [
                'pages' => ['/settings' => 200, '/crm' => 200, '/customers' => 200, '/job-orders' => 403, '/reports' => 403, '/portal' => 200],
                'apis' => ['/api/roles' => 200, '/api/users' => 200, '/api/customers' => 200, '/api/job-orders' => 403, '/api/reports/customers' => 403],
            ],
            'sales_manager' => [
                'pages' => ['/crm' => 200, '/customers' => 200, '/job-orders' => 200, '/rentals' => 200, '/projects' => 200, '/reports' => 200, '/users' => 403, '/settings' => 403, '/portal' => 403],
                'apis' => ['/api/roles' => 403, '/api/users' => 403, '/api/customers' => 200, '/api/job-orders' => 200, '/api/projects' => 200, '/api/reports/customers' => 200],
            ],
            'sales_business_development' => [
                'pages' => ['/crm' => 200, '/customers' => 200, '/crm/follow-ups' => 200, '/crm/communications' => 200, '/crm/feedback' => 200, '/quotations' => 200, '/job-orders' => 200, '/rentals' => 200, '/projects' => 200, '/reports' => 200, '/users' => 403, '/settings' => 403, '/portal' => 403],
                'apis' => ['/api/roles' => 403, '/api/users' => 403, '/api/customers' => 200, '/api/job-orders' => 200, '/api/projects' => 200, '/api/reports/customers' => 200],
            ],
            'client' => [
                'pages' => ['/portal' => 200, '/portal/profile' => 200, '/portal/quotations' => 200, '/dashboard' => 403, '/crm' => 403, '/customers' => 403, '/job-orders' => 403, '/reports' => 403, '/users' => 403, '/settings' => 403],
                'apis' => ['/api/roles' => 403, '/api/users' => 403, '/api/customers' => 403, '/api/job-orders' => 403, '/api/projects' => 403, '/api/reports/customers' => 403],
            ],
        ];

        foreach ($cases as $role => $access) {
            $user = User::factory()->create(['role' => $role]);

            foreach ($access['pages'] as $path => $status) {
                $this->actingAs($user)->get($path)->assertStatus($status);
            }

            foreach ($access['apis'] as $path => $status) {
                $this->actingAs($user)->getJson($path)->assertStatus($status);
            }
        }
    }

    public function test_legacy_aliases_are_grouped_under_five_canonical_roles_in_iam(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        User::factory()->create(['role' => 'administrator']);
        User::factory()->create(['role' => 'manager']);
        User::factory()->create(['role' => 'sales_bd']);
        User::factory()->create(['role' => 'operations_technical']);
        User::factory()->create(['role' => 'staff']);
        User::factory()->create(['role' => 'customer']);

        $response = $this->actingAs($admin)->getJson('/api/roles')->assertOk();

        $this->assertSame(
            ['super_admin', 'admin', 'sales_manager', 'sales_business_development', 'client'],
            collect($response->json('roles'))->pluck('key')->all()
        );
        $this->assertSame(5, $response->json('total_roles'));
        $this->assertSame(2, $response->json('roles.1.user_count'));
        $this->assertSame(1, $response->json('roles.2.user_count'));
        $this->assertSame(3, $response->json('roles.3.user_count'));
        $this->assertSame(1, $response->json('roles.4.user_count'));
    }

    public function test_admin_has_admin_access_but_cannot_manage_super_admin_or_sales_only_modules(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $salesManager = User::factory()->create(['role' => 'sales_manager']);

        $this->actingAs($admin)->get('/settings')->assertOk();
        $this->actingAs($admin)->get('/crm')->assertOk();
        $this->actingAs($admin)->get('/customers')->assertOk();
        $this->actingAs($admin)->get('/reports')->assertForbidden();
        $this->actingAs($admin)->get('/rental-requirements')->assertForbidden();
        $this->actingAs($admin)->getJson('/api/users')->assertOk();
        $this->actingAs($admin)->getJson('/api/customers')->assertOk();
        $this->actingAs($admin)->getJson('/api/job-orders')->assertForbidden();
        $this->actingAs($admin)->getJson('/api/assignable-staff')->assertForbidden();
        $this->actingAs($admin)->getJson('/api/system/maintenance')->assertOk();

        $this->actingAs($admin)->putJson("/api/users/{$salesManager->id}/role", [
            'role' => 'super_admin',
        ])->assertForbidden();
        $this->actingAs($admin)->putJson("/api/users/{$superAdmin->id}/role", [
            'role' => 'admin',
        ])->assertForbidden();
        $this->actingAs($admin)->patchJson("/api/users/{$superAdmin->id}/status", [
            'is_active' => false,
        ])->assertForbidden();
        $this->actingAs($admin)->deleteJson("/api/users/{$superAdmin->id}")->assertForbidden();
    }

    public function test_sales_users_cannot_read_iam_users_or_roles_and_clients_cannot_read_customer_directory(): void
    {
        $salesManager = User::factory()->create(['role' => 'sales_manager']);
        $client = User::factory()->create(['role' => 'client']);

        $this->actingAs($salesManager)->getJson('/api/roles')->assertForbidden();
        $this->actingAs($salesManager)->getJson('/api/users')->assertForbidden();
        $this->actingAs($salesManager)->getJson('/api/customers')->assertOk();
        $this->actingAs($client)->getJson('/api/customers')->assertForbidden();
        $this->actingAs($client)->get('/settings')->assertForbidden();
    }

    public function test_client_portal_job_orders_are_scoped_to_the_authenticated_client(): void
    {
        $ownCustomer = Customer::create([
            'name' => 'Own Client',
            'email' => 'own-client@example.test',
            'customer_type' => 'business',
        ]);
        $otherCustomer = Customer::create([
            'name' => 'Other Client',
            'email' => 'other-client@example.test',
            'customer_type' => 'business',
        ]);
        $client = User::factory()->create([
            'role' => 'client',
            'client_id' => $ownCustomer->id,
        ]);
        $creator = User::factory()->create(['role' => 'sales_business_development']);

        $ownJobOrder = JobOrder::create([
            'job_order_number' => 'JO-OWN-001',
            'customer_id' => $ownCustomer->id,
            'created_by' => $creator->id,
            'description' => 'Owned job order',
        ]);
        JobOrder::create([
            'job_order_number' => 'JO-OTHER-001',
            'customer_id' => $otherCustomer->id,
            'created_by' => $creator->id,
            'description' => 'Other client job order',
        ]);

        $this->actingAs($client)
            ->get('/portal/job-orders', ['X-Inertia' => 'true'])
            ->assertOk()
            ->assertJsonCount(1, 'props.jobOrders.data')
            ->assertJsonPath('props.jobOrders.data.0.id', $ownJobOrder->id);
    }

    public function test_dashboard_summary_returns_zero_counts_and_zero_filled_activity_for_empty_data(): void
    {
        $salesUser = User::factory()->create(['role' => 'sales_business_development']);

        $response = $this->actingAs($salesUser)->getJson('/api/dashboard/summary')
            ->assertOk()
            ->assertJsonPath('total_customers', 0)
            ->assertJsonPath('active_job_orders', 0)
            ->assertJsonPath('activity_chart.source', 'Job order records by creation date');

        $this->assertCount(6, $response->json('activity_chart.points'));
        $this->assertSame(
            [0, 0, 0, 0, 0, 0],
            collect($response->json('activity_chart.points'))->pluck('count')->all()
        );
    }

    public function test_dashboard_scorecards_and_activity_chart_use_persisted_records(): void
    {
        $customer = Customer::create([
            'name' => 'Dashboard Test Client',
            'email' => 'dashboard-client@example.test',
            'customer_type' => 'business',
        ]);
        $creator = User::factory()->create(['role' => 'sales_business_development']);

        JobOrder::create([
            'job_order_number' => 'JO-DASHBOARD-001',
            'customer_id' => $customer->id,
            'created_by' => $creator->id,
            'description' => 'Dashboard data source test',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($creator)->getJson('/api/dashboard/summary')
            ->assertOk()
            ->assertJsonPath('total_customers', 1)
            ->assertJsonPath('active_job_orders', 1);

        $points = $response->json('activity_chart.points');
        $this->assertCount(6, $points);
        $this->assertSame(1, $points[5]['count']);
        $this->assertSame(1, array_sum(array_column($points, 'count')));
    }

    public function test_client_cannot_access_internal_dashboard_or_summary_api(): void
    {
        $client = User::factory()->create(['role' => 'client']);

        $this->actingAs($client)->get('/dashboard')->assertForbidden();
        $this->actingAs($client)->getJson('/api/dashboard/summary')->assertForbidden();
        $this->actingAs($client)->getJson('/api/dashboard/recent-activities')->assertForbidden();
    }

    public function test_sales_role_cannot_access_administrative_audit_activity_feed(): void
    {
        $salesUser = User::factory()->create(['role' => 'sales_manager']);

        $this->actingAs($salesUser)->getJson('/api/dashboard/recent-activities')->assertForbidden();
    }

    public function test_admin_dashboard_activity_chart_uses_audit_log_records(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)->getJson('/api/dashboard/summary')
            ->assertOk()
            ->assertJsonPath('admin_summary.total_users', 1)
            ->assertJsonPath('activity_chart.title', 'System Activity')
            ->assertJsonPath('activity_chart.source', 'Activity log records')
            ->assertJsonCount(6, 'activity_chart.points');
    }
}
