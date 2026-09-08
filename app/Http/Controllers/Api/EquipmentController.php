<?php

namespace App\Http\Controllers\Api;

use App\Models\Equipment;
use App\Models\JobOrder;
use App\Models\JobOrderItem;
use App\Models\Rental;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use App\Http\Controllers\Controller;
use App\Services\ActivityLogService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class EquipmentController extends Controller
{
    /**
     * Display a listing of equipment.
     */
    public function index(Request $request)
    {
        Gate::authorize('view-rentals');
        $query = Equipment::query()->with([
            'jobOrderItems.jobOrder.customer',
            'rentals.customer',
            'rentals.jobOrder',
            'maintenanceRecords',
        ]);

        if ($request->filled('search')) {
            $search = '%' . strtolower($request->input('search')) . '%';
            $query->where(function ($q) use ($search) {
                $q->where(\Illuminate\Support\Facades\DB::raw('LOWER(name)'), 'like', $search)
                  ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(code)'), 'like', $search)
                  ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(serial_number)'), 'like', $search)
                  ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(crane_model)'), 'like', $search)
                  ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(location)'), 'like', $search);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        if ($request->filled('crane_category')) {
            $query->where('crane_category', $request->input('crane_category'));
        }

        $equipment = $query->orderBy('name')->paginate($request->input('per_page', 25));

        // Augment each equipment item with active deployment information
        $equipment->getCollection()->transform(function ($item) {
            $activeJob = null;
            foreach ($item->jobOrderItems as $joi) {
                if ($joi->jobOrder && in_array($joi->jobOrder->status, ['in-progress', 'approved'])) {
                    $activeJob = [
                        'job_order_id' => $joi->jobOrder->id,
                        'job_order_number' => $joi->jobOrder->job_order_number,
                        'status' => $joi->jobOrder->status,
                        'customer_id' => $joi->jobOrder->customer_id,
                        'customer_name' => $joi->jobOrder->customer?->company_name ?? $joi->jobOrder->customer?->name ?? 'Unknown Client',
                        'location' => $joi->jobOrder->location ?? 'Client Project Site',
                        'scheduled_date' => $joi->jobOrder->scheduled_date,
                        'due_date' => $joi->jobOrder->due_date,
                    ];
                    break;
                }
            }

            $activeRental = null;
            foreach ($item->rentals as $rent) {
                if (in_array($rent->status, ['active', 'pending'])) {
                    $activeRental = [
                        'rental_id' => $rent->id,
                        'rental_number' => $rent->rental_number,
                        'customer_id' => $rent->customer_id,
                        'customer_name' => $rent->customer?->company_name ?? $rent->customer?->name ?? 'Direct Rental',
                        'job_order_id' => $rent->job_order_id,
                        'job_order_number' => $rent->jobOrder?->job_order_number,
                        'rental_start_date' => $rent->rental_start_date,
                        'rental_end_date' => $rent->rental_end_date,
                        'daily_rate' => (float)$rent->daily_rate,
                        'status' => $rent->status,
                    ];
                    break;
                }
            }

            $latestMaintenance = $item->maintenanceRecords->sortByDesc('created_at')->first();

            $item->active_job_order = $activeJob;
            $item->active_rental = $activeRental;
            $item->latest_maintenance = $latestMaintenance ? [
                'id' => $latestMaintenance->id,
                'maintenance_type' => $latestMaintenance->maintenance_type,
                'scheduled_date' => $latestMaintenance->scheduled_date,
                'description' => $latestMaintenance->description,
            ] : null;

            return $item;
        });

        // Compute fleet telemetry metrics
        $totalUnits = Equipment::count();
        $availableUnits = Equipment::where('status', 'available')->count();
        $rentedUnits = Equipment::where('status', 'rented')->count();
        $maintenanceUnits = Equipment::where('status', 'maintenance')->count();
        $retiredUnits = Equipment::where('status', 'retired')->count();
        $totalValuation = (float)Equipment::sum('purchase_price');
        $utilizationRate = $totalUnits > 0 ? round(($rentedUnits / $totalUnits) * 100, 1) : 0;

        $telemetry = [
            'total_units' => $totalUnits,
            'available_units' => $availableUnits,
            'rented_units' => $rentedUnits,
            'maintenance_units' => $maintenanceUnits,
            'retired_units' => $retiredUnits,
            'total_valuation' => $totalValuation,
            'utilization_rate' => $utilizationRate,
        ];

        return response()->json([
            'data' => $equipment->items(),
            'current_page' => $equipment->currentPage(),
            'last_page' => $equipment->lastPage(),
            'total' => $equipment->total(),
            'per_page' => $equipment->perPage(),
            'telemetry' => $telemetry,
        ]);
    }

    /**
     * Store a newly created equipment.
     */
    public function store(Request $request)
    {
        Gate::authorize('manage-rentals');

        if (!$request->filled('code')) {
            $request->merge(['code' => 'EQ-' . date('Ymd') . '-' . strtoupper(Str::random(4))]);
        }
        if (!$request->filled('quantity_available')) {
            $request->merge(['quantity_available' => 1]);
        }
        if ($request->filled('daily_rate') && !$request->filled('rental_rate')) {
            $request->merge(['rental_rate' => $request->input('daily_rate')]);
        }

        $validated = $request->validate([
            'code' => ['required', 'string', 'unique:equipment'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category' => ['nullable', 'string'],
            'crane_model' => ['nullable', 'string', 'max:255'],
            'crane_category' => ['nullable', 'in:hammerhead,topless,luffing'],
            'maximum_load' => ['nullable', 'numeric', 'min:0'],
            'maximum_load_unit' => ['nullable', 'string', 'max:20'],
            'maximum_radius' => ['nullable', 'numeric', 'min:0'],
            'maximum_radius_unit' => ['nullable', 'string', 'max:20'],
            'final_height' => ['nullable', 'numeric', 'min:0'],
            'final_height_unit' => ['nullable', 'string', 'max:20'],
            'rental_services' => ['nullable', 'array'],
            'rental_rate' => ['nullable', 'numeric', 'min:0'],
            'rental_unit' => ['nullable', 'in:day,week,month,hourly'],
            'serial_number' => ['nullable', 'unique:equipment'],
            'acquisition_date' => ['nullable', 'date'],
            'purchase_price' => ['nullable', 'numeric', 'min:0'],
            'current_value' => ['nullable', 'numeric', 'min:0'],
            'quantity_available' => ['required', 'integer', 'min:1'],
            'location' => ['nullable', 'string'],
            'specifications' => ['nullable', 'string'],
            'status' => ['nullable', 'in:available,rented,maintenance,damaged,retired'],
        ]);

        $equipment = Equipment::create($validated);

        ActivityLogService::log(
            Auth::user(),
            'created',
            Equipment::class,
            $equipment->id,
            "Heavy equipment unit '{$equipment->name}' ({$equipment->code}) registered into fleet.",
            null,
            ['status' => $equipment->status, 'model' => $equipment->crane_model]
        );

        return response()->json($equipment, Response::HTTP_CREATED);
    }

    /**
     * Display the specified equipment.
     */
    public function show(Equipment $equipment)
    {
        Gate::authorize('view-rentals');
        $equipment->load(['jobOrderItems.jobOrder.customer', 'rentals.customer', 'rentals.jobOrder', 'maintenanceRecords']);
        return response()->json($equipment);
    }

    /**
     * Update the specified equipment.
     */
    public function update(Request $request, Equipment $equipment)
    {
        Gate::authorize('manage-rentals');
        $validated = $request->validate([
            'code' => ['string', 'unique:equipment,code,' . $equipment->id],
            'name' => ['string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category' => ['nullable', 'string'],
            'crane_model' => ['nullable', 'string', 'max:255'],
            'crane_category' => ['nullable', 'in:hammerhead,topless,luffing'],
            'maximum_load' => ['nullable', 'numeric', 'min:0'],
            'maximum_load_unit' => ['nullable', 'string', 'max:20'],
            'maximum_radius' => ['nullable', 'numeric', 'min:0'],
            'maximum_radius_unit' => ['nullable', 'string', 'max:20'],
            'final_height' => ['nullable', 'numeric', 'min:0'],
            'final_height_unit' => ['nullable', 'string', 'max:20'],
            'rental_services' => ['nullable', 'array'],
            'rental_rate' => ['nullable', 'numeric', 'min:0'],
            'rental_unit' => ['in:day,week,month,hourly'],
            'status' => ['in:available,rented,maintenance,damaged,retired'],
            'serial_number' => ['nullable', 'unique:equipment,serial_number,' . $equipment->id],
            'acquisition_date' => ['nullable', 'date'],
            'purchase_price' => ['nullable', 'numeric', 'min:0'],
            'current_value' => ['nullable', 'numeric', 'min:0'],
            'quantity_available' => ['integer', 'min:1'],
            'location' => ['nullable', 'string'],
            'specifications' => ['nullable', 'string'],
        ]);

        $oldStatus = $equipment->status;
        $equipment->update($validated);

        if (isset($validated['status']) && $validated['status'] !== $oldStatus) {
            ActivityLogService::log(
                Auth::user(),
                'status_change',
                Equipment::class,
                $equipment->id,
                "Equipment '{$equipment->name}' status changed from {$oldStatus} to {$validated['status']}.",
                ['status' => $oldStatus],
                ['status' => $validated['status']]
            );
        }

        return response()->json($equipment);
    }

    /**
     * Delete the specified equipment.
     */
    public function destroy(Equipment $equipment)
    {
        Gate::authorize('manage-rentals');
        $equipment->delete();
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * Deploy / Rent Out equipment to a Job Order or quick Rental.
     */
    public function deploy(Request $request, Equipment $equipment)
    {
        Gate::authorize('manage-rentals');

        $validated = $request->validate([
            'job_order_id' => ['nullable', 'exists:job_orders,id'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'rental_start_date' => ['nullable', 'date'],
            'rental_end_date' => ['nullable', 'date', 'after_or_equal:rental_start_date'],
            'daily_rate' => ['nullable', 'numeric', 'min:0'],
            'destination_site' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'mobilize_job_order' => ['nullable', 'boolean'],
        ]);

        $rate = $validated['daily_rate'] ?? $equipment->rental_rate ?? 0;
        $jobOrder = null;

        if (!empty($validated['job_order_id'])) {
            $jobOrder = JobOrder::find($validated['job_order_id']);

            // Check if already in jobOrderItems
            $item = JobOrderItem::firstOrCreate(
                [
                    'job_order_id' => $jobOrder->id,
                    'equipment_id' => $equipment->id,
                ],
                [
                    'quantity' => 1,
                    'unit_price' => $rate,
                    'unit' => 'day',
                    'total_price' => $rate,
                    'notes' => $validated['notes'] ?? 'Dispatched from Fleet Management',
                ]
            );

            // Optionally mark job order as in-progress if requested or approved
            if (!empty($validated['mobilize_job_order']) || $jobOrder->status === 'approved') {
                $jobOrder->update([
                    'status' => 'in-progress',
                    'start_date' => $jobOrder->start_date ?? now(),
                ]);
            }

            // Create or sync active rental record
            $startDate = $validated['rental_start_date'] ?? now()->toDateString();
            $endDate = $validated['rental_end_date'] ?? ($jobOrder->due_date ? $jobOrder->due_date->toDateString() : now()->addDays(30)->toDateString());
            $diffDays = max(1, (new \DateTime($startDate))->diff(new \DateTime($endDate))->days + 1);

            Rental::create([
                'rental_number' => 'RNT-' . date('Ymd') . '-' . strtoupper(Str::random(6)),
                'job_order_id' => $jobOrder->id,
                'customer_id' => $jobOrder->customer_id,
                'equipment_id' => $equipment->id,
                'quantity' => 1,
                'rental_start_date' => $startDate,
                'rental_end_date' => $endDate,
                'status' => 'active',
                'daily_rate' => $rate,
                'rental_days' => $diffDays,
                'rental_cost' => $rate * $diffDays,
                'total_amount' => $rate * $diffDays,
                'notes' => "Dispatched for Job Order {$jobOrder->job_order_number}. " . ($validated['notes'] ?? ''),
            ]);

            $newLocation = $validated['destination_site'] ?? $jobOrder->location ?? $equipment->location;
        } elseif (!empty($validated['customer_id'])) {
            // Direct rental without existing Job Order
            $startDate = $validated['rental_start_date'] ?? now()->toDateString();
            $endDate = $validated['rental_end_date'] ?? now()->addDays(30)->toDateString();
            $diffDays = max(1, (new \DateTime($startDate))->diff(new \DateTime($endDate))->days + 1);

            $rental = Rental::create([
                'rental_number' => 'RNT-' . date('Ymd') . '-' . strtoupper(Str::random(6)),
                'customer_id' => $validated['customer_id'],
                'equipment_id' => $equipment->id,
                'quantity' => 1,
                'rental_start_date' => $startDate,
                'rental_end_date' => $endDate,
                'status' => 'active',
                'daily_rate' => $rate,
                'rental_days' => $diffDays,
                'rental_cost' => $rate * $diffDays,
                'total_amount' => $rate * $diffDays,
                'notes' => $validated['notes'] ?? 'Direct Fleet Dispatch',
            ]);

            $newLocation = $validated['destination_site'] ?? $equipment->location;
        } else {
            return response()->json(['error' => 'Please select a Job Order or Customer for dispatch.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Set equipment status to rented
        $equipment->update([
            'status' => 'rented',
            'location' => $newLocation ?? $equipment->location,
        ]);

        ActivityLogService::log(
            Auth::user(),
            'deployed',
            Equipment::class,
            $equipment->id,
            "Equipment '{$equipment->name}' deployed to site" . ($jobOrder ? " under Job Order {$jobOrder->job_order_number}." : "."),
            null,
            ['job_order_id' => $jobOrder?->id, 'new_status' => 'rented', 'location' => $equipment->location]
        );

        return response()->json([
            'message' => 'Equipment successfully deployed to site.',
            'equipment' => $equipment,
            'job_order' => $jobOrder,
        ]);
    }

    /**
     * Demobilize equipment and return back to yard.
     */
    public function demobilize(Request $request, Equipment $equipment)
    {
        Gate::authorize('manage-rentals');

        $validated = $request->validate([
            'return_location' => ['nullable', 'string'],
            'damage_notes' => ['nullable', 'string'],
            'condition' => ['nullable', 'string', 'in:ready,needs_inspection,maintenance'],
        ]);

        $newStatus = ($validated['condition'] ?? 'ready') === 'maintenance' ? 'maintenance' : 'available';
        $returnLoc = $validated['return_location'] ?? 'Main Staging Yard, Meycauayan';

        $equipment->update([
            'status' => $newStatus,
            'location' => $returnLoc,
        ]);

        // Close any active rental
        $activeRentals = Rental::where('equipment_id', $equipment->id)
            ->whereIn('status', ['active', 'pending'])
            ->get();

        foreach ($activeRentals as $r) {
            $r->update([
                'status' => 'completed',
                'actual_return_date' => now(),
                'damage_notes' => $validated['damage_notes'] ?? null,
            ]);
        }

        ActivityLogService::log(
            Auth::user(),
            'demobilized',
            Equipment::class,
            $equipment->id,
            "Equipment '{$equipment->name}' returned to yard ({$returnLoc}) with status '{$newStatus}'.",
            null,
            ['return_status' => $newStatus, 'location' => $returnLoc]
        );

        return response()->json([
            'message' => 'Equipment successfully demobilized and returned to yard.',
            'equipment' => $equipment,
        ]);
    }

    /**
     * Complete maintenance and return equipment to available yard inventory.
     */
    public function completeMaintenance(Request $request, Equipment $equipment)
    {
        Gate::authorize('manage-rentals');

        $equipment->update([
            'status' => 'available',
            'last_maintenance' => now(),
        ]);

        ActivityLogService::log(
            Auth::user(),
            'maintenance_completed',
            Equipment::class,
            $equipment->id,
            "Maintenance inspection passed for '{$equipment->name}'. Crane is now Available for dispatch.",
            null,
            ['status' => 'available']
        );

        return response()->json([
            'message' => 'Maintenance completed. Equipment is now Available for dispatch.',
            'equipment' => $equipment,
        ]);
    }

    /**
     * Get equipment rentals.
     */
    public function rentals(Equipment $equipment)
    {
        Gate::authorize('view-rentals');
        $rentals = $equipment->rentals()->with(['customer', 'jobOrder'])->paginate(15);
        return response()->json($rentals);
    }

    /**
     * Get equipment maintenance records.
     */
    public function maintenance(Equipment $equipment)
    {
        Gate::authorize('view-rentals');
        $records = $equipment->maintenanceRecords()->paginate(15);
        return response()->json($records);
    }

    /**
     * Schedule maintenance for equipment.
     */
    public function scheduleMaintenance(Request $request, Equipment $equipment)
    {
        Gate::authorize('manage-rentals');
        $validated = $request->validate([
            'maintenance_type' => ['required', 'in:preventive,corrective,emergency'],
            'description' => ['required', 'string'],
            'scheduled_date' => ['required', 'date'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'findings' => ['nullable', 'string'],
        ]);

        $maintenance = $equipment->maintenanceRecords()->create($validated);
        $equipment->update(['status' => 'maintenance']);

        ActivityLogService::log(
            Auth::user(),
            'maintenance_scheduled',
            Equipment::class,
            $equipment->id,
            "Scheduled {$validated['maintenance_type']} maintenance for '{$equipment->name}'. Status set to maintenance.",
            null,
            ['status' => 'maintenance', 'scheduled_date' => $validated['scheduled_date']]
        );

        return response()->json($maintenance, Response::HTTP_CREATED);
    }
}
