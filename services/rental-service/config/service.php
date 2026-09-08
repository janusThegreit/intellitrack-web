<?php

return [
    'name' => 'rental-service',
    'port' => (int) env('RENTAL_SERVICE_PORT', 8005),
    'db' => [
        'database' => env('RENTAL_DB_DATABASE', 'intellitrack_rental_db'),
    ],
    'internal_secret' => env('MICROSERVICE_INTERNAL_SECRET', 'secret-internal-token'),
];
