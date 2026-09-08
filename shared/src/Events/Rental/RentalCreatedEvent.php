<?php

namespace IntelliTrack\Shared\Events\Rental;

use IntelliTrack\Shared\Events\DomainEvent;

class RentalCreatedEvent extends DomainEvent
{
    public static function create(int $rentalId, string $rentalNumber, int $customerId, int $equipmentId, int $quantity, string $startDate, string $endDate): self
    {
        return new self([
            'rental_id' => $rentalId,
            'rental_number' => $rentalNumber,
            'customer_id' => $customerId,
            'equipment_id' => $equipmentId,
            'quantity' => $quantity,
            'rental_start_date' => $startDate,
            'rental_end_date' => $endDate,
        ]);
    }
}
