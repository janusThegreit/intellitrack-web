<?php

namespace IntelliTrack\Services\Notification\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    protected $table = 'activity_logs';

    protected $fillable = [
        'user_id', 'action', 'description', 'loggable_type', 'loggable_id',
        'properties', 'ip_address', 'user_agent'
    ];

    protected $casts = [
        'properties' => 'array',
    ];
}
