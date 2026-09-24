<?php

return [
    /*
    |--------------------------------------------------------------------------
    | External Department HTTP API Integrations (BPA Level 1)
    |--------------------------------------------------------------------------
    |
    | Configuration for outgoing HTTP API calls and incoming webhooks to/from
    | the 8 external departments in the Business Process Architecture.
    |
    */

    'webhook_secret' => env('DEPARTMENT_WEBHOOK_SECRET', 'intellitrack-bpa-secret-key-2026'),

    'crane_management' => [
        'base_url' => env('DEPT_CRANE_URL', 'http://127.0.0.1:8011'),
        'api_token' => env('DEPT_CRANE_TOKEN', 'token-crane-dept'),
        'timeout' => 5,
        'endpoints' => [
            'equipment_requests' => '/api/v1/equipment-requests',
        ],
    ],

    'assign_driver_operator' => [
        'base_url' => env('DEPT_MANPOWER_URL', 'http://127.0.0.1:8012'),
        'api_token' => env('DEPT_MANPOWER_TOKEN', 'token-manpower-dept'),
        'timeout' => 5,
        'endpoints' => [
            'operator_requests' => '/api/v1/operator-requests',
        ],
    ],

    'dispatch_scheduling' => [
        'base_url' => env('DEPT_DISPATCH_URL', 'http://127.0.0.1:8013'),
        'api_token' => env('DEPT_DISPATCH_TOKEN', 'token-dispatch-dept'),
        'timeout' => 5,
        'endpoints' => [
            'dispatches' => '/api/v1/dispatches',
            'rental_schedule' => '/api/v1/dispatches/rental-schedule',
        ],
    ],

    'fleet_management' => [
        'base_url' => env('DEPT_FLEET_URL', 'http://127.0.0.1:8014'),
        'api_token' => env('DEPT_FLEET_TOKEN', 'token-fleet-dept'),
        'timeout' => 5,
        'endpoints' => [
            'trips' => '/api/v1/trips',
        ],
    ],

    'accounts_receivable' => [
        'base_url' => env('DEPT_AR_URL', 'http://127.0.0.1:8015'),
        'api_token' => env('DEPT_AR_TOKEN', 'token-ar-dept'),
        'timeout' => 5,
        'endpoints' => [
            'job_billing_records' => '/api/v1/job-billing-records',
        ],
    ],

    'billing_invoicing' => [
        'base_url' => env('DEPT_BILLING_URL', 'http://127.0.0.1:8016'),
        'api_token' => env('DEPT_BILLING_TOKEN', 'token-billing-dept'),
        'timeout' => 5,
        'endpoints' => [
            'job_completion' => '/api/v1/invoices/generate-from-job',
        ],
    ],

    'contract_permit' => [
        'base_url' => env('DEPT_CONTRACT_URL', 'http://127.0.0.1:8017'),
        'api_token' => env('DEPT_CONTRACT_TOKEN', 'token-contract-dept'),
        'timeout' => 5,
        'endpoints' => [
            'client_project_info' => '/api/v1/contracts/client-project-info',
        ],
    ],

    'asset_management' => [
        'base_url' => env('DEPT_ASSET_URL', 'http://127.0.0.1:8018'),
        'api_token' => env('DEPT_ASSET_TOKEN', 'token-asset-dept'),
        'timeout' => 5,
        'endpoints' => [
            'requirements' => '/api/v1/assets/requirements',
        ],
    ],
];
