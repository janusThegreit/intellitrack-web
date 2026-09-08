<?php

namespace App\Http\Controllers\Api;

use App\Models\Rental;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use App\Services\NotificationService;

class RentalController extends Controller
{
    /**
     * Display a listing of rentals.
     */
    public function index(Request $request)
    {
        Gate::authorize('view-rentals');
        $query = Rental::query()->with(['customer', 'equipment', 'jobOrder']);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->input('customer_id'));
        }

        if ($request->filled('equipment_id')) {
            $query->where('equipment_id', $request->input('equipment_id'));
        }

        if ($request->filled('search')) {
            $search = '%' . strtolower($request->input('search')) . '%';
            $query->where(function ($q) use ($search) {
                $q->where(\Illuminate\Support\Facades\DB::raw('LOWER(rental_number)'), 'like', $search)
                  ->orWhereHas('customer', fn ($cq) => $cq->where(\Illuminate\Support\Facades\DB::raw('LOWER(name)'), 'like', $search)->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(company_name)'), 'like', $search))
                  ->orWhereHas('equipment', fn ($eq) => $eq->where(\Illuminate\Support\Facades\DB::raw('LOWER(name)'), 'like', $search)->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(code)'), 'like', $search));
            });
        }

        $rentals = $query->orderByDesc('created_at')->paginate($request->input('per_page', 15));

        return response()->json($rentals);
    }

    /**
     * Store a newly created rental.
     */
    public function store(Request $request)
    {
        Gate::authorize('manage-rentals');
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

        $validated['rental_number'] = 'RNT-' . date('Ymd') . '-' . strtoupper(Str::random(6));
        
        // Calculate rental days and cost
        $startDate = new \DateTime($validated['rental_start_date']);
        $endDate = new \DateTime($validated['rental_end_date']);
        $rentalDays = $startDate->diff($endDate)->days + 1;
        $rentalCost = $rentalDays * $validated['daily_rate'] * $validated['quantity'];
        
        $validated['rental_days'] = $rentalDays;
        $validated['rental_cost'] = $rentalCost;
        $validated['total_amount'] = $rentalCost + ($validated['deposit_amount'] ?? 0);

        $rental = Rental::create($validated);
        $rental->equipment?->update(['status' => 'rented']);

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
        Gate::authorize('view-rentals');
        $rental->load(['customer', 'equipment', 'jobOrder']);
        return response()->json($rental);
    }

    /**
     * Update the specified rental.
     */
    public function update(Request $request, Rental $rental)
    {
        Gate::authorize('manage-rentals');
        $validated = $request->validate([
            'status' => ['nullable', 'string'],
            'daily_rate' => ['nullable', 'numeric', 'min:0'],
            'rental_start_date' => ['nullable', 'date'],
            'rental_end_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'damage_notes' => ['nullable', 'string'],
        ]);

        $rental->update(array_filter($validated, fn ($val) => !is_null($val)));

        return response()->json($rental);
    }

    /**
     * Delete the specified rental.
     */
    public function destroy(Rental $rental)
    {
        Gate::authorize('manage-rentals');
        $rental->delete();
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * Return equipment from rental.
     */
    public function returnEquipment(Request $request, Rental $rental)
    {
        Gate::authorize('manage-rentals');
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

        // Update equipment status back to available safely
        $rental->equipment?->update(['status' => 'available']);

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
        Gate::authorize('view-rentals');
        $overdueRentals = Rental::where('status', '!=', 'completed')
            ->where('status', '!=', 'cancelled')
            ->where('rental_end_date', '<', now())
            ->with(['customer', 'equipment'])
            ->paginate(15);

        return response()->json($overdueRentals);
    }
}
