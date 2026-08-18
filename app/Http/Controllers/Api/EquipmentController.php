<?php

namespace App\Http\Controllers\Api;

use App\Models\Equipment;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use App\Http\Controllers\Controller;

class EquipmentController extends Controller
{
    /**
     * Display a listing of equipment.
     */
    public function index(Request $request)
    {
        $query = Equipment::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('serial_number', 'like', "%{$search}%");
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        $equipment = $query->paginate($request->input('per_page', 15));

        return response()->json($equipment);
    }

    /**
     * Store a newly created equipment.
     */
    public function store(Request $request)
    {
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
            'rental_unit' => ['in:day,week,month,hourly'],
            'serial_number' => ['nullable', 'unique:equipment'],
            'acquisition_date' => ['nullable', 'date'],
            'purchase_price' => ['nullable', 'numeric', 'min:0'],
            'current_value' => ['nullable', 'numeric', 'min:0'],
            'quantity_available' => ['required', 'integer', 'min:1'],
            'location' => ['nullable', 'string'],
            'specifications' => ['nullable', 'string'],
        ]);

        $equipment = Equipment::create($validated);

        return response()->json($equipment, Response::HTTP_CREATED);
    }

    /**
     * Display the specified equipment.
     */
    public function show(Equipment $equipment)
    {
        $equipment->load(['jobOrderItems', 'rentals', 'maintenanceRecords']);
        return response()->json($equipment);
    }

    /**
     * Update the specified equipment.
     */
    public function update(Request $request, Equipment $equipment)
    {
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

        $equipment->update($validated);

        return response()->json($equipment);
    }

    /**
     * Delete the specified equipment.
     */
    public function destroy(Equipment $equipment)
    {
        $equipment->delete();
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * Get equipment rentals.
     */
    public function rentals(Equipment $equipment)
    {
        $rentals = $equipment->rentals()->with('customer')->paginate(15);
        return response()->json($rentals);
    }

    /**
     * Get equipment maintenance records.
     */
    public function maintenance(Equipment $equipment)
    {
        $records = $equipment->maintenanceRecords()->paginate(15);
        return response()->json($records);
    }

    /**
     * Schedule maintenance for equipment.
     */
    public function scheduleMaintenance(Request $request, Equipment $equipment)
    {
        $validated = $request->validate([
            'maintenance_type' => ['required', 'in:preventive,corrective,emergency'],
            'description' => ['required', 'string'],
            'scheduled_date' => ['required', 'date'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'findings' => ['nullable', 'string'],
        ]);

        $maintenance = $equipment->maintenanceRecords()->create($validated);

        return response()->json($maintenance, Response::HTTP_CREATED);
    }
}
