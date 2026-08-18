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
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('inquiry_number', 'like', "%{$search}%")
                    ->orWhere('subject', 'like', "%{$search}%")
                    ->orWhere('details', 'like', "%{$search}%")
                    ->orWhere('remarks', 'like', "%{$search}%");
            });
        }

        return response()->json($query->latest()->paginate($request->input('per_page', 15)));
    }

    public function store(Request $request)
    {
        Gate::authorize('manage-crm');
        $validated = $request->validate([
            'customer_id' => ['nullable', 'exists:customers,id'],
            'source' => ['required', 'string', 'max:255'],
            'subject' => ['required', 'string', 'max:255'],
            'details' => ['required', 'string'],
            'status' => ['nullable', 'in:new,contacted,qualified,quoted,closed,archived'],
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
            'status' => ['required', 'in:new,contacted,qualified,quoted,closed,archived'],
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
}
