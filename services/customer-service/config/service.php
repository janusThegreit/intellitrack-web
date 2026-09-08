<?php

return [
    'name' => 'customer-service',
    'port' => (int) env('CUSTOMER_SERVICE_PORT', 8002),
    'db' => [
        'database' => env('CUSTOMER_DB_DATABASE', 'intellitrack_customer_db'),
    ],
    'internal_secret' => env('MICROSERVICE_INTERNAL_SECRET', 'secret-internal-token'),
];
