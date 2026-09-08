<?php

return [
    'name' => 'api-gateway',
    'port' => (int) env('GATEWAY_PORT', 8000),
    'internal_secret' => env('MICROSERVICE_INTERNAL_SECRET', 'secret-internal-token'),
];
