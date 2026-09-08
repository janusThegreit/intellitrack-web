<?php

namespace IntelliTrack\Shared\Events\Rental;

use IntelliTrack\Shared\Events\DomainEvent;

class EquipmentReturnedEvent extends DomainEvent
{
    public static function create(int $rentalId, int $equipmentId, int $quantity, string $returnDate, float $additionalCharges = 0, ?string $damageNotes = null): self
    {
        return new self([
            'rental_id' => $rentalId,
            'equipment_id' => $equipmentId,
            'quantity' => $quantity,
            'return_date' => $returnDate,
            'additional_charges' => $additionalCharges,
            'damage_notes' => $damageNotes,
        ]);
    }
}
