<?php

namespace App\Http\Controllers\Api;

use App\Models\Rental;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use App\Http\Controllers\Controller;
use Illuminate\Support\Str;
use App\Services\NotificationService;

class RentalController extends Controller
{
    /**
     * Display a listing of rentals.
     */
    public function index(Request $request)
    {
        $query = Rental::query()->with(['customer', 'equipment']);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->input('customer_id'));
        }

        if ($request->filled('equipment_id')) {
            $query->where('equipment_id', $request->input('equipment_id'));
        }

        $rentals = $query->orderByDesc('created_at')->paginate($request->input('per_page', 15));

        return response()->json($rentals);
    }

    /**
     * Store a newly created rental.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
            'equipment_id' => ['required', 'exists:equipment,id'],
            'job_order_id' => ['nullable', 'exists:job_orders,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'rental_start_date' => ['required', 'date'],
            'rental_end_date' => ['required', 'date', 'after:rental_start_date'],
            'daily_rate' => ['required', 'numeric', 'min:0'],
            'deposit_amount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $validated['rental_number'] = 'RNT-' . date('Ymd') . '-' . Str::random(6);
        
        // Calculate rental days and cost
        $startDate = new \DateTime($validated['rental_start_date']);
        $endDate = new \DateTime($validated['rental_end_date']);
        $rentalDays = $startDate->diff($endDate)->days + 1;
        $rentalCost = $rentalDays * $validated['daily_rate'] * $validated['quantity'];
        
        $validated['rental_days'] = $rentalDays;
        $validated['rental_cost'] = $rentalCost;
        $validated['total_amount'] = $rentalCost + ($validated['deposit_amount'] ?? 0);

        $rental = Rental::create($validated);

        app(NotificationService::class)->notifyRoles(
            ['administrator', 'sales_manager'],
            'info',
            'New rental recorded',
            "{$rental->rental_number} was created for {$rental->customer->name}.",
            Rental::class,
            $rental->id,
        );

        return response()->json($rental, Response::HTTP_CREATED);
    }

    /**
     * Display the specified rental.
     */
    public function show(Rental $rental)
    {
        $rental->load(['customer', 'equipment', 'jobOrder']);
        return response()->json($rental);
    }

    /**
     * Update the specified rental.
     */
    public function update(Request $request, Rental $rental)
    {
        $validated = $request->validate([
            'notes' => ['nullable', 'string'],
            'damage_notes' => ['nullable', 'string'],
        ]);

        $rental->update($validated);

        return response()->json($rental);
    }

    /**
     * Delete the specified rental.
     */
    public function destroy(Rental $rental)
    {
        $rental->delete();
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * Return equipment from rental.
     */
    public function returnEquipment(Request $request, Rental $rental)
    {
        $validated = $request->validate([
            'actual_return_date' => ['required', 'date'],
            'damage_notes' => ['nullable', 'string'],
            'additional_charges' => ['nullable', 'numeric', 'min:0'],
        ]);

        $rental->update([
            'actual_return_date' => $validated['actual_return_date'],
            'damage_notes' => $validated['damage_notes'] ?? null,
            'additional_charges' => $validated['additional_charges'] ?? 0,
            'status' => 'completed',
        ]);

        // Update equipment status back to available
        $rental->equipment->update(['status' => 'available']);

        app(NotificationService::class)->notifyRoles(
            ['administrator', 'sales_manager', 'sales_business_development'],
            'info',
            'Rental completed',
            "{$rental->rental_number} has been marked completed.",
            Rental::class,
            $rental->id,
        );

        return response()->json($rental);
    }

    /**
     * Get overdue rentals.
     */
    public function overdue()
    {
        $overdueRentals = Rental::where('status', '!=', 'completed')
            ->where('status', '!=', 'cancelled')
            ->where('rental_end_date', '<', now())
            ->with(['customer', 'equipment'])
            ->paginate(15);

        return response()->json($overdueRentals);
    }
}
