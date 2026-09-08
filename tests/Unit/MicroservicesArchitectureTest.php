<?php

namespace Tests\Unit;

use Tests\TestCase;
use IntelliTrack\Shared\Http\ApiResponse;
use IntelliTrack\Shared\DTOs\UserContext;
use IntelliTrack\Shared\Events\Quotation\QuotationApprovedEvent;
use IntelliTrack\Shared\Events\Rental\RentalCreatedEvent;
use IntelliTrack\Shared\Events\Customer\CustomerCreatedEvent;

class MicroservicesArchitectureTest extends TestCase
{
    /**
     * Test ApiResponse standardized success structure.
     */
    public function test_api_response_formats_standardized_json(): void
    {
        $response = ApiResponse::success(['id' => 10, 'name' => 'Crane Alpha'], 'Fetched');
        $data = $response->getData(true);

        $this->assertTrue($data['success']);
        $this->assertEquals('Fetched', $data['message']);
        $this->assertEquals(10, $data['data']['id']);
        $this->assertArrayHasKey('correlation_id', $data['meta']);
    }

    /**
     * Test UserContext DTO serialization.
     */
    public function test_user_context_headers_and_roles(): void
    {
        $user = new UserContext(
            id: 5,
            email: 'admin@intellitrack.com',
            name: 'Admin User',
            role: 'administrator',
            permissions: ['all']
        );

        $this->assertTrue($user->isAdmin());
        $this->assertFalse($user->isStaff());

        $headers = $user->toHeaders();
        $this->assertEquals('5', $headers['X-User-Id']);
        $this->assertEquals('administrator', $headers['X-User-Role']);
    }

    /**
     * Test DomainEvent creation and serialization.
     */
    public function test_domain_events_serialization(): void
    {
        $event = QuotationApprovedEvent::create(101, 'QT-2026-001', 5, 2, 150000.00);

        $this->assertEquals('quotation.approved.event', $event->eventType);
        $this->assertEquals(101, $event->payload['quotation_id']);
        $this->assertEquals(150000.00, $event->payload['total_amount']);
        $this->assertNotNull($event->correlationId);

        $json = $event->toJson();
        $this->assertJson($json);
    }
}
