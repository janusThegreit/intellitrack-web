<?php

namespace IntelliTrack\Shared\Events;

interface EventBusInterface
{
    /**
     * Publish a domain event to the message broker.
     */
    public function publish(DomainEvent $event): void;

    /**
     * Subscribe to a topic / pattern with a callable handler.
     */
    public function subscribe(string $channel, callable $handler): void;
}
