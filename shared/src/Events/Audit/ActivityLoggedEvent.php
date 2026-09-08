<?php

namespace IntelliTrack\Shared\Events\Audit;

use IntelliTrack\Shared\Events\DomainEvent;

class ActivityLoggedEvent extends DomainEvent
{
    public static function create(?int $userId, string $action, string $description, ?string $loggableType = null, ?int $loggableId = null, array $properties = []): self
    {
        return new self([
            'user_id' => $userId,
            'action' => $action,
            'description' => $description,
            'loggable_type' => $loggableType,
            'loggable_id' => $loggableId,
            'properties' => $properties,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
