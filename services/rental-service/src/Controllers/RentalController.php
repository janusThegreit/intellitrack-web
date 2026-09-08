<?php

namespace IntelliTrack\Services\Rental\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use IntelliTrack\Services\Rental\Models\Rental;
use IntelliTrack\Shared\Http\ApiResponse;
use IntelliTrack\Shared\Events\Rental\RentalCreatedEvent;
use IntelliTrack\Shared\Events\Rental\EquipmentReturnedEvent;
use IntelliTrack\Shared\Events\RedisEventBus;

class RentalController extends Controller
{
    /**
     * List rentals.
     */
    public function index(Request $request)
    {
        $query = Rental::query();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->filled('equipment_id')) {
            $query->where('equipment_id', $request->equipment_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('rental_number', 'like', "%{$search}%");
        }

        $rentals = $query->orderByDesc('created_at')->paginate($request->input('per_page', 25));

        return ApiResponse::success($rentals);
    }

    /**
     * Store new rental contract.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'job_order_id' => 'nullable|integer',
            'customer_id' => 'required|integer',
            'equipment_id' => 'required|integer',
            'quantity' => 'required|integer|min:1',
            'rental_start_date' => 'required|date',
            'rental_end_date' => 'required|date|after_or_equal:rental_start_date',
            'daily_rate' => 'required|numeric|min:0',
            'deposit_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors());
        }

        $data = $validator->validated();
        $start = \Carbon\Carbon::parse($data['rental_start_date']);
        $end = \Carbon\Carbon::parse($data['rental_end_date']);
        $days = max(1, $start->diffInDays($end) + 1);

        $data['rental_number'] = 'RNT-' . date('Ymd') . '-' . strtoupper(Str::random(6));
        $data['rental_days'] = $days;
        $data['rental_cost'] = round($days * $data['daily_rate'] * $data['quantity'], 2);
        $data['total_amount'] = $data['rental_cost'] + ($data['deposit_amount'] ?? 0);
        $data['status'] = 'active';

        $rental = Rental::create($data);

        // Publish RentalCreatedEvent
        try {
            $event = RentalCreatedEvent::create(
                $rental->id,
                $rental->rental_number,
                $rental->customer_id,
                $rental->equipment_id,
                $rental->quantity,
                $rental->rental_start_date->toIso8601String(),
                $rental->rental_end_date->toIso8601String()
            );
            app(RedisEventBus::class)->publish($event);
        } catch (\Throwable $e) {}

        return ApiResponse::created($rental, 'Rental contract initiated');
    }

    /**
     * Show single rental.
     */
    public function show($id)
    {
        $rental = Rental::with('jobOrder')->find($id);
        if (! $rental) {
            return ApiResponse::notFound('Rental not found.');
        }

        return ApiResponse::success($rental);
    }

    /**
     * Return equipment check-in.
     */
    public function returnEquipment(Request $request, $id)
    {
        $rental = Rental::find($id);
        if (! $rental) {
            return ApiResponse::notFound('Rental not found.');
        }

        $validator = Validator::make($request->all(), [
            'actual_return_date' => 'nullable|date',
            'additional_charges' => 'nullable|numeric|min:0',
            'deposit_returned' => 'nullable|numeric|min:0',
            'damage_notes' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors());
        }

        $returnDate = $request->input('actual_return_date', now());
        $addCharges = $request->input('additional_charges', 0);
        $depositReturned = $request->input('deposit_returned', $rental->deposit_amount);

        $rental->update([
            'status' => 'completed',
            'actual_return_date' => $returnDate,
            'additional_charges' => $addCharges,
            'deposit_returned' => $depositReturned,
            'total_amount' => $rental->rental_cost + $addCharges,
            'damage_notes' => $request->damage_notes,
            'notes' => $request->notes ?? $rental->notes,
        ]);

        // Publish EquipmentReturnedEvent
        try {
            $event = EquipmentReturnedEvent::create(
                $rental->id,
                $rental->equipment_id,
                $rental->quantity,
                \Carbon\Carbon::parse($returnDate)->toIso8601String(),
                (float) $addCharges,
                $request->damage_notes
            );
            app(RedisEventBus::class)->publish($event);
        } catch (\Throwable $e) {}

        return ApiResponse::success($rental, 'Equipment returned and rental finalized');
    }

    /**
     * Get overdue rentals list.
     */
    public function overdue()
    {
        $overdue = Rental::whereNotIn('status', ['completed', 'cancelled'])
            ->where('rental_end_date', '<', now())
            ->orderBy('rental_end_date')
            ->get();

        return ApiResponse::success($overdue);
    }
}
