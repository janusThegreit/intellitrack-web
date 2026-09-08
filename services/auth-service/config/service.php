<?php

return [
    'name' => 'auth-service',
    'port' => (int) env('AUTH_SERVICE_PORT', 8001),
    'db' => [
        'database' => env('AUTH_DB_DATABASE', 'intellitrack_auth_db'),
    ],
    'internal_secret' => env('MICROSERVICE_INTERNAL_SECRET', 'secret-internal-token'),
];
