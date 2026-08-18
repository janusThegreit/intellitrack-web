<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class DashboardAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_sign_in_before_viewing_the_dashboard(): void
    {
        $this->get('/dashboard')->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_open_the_dashboard(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/dashboard')->assertOk();
    }

    public function test_authenticated_users_can_load_dashboard_summary_data(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->getJson('/api/dashboard/summary')
            ->assertOk()
            ->assertJsonStructure(['total_customers', 'active_job_orders', 'revenue_this_month']);
    }

    public function test_sales_business_development_users_can_open_crm(): void
    {
        $user = User::factory()->create(['role' => 'sales_business_development']);

        $this->actingAs($user)->get('/crm')->assertOk();
    }

    public function test_sales_managers_can_open_job_orders_projects_and_ai_analytics(): void
    {
        $user = User::factory()->create(['role' => 'sales_manager']);

        $this->actingAs($user)->get('/job-orders')->assertOk();
        $this->actingAs($user)->get('/projects')->assertOk();
        $this->actingAs($user)->get('/ai-analytics')->assertOk();
    }

    public function test_administrators_can_open_user_management_and_view_users(): void
    {
        $user = User::factory()->create(['role' => 'administrator']);

        $this->actingAs($user)->get('/users')->assertOk();
        $this->actingAs($user)->getJson('/api/users')->assertOk()->assertJsonStructure(['data']);
    }

    public function test_administrators_can_list_and_create_clients(): void
    {
        $user = User::factory()->create(['role' => 'administrator']);

        $this->actingAs($user)->getJson('/api/customers')->assertOk()->assertJsonStructure(['data']);
        $this->actingAs($user)->postJson('/api/customers', [
            'name' => 'Quezon City Demo Client',
            'email' => 'quezon-demo@example.test',
            'phone' => '09170000000',
            'company_name' => 'Quezon City Demo Builders',
            'customer_type' => 'business',
        ])->assertCreated()->assertJsonPath('company_name', 'Quezon City Demo Builders');
    }

    public function test_login_redirects_to_a_visible_dashboard(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('secure-password'),
        ]);

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'secure-password',
        ])->assertRedirect(route('dashboard'));

        $this->assertAuthenticatedAs($user);
        $this->get('/dashboard')->assertOk();
    }
}