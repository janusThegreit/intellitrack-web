<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_authenticated_user_can_view_a_revenue_report_for_a_date_range(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/reports/revenue?from_date=2026-01-01&to_date=2026-01-31');

        $response->assertOk()->assertJsonStructure([
            'total_revenue',
            'job_order_revenue',
            'rental_revenue',
            'job_order_count',
            'rental_count',
            'by_month',
        ]);
    }

    public function test_a_report_rejects_an_end_date_before_the_start_date(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/reports/revenue?from_date=2026-02-01&to_date=2026-01-31');

        $response->assertUnprocessable()->assertJsonValidationErrors('to_date');
    }
}