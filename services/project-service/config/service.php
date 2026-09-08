<?php

return [
    'name' => 'project-service',
    'port' => (int) env('PROJECT_SERVICE_PORT', 8006),
    'db' => [
        'database' => env('PROJECT_DB_DATABASE', 'intellitrack_project_db'),
    ],
    'internal_secret' => env('MICROSERVICE_INTERNAL_SECRET', 'secret-internal-token'),
];
