<?php

namespace App\Services;

use App\Models\JobOrder;
use App\Models\Rental;
use App\Models\Customer;
use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DepartmentIntegrationService
{
    /**
     * Helper to execute HTTP request with timeout, logging, and error handling.
     */
    protected static function executeRequest(string $deptKey, string $endpointKey, array $payload, string $method = 'POST'): array
    {
        $config = config("departments.{$deptKey}");
        if (!$config || empty($config['base_url'])) {
            return [
                'success' => false,
                'error' => "Configuration for department [{$deptKey}] not found.",
            ];
        }

        $url = rtrim($config['base_url'], '/') . '/' . ltrim($config['endpoints'][$endpointKey] ?? '', '/');
        $token = $config['api_token'] ?? '';
        $timeout = $config['timeout'] ?? 5;

        try {
            $response = Http::timeout($timeout)
                ->withHeaders([
                    'Authorization' => "Bearer {$token}",
                    'Accept' => 'application/json',
                    'X-Source-System' => 'IntelliTrack-Core',
                ])
                ->send($method, $url, [
                    'json' => $payload,
                ]);

            $isSuccess = $response->successful();
            $responseData = $response->json() ?? ['raw_body' => $response->body()];

            // Log activity
            ActivityLogService::log(
                auth()->user(),
                'department_api_outbound',
                JobOrder::class,
                $payload['job_order_id'] ?? null,
                "Outbound HTTP to [{$deptKey}] ({$endpointKey}): " . ($isSuccess ? 'SUCCESS' : 'FAILED status ' . $response->status()),
                null,
                [
                    'department' => $deptKey,
                    'endpoint' => $url,
                    'status_code' => $response->status(),
                    'payload_summary' => array_keys($payload),
                ]
            );

            return [
                'success' => $isSuccess,
                'status' => $response->status(),
                'data' => $responseData,
                'error' => $isSuccess ? null : ($responseData['message'] ?? 'Department HTTP request failed.'),
            ];
        } catch (\Throwable $e) {
            Log::warning("IntelliTrack department HTTP integration error [{$deptKey}]: " . $e->getMessage());

            ActivityLogService::log(
                auth()->user(),
                'department_api_error',
                JobOrder::class,
                $payload['job_order_id'] ?? null,
                "Outbound HTTP exception to [{$deptKey}]: " . $e->getMessage(),
                null,
                ['department' => $deptKey, 'error' => $e->getMessage()]
            );

            return [
                'success' => false,
                'status' => 0,
                'data' => null,
                'error' => 'Connection to department failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * 1. Send Rental / Equipment Requirements to Crane & Equipment Management
     */
    public static function sendEquipmentRequirementsToCrane(JobOrder $jobOrder): array
    {
        $jobOrder->loadMissing(['customer', 'jobOrderItems.equipment']);

        $requirements = $jobOrder->jobOrderItems->map(function ($item) {
            return [
                'equipment_id' => $item->equipment_id,
                'equipment_code' => $item->equipment?->code,
                'equipment_name' => $item->equipment?->name,
                'model' => $item->equipment?->crane_model ?? $item->equipment?->model,
                'category' => $item->equipment?->category,
                'quantity' => $item->quantity,
                'capacity' => $item->equipment?->maximum_load . ' ' . $item->equipment?->maximum_load_unit,
            ];
        })->toArray();

        $payload = [
            'job_order_id' => $jobOrder->id,
            'job_order_number' => $jobOrder->job_order_number,
            'customer_name' => $jobOrder->customer?->company_name ?: $jobOrder->customer?->name,
            'site_location' => $jobOrder->location,
            'scheduled_date' => $jobOrder->scheduled_date?->toIso8601String(),
            'due_date' => $jobOrder->due_date?->toIso8601String(),
            'equipment_count' => $jobOrder->equipment_count,
            'requirements' => $requirements,
            'notes' => $jobOrder->notes,
        ];

        return self::executeRequest('crane_management', 'equipment_requests', $payload);
    }

    /**
     * 2. Send Operator / Driver Request to Assign Driver/Operator & Equipment
     */
    public static function requestOperatorAssignment(JobOrder $jobOrder, array $crewRequirements = []): array
    {
        $jobOrder->loadMissing(['customer', 'jobOrderItems.equipment']);

        $payload = [
            'job_order_id' => $jobOrder->id,
            'job_order_number' => $jobOrder->job_order_number,
            'site_location' => $jobOrder->location,
            'start_date' => $jobOrder->scheduled_date?->toIso8601String() ?: now()->toIso8601String(),
            'due_date' => $jobOrder->due_date?->toIso8601String(),
            'priority' => $jobOrder->priority,
            'crew_requirements' => !empty($crewRequirements) ? $crewRequirements : [
                [
                    'role' => 'Heavy Equipment / Crane Operator',
                    'count' => max(1, $jobOrder->equipment_count),
                    'min_experience_years' => 3,
                    'certifications' => ['TESDA NC II', 'Safety Induction'],
                ],
                [
                    'role' => 'Certified Rigger',
                    'count' => 1,
                    'certifications' => ['Rigging & Slinging NC I'],
                ],
            ],
            'notes' => $jobOrder->notes,
        ];

        return self::executeRequest('assign_driver_operator', 'operator_requests', $payload);
    }

    /**
     * 3. Send Job Order Information to Dispatch Job & Scheduling
     */
    public static function sendJobOrderToDispatch(JobOrder $jobOrder): array
    {
        $jobOrder->loadMissing(['customer', 'jobOrderItems.equipment']);

        $payload = [
            'job_order_id' => $jobOrder->id,
            'job_order_number' => $jobOrder->job_order_number,
            'customer' => [
                'id' => $jobOrder->customer?->id,
                'name' => $jobOrder->customer?->name,
                'company' => $jobOrder->customer?->company_name,
                'phone' => $jobOrder->customer?->phone,
            ],
            'destination_site' => [
                'address' => $jobOrder->location,
                'scheduled_date' => $jobOrder->scheduled_date?->toIso8601String(),
            ],
            'items' => $jobOrder->jobOrderItems->map(fn($item) => [
                'equipment_name' => $item->equipment?->name,
                'code' => $item->equipment?->code,
                'quantity' => $item->quantity,
            ])->toArray(),
            'status' => $jobOrder->status,
            'instructions' => $jobOrder->notes,
        ];

        return self::executeRequest('dispatch_scheduling', 'dispatches', $payload);
    }

    /**
     * Send Rental Schedule to Dispatch
     */
    public static function sendRentalScheduleToDispatch(Rental $rental): array
    {
        $rental->loadMissing(['customer', 'equipment']);

        $payload = [
            'rental_id' => $rental->id,
            'rental_code' => $rental->rental_code,
            'customer_name' => $rental->customer?->company_name ?: $rental->customer?->name,
            'equipment_code' => $rental->equipment?->code,
            'equipment_name' => $rental->equipment?->name,
            'start_date' => $rental->start_date?->toIso8601String(),
            'end_date' => $rental->end_date?->toIso8601String(),
            'daily_rate' => $rental->daily_rate,
            'status' => $rental->status,
        ];

        return self::executeRequest('dispatch_scheduling', 'rental_schedule', $payload);
    }

    /**
     * 4. Send Trip / Hauling Information to Fleet Management
     */
    public static function sendTripInfoToFleet(JobOrder $jobOrder, array $extra = []): array
    {
        $jobOrder->loadMissing(['customer', 'jobOrderItems.equipment']);

        $payload = [
            'job_order_id' => $jobOrder->id,
            'job_order_number' => $jobOrder->job_order_number,
            'origin' => $extra['origin_yard'] ?? 'IntelliTrack Central Yard',
            'destination' => $jobOrder->location,
            'cargo_description' => $jobOrder->description,
            'equipment_count' => $jobOrder->equipment_count,
            'departure_target' => $jobOrder->scheduled_date?->toIso8601String(),
            'hauling_specs' => $extra['hauling_specs'] ?? 'Heavy haul lowbed trailer needed',
        ];

        return self::executeRequest('fleet_management', 'trips', $payload);
    }

    /**
     * 5. Send Job Details to Accounts Receivable (AR)
     */
    public static function sendJobDetailsToAR(JobOrder $jobOrder): array
    {
        $jobOrder->loadMissing('customer');

        $payload = [
            'job_order_id' => $jobOrder->id,
            'job_order_number' => $jobOrder->job_order_number,
            'customer' => [
                'id' => $jobOrder->customer?->id,
                'name' => $jobOrder->customer?->name,
                'company' => $jobOrder->customer?->company_name,
                'tin' => $jobOrder->customer?->tax_number ?? '000-000-000-000',
                'credit_terms' => $jobOrder->customer?->payment_terms ?? '30 Days',
            ],
            'total_amount' => (float) ($jobOrder->total_amount ?: $jobOrder->estimated_cost),
            'currency' => 'PHP',
            'status' => $jobOrder->status,
            'verification_required' => true,
        ];

        return self::executeRequest('accounts_receivable', 'job_billing_records', $payload);
    }

    /**
     * 6. Send Job Completion Details to Billing & Invoicing Module
     */
    public static function sendJobCompletionToBilling(JobOrder $jobOrder, array $extraBillingData = []): array
    {
        $jobOrder->loadMissing(['customer', 'jobOrderItems.equipment']);

        $payload = [
            'job_order_id' => $jobOrder->id,
            'job_order_number' => $jobOrder->job_order_number,
            'customer_id' => $jobOrder->customer_id,
            'customer_name' => $jobOrder->customer?->company_name ?: $jobOrder->customer?->name,
            'start_date' => $jobOrder->start_date?->toIso8601String(),
            'completion_date' => $jobOrder->completion_date?->toIso8601String() ?: now()->toIso8601String(),
            'actual_cost' => (float) $jobOrder->actual_cost,
            'total_amount' => (float) $jobOrder->total_amount,
            'operating_hours' => $extraBillingData['operating_hours'] ?? null,
            'overtime_hours' => $extraBillingData['overtime_hours'] ?? 0,
            'fuel_charges' => $extraBillingData['fuel_charges'] ?? 0,
            'penalties' => $extraBillingData['penalties'] ?? 0,
            'signed_ticket_url' => $extraBillingData['ticket_url'] ?? null,
            'remarks' => $jobOrder->notes,
        ];

        return self::executeRequest('billing_invoicing', 'job_completion', $payload);
    }

    /**
     * 7. Send Client and Project Info to Contract & Permit Management
     */
    public static function sendClientAndProjectToContract(Customer $customer, ?Project $project = null): array
    {
        $payload = [
            'customer_id' => $customer->id,
            'client_name' => $customer->name,
            'company_name' => $customer->company_name,
            'address' => $customer->address,
            'email' => $customer->email,
            'phone' => $customer->phone,
            'project' => $project ? [
                'project_id' => $project->id,
                'name' => $project->name,
                'code' => $project->project_code,
                'location' => $project->location,
                'start_date' => $project->start_date?->toIso8601String(),
                'end_date' => $project->end_date?->toIso8601String(),
            ] : null,
        ];

        return self::executeRequest('contract_permit', 'client_project_info', $payload);
    }

    /**
     * 8. Send Equipment Requirements to Asset Management
     */
    public static function sendRequirementsToAssetManagement(Rental $rental): array
    {
        $rental->loadMissing('equipment');

        $payload = [
            'rental_id' => $rental->id,
            'rental_code' => $rental->rental_code,
            'equipment_id' => $rental->equipment_id,
            'equipment_code' => $rental->equipment?->code,
            'equipment_name' => $rental->equipment?->name,
            'category' => $rental->equipment?->category,
            'start_date' => $rental->start_date?->toIso8601String(),
            'end_date' => $rental->end_date?->toIso8601String(),
        ];

        return self::executeRequest('asset_management', 'requirements', $payload);
    }
}
