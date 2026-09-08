<?php

return [
    'name' => 'analytics-service',
    'port' => (int) env('ANALYTICS_SERVICE_PORT', 8008),
    'db' => [
        'database' => env('ANALYTICS_DB_DATABASE', 'intellitrack_analytics_db'),
    ],
    'internal_secret' => env('MICROSERVICE_INTERNAL_SECRET', 'secret-internal-token'),
];
