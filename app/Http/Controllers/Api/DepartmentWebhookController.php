<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobOrder;
use App\Models\Equipment;
use App\Models\Customer;
use App\Models\Rental;
use App\Services\ActivityLogService;
use App\Services\DepartmentIntegrationService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class DepartmentWebhookController extends Controller
{
    /**
     * 1. Inbound: Crane & Equipment Management Status Update
     */
    public function craneStatusUpdate(Request $request)
    {
        $validated = $request->validate([
            'job_order_number' => ['nullable', 'string'],
            'equipment_code' => ['required', 'string'],
            'status' => ['required', 'string'],
            'inspection_passed' => ['nullable', 'boolean'],
            'pemea_safety_cert_no' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $equipment = Equipment::where('code', $validated['equipment_code'])->first();
        if ($equipment) {
            $allowedStatuses = ['available', 'rented', 'maintenance', 'retired'];
            $newStatus = in_array(strtolower($validated['status']), $allowedStatuses)
                ? strtolower($validated['status'])
                : $equipment->status;

            $equipment->update([
                'status' => $newStatus,
                'notes' => trim(($equipment->notes ? $equipment->notes . "\n" : '') . "[Crane Dept Update]: Status {$validated['status']} | Safety Cert: " . ($validated['pemea_safety_cert_no'] ?? 'N/A')),
            ]);
        }

        $jobOrder = !empty($validated['job_order_number'])
            ? JobOrder::where('job_order_number', $validated['job_order_number'])->first()
            : null;

        ActivityLogService::log(
            null,
            'crane_status_webhook',
            JobOrder::class,
            $jobOrder?->id,
            "Crane Dept Webhook: Unit {$validated['equipment_code']} status set to '{$validated['status']}'.",
            null,
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => "Equipment status for '{$validated['equipment_code']}' updated successfully.",
            'equipment_status' => $equipment?->status,
        ]);
    }

    /**
     * 2. Inbound: Assign Driver / Operator and Equipment Assignment Callback
     */
    public function manpowerAssignment(Request $request)
    {
        $validated = $request->validate([
            'job_order_number' => ['required', 'string'],
            'assigned_crew' => ['required', 'array'],
            'assignment_status' => ['nullable', 'string'],
        ]);

        $jobOrder = JobOrder::where('job_order_number', $validated['job_order_number'])->firstOrFail();

        $crewSummary = collect($validated['assigned_crew'])->map(function ($crew) {
            return ($crew['role'] ?? 'Crew') . ": " . ($crew['full_name'] ?? 'Assigned') . " (" . ($crew['mobile'] ?? 'N/A') . ")";
        })->implode("\n");

        $jobOrder->update([
            'notes' => trim(($jobOrder->notes ? $jobOrder->notes . "\n" : '') . "[Manpower Dept Assigned Crew]:\n" . $crewSummary),
        ]);

        ActivityLogService::log(
            null,
            'manpower_assigned_webhook',
            JobOrder::class,
            $jobOrder->id,
            "Manpower Dept assigned " . count($validated['assigned_crew']) . " crew member(s) to JO {$jobOrder->job_order_number}.",
            null,
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => 'Manpower crew assignment recorded on Job Order.',
            'job_order_number' => $jobOrder->job_order_number,
        ]);
    }

    /**
     * 3. Inbound: Dispatch Job and Scheduling Status Update
     */
    public function dispatchStatus(Request $request)
    {
        $validated = $request->validate([
            'job_order_number' => ['required', 'string'],
            'status' => ['required', 'string'],
            'remarks' => ['nullable', 'string'],
            'arrived_at' => ['nullable', 'date'],
            'live_tracking_url' => ['nullable', 'url'],
        ]);

        $jobOrder = JobOrder::where('job_order_number', $validated['job_order_number'])->firstOrFail();

        // If status indicates on site or rigging, set job order in-progress
        if (in_array(strtolower($validated['status']), ['arrived_on_site', 'rigging', 'in-progress'])) {
            if ($jobOrder->status === 'pending' || $jobOrder->status === 'approved') {
                $jobOrder->status = 'in-progress';
            }
        }

        $jobOrder->notes = trim(($jobOrder->notes ? $jobOrder->notes . "\n" : '') .
            "[Dispatch Update]: Status: {$validated['status']}" .
            ($validated['remarks'] ? " | Remarks: {$validated['remarks']}" : "") .
            ($validated['live_tracking_url'] ? " | Tracking: {$validated['live_tracking_url']}" : ""));
        $jobOrder->save();

        ActivityLogService::log(
            null,
            'dispatch_status_webhook',
            JobOrder::class,
            $jobOrder->id,
            "Dispatch Dept updated status to '{$validated['status']}' for JO {$jobOrder->job_order_number}.",
            null,
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => 'Dispatch status updated successfully.',
            'job_order_status' => $jobOrder->status,
        ]);
    }

    /**
     * 4. Inbound: Fleet Management Trip Status Callback
     */
    public function fleetTripStatus(Request $request)
    {
        $validated = $request->validate([
            'job_order_number' => ['required', 'string'],
            'trip_id' => ['nullable', 'string'],
            'vehicle_plate' => ['nullable', 'string'],
            'driver_name' => ['nullable', 'string'],
            'status' => ['required', 'string'],
            'gps_coordinates' => ['nullable', 'array'],
            'estimated_arrival' => ['nullable', 'string'],
        ]);

        $jobOrder = JobOrder::where('job_order_number', $validated['job_order_number'])->firstOrFail();

        $entry = "[Fleet Transit Update]: Vehicle {$validated['vehicle_plate']} (Driver: {$validated['driver_name']}) - Status: {$validated['status']}";
        if (!empty($validated['estimated_arrival'])) {
            $entry .= " | ETA: {$validated['estimated_arrival']}";
        }

        $jobOrder->update([
            'notes' => trim(($jobOrder->notes ? $jobOrder->notes . "\n" : '') . $entry),
        ]);

        ActivityLogService::log(
            null,
            'fleet_status_webhook',
            JobOrder::class,
            $jobOrder->id,
            "Fleet Dept updated transit status to '{$validated['status']}' for JO {$jobOrder->job_order_number}.",
            null,
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => 'Fleet transit telemetry recorded.',
            'job_order_number' => $jobOrder->job_order_number,
        ]);
    }

    /**
     * 5. Inbound: Accounts Receivable (AR) Credit Clearance Callback
     */
    public function arCreditClearance(Request $request)
    {
        $validated = $request->validate([
            'job_order_number' => ['required', 'string'],
            'credit_status' => ['required', 'string'], // cleared, hold, rejected
            'downpayment_received' => ['nullable', 'numeric'],
            'or_number' => ['nullable', 'string'],
            'approved_by' => ['nullable', 'string'],
        ]);

        $jobOrder = JobOrder::where('job_order_number', $validated['job_order_number'])->firstOrFail();

        $cleared = strtolower($validated['credit_status']) === 'cleared' || strtolower($validated['credit_status']) === 'approved';
        $entry = "[Accounts Receivable]: Credit {$validated['credit_status']}" .
            ($validated['downpayment_received'] ? " | DP Paid: PHP " . number_format($validated['downpayment_received'], 2) : "") .
            ($validated['or_number'] ? " | Official Receipt: {$validated['or_number']}" : "");

        $jobOrder->update([
            'notes' => trim(($jobOrder->notes ? $jobOrder->notes . "\n" : '') . $entry),
        ]);

        ActivityLogService::log(
            null,
            'ar_credit_webhook',
            JobOrder::class,
            $jobOrder->id,
            "AR Dept set credit status to '{$validated['credit_status']}' for JO {$jobOrder->job_order_number}.",
            null,
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => 'Accounts Receivable clearance status registered.',
            'cleared' => $cleared,
        ]);
    }

    /**
     * 6. Inbound: Billing & Invoicing Module Invoice Status Callback
     */
    public function billingInvoiceStatus(Request $request)
    {
        $validated = $request->validate([
            'job_order_number' => ['required', 'string'],
            'invoice_number' => ['required', 'string'],
            'status' => ['required', 'string'], // posted, paid, cancelled
            'grand_total' => ['nullable', 'numeric'],
            'invoice_pdf_url' => ['nullable', 'url'],
        ]);

        $jobOrder = JobOrder::where('job_order_number', $validated['job_order_number'])->firstOrFail();

        $entry = "[Billing Module]: Invoice {$validated['invoice_number']} ({$validated['status']})" .
            ($validated['grand_total'] ? " | Total: PHP " . number_format($validated['grand_total'], 2) : "") .
            ($validated['invoice_pdf_url'] ? " | PDF: {$validated['invoice_pdf_url']}" : "");

        $jobOrder->update([
            'notes' => trim(($jobOrder->notes ? $jobOrder->notes . "\n" : '') . $entry),
        ]);

        ActivityLogService::log(
            null,
            'billing_invoice_webhook',
            JobOrder::class,
            $jobOrder->id,
            "Billing Dept issued invoice {$validated['invoice_number']} ({$validated['status']}) for JO {$jobOrder->job_order_number}.",
            null,
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => 'Invoice status linked to Job Order.',
            'invoice_number' => $validated['invoice_number'],
        ]);
    }

    /**
     * 7. Inbound: Contract and Permit Management Status Callback
     */
    public function contractStatusUpdate(Request $request)
    {
        $validated = $request->validate([
            'client_id' => ['required', 'exists:customers,id'],
            'contract_number' => ['required', 'string'],
            'contract_status' => ['required', 'string'],
            'contract_file_url' => ['nullable', 'url'],
            'permits' => ['nullable', 'array'],
        ]);

        $customer = Customer::findOrFail($validated['client_id']);

        ActivityLogService::log(
            null,
            'contract_permit_webhook',
            Customer::class,
            $customer->id,
            "Contract & Permit Dept synced contract {$validated['contract_number']} ({$validated['contract_status']}) for Client '{$customer->name}'.",
            null,
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => 'Client contract & permit status synchronized.',
            'client_id' => $customer->id,
        ]);
    }

    /**
     * 8. Inbound: Asset Management Availability Callback
     */
    public function assetAvailabilityStatus(Request $request)
    {
        $validated = $request->validate([
            'rental_id' => ['required', 'exists:rentals,id'],
            'asset_tag' => ['required', 'string'],
            'availability_status' => ['required', 'string'],
            'asset_condition' => ['nullable', 'string'],
        ]);

        $rental = Rental::findOrFail($validated['rental_id']);
        $rental->update([
            'notes' => trim(($rental->notes ? $rental->notes . "\n" : '') .
                "[Asset Management]: Tag: {$validated['asset_tag']} | Status: {$validated['availability_status']} | Condition: " . ($validated['asset_condition'] ?? 'Operational')),
        ]);

        ActivityLogService::log(
            null,
            'asset_management_webhook',
            Rental::class,
            $rental->id,
            "Asset Dept verified asset {$validated['asset_tag']} for Rental {$rental->rental_code}.",
            null,
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => 'Asset readiness updated on rental.',
            'rental_code' => $rental->rental_code,
        ]);
    }

    /**
     * Manual Trigger for Core Users to Dispatch Outbound HTTP calls
     */
    public function syncDepartment(Request $request, JobOrder $jobOrder, string $department)
    {
        $this->authorize('manage-job-orders');

        $result = match ($department) {
            'crane' => DepartmentIntegrationService::sendEquipmentRequirementsToCrane($jobOrder),
            'manpower' => DepartmentIntegrationService::requestOperatorAssignment($jobOrder),
            'dispatch' => DepartmentIntegrationService::sendJobOrderToDispatch($jobOrder),
            'fleet' => DepartmentIntegrationService::sendTripInfoToFleet($jobOrder),
            'ar' => DepartmentIntegrationService::sendJobDetailsToAR($jobOrder),
            'billing' => DepartmentIntegrationService::sendJobCompletionToBilling($jobOrder),
            default => ['success' => false, 'error' => "Unknown department: {$department}"],
        };

        return response()->json([
            'department' => $department,
            'result' => $result,
        ], $result['success'] ? Response::HTTP_OK : Response::HTTP_BAD_REQUEST);
    }
}
