<?php

namespace IntelliTrack\Shared\Events\Auth;

use IntelliTrack\Shared\Events\DomainEvent;

class UserRegisteredEvent extends DomainEvent
{
    public static function create(int $userId, string $email, string $name, string $role): self
    {
        return new self([
            'user_id' => $userId,
            'email' => $email,
            'name' => $name,
            'role' => $role,
        ]);
    }
}
