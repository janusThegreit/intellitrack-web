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
use Tests\TestCase;

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
}
