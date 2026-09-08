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
            $search = '%' . strtolower($request->input('search')) . '%';
            $query->where(function ($q) use ($search) {
                $q->where(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(customer_code, ""))'), 'like', $search)
                  ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(name, ""))'), 'like', $search)
                  ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(company_name, ""))'), 'like', $search)
                  ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(contact_person, ""))'), 'like', $search)
                  ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(phone, ""))'), 'like', $search)
                  ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(mobile_number, ""))'), 'like', $search)
                  ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(email, ""))'), 'like', $search)
                  ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(business_reg_no, ""))'), 'like', $search)
                  ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(tax_id, ""))'), 'like', $search)
                  ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(industry, ""))'), 'like', $search)
                  ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(city, ""))'), 'like', $search)
                  ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(province, ""))'), 'like', $search);
            });
        }

        // Filter by status
        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        // Filter by type
        if ($request->filled('type') && $request->input('type') !== 'all') {
            $query->where('customer_type', $request->input('type'));
        }

        // Filter by source
        if ($request->filled('source') && $request->input('source') !== 'all') {
            $query->where('source', $request->input('source'));
        }

        $customers = $query->orderBy('id', 'desc')->paginate($request->input('per_page', 15));

        return response()->json($customers);
    }

    /**
     * Export customers as CSV.
     */
    public function export(Request $request)
    {
        Gate::authorize('view-core-dashboard');

        $query = Customer::query();

        if ($request->boolean('archived')) {
            $query->whereNotNull('archived_at');
        } else {
            $query->whereNull('archived_at');
        }

        if ($request->filled('search')) {
            $search = '%' . strtolower($request->input('search')) . '%';
            $query->where(function ($q) use ($search) {
                $q->where(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(customer_code, ""))'), 'like', $search)
                  ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(name, ""))'), 'like', $search)
                  ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(company_name, ""))'), 'like', $search)
                  ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(contact_person, ""))'), 'like', $search)
                  ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(phone, ""))'), 'like', $search)
                  ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(email, ""))'), 'like', $search);
            });
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('type') && $request->input('type') !== 'all') {
            $query->where('customer_type', $request->input('type'));
        }

        $customers = $query->orderBy('id', 'asc')->get();

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="customers-master-list-' . date('Y-m-d') . '.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($customers) {
            $handle = fopen('php://output', 'w');
            // Add UTF-8 BOM for Excel compatibility
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));
            
            fputcsv($handle, [
                'Customer ID',
                'Customer / Company',
                'Contact Person',
                'Position',
                'Contact No.',
                'Mobile No.',
                'Email',
                'Type',
                'Status',
                'Industry',
                'Business Reg No',
                'TIN',
                'Customer Source',
                'Address',
                'Barangay',
                'City / Municipality',
                'Province',
                'Postal Code',
                'Notes',
            ]);

            foreach ($customers as $c) {
                fputcsv($handle, [
                    $c->customer_code ?? ('CUS-' . str_pad($c->id, 4, '0', STR_PAD_LEFT)),
                    $c->company_name ?: $c->name,
                    $c->contact_person ?? '—',
                    $c->position ?? '—',
                    $c->phone ?? '—',
                    $c->mobile_number ?? '—',
                    $c->email ?? '—',
                    ucfirst($c->customer_type ?? 'corporate'),
                    ucfirst($c->status ?? 'active'),
                    $c->industry ?? '—',
                    $c->business_reg_no ?? '—',
                    $c->tax_id ?? '—',
                    $c->source ?? '—',
                    $c->address ?? '—',
                    $c->barangay ?? '—',
                    $c->city ?? '—',
                    $c->province ?? '—',
                    $c->postal_code ?? '—',
                    $c->notes ?? '',
                ]);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Store a newly created customer.
     */
    public function store(Request $request)
    {
        Gate::authorize('manage-customers');
        $validated = $request->validate([
            'customer_code' => ['nullable', 'string', 'max:50', 'unique:customers,customer_code'],
            'customer_type' => ['required', 'string', 'max:50'],
            'name' => ['nullable', 'string', 'max:255'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'business_reg_no' => ['nullable', 'string', 'max:100'],
            'tax_id' => ['nullable', 'string', 'max:100'],
            'industry' => ['nullable', 'string', 'max:100'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:50'],
            'mobile_number' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255', 'unique:customers,email'],
            'address' => ['nullable', 'string'],
            'barangay' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
            'province' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'source' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'max:50'],
            'project_location' => ['nullable', 'string', 'max:255'],
            'technical_requirements' => ['nullable', 'string'],
            'site_condition' => ['nullable', 'string'],
            'estimated_budget' => ['nullable', 'numeric', 'min:0'],
        ]);

        $displayName = $validated['company_name'] ?? $validated['name'] ?? 'Customer';
        $validated['name'] = $displayName;
        $validated['company_name'] = $displayName;
        $validated['status'] = strtolower($validated['status'] ?? 'active');
        $validated['customer_type'] = strtolower($validated['customer_type'] ?? 'corporate');

        $customer = Customer::create($validated);

        return response()->json($customer, Response::HTTP_CREATED);
    }

    /**
     * Display the specified customer.
     */
    public function show(Customer $customer)
    {
        Gate::authorize('view-customer', $customer);
        $customer->load([
            'jobOrders.jobOrderItems.equipment',
            'rentals.equipment',
            'quotations',
            'projects',
            'inquiries',
            'followUps.assignee',
            'communications.creator',
            'feedbacks',
        ]);

        $totalJobOrdersAmount = (float) $customer->jobOrders->sum('total_amount');
        $totalRentalsAmount = (float) $customer->rentals->sum('total_amount');
        $activeJobOrdersCount = $customer->jobOrders->whereIn('status', ['approved', 'in-progress'])->count();
        $activeRentalsCount = $customer->rentals->where('status', 'active')->count();

        // Extract deployed cranes across active job orders & rentals
        $deployedCranes = [];
        foreach ($customer->rentals->where('status', 'active') as $r) {
            if ($r->equipment) {
                $deployedCranes[] = [
                    'id' => $r->equipment->id,
                    'name' => $r->equipment->name,
                    'code' => $r->equipment->code,
                    'crane_model' => $r->equipment->crane_model,
                    'maximum_load' => $r->equipment->maximum_load,
                    'maximum_load_unit' => $r->equipment->maximum_load_unit,
                    'rental_number' => $r->rental_number,
                    'location' => $r->equipment->location,
                ];
            }
        }
        foreach ($customer->jobOrders->where('status', 'in-progress') as $jo) {
            foreach ($jo->jobOrderItems as $item) {
                if ($item->equipment && !collect($deployedCranes)->contains('id', $item->equipment->id)) {
                    $deployedCranes[] = [
                        'id' => $item->equipment->id,
                        'name' => $item->equipment->name,
                        'code' => $item->equipment->code,
                        'crane_model' => $item->equipment->crane_model,
                        'maximum_load' => $item->equipment->maximum_load,
                        'maximum_load_unit' => $item->equipment->maximum_load_unit,
                        'job_order_number' => $jo->job_order_number,
                        'location' => $jo->location,
                    ];
                }
            }
        }

        $customer->lifetime_value = max($totalJobOrdersAmount + $totalRentalsAmount, (float)($customer->total_spending ?? 0));
        $customer->active_job_orders_count = $activeJobOrdersCount;
        $customer->active_rentals_count = $activeRentalsCount;
        $customer->deployed_cranes = $deployedCranes;

        return response()->json([
            'status' => 'success',
            'customer' => $customer,
        ]);
    }

    /**
     * Update the specified customer.
     */
    public function update(Request $request, Customer $customer)
    {
        Gate::authorize('manage-customers');
        $validated = $request->validate([
            'customer_code' => ['nullable', 'string', 'max:50', 'unique:customers,customer_code,' . $customer->id],
            'customer_type' => ['nullable', 'string', 'max:50'],
            'name' => ['nullable', 'string', 'max:255'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'business_reg_no' => ['nullable', 'string', 'max:100'],
            'tax_id' => ['nullable', 'string', 'max:100'],
            'industry' => ['nullable', 'string', 'max:100'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:50'],
            'mobile_number' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255', 'unique:customers,email,' . $customer->id],
            'address' => ['nullable', 'string'],
            'barangay' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
            'province' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'source' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'max:50'],
            'project_location' => ['nullable', 'string', 'max:255'],
            'technical_requirements' => ['nullable', 'string'],
            'site_condition' => ['nullable', 'string'],
            'estimated_budget' => ['nullable', 'numeric', 'min:0'],
        ]);

        if (isset($validated['company_name']) && !isset($validated['name'])) {
            $validated['name'] = $validated['company_name'];
        } elseif (isset($validated['name']) && !isset($validated['company_name'])) {
            $validated['company_name'] = $validated['name'];
        }

        if (isset($validated['status'])) {
            $validated['status'] = strtolower($validated['status']);
        }
        if (isset($validated['customer_type'])) {
            $validated['customer_type'] = strtolower($validated['customer_type']);
        }

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
