<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\JobOrder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Client\Request as ClientRequest;
use Tests\TestCase;

class RevenueTrendAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
    }

    public function test_client_cannot_access_internal_analytics_or_training(): void
    {
        $client = User::factory()->create(['role' => 'client']);

        $this->actingAs($client)->get('/ai-analytics')->assertForbidden();
        $this->actingAs($client)->getJson('/api/analytics/summary')->assertForbidden();
        $this->actingAs($client)->postJson('/api/analytics/train')->assertForbidden();
        $this->actingAs($client)->postJson('/api/analytics/copilot', ['prompt' => 'Show internal data'])->assertForbidden();
    }

    public function test_legacy_ai_page_redirects_to_analytics_without_calling_auth_service(): void
    {
        $salesManager = User::factory()->create(['role' => 'sales_manager']);

        $this->actingAs($salesManager)->get('/ai')->assertRedirect('/ai-analytics');
        $this->actingAs($salesManager)->post('/ai/ask', ['prompt' => 'Summarize current business records.'])
            ->assertGone();
    }

    public function test_sales_roles_can_read_authorized_summary_but_cannot_train_model(): void
    {
        foreach (['sales_manager', 'sales_business_development'] as $role) {
            $user = User::factory()->create(['role' => $role]);

            $this->actingAs($user)->getJson('/api/analytics/summary')
                ->assertOk()
                ->assertJsonPath('forecast.available', false);
            $this->actingAs($user)->postJson('/api/analytics/train')->assertForbidden();
        }
    }

    public function test_admin_can_train_real_completed_job_order_data(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = Customer::create([
            'name' => 'Training Fixture',
            'email' => 'training-fixture@example.test',
            'customer_type' => 'business',
        ]);

        foreach ([1, 2, 3] as $offset) {
            JobOrder::create([
                'job_order_number' => "TREND-{$offset}",
                'customer_id' => $customer->id,
                'created_by' => $admin->id,
                'description' => 'Completed training record',
                'status' => 'completed',
                'priority' => 'medium',
                'completion_date' => Carbon::now()->startOfMonth()->subMonths($offset)->addDay(),
                'total_amount' => 1000 * $offset,
            ]);
        }

        $this->actingAs($admin)->postJson('/api/analytics/train')
            ->assertOk()
            ->assertJsonPath('trained', true)
            ->assertJsonPath('months_with_data', 3);

        $this->assertTrue(Storage::disk('local')->exists('analytics/revenue-trend-model.json'));
        $this->actingAs($admin)->getJson('/api/analytics/summary')
            ->assertOk()
            ->assertJsonPath('forecast.available', true);
    }

    public function test_super_admin_has_training_access_but_insufficient_data_does_not_claim_training(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        $this->actingAs($superAdmin)->getJson('/api/analytics/summary')
            ->assertOk()
            ->assertJsonPath('forecast.available', false);

        $this->actingAs($superAdmin)->postJson('/api/analytics/train')
            ->assertUnprocessable()
            ->assertJsonPath('trained', false)
            ->assertJsonPath('months_with_data', 0);
    }

    public function test_copilot_uses_server_configured_provider_credentials(): void
    {
        config([
            'services.gemini.api_key' => 'server-only-test-secret',
            'services.gemini.model' => 'gemini-2.5-flash',
        ]);
        Http::fake([
            'https://generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [[
                    'content' => ['parts' => [['text' => 'The aggregate counts are available.']]],
                ]],
            ]),
        ]);

        $salesManager = User::factory()->create(['role' => 'sales_manager']);
        $response = $this->actingAs($salesManager)->postJson('/api/analytics/copilot', [
            'prompt' => 'Summarize the current record counts.',
        ]);

        $response->assertOk()
            ->assertJsonPath('response', 'The aggregate counts are available.')
            ->assertDontSee('server-only-test-secret');

        Http::assertSent(function (ClientRequest $request): bool {
            return $request->hasHeader('x-goog-api-key', 'server-only-test-secret')
                && ! array_key_exists('key', $request->data());
        });
    }
}
