<?php

namespace IntelliTrack\Shared\Events\Customer;

use IntelliTrack\Shared\Events\DomainEvent;

class CustomerCreatedEvent extends DomainEvent
{
    public static function create(int $customerId, string $name, string $email, ?string $companyName): self
    {
        return new self([
            'customer_id' => $customerId,
            'name' => $name,
            'email' => $email,
            'company_name' => $companyName,
        ]);
    }
}
