<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PublicLandingAndClientPortalTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_landing_page_is_accessible_without_login(): void
    {
        $this->get('/')->assertOk();
    }

    public function test_public_registration_forces_client_role_even_if_role_is_sent(): void
    {
        $response = $this->post('/register', [
            'company_name' => 'Test Client Co',
            'contact_person' => 'Jane Client',
            'email' => 'jane.client@example.com',
            'phone' => '09170000000',
            'address' => '123 Client Street, Makati',
            'project_location' => 'Taguig City',
            'password' => 'StrongPass!234',
            'password_confirmation' => 'StrongPass!234',
            'role' => 'super_admin',
        ]);

        $response->assertRedirect('/portal');

        $this->assertDatabaseHas('users', [
            'email' => 'jane.client@example.com',
            'role' => 'client',
        ]);
    }

    public function test_client_user_can_access_client_portal(): void
    {
        $client = User::factory()->create([
            'role' => 'client',
            'password' => Hash::make('StrongPass!234'),
        ]);

        $this->actingAs($client)->get('/portal')->assertOk();
    }
}
