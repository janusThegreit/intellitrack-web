<?php

namespace IntelliTrack\Shared\Events;

use Illuminate\Support\Str;

abstract class DomainEvent
{
    public readonly string $eventId;
    public readonly string $eventType;
    public readonly string $occurredOn;
    public readonly string $correlationId;
    public readonly array $payload;

    public function __construct(array $payload = [], ?string $correlationId = null)
    {
        $this->eventId = (string) Str::uuid();
        $this->eventType = static::eventName();
        $this->occurredOn = now()->toIso8601String();
        $this->correlationId = $correlationId ?? request()->header('X-Correlation-ID', (string) Str::uuid());
        $this->payload = $payload;
    }

    public static function eventName(): string
    {
        $class = class_basename(static::class);
        return Str::snake($class, '.');
    }

    public function toArray(): array
    {
        return [
            'event_id' => $this->eventId,
            'event_type' => $this->eventType,
            'occurred_on' => $this->occurredOn,
            'correlation_id' => $this->correlationId,
            'payload' => $this->payload,
        ];
    }

    public function toJson(): string
    {
        return json_encode($this->toArray(), JSON_THROW_ON_ERROR);
    }

    public static function fromArray(array $data): static
    {
        $event = new static($data['payload'] ?? [], $data['correlation_id'] ?? null);
        return $event;
    }
}
