<?php

namespace IntelliTrack\Services\Quotation\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use IntelliTrack\Services\Quotation\Models\Quotation;
use IntelliTrack\Services\Quotation\Models\QuotationItem;
use IntelliTrack\Services\Quotation\Models\QuotationHistory;
use IntelliTrack\Shared\Http\ApiResponse;
use IntelliTrack\Shared\Events\Quotation\QuotationApprovedEvent;
use IntelliTrack\Shared\Events\RedisEventBus;

class QuotationController extends Controller
{
    /**
     * List quotations with filtering.
     */
    public function index(Request $request)
    {
        $query = Quotation::with(['items', 'history']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('quotation_number', 'like', "%{$search}%");
        }

        $quotations = $query->orderByDesc('created_at')->paginate($request->input('per_page', 25));

        return ApiResponse::success($quotations);
    }

    /**
     * Store new quotation.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => 'required|integer',
            'job_order_id' => 'nullable|integer',
            'sales_opportunity_id' => 'nullable|integer',
            'description' => 'nullable|string',
            'subtotal' => 'nullable|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'discount_amount' => 'nullable|numeric|min:0',
            'valid_until' => 'nullable|date',
            'terms_conditions' => 'nullable|string',
            'notes' => 'nullable|string',
            'status' => 'nullable|string|in:draft,submitted,under_review,revision_requested,approved,sent,accepted,rejected,expired',
            'items' => 'nullable|array',
            'items.*.equipment_id' => 'nullable|integer',
            'items.*.description' => 'required_with:items|string',
            'items.*.quantity' => 'required_with:items|integer|min:1',
            'items.*.rental_duration' => 'nullable|integer|min:1',
            'items.*.rental_duration_unit' => 'nullable|in:hour,day,week,month',
            'items.*.unit_rate' => 'required_with:items|numeric|min:0',
            'items.*.additional_charges' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors());
        }

        $validated = $validator->validated();
        $items = $validated['items'] ?? [];
        unset($validated['items']);

        $validated['quotation_number'] = 'QT-' . date('Ymd') . '-' . strtoupper(Str::random(6));
        $validated['created_by'] = (int) $request->header('X-User-Id', 1);
        $validated['quotation_date'] = now();
        $validated['status'] = $validated['status'] ?? 'draft';

        // Calculate totals
        $subtotal = 0;
        foreach ($items as $item) {
            $qty = $item['quantity'] ?? 1;
            $duration = $item['rental_duration'] ?? 1;
            $rate = $item['unit_rate'] ?? 0;
            $add = $item['additional_charges'] ?? 0;
            $subtotal += ($qty * $duration * $rate) + $add;
        }

        $validated['subtotal'] = $subtotal > 0 ? $subtotal : ($validated['subtotal'] ?? 0);
        $taxRate = $validated['tax_rate'] ?? 12;
        $discount = $validated['discount_amount'] ?? 0;
        $validated['tax_amount'] = round(($validated['subtotal'] - $discount) * ($taxRate / 100), 2);
        $validated['total_amount'] = round(($validated['subtotal'] - $discount) + $validated['tax_amount'], 2);

        $quotation = Quotation::create($validated);

        foreach ($items as $item) {
            $itemSubtotal = (($item['quantity'] ?? 1) * ($item['rental_duration'] ?? 1) * ($item['unit_rate'] ?? 0)) + ($item['additional_charges'] ?? 0);
            QuotationItem::create([
                'quotation_id' => $quotation->id,
                'equipment_id' => $item['equipment_id'] ?? null,
                'description' => $item['description'],
                'quantity' => $item['quantity'] ?? 1,
                'rental_duration' => $item['rental_duration'] ?? 1,
                'rental_duration_unit' => $item['rental_duration_unit'] ?? 'month',
                'unit_rate' => $item['unit_rate'] ?? 0,
                'additional_charges' => $item['additional_charges'] ?? 0,
                'total_amount' => $itemSubtotal,
            ]);
        }

        QuotationHistory::create([
            'quotation_id' => $quotation->id,
            'user_id' => $validated['created_by'],
            'action' => 'created',
            'from_status' => null,
            'to_status' => $quotation->status,
            'notes' => 'Quotation drafted.',
        ]);

        return ApiResponse::created($quotation->load(['items', 'history']), 'Quotation created successfully');
    }

    /**
     * Show quotation details.
     */
    public function show($id)
    {
        $quotation = Quotation::with(['items', 'history'])->find($id);
        if (! $quotation) {
            return ApiResponse::notFound('Quotation not found.');
        }

        return ApiResponse::success($quotation);
    }

    /**
     * Submit quotation for review.
     */
    public function submit($id, Request $request)
    {
        $quotation = Quotation::find($id);
        if (! $quotation) {
            return ApiResponse::notFound('Quotation not found.');
        }

        $userId = (int) $request->header('X-User-Id', 1);
        $quotation->update([
            'status' => 'under_review',
            'submitted_at' => now(),
        ]);

        QuotationHistory::create([
            'quotation_id' => $quotation->id,
            'user_id' => $userId,
            'action' => 'submitted',
            'from_status' => 'draft',
            'to_status' => 'under_review',
            'notes' => 'Quotation submitted for managerial approval.',
        ]);

        return ApiResponse::success($quotation->fresh(['items', 'history']), 'Quotation submitted for review');
    }

