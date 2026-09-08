<?php

return [
    'services' => [
        'auth' => [
            'base_url' => env('AUTH_SERVICE_URL', 'http://127.0.0.1:8001'),
            'timeout' => 5,
        ],
        'customer' => [
            'base_url' => env('CUSTOMER_SERVICE_URL', 'http://127.0.0.1:8002'),
            'timeout' => 5,
        ],
        'inventory' => [
            'base_url' => env('INVENTORY_SERVICE_URL', 'http://127.0.0.1:8003'),
            'timeout' => 5,
        ],
        'quotation' => [
            'base_url' => env('QUOTATION_SERVICE_URL', 'http://127.0.0.1:8004'),
            'timeout' => 5,
        ],
        'rental' => [
            'base_url' => env('RENTAL_SERVICE_URL', 'http://127.0.0.1:8005'),
            'timeout' => 5,
        ],
        'project' => [
            'base_url' => env('PROJECT_SERVICE_URL', 'http://127.0.0.1:8006'),
            'timeout' => 5,
        ],
        'notification' => [
            'base_url' => env('NOTIFICATION_SERVICE_URL', 'http://127.0.0.1:8007'),
            'timeout' => 5,
        ],
        'analytics' => [
            'base_url' => env('ANALYTICS_SERVICE_URL', 'http://127.0.0.1:8008'),
            'timeout' => 5,
        ],
    ],
    'internal_secret' => env('MICROSERVICE_INTERNAL_SECRET', 'secret-internal-token'),
];
