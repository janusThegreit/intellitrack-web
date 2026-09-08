<?php

return [
    'name' => 'inventory-service',
    'port' => (int) env('INVENTORY_SERVICE_PORT', 8003),
    'db' => [
        'database' => env('INVENTORY_DB_DATABASE', 'intellitrack_inventory_db'),
    ],
    'internal_secret' => env('MICROSERVICE_INTERNAL_SECRET', 'secret-internal-token'),
];
