<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerInquiry;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use App\Services\NotificationService;

class CustomerInquiryController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('view-crm');
        $query = CustomerInquiry::query()->with(['customer', 'creator', 'assignee', 'history.user']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('source')) {
            $query->where('source', $request->source);
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->filled('search')) {
            $search = '%' . strtolower($request->input('search')) . '%';
            $query->where(function ($q) use ($search) {
                $q->where(\Illuminate\Support\Facades\DB::raw('LOWER(inquiry_number)'), 'like', $search)
                    ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(subject)'), 'like', $search)
                    ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(details)'), 'like', $search)
                    ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(remarks)'), 'like', $search);
            });
        }

        return response()->json($query->latest()->paginate($request->input('per_page', 15)));
    }

    public function store(Request $request)
    {
        Gate::authorize('manage-crm');

        // Provide smart fallbacks for source, subject, and details if frontend submits alternate field names
        $request->merge([
            'source' => $request->input('source') ?: 'direct_inquiry',
            'subject' => $request->input('subject') ?: ($request->input('project_name') ? "Inquiry for {$request->input('project_name')}" : ($request->input('company_name') ? "Requirement for {$request->input('company_name')}" : "Inquiry from {$request->input('contact_name', 'Client')}")),
            'details' => $request->input('details') ?: ($request->input('notes') ?: 'Customer inquiry for crane rental and heavy equipment services.'),
            'customer_name' => $request->input('customer_name') ?: ($request->input('company_name') ?: $request->input('contact_name')),
            'customer_email' => $request->input('customer_email') ?: $request->input('email'),
            'customer_phone' => $request->input('customer_phone') ?: $request->input('phone'),
            'contact_person' => $request->input('contact_person') ?: $request->input('contact_name'),
            'address' => $request->input('address') ?: $request->input('project_location'),
        ]);

        $validated = $request->validate([
            'customer_id' => ['nullable', 'exists:customers,id'],
            'source' => ['required', 'string', 'max:255'],
            'subject' => ['required', 'string', 'max:255'],
            'details' => ['required', 'string'],
            'status' => ['nullable', 'in:new,contacted,qualified,quoted,proposal_sent,converted,closed,closed_lost,archived'],
            'priority' => ['nullable', 'in:low,medium,high,urgent'],
            'remarks' => ['nullable', 'string'],
            'assigned_to' => ['nullable', 'exists:users,id'],
        ]);

        $customerId = $validated['customer_id'] ?? null;
        if (! $customerId && $request->filled('customer_name')) {
            $customer = Customer::firstOrCreate(
                ['email' => $request->input('customer_email', '') ?: 'guest-' . Str::random(8) . '@intellitrack.local'],
                [
                    'name' => $request->input('customer_name'),
                    'email' => $request->input('customer_email', 'guest-' . Str::random(8) . '@intellitrack.local'),
                    'phone' => $request->input('customer_phone'),
                    'company_name' => $request->input('company_name'),
                    'contact_person' => $request->input('contact_person'),
                    'address' => $request->input('address'),
                    'city' => $request->input('city'),
                    'province' => $request->input('province'),
                    'customer_type' => $request->input('customer_type', 'business'),
                    'status' => 'active',
                ]
            );
            $customerId = $customer->id;
        }

        $validated['customer_id'] = $customerId;
        $validated['created_by'] = Auth::id();
        $validated['inquiry_number'] = 'INQ-' . date('Ymd') . '-' . strtoupper(Str::random(6));
        $validated['status'] = $validated['status'] ?? 'new';
        $validated['priority'] = $validated['priority'] ?? 'medium';

        $inquiry = CustomerInquiry::create($validated);

        $inquiry->history()->create([
            'user_id' => Auth::id(),
            'action' => 'created',
            'notes' => 'Inquiry created',
            'old_status' => null,
            'new_status' => $inquiry->status,
        ]);

        app(NotificationService::class)->notifyRoles(
            ['administrator', 'sales_manager'],
            'info',
            'New customer inquiry',
            "{$inquiry->inquiry_number}: {$inquiry->subject}",
            CustomerInquiry::class,
            $inquiry->id,
        );

        return response()->json($inquiry->load(['customer', 'creator', 'assignee']), Response::HTTP_CREATED);
    }

    public function show(CustomerInquiry $customerInquiry)
    {
        Gate::authorize('view-crm');
        return response()->json($customerInquiry->load(['customer', 'creator', 'assignee', 'history.user']));
    }

    public function update(Request $request, CustomerInquiry $customerInquiry)
    {
        Gate::authorize('manage-crm');
        $validated = $request->validate([
            'customer_id' => ['nullable', 'exists:customers,id'],
            'source' => ['sometimes', 'string', 'max:255'],
            'subject' => ['sometimes', 'string', 'max:255'],
            'details' => ['sometimes', 'string'],
            'status' => ['sometimes', 'in:new,contacted,qualified,quoted,closed,archived'],
            'priority' => ['sometimes', 'in:low,medium,high,urgent'],
            'remarks' => ['sometimes', 'nullable', 'string'],
            'assigned_to' => ['sometimes', 'nullable', 'exists:users,id'],
        ]);

        $oldStatus = $customerInquiry->status;
        $customerInquiry->fill($validated);
        $customerInquiry->save();

        if ($oldStatus !== $customerInquiry->status) {
            $customerInquiry->history()->create([
                'user_id' => Auth::id(),
                'action' => 'status_updated',
                'notes' => 'Inquiry status updated',
                'old_status' => $oldStatus,
                'new_status' => $customerInquiry->status,
            ]);
        }

        return response()->json($customerInquiry->load(['customer', 'creator', 'assignee', 'history.user']));
    }

    public function destroy(CustomerInquiry $customerInquiry)
    {
        Gate::authorize('manage-crm');
        $customerInquiry->delete();

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    public function updateStatus(Request $request, CustomerInquiry $customerInquiry)
    {
        Gate::authorize('manage-crm');
        $validated = $request->validate([
            'status' => ['required', 'in:new,contacted,qualified,quoted,proposal_sent,converted,closed,closed_lost,archived'],
            'remarks' => ['nullable', 'string'],
        ]);

        $oldStatus = $customerInquiry->status;
        $customerInquiry->status = $validated['status'];
        $customerInquiry->remarks = $validated['remarks'] ?? $customerInquiry->remarks;
        $customerInquiry->save();

        $customerInquiry->history()->create([
            'user_id' => Auth::id(),
            'action' => 'status_updated',
            'notes' => $validated['remarks'] ?? 'Status updated',
            'old_status' => $oldStatus,
            'new_status' => $validated['status'],
        ]);

        return response()->json($customerInquiry->load(['customer', 'creator', 'assignee', 'history.user']));
    }

    /**
     * Convert an inquiry into a draft quotation.
     */
    public function convertToQuotation(Request $request, CustomerInquiry $customerInquiry)
    {
        Gate::authorize('manage-crm');

        if (! $customerInquiry->customer_id) {
            abort(422, 'Cannot convert inquiry without an associated customer account.');
        }

        $quotation = \App\Models\Quotation::create([
            'quotation_number' => 'QT-' . date('Ymd') . '-' . strtoupper(Str::random(6)),
            'customer_id' => $customerInquiry->customer_id,
            'created_by' => Auth::id(),
            'quotation_date' => now(),
            'valid_until' => now()->addDays(30),
            'status' => 'draft',
            'description' => "Proposal for Inquiry {$customerInquiry->inquiry_number}: {$customerInquiry->subject}",
            'notes' => $customerInquiry->details,
            'subtotal' => 0,
            'tax_rate' => 12,
            'tax_amount' => 0,
            'discount_amount' => 0,
            'total_amount' => 0,
        ]);

        $oldStatus = $customerInquiry->status;
        $customerInquiry->update(['status' => 'quoted']);

        $customerInquiry->history()->create([
            'user_id' => Auth::id(),
            'action' => 'converted_to_quotation',
            'notes' => "Converted to Quotation {$quotation->quotation_number}",
            'old_status' => $oldStatus,
            'new_status' => 'quoted',
        ]);

        return response()->json($quotation->load(['customer', 'createdBy']), Response::HTTP_CREATED);
    }
}
