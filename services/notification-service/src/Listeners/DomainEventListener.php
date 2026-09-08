<?php

namespace IntelliTrack\Services\Notification\Listeners;

use IntelliTrack\Services\Notification\Models\ActivityLog;
use IntelliTrack\Services\Notification\Models\Notification;
use Illuminate\Support\Facades\Log;

class DomainEventListener
{
    /**
     * Handle incoming domain events received via Redis event stream / pubsub.
     */
    public function handle(array $eventData, string $channel): void
    {
        $eventType = $eventData['event_type'] ?? '';
        $payload = $eventData['payload'] ?? [];
        $correlationId = $eventData['correlation_id'] ?? '';

        Log::info("NotificationService consumed event [{$eventType}]", [
            'correlation_id' => $correlationId,
        ]);

        switch ($eventType) {
            case 'quotation.approved.event':
                Notification::create([
                    'user_id' => $payload['approved_by'] ?? 1,
                    'type' => 'success',
                    'title' => 'Quotation Approved',
                    'message' => "Quotation #{$payload['quotation_number']} has been approved.",
                    'notifiable_type' => 'Quotation',
                    'notifiable_id' => $payload['quotation_id'] ?? null,
                ]);
                break;

            case 'rental.created.event':
                ActivityLog::create([
                    'action' => 'rental_created',
                    'description' => "Rental contract #{$payload['rental_number']} initiated.",
                    'loggable_type' => 'Rental',
                    'loggable_id' => $payload['rental_id'] ?? null,
                    'properties' => $payload,
                ]);
                break;

            case 'equipment.returned.event':
                ActivityLog::create([
                    'action' => 'equipment_returned',
                    'description' => "Equipment #{$payload['equipment_id']} checked in from rental #{$payload['rental_id']}.",
                    'loggable_type' => 'Equipment',
                    'loggable_id' => $payload['equipment_id'] ?? null,
                    'properties' => $payload,
                ]);
                break;

            default:
                break;
        }
    }
}
