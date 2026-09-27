<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerInquiry;
use App\Models\JobOrder;
use App\Models\Rental;
use App\Services\ActivityLogService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class SubsystemIntegrationController extends Controller
{
    /**
     * 1. EXTERNAL CUSTOMER INQUIRY INTAKE (Alibaton Website: https://alibaton.com.ph/)
     *
     * Sales & Commercial Department receives inquiries from the external corporate website.
     * The website itself is NOT internal; the department processes inquiry records into leads and opportunities.
     * Flow: WEBSITE INQUIRY -> CRM -> LEAD/OPPORTUNITY -> CUSTOMER -> CLIENT -> QUOTATION
     */
    public function ingestWebsiteInquiry(Request $request)
    {
        $validated = $request->validate([
            'contact_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'project_name' => ['nullable', 'string', 'max:255'],
            'project_location' => ['nullable', 'string', 'max:255'],
            'equipment_type' => ['nullable', 'string', 'max:100'],
            'details' => ['required', 'string'],
            'source_url' => ['nullable', 'string'],
        ]);

        $sourceUrl = $validated['source_url'] ?? 'https://alibaton.com.ph/';

        // Auto-create or find Customer master
        $customer = Customer::firstOrCreate(
            ['email' => $validated['email']],
            [
                'name' => $validated['company_name'] ?: $validated['contact_name'],
                'company_name' => $validated['company_name'] ?: $validated['contact_name'],
                'contact_person' => $validated['contact_name'],
                'phone' => $validated['phone'],
                'mobile_number' => $validated['phone'],
                'address' => $validated['project_location'],
                'customer_type' => 'business',
                'source' => 'Alibaton Website (https://alibaton.com.ph/)',
                'status' => 'prospect',
            ]
        );

        $inquiry = CustomerInquiry::create([
            'inquiry_number' => 'INQ-' . date('Ymd') . '-' . strtoupper(Str::random(6)),
            'customer_id' => $customer->id,
            'source' => 'Alibaton Website (https://alibaton.com.ph/)',
            'subject' => $validated['project_name'] ? "Website Inquiry: {$validated['project_name']}" : "Website Inquiry from {$validated['contact_name']}",
            'details' => $validated['details'] . ($validated['equipment_type'] ? "\nRequested Equipment: {$validated['equipment_type']}" : '') . "\nIntake Source: {$sourceUrl}",
            'status' => 'new',
            'priority' => 'high',
            'remarks' => "Ingested from external Alibaton portal: {$sourceUrl}",
        ]);

        $inquiry->history()->create([
            'action' => 'website_intake',
            'notes' => "Customer inquiry received through Alibaton Website API ({$sourceUrl})",
            'old_status' => null,
            'new_status' => 'new',
        ]);

        app(NotificationService::class)->notifyRoles(
            ['sales_business_development', 'sales_manager'],
            'info',
            'Incoming Website Customer Inquiry',
            "New inquiry {$inquiry->inquiry_number} received from {$customer->name} via Alibaton Website ({$sourceUrl}).",
            CustomerInquiry::class,
            $inquiry->id
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Website inquiry received and queued for SBD processing.',
            'inquiry' => $inquiry->load('customer'),
        ], Response::HTTP_CREATED);
    }

    /**
     * 2. OPERATIONS & DISPATCH DEPARTMENT INTEGRATION
     *
     * Sales & Commercial SENDS: Job Order information, equipment requirements, rental requirements,
     * dates, location, service requirements.
     * Sales does NOT perform dispatch, driver assignment, or equipment operations.
     */
    public function submitJobOrderToOperations(Request $request, JobOrder $jobOrder)
    {
        $user = Auth::user();
        if (! $user || (! $user->isSalesBusinessDevelopment() && ! $user->isSalesManager())) {
            abort(403, 'Only Sales Business Development (SBD) or Sales Manager can submit Job Orders to Operations.');
        }

        $validated = $request->validate([
            'special_instructions' => ['nullable', 'string'],
            'job_requirements' => ['nullable', 'string'],
            'service_type' => ['nullable', 'string'],
        ]);

        $jobOrder->update([
            'status' => 'submitted',
            'operations_submitted_at' => now(),
            'operational_status' => 'Transmitted to Operations & Dispatch Department',
            'dispatch_status' => 'Pending Operations Dispatch Schedule',
            'operational_equipment_status' => 'Allocating Heavy Equipment in Operations Yard',
            'special_instructions' => $validated['special_instructions'] ?? $jobOrder->special_instructions,
            'job_requirements' => $validated['job_requirements'] ?? $jobOrder->job_requirements,
            'service_type' => $validated['service_type'] ?? $jobOrder->service_type,
        ]);

        // Build structured payload handed off to Operations & Dispatch
        $operationalHandoffPayload = [
            'subsystem_source' => 'Sales & Commercial Department',
            'subsystem_destination' => 'Operations & Dispatch Department',
            'handed_off_at' => now()->toIso8601String(),
            'handed_off_by' => [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role,
            ],
            'job_order_data' => [
                'job_order_number' => $jobOrder->job_order_number,
                'client' => [
                    'id' => $jobOrder->customer_id,
                    'company_name' => $jobOrder->customer?->company_name ?: $jobOrder->customer?->name,
                    'contact_person' => $jobOrder->customer?->contact_person,
                    'phone' => $jobOrder->customer?->phone,
                ],
                'project_reference' => $jobOrder->project?->project_code,
                'quotation_reference' => $jobOrder->quotation?->quotation_number,
                'service_type' => $jobOrder->service_type,
                'project_location' => $jobOrder->location,
                'start_date' => $jobOrder->start_date?->toIso8601String(),
                'end_date' => $jobOrder->end_date?->toIso8601String() ?: $jobOrder->due_date?->toIso8601String(),
                'required_equipment' => $jobOrder->required_equipment,
                'rental_requirements' => $jobOrder->rental_requirements,
                'job_requirements' => $jobOrder->job_requirements,
                'special_instructions' => $jobOrder->special_instructions,
            ],
        ];

        ActivityLogService::log(
            $user,
            'operations_handoff',
            JobOrder::class,
            $jobOrder->id,
            "Job Order {$jobOrder->job_order_number} submitted to Core Transaction 2 (Operations & Dispatch).",
            ['status' => 'draft'],
            $operationalHandoffPayload
        );

        app(NotificationService::class)->notifyRoles(
            ['sales_manager', 'sales_business_development'],
            'success',
            'Job Order Submitted to Operations',
            "Job Order {$jobOrder->job_order_number} was transmitted to Core Transaction 2 for dispatch scheduling.",
            JobOrder::class,
            $jobOrder->id
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Job Order successfully submitted to Operations & Dispatch Department.',
            'job_order' => $jobOrder->fresh()->load(['customer', 'project', 'quotation', 'jobOrderItems.equipment']),
            'handoff_payload' => $operationalHandoffPayload,
        ]);
    }

    /**
     * 2.1 RECEIVE OPERATIONAL STATUS UPDATE FROM OPERATIONS & DISPATCH
     *
     * Operations returns schedule/dispatch status, equipment status, assignment info,
     * job progress, and completion details to Sales for read/monitoring only.
     */
    public function receiveOperationsStatus(Request $request, JobOrder $jobOrder)
    {
        $validated = $request->validate([
            'operational_status' => ['required', 'string'],
            'dispatch_status' => ['nullable', 'string'], // e.g. Scheduled, Dispatched, On-Site
            'operational_equipment_status' => ['nullable', 'string'], // e.g. Deployed, Operational, Demobilizing
            'assigned_operator' => ['nullable', 'string'], // e.g. Engr. Marlon Ramos / Crew Lead
            'operational_notes' => ['nullable', 'string'],
            'core1_status_sync' => ['nullable', 'in:scheduled,ongoing,completed,cancelled'],
        ]);

        $updateData = [
            'operational_status' => $validated['operational_status'],
            'dispatch_status' => $validated['dispatch_status'] ?? $jobOrder->dispatch_status,
            'operational_equipment_status' => $validated['operational_equipment_status'] ?? $jobOrder->operational_equipment_status,
            'operational_notes' => $validated['operational_notes'] ?? $jobOrder->operational_notes,
        ];

        if (!empty($validated['core1_status_sync'])) {
            $updateData['status'] = $validated['core1_status_sync'];
            if ($validated['core1_status_sync'] === 'completed') {
                $updateData['completion_date'] = now();
            }
        }

        $jobOrder->update($updateData);

        ActivityLogService::log(
            Auth::user() ?? \App\Models\User::where('role', 'sales_manager')->first(),
            'operational_status_received',
            JobOrder::class,
            $jobOrder->id,
            "Received operational telemetry from Operations & Dispatch for Job Order {$jobOrder->job_order_number}: {$validated['operational_status']}",
            null,
            $validated
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Operational status updated from Operations & Dispatch Department.',
            'job_order' => $jobOrder->fresh()->load(['customer', 'project', 'quotation']),
        ]);
    }

    /**
     * 3. FINANCE & BILLING DEPARTMENT INTEGRATION
     *
     * IMPORTANT REQUIREMENT:
     * Sales & Commercial Department provides ONLY CUSTOMER MASTER DATA to Finance & Billing.
     * DO NOT send financial transactions (No AR, No collection, No disbursements, No billing).
     */
    public function syncCustomerMasterToGroup185(Request $request, Customer $customer)
    {
        $user = Auth::user();
        if (! $user || (! $user->isSalesBusinessDevelopment() && ! $user->isSalesManager() && ! $user->isAdministrator())) {
            abort(403, 'Unauthorized.');
        }

        // STRICT ENFORCEMENT: ONLY CUSTOMER MASTER DATA
        $masterDataPayload = [
            'target_subsystem' => 'Finance & Billing Department (Financial Management System)',
            'data_classification' => 'CUSTOMER_MASTER_DATA_ONLY',
            'synced_at' => now()->toIso8601String(),
            'synced_by' => [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role,
            ],
            'customer_master' => [
                'customer_id' => $customer->id,
                'customer_code' => $customer->customer_code,
                'client_company_name' => $customer->company_name ?: $customer->name,
                'contact_person' => $customer->contact_person,
                'position' => $customer->position,
                'contact_phone' => $customer->phone,
                'contact_mobile' => $customer->mobile_number,
                'contact_email' => $customer->email,
                'business_reg_no' => $customer->business_reg_no,
                'tax_id' => $customer->tax_id,
                'industry' => $customer->industry,
                'address' => $customer->address,
                'barangay' => $customer->barangay,
                'city' => $customer->city,
                'province' => $customer->province,
                'postal_code' => $customer->postal_code,
                'customer_type' => $customer->customer_type,
                'customer_status' => $customer->status,
                'created_at' => $customer->created_at?->toIso8601String(),
            ],
            'subsystem_boundary_compliance' => [
                'accounts_receivable_included' => false,
                'billing_included' => false,
                'collections_included' => false,
                'financial_transactions_included' => false,
                'notice' => 'Strict Sales to Finance boundary enforced. Financial transactions remain owned by Finance & Billing Department.',
            ],
        ];

        $refId = 'FIN-CUS-' . str_pad($customer->id, 5, '0', STR_PAD_LEFT);
        $customer->update([
            'group185_synced_at' => now(),
            'group185_reference_id' => $refId,
        ]);

        ActivityLogService::log(
            $user,
            'finance_master_data_sync',
            Customer::class,
            $customer->id,
            "Customer Master Data for '{$customer->name}' synchronized to Finance & Billing Department.",
            null,
            $masterDataPayload
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Customer master data synchronized to Finance & Billing Department.',
            'group185_reference_id' => $refId,
            'payload' => $masterDataPayload,
        ]);
    }
}
