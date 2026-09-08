<?php

namespace IntelliTrack\Shared\Events;

use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;
use Throwable;

class RedisEventBus implements EventBusInterface
{
    protected string $prefix;

    public function __construct(string $prefix = 'intellitrack:events:')
    {
        $this->prefix = $prefix;
    }

    /**
     * Publish domain event to Redis pub/sub and event stream.
     */
    public function publish(DomainEvent $event): void
    {
        $channel = $this->prefix . $event->eventType;
        $payload = $event->toJson();

        try {
            // Publish to PubSub for real-time subscribers
            Redis::publish($channel, $payload);
            
            // Also store in an event log stream for replayability and audit
            Redis::xadd($this->prefix . 'stream', '*', [
                'event_type' => $event->eventType,
                'correlation_id' => $event->correlationId,
                'data' => $payload,
            ]);

            Log::info("Published domain event [{$event->eventType}]", [
                'event_id' => $event->eventId,
                'correlation_id' => $event->correlationId,
            ]);
        } catch (Throwable $e) {
            Log::error("Failed to publish domain event [{$event->eventType}]: " . $e->getMessage(), [
                'exception' => $e,
                'payload' => $payload,
            ]);
        }
    }

    /**
     * Subscribe to a channel pattern.
     */
    public function subscribe(string $channel, callable $handler): void
    {
        $fullChannel = $this->prefix . $channel;
        Redis::psubscribe([$fullChannel], function ($message, $channel) use ($handler) {
            $data = json_decode($message, true);
            $handler($data, $channel);
        });
    }
}
