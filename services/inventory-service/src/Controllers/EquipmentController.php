<?php

namespace IntelliTrack\Services\Inventory\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;
use IntelliTrack\Services\Inventory\Models\Equipment;
use IntelliTrack\Services\Inventory\Models\EquipmentMaintenance;
use IntelliTrack\Shared\Http\ApiResponse;
use IntelliTrack\Shared\Events\Inventory\EquipmentStatusChangedEvent;
use IntelliTrack\Shared\Events\RedisEventBus;

class EquipmentController extends Controller
{
    /**
     * List all equipment with search and filter.
     */
    public function index(Request $request)
    {
        $query = Equipment::query();

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('crane_model', 'like', "%{$search}%")
                  ->orWhere('serial_number', 'like', "%{$search}%");
            });
        }

        $equipment = $query->orderBy('name')->paginate($request->input('per_page', 25));

        return ApiResponse::success($equipment);
    }

    /**
     * Store new equipment.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|max:50|unique:equipment,code',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|string|max:100',
            'rental_rate' => 'required|numeric|min:0',
            'rental_unit' => 'required|string|in:hour,day,week,month',
            'status' => 'nullable|string|in:available,rented,maintenance,retired,reserved',
            'serial_number' => 'nullable|string|max:100',
            'acquisition_date' => 'nullable|date',
            'purchase_price' => 'nullable|numeric|min:0',
            'quantity_available' => 'nullable|integer|min:0',
            'location' => 'nullable|string|max:255',
            'image_url' => 'nullable|string|max:1000',
            'crane_model' => 'nullable|string|max:100',
            'crane_category' => 'nullable|string|max:100',
            'maximum_load' => 'nullable|numeric|min:0',
            'maximum_load_unit' => 'nullable|string|max:20',
            'maximum_radius' => 'nullable|numeric|min:0',
            'maximum_radius_unit' => 'nullable|string|max:20',
            'final_height' => 'nullable|numeric|min:0',
            'final_height_unit' => 'nullable|string|max:20',
            'rental_services' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors());
        }

        $data = $validator->validated();
        $data['status'] = $data['status'] ?? 'available';
        $data['quantity_available'] = $data['quantity_available'] ?? 1;

        $equipment = Equipment::create($data);

        return ApiResponse::created($equipment, 'Equipment created successfully');
    }

    /**
     * Show single equipment.
     */
    public function show($id)
    {
        $equipment = Equipment::with('maintenanceRecords')->find($id);
        if (! $equipment) {
            return ApiResponse::notFound('Equipment not found.');
        }

        return ApiResponse::success($equipment);
    }

    /**
     * Update equipment.
     */
    public function update(Request $request, $id)
    {
        $equipment = Equipment::find($id);
        if (! $equipment) {
            return ApiResponse::notFound('Equipment not found.');
        }

        $validator = Validator::make($request->all(), [
            'code' => 'nullable|string|max:50|unique:equipment,code,' . $id,
            'name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:100',
            'rental_rate' => 'nullable|numeric|min:0',
            'rental_unit' => 'nullable|string|in:hour,day,week,month',
            'status' => 'nullable|string|in:available,rented,maintenance,retired,reserved',
            'serial_number' => 'nullable|string|max:100',
            'acquisition_date' => 'nullable|date',
            'purchase_price' => 'nullable|numeric|min:0',
            'quantity_available' => 'nullable|integer|min:0',
            'location' => 'nullable|string|max:255',
            'image_url' => 'nullable|string|max:1000',
            'crane_model' => 'nullable|string|max:100',
            'crane_category' => 'nullable|string|max:100',
            'maximum_load' => 'nullable|numeric|min:0',
            'maximum_load_unit' => 'nullable|string|max:20',
            'maximum_radius' => 'nullable|numeric|min:0',
            'maximum_radius_unit' => 'nullable|string|max:20',
            'final_height' => 'nullable|numeric|min:0',
            'final_height_unit' => 'nullable|string|max:20',
            'rental_services' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors());
        }

        $oldStatus = $equipment->status;
        $equipment->update($validator->validated());

        if ($request->filled('status') && $request->status !== $oldStatus) {
            try {
                $event = EquipmentStatusChangedEvent::create($equipment->id, $oldStatus, $request->status);
                app(RedisEventBus::class)->publish($event);
            } catch (\Throwable $e) {}
        }

        return ApiResponse::success($equipment, 'Equipment updated successfully');
    }

    /**
     * Delete equipment.
     */
    public function destroy($id)
    {
        $equipment = Equipment::find($id);
        if (! $equipment) {
            return ApiResponse::notFound('Equipment not found.');
        }

        $equipment->delete();

        return ApiResponse::success(null, 'Equipment deleted successfully');
    }

    /**
     * Get equipment maintenance records.
     */
    public function maintenance($id)
    {
        $equipment = Equipment::find($id);
        if (! $equipment) {
            return ApiResponse::notFound('Equipment not found.');
        }

        $records = EquipmentMaintenance::where('equipment_id', $id)
            ->orderByDesc('scheduled_date')
            ->get();

        return ApiResponse::success($records);
    }

    /**
     * Schedule maintenance for equipment.
     */
    public function scheduleMaintenance(Request $request, $id)
    {
        $equipment = Equipment::find($id);
        if (! $equipment) {
            return ApiResponse::notFound('Equipment not found.');
        }

        $validator = Validator::make($request->all(), [
            'maintenance_type' => 'required|string|in:routine,repair,inspection,overhaul',
            'description' => 'required|string',
            'scheduled_date' => 'required|date',
            'cost' => 'nullable|numeric|min:0',
            'assigned_to' => 'nullable|integer',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors());
        }

        $record = EquipmentMaintenance::create([
            'equipment_id' => $id,
            'maintenance_type' => $request->maintenance_type,
            'description' => $request->description,
            'status' => 'scheduled',
            'scheduled_date' => $request->scheduled_date,
            'cost' => $request->cost,
            'assigned_to' => $request->assigned_to,
            'notes' => $request->notes,
        ]);

        $equipment->update(['status' => 'maintenance', 'last_maintenance' => now()]);

        return ApiResponse::created($record, 'Maintenance scheduled successfully');
    }
}
