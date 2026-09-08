<?php

namespace IntelliTrack\Shared\Events\Inventory;

use IntelliTrack\Shared\Events\DomainEvent;

class EquipmentStatusChangedEvent extends DomainEvent
{
    public static function create(int $equipmentId, string $oldStatus, string $newStatus, ?string $reason = null): self
    {
        return new self([
            'equipment_id' => $equipmentId,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'reason' => $reason,
        ]);
    }
}
