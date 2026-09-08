<?php

namespace App\Http\Controllers\Api;

use App\Models\JobOrder;
use App\Models\JobOrderItem;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use App\Http\Controllers\Controller;
use App\Services\ActivityLogService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class JobOrderController extends Controller
{
    /**
     * Display a listing of job orders.
     */
    public function index(Request $request)
    {
        Gate::authorize('view-core-dashboard');
        $query = JobOrder::query()->with(['customer', 'assignedTo', 'createdBy', 'jobOrderItems.equipment', 'feedback']);

        if ($request->filled('search')) {
            $search = '%' . strtolower($request->input('search')) . '%';
            $query->where(function ($q) use ($search) {
                $q->where(\Illuminate\Support\Facades\DB::raw('LOWER(job_order_number)'), 'like', $search)
                  ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(description)'), 'like', $search)
                  ->orWhereHas('customer', function ($cq) use ($search) {
                      $cq->where(\Illuminate\Support\Facades\DB::raw('LOWER(name)'), 'like', $search)
                         ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(company_name)'), 'like', $search);
                  });
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
        Gate::authorize('manage-job-orders');
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

        $validated['job_order_number'] = 'JO-' . date('Ymd') . '-' . strtoupper(Str::random(6));
        $validated['created_by'] = auth()->id();

        $jobOrder = JobOrder::create($validated);

        ActivityLogService::log(Auth::user(), 'created', JobOrder::class, $jobOrder->id, "Job Order {$jobOrder->job_order_number} created.", null, ['status' => $jobOrder->status, 'priority' => $jobOrder->priority]);

        return response()->json($jobOrder, Response::HTTP_CREATED);
    }

    /**
     * Display the specified job order.
     */
    public function show(JobOrder $jobOrder)
    {
        Gate::authorize('view-core-dashboard');
        $jobOrder->load(['customer', 'createdBy', 'assignedTo', 'jobOrderItems.equipment', 'rentals', 'feedback']);
        return response()->json($jobOrder);
    }

    /**
     * Update the specified job order.
     */
    public function update(Request $request, JobOrder $jobOrder)
    {
        Gate::authorize('manage-job-orders');
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

        return response()->json($jobOrder->load(['customer', 'assignedTo', 'createdBy', 'jobOrderItems.equipment', 'feedback']));
    }

    /**
     * Delete the specified job order.
     */
    public function destroy(JobOrder $jobOrder)
    {
        Gate::authorize('manage-job-orders');
        $jobOrder->delete();
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * Add item to job order.
     */
    public function addItem(Request $request, JobOrder $jobOrder)
    {
        Gate::authorize('manage-job-orders');
        $validated = $request->validate([
            'equipment_id' => ['required', 'exists:equipment,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'unit_price' => ['nullable', 'numeric', 'min:0'],
            'unit' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $validated['total_price'] = ($validated['quantity'] ?? 1) * ($validated['unit_price'] ?? 0);
        $item = $jobOrder->jobOrderItems()->create($validated);

        // Update equipment count
        $jobOrder->increment('equipment_count');

        // Recalculate total
        $this->recalculateJobOrderTotal($jobOrder);

        // If job order is already in-progress, mark equipment as rented
        if ($jobOrder->status === 'in-progress') {
            \App\Models\Equipment::where('id', $validated['equipment_id'])->update([
                'status' => 'rented',
                'location' => $jobOrder->location ?: \Illuminate\Support\Facades\DB::raw('location'),
            ]);
        }

        return response()->json($item->load('equipment'), Response::HTTP_CREATED);
    }

    /**
     * Update job order item.
     */
    public function updateItem(Request $request, JobOrder $jobOrder, JobOrderItem $item)
    {
        Gate::authorize('manage-job-orders');
        if ($item->job_order_id !== $jobOrder->id) {
            return response()->json(['error' => 'Item not found'], Response::HTTP_NOT_FOUND);
        }

        $validated = $request->validate([
            'quantity' => ['integer', 'min:1'],
            'unit_price' => ['nullable', 'numeric', 'min:0'],
            'unit' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $qty = $validated['quantity'] ?? $item->quantity;
        $price = array_key_exists('unit_price', $validated) ? $validated['unit_price'] : $item->unit_price;
        $validated['total_price'] = $qty * ($price ?? 0);

        $item->update($validated);

        $this->recalculateJobOrderTotal($jobOrder);

        return response()->json($item);
    }

    /**
     * Delete job order item.
     */
    public function deleteItem(JobOrder $jobOrder, JobOrderItem $item)
    {
        Gate::authorize('manage-job-orders');
        if ($item->job_order_id !== $jobOrder->id) {
            return response()->json(['error' => 'Item not found'], Response::HTTP_NOT_FOUND);
        }

        $equipmentId = $item->equipment_id;
        $item->delete();
        $jobOrder->decrement('equipment_count');

        $this->recalculateJobOrderTotal($jobOrder);

        // Check if equipment is still in other in-progress job orders
        $stillInUse = JobOrderItem::where('equipment_id', $equipmentId)
            ->whereHas('jobOrder', fn ($q) => $q->where('status', 'in-progress'))
            ->exists();

        if (!$stillInUse) {
            \App\Models\Equipment::where('id', $equipmentId)->update(['status' => 'available']);
        }

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * Update job order status.
     */
    public function updateStatus(Request $request, JobOrder $jobOrder)
    {
        Gate::authorize('manage-job-orders');
        $validated = $request->validate([
            'status' => ['required', 'in:draft,pending,approved,in-progress,completed,cancelled'],
        ]);

        $oldStatus = $jobOrder->status;
        $jobOrder->update($validated);

        if ($validated['status'] === 'completed') {
            $jobOrder->update(['completion_date' => now()]);
        }

        // Operational sync: automatically sync equipment status
        $equipmentIds = $jobOrder->jobOrderItems()->pluck('equipment_id')->filter()->unique();

        if ($validated['status'] === 'in-progress') {
            if ($equipmentIds->isNotEmpty()) {
                \App\Models\Equipment::whereIn('id', $equipmentIds)->update([
                    'status' => 'rented',
                    'location' => $jobOrder->location ?: \Illuminate\Support\Facades\DB::raw('location'),
                ]);
            }
        } elseif (in_array($validated['status'], ['completed', 'cancelled'])) {
            // Restore equipment to available if not active on other in-progress jobs
            foreach ($equipmentIds as $eqId) {
                $stillUsed = JobOrderItem::where('equipment_id', $eqId)
                    ->where('job_order_id', '!=', $jobOrder->id)
                    ->whereHas('jobOrder', fn ($q) => $q->where('status', 'in-progress'))
                    ->exists();

                if (!$stillUsed) {
                    \App\Models\Equipment::where('id', $eqId)->update(['status' => 'available']);
                }
            }
        }

        ActivityLogService::log(
            Auth::user(),
            'status_change',
            JobOrder::class,
            $jobOrder->id,
            "Job Order {$jobOrder->job_order_number} status changed from '{$oldStatus}' to '{$validated['status']}'.",
            ['status' => $oldStatus],
            ['status' => $validated['status']]
        );

        return response()->json($jobOrder->load(['customer', 'assignedTo', 'createdBy', 'jobOrderItems.equipment', 'feedback']));
    }

    /**
     * Assign job order to staff.
     */
    public function assign(Request $request, JobOrder $jobOrder)
    {
        Gate::authorize('manage-job-orders');
        $validated = $request->validate([
            'assigned_to' => ['required', 'exists:users,id'],
        ]);

        $jobOrder->update($validated);
        $assignedUser = \App\Models\User::find($validated['assigned_to']);

        ActivityLogService::log(
            Auth::user(),
            'assigned',
            JobOrder::class,
            $jobOrder->id,
            "Job Order {$jobOrder->job_order_number} assigned to " . ($assignedUser?->name ?? 'Staff') . ".",
            null,
            ['assigned_to' => $validated['assigned_to']]
        );

        return response()->json($jobOrder->load(['customer', 'assignedTo', 'createdBy', 'jobOrderItems.equipment', 'feedback']));
    }

    /**
     * Schedule mobilization, start date, and target due date for job order.
     */
    public function schedule(Request $request, JobOrder $jobOrder)
    {
        Gate::authorize('manage-job-orders');
        $validated = $request->validate([
            'scheduled_date' => ['nullable', 'date'],
            'start_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date'],
            'location' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        if (empty($jobOrder->start_date) && ! empty($validated['start_date'])) {
            $validated['status'] = 'in-progress';
        }

        $jobOrder->update($validated);

        ActivityLogService::log(
            Auth::user(),
            'scheduled',
            JobOrder::class,
            $jobOrder->id,
            "Job Order {$jobOrder->job_order_number} schedule updated (target due: {$jobOrder->due_date}).",
            null,
            $validated
        );

        return response()->json($jobOrder->load(['customer', 'assignedTo', 'createdBy', 'jobOrderItems.equipment', 'feedback']));
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
