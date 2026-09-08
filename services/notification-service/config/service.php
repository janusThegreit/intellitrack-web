<?php

return [
    'name' => 'notification-service',
    'port' => (int) env('NOTIFICATION_SERVICE_PORT', 8007),
    'db' => [
        'database' => env('NOTIFICATION_DB_DATABASE', 'intellitrack_notification_db'),
    ],
    'internal_secret' => env('MICROSERVICE_INTERNAL_SECRET', 'secret-internal-token'),
];
