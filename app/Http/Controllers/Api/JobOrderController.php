<?php

namespace App\Http\Controllers\Api;

use App\Models\JobOrder;
use App\Models\JobOrderItem;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use App\Http\Controllers\Controller;
use Illuminate\Support\Str;

class JobOrderController extends Controller
{
    /**
     * Display a listing of job orders.
     */
    public function index(Request $request)
    {
        $query = JobOrder::query()->with(['customer', 'assignedTo']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('job_order_number', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%");
                  });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->input('priority'));
        }

        $jobOrders = $query->orderByDesc('created_at')->paginate($request->input('per_page', 15));

        return response()->json($jobOrders);
    }

    /**
     * Store a newly created job order.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
            'description' => ['required', 'string'],
            'status' => ['in:draft,pending,approved,in-progress,completed,cancelled'],
            'priority' => ['in:low,medium,high,urgent'],
            'scheduled_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date'],
            'estimated_cost' => ['nullable', 'numeric', 'min:0'],
            'location' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $validated['job_order_number'] = 'JO-' . date('Ymd') . '-' . Str::random(6);
        $validated['created_by'] = auth()->id();

        $jobOrder = JobOrder::create($validated);

        return response()->json($jobOrder, Response::HTTP_CREATED);
    }

    /**
     * Display the specified job order.
     */
    public function show(JobOrder $jobOrder)
    {
        $jobOrder->load(['customer', 'createdBy', 'assignedTo', 'jobOrderItems.equipment', 'rentals']);
        return response()->json($jobOrder);
    }

    /**
     * Update the specified job order.
     */
    public function update(Request $request, JobOrder $jobOrder)
    {
        $validated = $request->validate([
            'description' => ['string'],
            'status' => ['in:draft,pending,approved,in-progress,completed,cancelled'],
            'priority' => ['in:low,medium,high,urgent'],
            'scheduled_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date'],
            'estimated_cost' => ['nullable', 'numeric', 'min:0'],
            'actual_cost' => ['nullable', 'numeric', 'min:0'],
            'location' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $jobOrder->update($validated);

        return response()->json($jobOrder);
    }

    /**
     * Delete the specified job order.
     */
    public function destroy(JobOrder $jobOrder)
    {
        $jobOrder->delete();
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * Add item to job order.
     */
    public function addItem(Request $request, JobOrder $jobOrder)
    {
        $validated = $request->validate([
            'equipment_id' => ['required', 'exists:equipment,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'unit_price' => ['nullable', 'numeric', 'min:0'],
            'unit' => ['string'],
            'notes' => ['nullable', 'string'],
        ]);

        $item = $jobOrder->jobOrderItems()->create($validated);

        // Update equipment count
        $jobOrder->increment('equipment_count');

        // Recalculate total
        $this->recalculateJobOrderTotal($jobOrder);

        return response()->json($item, Response::HTTP_CREATED);
    }

    /**
     * Update job order item.
     */
    public function updateItem(Request $request, JobOrder $jobOrder, JobOrderItem $item)
    {
        if ($item->job_order_id !== $jobOrder->id) {
            return response()->json(['error' => 'Item not found'], Response::HTTP_NOT_FOUND);
        }

        $validated = $request->validate([
            'quantity' => ['integer', 'min:1'],
            'unit_price' => ['nullable', 'numeric', 'min:0'],
            'unit' => ['string'],
            'notes' => ['nullable', 'string'],
        ]);

        $item->update($validated);

        $this->recalculateJobOrderTotal($jobOrder);

        return response()->json($item);
    }

    /**
     * Delete job order item.
     */
    public function deleteItem(JobOrder $jobOrder, JobOrderItem $item)
    {
        if ($item->job_order_id !== $jobOrder->id) {
            return response()->json(['error' => 'Item not found'], Response::HTTP_NOT_FOUND);
        }

        $item->delete();
        $jobOrder->decrement('equipment_count');

        $this->recalculateJobOrderTotal($jobOrder);

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * Update job order status.
     */
    public function updateStatus(Request $request, JobOrder $jobOrder)
    {
        $validated = $request->validate([
            'status' => ['required', 'in:draft,pending,approved,in-progress,completed,cancelled'],
        ]);

        $oldStatus = $jobOrder->status;
        $jobOrder->update($validated);

        if ($validated['status'] === 'completed') {
            $jobOrder->update(['completion_date' => now()]);
        }

        return response()->json($jobOrder);
    }

    /**
     * Assign job order to staff.
     */
    public function assign(Request $request, JobOrder $jobOrder)
    {
        $validated = $request->validate([
            'assigned_to' => ['required', 'exists:users,id'],
        ]);

        $jobOrder->update($validated);

        return response()->json($jobOrder);
    }

    /**
     * Recalculate job order total.
     */
    private function recalculateJobOrderTotal(JobOrder $jobOrder)
    {
        $total = $jobOrder->jobOrderItems()->sum('total_price');
        $jobOrder->update(['total_amount' => $total]);
    }
}