    /**
     * Approve quotation.
     */
    public function approve($id, Request $request)
    {
        $quotation = Quotation::find($id);
        if (! $quotation) {
            return ApiResponse::notFound('Quotation not found.');
        }

        $userRole = $request->header('X-User-Role', 'sales_manager');
        $userId = (int) $request->header('X-User-Id', 1);

        if (! in_array($userRole, ['administrator', 'admin', 'sales_manager', 'manager'])) {
            return ApiResponse::forbidden('Only Sales Managers or Administrators can approve quotations.');
        }

        $quotation->update([
            'status' => 'approved',
            'approved_by' => $userId,
            'approved_at' => now(),
            'approval_notes' => $request->input('approval_notes'),
        ]);

        QuotationHistory::create([
            'quotation_id' => $quotation->id,
            'user_id' => $userId,
            'action' => 'approved',
            'from_status' => 'under_review',
            'to_status' => 'approved',
            'notes' => $request->input('approval_notes', 'Quotation approved.'),
        ]);

        // Publish QuotationApprovedEvent
        try {
            $event = QuotationApprovedEvent::create($quotation->id, $quotation->quotation_number, $quotation->customer_id, $userId, (float) $quotation->total_amount);
            app(RedisEventBus::class)->publish($event);
        } catch (\Throwable $e) {}

        return ApiResponse::success($quotation->fresh(['items', 'history']), 'Quotation approved successfully');
    }

    /**
     * Request revision.
     */
    public function requestRevision($id, Request $request)
    {
        $quotation = Quotation::find($id);
        if (! $quotation) {
            return ApiResponse::notFound('Quotation not found.');
        }

        $userId = (int) $request->header('X-User-Id', 1);
        $notes = $request->input('revision_notes', 'Revision requested.');

        $quotation->update([
            'status' => 'revision_requested',
            'revision_notes' => $notes,
            'approved_by' => null,
            'approved_at' => null,
        ]);

        QuotationHistory::create([
            'quotation_id' => $quotation->id,
            'user_id' => $userId,
            'action' => 'revision_requested',
            'from_status' => 'under_review',
            'to_status' => 'revision_requested',
            'notes' => $notes,
        ]);

        return ApiResponse::success($quotation->fresh(['items', 'history']), 'Revision requested successfully');
    }

    /**
     * Send quotation to client.
     */
    public function send($id, Request $request)
    {
        $quotation = Quotation::find($id);
        if (! $quotation) {
            return ApiResponse::notFound('Quotation not found.');
        }

        $userId = (int) $request->header('X-User-Id', 1);
        $quotation->update([
            'status' => 'sent',
            'sent_date' => now(),
        ]);

        QuotationHistory::create([
            'quotation_id' => $quotation->id,
            'user_id' => $userId,
            'action' => 'sent_to_customer',
            'from_status' => 'approved',
            'to_status' => 'sent',
            'notes' => 'Quotation dispatched to customer.',
        ]);

        return ApiResponse::success($quotation->fresh(['items', 'history']), 'Quotation marked as sent to customer');
    }

    /**
     * Accept quotation.
     */
    public function accept($id, Request $request)
    {
        $quotation = Quotation::find($id);
        if (! $quotation) {
            return ApiResponse::notFound('Quotation not found.');
        }

        $userId = (int) $request->header('X-User-Id', 1);
        $response = $request->input('customer_response', 'Accepted by client');

        $quotation->update([
            'status' => 'accepted',
            'accepted_date' => now(),
            'customer_response' => $response,
            'customer_response_at' => now(),
        ]);

        QuotationHistory::create([
            'quotation_id' => $quotation->id,
            'user_id' => $userId,
            'action' => 'customer_accepted',
            'from_status' => 'sent',
            'to_status' => 'accepted',
            'notes' => $response,
        ]);

        return ApiResponse::success($quotation->fresh(['items', 'history']), 'Quotation accepted');
    }

    /**
     * Reject quotation.
     */
    public function reject($id, Request $request)
    {
        $quotation = Quotation::find($id);
        if (! $quotation) {
            return ApiResponse::notFound('Quotation not found.');
        }

        $userId = (int) $request->header('X-User-Id', 1);
        $notes = $request->input('notes', 'Rejected by client or manager');

        $quotation->update([
            'status' => 'rejected',
            'rejected_at' => now(),
            'notes' => $notes,
        ]);

        QuotationHistory::create([
            'quotation_id' => $quotation->id,
            'user_id' => $userId,
            'action' => 'rejected',
            'from_status' => $quotation->status,
            'to_status' => 'rejected',
            'notes' => $notes,
        ]);

        return ApiResponse::success($quotation->fresh(['items', 'history']), 'Quotation rejected');
    }
}
