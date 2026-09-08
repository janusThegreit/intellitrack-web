<?php

return [
    'name' => 'quotation-service',
    'port' => (int) env('QUOTATION_SERVICE_PORT', 8004),
    'db' => [
        'database' => env('QUOTATION_DB_DATABASE', 'intellitrack_quotation_db'),
    ],
    'internal_secret' => env('MICROSERVICE_INTERNAL_SECRET', 'secret-internal-token'),
];
