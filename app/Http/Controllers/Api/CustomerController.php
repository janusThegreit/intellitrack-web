<?php

namespace App\Http\Controllers\Api;

use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Gate;

class CustomerController extends Controller
{
    /**
     * Display a listing of customers.
     */
    public function index(Request $request)
    {
        Gate::authorize('view-core-dashboard');
        $query = Customer::query();

        if ($request->boolean('archived')) {
            $query->whereNotNull('archived_at');
        } else {
            $query->whereNull('archived_at');
        }

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('company_name', 'like', "%{$search}%");
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Filter by type
        if ($request->filled('type')) {
            $query->where('customer_type', $request->input('type'));
        }

        $customers = $query->paginate($request->input('per_page', 15));

        return response()->json($customers);
    }

    /**
     * Store a newly created customer.
     */
    public function store(Request $request)
    {
        Gate::authorize('manage-customers');
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:customers'],
            'phone' => ['nullable', 'string', 'max:20'],
            'company_name' => ['nullable', 'string'],
            'contact_person' => ['nullable', 'string'],
            'address' => ['nullable', 'string'],
            'project_location' => ['nullable', 'string', 'max:255'],
            'technical_requirements' => ['nullable', 'string'],
            'site_condition' => ['nullable', 'string'],
            'estimated_budget' => ['nullable', 'numeric', 'min:0'],
            'city' => ['nullable', 'string'],
            'province' => ['nullable', 'string'],
            'postal_code' => ['nullable', 'string'],
            'tax_id' => ['nullable', 'string'],
            'customer_type' => ['required', 'in:individual,business,corporate'],
            'notes' => ['nullable', 'string'],
        ]);

        $customer = Customer::create($validated);

        return response()->json($customer, Response::HTTP_CREATED);
    }

    /**
     * Display the specified customer.
     */
    public function show(Customer $customer)
    {
        Gate::authorize('view-customer', $customer);
        $customer->load(['jobOrders', 'rentals', 'quotations', 'projects']);
        return response()->json($customer);
    }

    /**
     * Update the specified customer.
     */
    public function update(Request $request, Customer $customer)
    {
        Gate::authorize('manage-customers');
        $validated = $request->validate([
            'name' => ['string', 'max:255'],
            'email' => ['email', 'unique:customers,email,' . $customer->id],
            'phone' => ['nullable', 'string', 'max:20'],
            'company_name' => ['nullable', 'string'],
            'contact_person' => ['nullable', 'string'],
            'address' => ['nullable', 'string'],
            'project_location' => ['nullable', 'string', 'max:255'],
            'technical_requirements' => ['nullable', 'string'],
            'site_condition' => ['nullable', 'string'],
            'estimated_budget' => ['nullable', 'numeric', 'min:0'],
            'city' => ['nullable', 'string'],
            'province' => ['nullable', 'string'],
            'postal_code' => ['nullable', 'string'],
            'tax_id' => ['nullable', 'string'],
            'customer_type' => ['in:individual,business,corporate'],
            'status' => ['in:active,inactive,blacklisted'],
            'notes' => ['nullable', 'string'],
        ]);

        $customer->update($validated);

        return response()->json($customer);
    }

    /**
     * Delete the specified customer.
     */
    public function destroy(Customer $customer)
    {
        Gate::authorize('manage-customers');
        $customer->delete();
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    public function archive(Customer $customer)
    {
        Gate::authorize('manage-customers');
        $customer->update(['archived_at' => now(), 'status' => 'inactive']);

        return response()->json($customer->fresh());
    }

    public function restore(Customer $customer)
    {
        Gate::authorize('manage-customers');
        $customer->update(['archived_at' => null, 'status' => 'active']);

        return response()->json($customer->fresh());
    }

    /**
     * Get customer's job orders
     */
    public function jobOrders(Customer $customer)
    {
        Gate::authorize('view-customer', $customer);
        $jobOrders = $customer->jobOrders()->with('jobOrderItems.equipment')->paginate(15);
        return response()->json($jobOrders);
    }

    /**
     * Get customer's rentals
     */
    public function rentals(Customer $customer)
    {
        Gate::authorize('view-customer', $customer);
        $rentals = $customer->rentals()->with('equipment')->paginate(15);
        return response()->json($rentals);
    }

    /**
     * Get customer's quotations
     */
    public function quotations(Customer $customer)
    {
        Gate::authorize('view-customer', $customer);
        $quotations = $customer->quotations()->paginate(15);
        return response()->json($quotations);
    }
}
