<?php

namespace App\Http\Controllers\Api;

use App\Models\Customer;
use App\Services\ActivityLogService;
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
        Gate::authorize('view-clients');
        $query = Customer::query();
        // Automatically purge any records in Recently Deleted that have exceeded the 30-day retention window
        Customer::onlyTrashed()->where('deleted_at', '<=', now()->subDays(30))->forceDelete();

        $isTrashView = $request->boolean('trash') || $request->input('view') === 'trash';
        $isArchivedView = $request->boolean('archived') || $request->input('view') === 'archived';

        if ($isTrashView) {
            $query = Customer::onlyTrashed();
        } elseif ($isArchivedView) {
            $query = Customer::query()->whereNotNull('archived_at');
        } else {
            $query = Customer::query()->whereNull('archived_at');
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

        // Filter by pipeline flow stage
        if ($request->filled('pipeline_stage') && $request->input('pipeline_stage') !== 'all') {
            $query->where('pipeline_stage', $request->input('pipeline_stage'));
        }

        // Filter by assigned Sales BD
        if ($request->filled('assigned_sales_bd_id') && $request->input('assigned_sales_bd_id') !== 'all') {
            $query->where('assigned_sales_bd_id', $request->input('assigned_sales_bd_id'));
        }

        // Filter by Sales Manager
        if ($request->filled('sales_manager_id') && $request->input('sales_manager_id') !== 'all') {
            $query->where('sales_manager_id', $request->input('sales_manager_id'));
        }

        // Filter by type
        if ($request->filled('type') && $request->input('type') !== 'all') {
            $query->where('customer_type', $request->input('type'));
        }

        // Filter by source
        if ($request->filled('source') && $request->input('source') !== 'all') {
            $query->where('source', $request->input('source'));
        }

        // Filter by location / region
        if ($request->filled('location') && $request->input('location') !== 'all') {
            $loc = strtolower($request->input('location'));
            if ($loc === 'metro_manila' || $loc === 'ncr') {
                $query->where(function ($q) {
                    $q->where(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(province, ""))'), 'like', '%manila%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(city, ""))'), 'like', '%taguig%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(city, ""))'), 'like', '%makati%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(city, ""))'), 'like', '%quezon%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(city, ""))'), 'like', '%pasig%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(city, ""))'), 'like', '%manila%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(project_location, ""))'), 'like', '%bgc%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(project_location, ""))'), 'like', '%manila%');
                });
            } elseif ($loc === 'cebu' || $loc === 'visayas') {
                $query->where(function ($q) {
                    $q->where(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(province, ""))'), 'like', '%cebu%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(city, ""))'), 'like', '%cebu%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(project_location, ""))'), 'like', '%cebu%');
                });
            } elseif ($loc === 'central_luzon') {
                $query->where(function ($q) {
                    $q->where(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(province, ""))'), 'like', '%pampanga%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(province, ""))'), 'like', '%bulacan%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(province, ""))'), 'like', '%zambales%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(city, ""))'), 'like', '%subic%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(project_location, ""))'), 'like', '%subic%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(project_location, ""))'), 'like', '%clark%');
                });
            } elseif ($loc === 'calabarzon') {
                $query->where(function ($q) {
                    $q->where(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(province, ""))'), 'like', '%laguna%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(province, ""))'), 'like', '%batangas%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(province, ""))'), 'like', '%cavite%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(province, ""))'), 'like', '%rizal%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(city, ""))'), 'like', '%calamba%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(project_location, ""))'), 'like', '%calamba%');
                });
            } elseif ($loc === 'davao' || $loc === 'mindanao') {
                $query->where(function ($q) {
                    $q->where(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(province, ""))'), 'like', '%davao%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(city, ""))'), 'like', '%davao%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(project_location, ""))'), 'like', '%davao%');
                });
            } elseif ($loc === 'international' || $loc === 'other') {
                $query->where(function ($q) {
                    $q->where(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(province, ""))'), 'not like', '%manila%')
                      ->where(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(province, ""))'), 'not like', '%cebu%')
                      ->where(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(province, ""))'), 'not like', '%pampanga%')
                      ->where(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(province, ""))'), 'not like', '%bulacan%')
                      ->where(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(city, ""))'), 'not like', '%makati%')
                      ->where(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(city, ""))'), 'not like', '%taguig%')
                      ->where(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(city, ""))'), 'not like', '%cebu%');
                });
            }
        }

        $query->with([
            'assignedSalesBd:id,name,email,role',
            'salesManager:id,name,email,role',
            'rentals.equipment',
            'jobOrders.jobOrderItems.equipment',
            'projects',
            'followUps',
            'communications',
            'quotations',
        ]);

        $customers = $query->orderBy($isTrashView ? 'deleted_at' : 'id', 'desc')->paginate($request->input('per_page', 15));

        $customers->getCollection()->transform(function ($customer) {
            if ($customer->deleted_at) {
                $del = \Carbon\Carbon::parse($customer->deleted_at);
                $daysAgo = (int) $del->diffInDays(now());
                $customer->days_remaining = max(0, 30 - $daysAgo);
                $customer->days_deleted = $daysAgo;
            }
            return $customer;
        });

        $customData = $customers->toArray();
        $customData['trash_count'] = Customer::onlyTrashed()->count();
        $customData['archived_count'] = Customer::whereNotNull('archived_at')->count();
        $customData['active_count'] = Customer::whereNull('archived_at')->count();

        return response()->json($customData);
    }

    /**
     * Export customers as CSV.
     */
    public function export(Request $request)
    {
        Gate::authorize('view-clients');

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

        if ($request->filled('source') && $request->input('source') !== 'all') {
            $query->where('source', $request->input('source'));
        }

        if ($request->filled('location') && $request->input('location') !== 'all') {
            $loc = strtolower($request->input('location'));
            if ($loc === 'metro_manila' || $loc === 'ncr') {
                $query->where(function ($q) {
                    $q->where(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(province, ""))'), 'like', '%manila%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(city, ""))'), 'like', '%taguig%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(city, ""))'), 'like', '%makati%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(city, ""))'), 'like', '%quezon%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(city, ""))'), 'like', '%pasig%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(city, ""))'), 'like', '%manila%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(project_location, ""))'), 'like', '%bgc%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(project_location, ""))'), 'like', '%manila%');
                });
            } elseif ($loc === 'cebu' || $loc === 'visayas') {
                $query->where(function ($q) {
                    $q->where(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(province, ""))'), 'like', '%cebu%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(city, ""))'), 'like', '%cebu%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(project_location, ""))'), 'like', '%cebu%');
                });
            } elseif ($loc === 'central_luzon') {
                $query->where(function ($q) {
                    $q->where(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(province, ""))'), 'like', '%pampanga%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(province, ""))'), 'like', '%bulacan%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(province, ""))'), 'like', '%zambales%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(city, ""))'), 'like', '%subic%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(project_location, ""))'), 'like', '%subic%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(project_location, ""))'), 'like', '%clark%');
                });
            } elseif ($loc === 'calabarzon') {
                $query->where(function ($q) {
                    $q->where(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(province, ""))'), 'like', '%laguna%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(province, ""))'), 'like', '%batangas%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(province, ""))'), 'like', '%cavite%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(province, ""))'), 'like', '%rizal%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(city, ""))'), 'like', '%calamba%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(project_location, ""))'), 'like', '%calamba%');
                });
            } elseif ($loc === 'davao' || $loc === 'mindanao') {
                $query->where(function ($q) {
                    $q->where(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(province, ""))'), 'like', '%davao%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(city, ""))'), 'like', '%davao%')
                      ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(project_location, ""))'), 'like', '%davao%');
                });
            } elseif ($loc === 'international' || $loc === 'other') {
                $query->where(function ($q) {
                    $q->where(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(province, ""))'), 'not like', '%manila%')
                      ->where(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(province, ""))'), 'not like', '%cebu%')
                      ->where(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(province, ""))'), 'not like', '%pampanga%')
                      ->where(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(province, ""))'), 'not like', '%bulacan%')
                      ->where(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(city, ""))'), 'not like', '%makati%')
                      ->where(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(city, ""))'), 'not like', '%taguig%')
                      ->where(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(city, ""))'), 'not like', '%cebu%');
                });
            }
        }

        $customers = $query->with([
            'rentals.equipment',
            'jobOrders.jobOrderItems.equipment',
            'projects',
            'followUps',
            'communications',
            'quotations',
        ])->orderBy('id', 'asc')->get();

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
                'Region / Location',
                'Active Project / Lease',
                'Total Contract Value (PHP)',
                'Last Interaction Date',
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
                    $c->region ?? '—',
                    $c->active_lease_summary . ($c->active_project_name ? ' (' . $c->active_project_name . ')' : ''),
                    number_format($c->total_contract_value ?? 0, 2, '.', ''),
                    $c->last_interaction_date ? ($c->last_interaction_date . ' [' . ($c->last_interaction_type ?? 'Interaction') . ']') : '—',
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
            'payment_terms' => ['nullable', 'string', 'max:50'],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'accreditation_status' => ['nullable', 'string', 'max:50'],
            'accreditation_valid_until' => ['nullable', 'date'],
            'project_location' => ['nullable', 'string', 'max:255'],
            'technical_requirements' => ['nullable', 'string'],
            'site_condition' => ['nullable', 'string'],
            'estimated_budget' => ['nullable', 'numeric', 'min:0'],
            'bidding_status' => ['nullable', 'string', 'max:50'],
        ]);

        $displayName = $validated['company_name'] ?? $validated['name'] ?? 'Customer';
        $validated['name'] = $displayName;
        $validated['company_name'] = $displayName;
        $validated['status'] = strtolower($validated['status'] ?? 'active');
        $validated['customer_type'] = strtolower($validated['customer_type'] ?? 'corporate');
        $validated['accreditation_status'] = strtolower($validated['accreditation_status'] ?? 'accredited');
        $validated['payment_terms'] = $validated['payment_terms'] ?? 'Net 30';
        $validated['credit_limit'] = $validated['credit_limit'] ?? 500000.00;

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
            'assignedSalesBd:id,name,email,role',
            'salesManager:id,name,email,role',
            'jobOrders.jobOrderItems.equipment',
            'rentals.equipment',
            'quotations',
            'projects',
            'inquiries',
            'followUps.assignee',
            'communications.creator',
            'feedbacks',
            'rentalRequirements.equipment',
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
            'payment_terms' => ['nullable', 'string', 'max:50'],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'accreditation_status' => ['nullable', 'string', 'max:50'],
            'accreditation_valid_until' => ['nullable', 'date'],
            'project_location' => ['nullable', 'string', 'max:255'],
            'technical_requirements' => ['nullable', 'string'],
            'site_condition' => ['nullable', 'string'],
            'estimated_budget' => ['nullable', 'numeric', 'min:0'],
            'bidding_status' => ['nullable', 'string', 'max:50'],
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
        if (isset($validated['accreditation_status'])) {
            $validated['accreditation_status'] = strtolower($validated['accreditation_status']);
        }

        $customer->update($validated);

        return response()->json($customer);
    }

    /**
     * Delete the specified customer (Moves to Recently Deleted with 30-day retention).
     */
    public function destroy(Customer $customer)
    {
        Gate::authorize('manage-customers');
        $name = $customer->company_name ?? $customer->name;
        $customer->update(['status' => 'inactive']);
        $customer->delete(); // sets deleted_at = now()

        return response()->json([
            'message' => "{$name} moved to Recently Deleted. It will be kept for 30 days before permanent deletion.",
            'days_remaining' => 30,
        ], Response::HTTP_OK);
    }

    /**
     * Get count of recently deleted customers.
     */
    public function trashCount()
    {
        Gate::authorize('view-core-dashboard');
        Customer::onlyTrashed()->where('deleted_at', '<=', now()->subDays(30))->forceDelete();
        $count = Customer::onlyTrashed()->count();

        return response()->json(['trash_count' => $count]);
    }

    /**
     * Restore a soft-deleted customer from Recently Deleted (30-day trash).
     */
    public function restoreDeleted($id)
    {
        Gate::authorize('manage-customers');
        $customer = Customer::onlyTrashed()->findOrFail($id);
        $customer->restore();
        $customer->update(['status' => 'active']);

        return response()->json([
            'message' => "{$customer->name} has been restored successfully.",
            'customer' => $customer->fresh(),
        ]);
    }

    /**
     * Permanently remove a customer from the database immediately.
     */
    public function forceDelete($id)
    {
        Gate::authorize('manage-customers');
        $customer = Customer::withTrashed()->findOrFail($id);
        $name = $customer->company_name ?? $customer->name;
        $customer->forceDelete();

        return response()->json([
            'message' => "{$name} has been permanently deleted.",
        ], Response::HTTP_OK);
    }

    /**
     * Empty all items in Recently Deleted.
     */
    public function emptyTrash()
    {
        Gate::authorize('manage-customers');
        $count = Customer::onlyTrashed()->count();
        Customer::onlyTrashed()->forceDelete();

        return response()->json([
            'message' => "Emptied {$count} customer(s) from Recently Deleted.",
        ]);
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

    /**
     * Advance or transition the client flow process stage.
     */
    public function advanceFlowStage(Request $request, Customer $customer)
    {
        Gate::authorize('manage-customers');
        $user = $request->user();

        $validated = $request->validate([
            'stage' => ['required', 'string', 'in:lead_acquisition,technical_scoping,accreditation_review,bidding_proposal,awarded_contract'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'payment_terms' => ['nullable', 'string', 'max:50'],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'accreditation_status' => ['nullable', 'string', 'in:accredited,under_review,pending,rejected'],
        ]);

        $targetStage = $validated['stage'];
        $oldStage = $customer->pipeline_stage ?? 'lead_acquisition';

        // Workflow permission rules between Sales BD and Sales Manager
        if ($targetStage === 'accreditation_review') {
            $customer->accreditation_status = 'under_review';
        } elseif (in_array($targetStage, ['bidding_proposal', 'awarded_contract'])) {
            // Only Sales Manager or Administrator can approve accreditation & advance to bidding / awarded
            if (! $user->isSalesManager() && ! $user->isAdministrator()) {
                return response()->json([
                    'message' => 'Only the Sales Manager or Administrator has authority to approve client accreditation and promote to Bidding or Awarded Contract stage.',
                ], 403);
            }

            if ($targetStage === 'awarded_contract') {
                $customer->accreditation_status = 'accredited';
                $customer->status = 'active';
                $customer->bidding_status = 'awarded';
            } elseif ($targetStage === 'bidding_proposal') {
                $customer->accreditation_status = 'accredited';
                $customer->bidding_status = 'bidding';
            }
        }

        if (isset($validated['payment_terms'])) {
            $customer->payment_terms = $validated['payment_terms'];
        }
        if (isset($validated['credit_limit'])) {
            $customer->credit_limit = $validated['credit_limit'];
        }
        if (isset($validated['accreditation_status'])) {
            $customer->accreditation_status = $validated['accreditation_status'];
        }

        $customer->pipeline_stage = $targetStage;

        if (!empty($validated['notes'])) {
            $customer->notes = ($customer->notes ? $customer->notes . "\n\n" : '') .
                "[" . now()->format('Y-m-d H:i') . " {$user->name}]: " . $validated['notes'];
        }

        $customer->save();

        ActivityLogService::log(
            $user,
            'updated',
            Customer::class,
            $customer->id,
            "Client '{$customer->name}' flow process transitioned from '{$oldStage}' to '{$targetStage}' by {$user->name} ({$user->role}).",
            ['pipeline_stage' => $oldStage],
            ['pipeline_stage' => $targetStage]
        );

        return response()->json([
            'message' => "Client flow process stage successfully updated to {$targetStage}.",
            'customer' => $customer->fresh([
                'assignedSalesBd:id,name,email,role',
                'salesManager:id,name,email,role',
                'jobOrders.jobOrderItems.equipment',
                'rentals.equipment',
                'quotations',
                'projects',
                'inquiries',
            ]),
        ]);
    }

    /**
     * Assign Sales BD and Sales Manager roles to customer.
     */
    public function assignSalesRoles(Request $request, Customer $customer)
    {
        Gate::authorize('manage-customers');
        $user = $request->user();

        $validated = $request->validate([
            'assigned_sales_bd_id' => ['nullable', 'exists:users,id'],
            'sales_manager_id' => ['nullable', 'exists:users,id'],
        ]);

        $customer->update($validated);

        ActivityLogService::log(
            $user,
            'updated',
            Customer::class,
            $customer->id,
            "Sales team assignments updated for client '{$customer->name}'.",
            null,
            $validated
        );

        return response()->json([
            'message' => 'Sales team assigned successfully.',
            'customer' => $customer->fresh([
                'assignedSalesBd:id,name,email,role',
                'salesManager:id,name,email,role',
            ]),
        ]);
    }
}
