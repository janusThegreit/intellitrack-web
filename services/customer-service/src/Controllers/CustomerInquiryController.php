<?php

namespace IntelliTrack\Services\Customer\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use IntelliTrack\Services\Customer\Models\CustomerInquiry;
use IntelliTrack\Services\Customer\Models\CustomerInquiryHistory;
use IntelliTrack\Shared\Http\ApiResponse;

class CustomerInquiryController extends Controller
{
    /**
     * List inquiries.
     */
    public function index(Request $request)
    {
        $query = CustomerInquiry::with(['customer', 'histories']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('inquiry_number', 'like', "%{$search}%")
                  ->orWhere('contact_name', 'like', "%{$search}%")
                  ->orWhere('company_name', 'like', "%{$search}%")
                  ->orWhere('project_name', 'like', "%{$search}%");
            });
        }

        $inquiries = $query->orderByDesc('created_at')->paginate($request->input('per_page', 25));

        return ApiResponse::success($inquiries);
    }

    /**
     * Store new inquiry.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => 'nullable|exists:customers,id',
            'contact_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:50',
            'company_name' => 'nullable|string|max:255',
            'project_name' => 'nullable|string|max:255',
            'project_location' => 'nullable|string|max:500',
            'project_duration' => 'nullable|string|max:100',
            'estimated_budget' => 'nullable|numeric|min:0',
            'site_condition' => 'nullable|string',
            'technical_requirements' => 'nullable|string',
            'priority' => 'nullable|string|in:low,medium,high,urgent',
            'source' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors());
        }

        $data = $validator->validated();
        $data['inquiry_number'] = 'INQ-' . date('Ymd') . '-' . strtoupper(Str::random(6));
        $data['status'] = 'new';
        $data['priority'] = $data['priority'] ?? 'medium';

        $inquiry = CustomerInquiry::create($data);

        // Record history
        CustomerInquiryHistory::create([
            'customer_inquiry_id' => $inquiry->id,
            'user_id' => $request->header('X-User-Id'),
            'status_from' => null,
            'status_to' => 'new',
            'action' => 'inquiry_created',
            'notes' => 'Inquiry registered into system.',
        ]);

        return ApiResponse::created($inquiry->load('customer'), 'Customer inquiry created successfully');
    }

    /**
     * Show inquiry details.
     */
    public function show($id)
    {
        $inquiry = CustomerInquiry::with(['customer', 'histories'])->find($id);
        if (! $inquiry) {
            return ApiResponse::notFound('Customer inquiry not found.');
        }

        return ApiResponse::success($inquiry);
    }

    /**
     * Update inquiry.
     */
    public function update(Request $request, $id)
    {
        $inquiry = CustomerInquiry::find($id);
        if (! $inquiry) {
            return ApiResponse::notFound('Customer inquiry not found.');
        }

        $validator = Validator::make($request->all(), [
            'contact_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'company_name' => 'nullable|string|max:255',
            'project_name' => 'nullable|string|max:255',
            'project_location' => 'nullable|string|max:500',
            'project_duration' => 'nullable|string|max:100',
            'estimated_budget' => 'nullable|numeric|min:0',
            'site_condition' => 'nullable|string',
            'technical_requirements' => 'nullable|string',
            'priority' => 'nullable|string|in:low,medium,high,urgent',
            'source' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors());
        }

        $inquiry->update($validator->validated());

        return ApiResponse::success($inquiry, 'Customer inquiry updated successfully');
    }

    /**
     * Update inquiry status.
     */
    public function updateStatus(Request $request, $id)
    {
        $inquiry = CustomerInquiry::find($id);
        if (! $inquiry) {
            return ApiResponse::notFound('Customer inquiry not found.');
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|string|in:new,contacted,qualified,proposal_sent,negotiating,converted,closed_lost',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors());
        }

        $oldStatus = $inquiry->status;
        $newStatus = $request->status;

        $updates = ['status' => $newStatus];
        if ($newStatus === 'contacted' && ! $inquiry->contacted_at) {
            $updates['contacted_at'] = now();
        } elseif ($newStatus === 'converted' && ! $inquiry->converted_at) {
            $updates['converted_at'] = now();
        } elseif ($newStatus === 'closed_lost' && ! $inquiry->closed_at) {
            $updates['closed_at'] = now();
        }

        $inquiry->update($updates);

        // Record history
        CustomerInquiryHistory::create([
            'customer_inquiry_id' => $inquiry->id,
            'user_id' => $request->header('X-User-Id'),
            'status_from' => $oldStatus,
            'status_to' => $newStatus,
            'action' => 'status_updated',
            'notes' => $request->notes ?? "Status changed from {$oldStatus} to {$newStatus}.",
        ]);

        return ApiResponse::success($inquiry->fresh(['customer', 'histories']), 'Inquiry status updated successfully');
    }

    /**
     * Delete inquiry.
     */
    public function destroy($id)
    {
        $inquiry = CustomerInquiry::find($id);
        if (! $inquiry) {
            return ApiResponse::notFound('Customer inquiry not found.');
        }

        $inquiry->delete();

        return ApiResponse::success(null, 'Customer inquiry deleted successfully');
    }
}
