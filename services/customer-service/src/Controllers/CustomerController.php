<?php

namespace IntelliTrack\Services\Customer\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;
use IntelliTrack\Services\Customer\Models\Customer;
use IntelliTrack\Shared\Http\ApiResponse;
use IntelliTrack\Shared\Events\Customer\CustomerCreatedEvent;
use IntelliTrack\Shared\Events\RedisEventBus;

class CustomerController extends Controller
{
    /**
     * List customers with filtering and pagination.
     */
    public function index(Request $request)
    {
        $query = Customer::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('company_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->boolean('include_archived', false)) {
            $query->withTrashed();
        }

        $customers = $query->orderBy('name')->paginate($request->input('per_page', 25));

        return ApiResponse::success($customers);
    }

    /**
     * Store new customer.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:50',
            'company_name' => 'nullable|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:500',
            'project_location' => 'nullable|string|max:500',
            'technical_requirements' => 'nullable|string',
            'site_condition' => 'nullable|string',
            'estimated_budget' => 'nullable|numeric|min:0',
            'city' => 'nullable|string|max:100',
            'province' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'tax_id' => 'nullable|string|max:100',
            'customer_type' => 'nullable|string|in:corporate,individual,contractor,government',
            'status' => 'nullable|string|in:active,inactive,lead,prospect',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors());
        }

        $data = $validator->validated();
        $data['status'] = $data['status'] ?? 'active';

        $customer = Customer::create($data);

        // Publish event
        try {
            $event = CustomerCreatedEvent::create($customer->id, $customer->name, $customer->email, $customer->company_name);
            app(RedisEventBus::class)->publish($event);
        } catch (\Throwable $e) {}

        return ApiResponse::created($customer, 'Customer created successfully');
    }

    /**
     * Show single customer.
     */
    public function show($id)
    {
        $customer = Customer::with('inquiries')->find($id);
        if (! $customer) {
            return ApiResponse::notFound('Customer not found.');
        }

        return ApiResponse::success($customer);
    }

    /**
     * Update customer.
     */
    public function update(Request $request, $id)
    {
        $customer = Customer::find($id);
        if (! $customer) {
            return ApiResponse::notFound('Customer not found.');
        }

        $validator = Validator::make($request->all(), [
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'company_name' => 'nullable|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:500',
            'project_location' => 'nullable|string|max:500',
            'technical_requirements' => 'nullable|string',
            'site_condition' => 'nullable|string',
            'estimated_budget' => 'nullable|numeric|min:0',
            'city' => 'nullable|string|max:100',
            'province' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'tax_id' => 'nullable|string|max:100',
            'customer_type' => 'nullable|string|in:corporate,individual,contractor,government',
            'status' => 'nullable|string|in:active,inactive,lead,prospect',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors());
        }

        $customer->update($validator->validated());

        return ApiResponse::success($customer, 'Customer updated successfully');
    }

    /**
     * Archive customer.
     */
    public function archive($id)
    {
        $customer = Customer::find($id);
        if (! $customer) {
            return ApiResponse::notFound('Customer not found.');
        }

        $customer->update(['archived_at' => now()]);
        $customer->delete();

        return ApiResponse::success(null, 'Customer archived successfully');
    }

    /**
     * Restore archived customer.
     */
    public function restore($id)
    {
        $customer = Customer::withTrashed()->find($id);
        if (! $customer) {
            return ApiResponse::notFound('Customer not found.');
        }

        $customer->update(['archived_at' => null]);
        $customer->restore();

        return ApiResponse::success($customer, 'Customer restored successfully');
    }

    /**
     * Delete customer permanently.
     */
    public function destroy($id)
    {
        $customer = Customer::withTrashed()->find($id);
        if (! $customer) {
            return ApiResponse::notFound('Customer not found.');
        }

        $customer->forceDelete();

        return ApiResponse::success(null, 'Customer deleted permanently');
    }
}
