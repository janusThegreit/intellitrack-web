<?php

namespace IntelliTrack\Services\Rental\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use IntelliTrack\Services\Rental\Models\JobOrder;
use IntelliTrack\Services\Rental\Models\JobOrderItem;
use IntelliTrack\Shared\Http\ApiResponse;

class JobOrderController extends Controller
{
    /**
     * List job orders.
     */
    public function index(Request $request)
    {
        $query = JobOrder::with(['items', 'rentals']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('job_order_number', 'like', "%{$search}%");
        }

        $jobOrders = $query->orderByDesc('created_at')->paginate($request->input('per_page', 25));

        return ApiResponse::success($jobOrders);
    }

    /**
     * Store new job order.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => 'required|integer',
            'description' => 'required|string',
            'status' => 'nullable|string|in:draft,pending,approved,in-progress,completed,cancelled',
            'priority' => 'nullable|string|in:low,medium,high,urgent',
            'scheduled_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'estimated_cost' => 'nullable|numeric|min:0',
            'location' => 'nullable|string|max:500',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors());
        }

        $data = $validator->validated();
        $data['job_order_number'] = 'JO-' . date('Ymd') . '-' . strtoupper(Str::random(6));
        $data['created_by'] = (int) $request->header('X-User-Id', 1);
        $data['status'] = $data['status'] ?? 'pending';
        $data['priority'] = $data['priority'] ?? 'medium';

        $jobOrder = JobOrder::create($data);

        return ApiResponse::created($jobOrder, 'Job order created successfully');
    }

    /**
     * Show single job order.
     */
    public function show($id)
    {
        $jobOrder = JobOrder::with(['items', 'rentals'])->find($id);
        if (! $jobOrder) {
            return ApiResponse::notFound('Job order not found.');
        }

        return ApiResponse::success($jobOrder);
    }

    /**
     * Update job order.
     */
    public function update(Request $request, $id)
    {
        $jobOrder = JobOrder::find($id);
        if (! $jobOrder) {
            return ApiResponse::notFound('Job order not found.');
        }

        $validator = Validator::make($request->all(), [
            'description' => 'nullable|string',
            'status' => 'nullable|string|in:draft,pending,approved,in-progress,completed,cancelled',
            'priority' => 'nullable|string|in:low,medium,high,urgent',
            'scheduled_date' => 'nullable|date',
            'start_date' => 'nullable|date',
            'completion_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'estimated_cost' => 'nullable|numeric|min:0',
            'actual_cost' => 'nullable|numeric|min:0',
            'location' => 'nullable|string|max:500',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors());
        }

        $jobOrder->update($validator->validated());

        return ApiResponse::success($jobOrder, 'Job order updated successfully');
    }

    /**
     * Add item to job order.
     */
    public function addItem(Request $request, $id)
    {
        $jobOrder = JobOrder::find($id);
        if (! $jobOrder) {
            return ApiResponse::notFound('Job order not found.');
        }

        $validator = Validator::make($request->all(), [
            'equipment_id' => 'nullable|integer',
            'description' => 'required|string',
            'quantity' => 'required|integer|min:1',
            'unit_price' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors());
        }

        $qty = $request->quantity;
        $unitPrice = $request->unit_price;

        $item = JobOrderItem::create([
            'job_order_id' => $id,
            'equipment_id' => $request->equipment_id,
            'description' => $request->description,
            'quantity' => $qty,
            'unit_price' => $unitPrice,
            'total_price' => round($qty * $unitPrice, 2),
            'notes' => $request->notes,
        ]);

        $jobOrder->increment('total_amount', $item->total_price);

        return ApiResponse::created($item, 'Item added to job order');
    }

    /**
     * Delete item from job order.
     */
    public function deleteItem($id, $itemId)
    {
        $item = JobOrderItem::where('job_order_id', $id)->find($itemId);
        if (! $item) {
            return ApiResponse::notFound('Job order item not found.');
        }

        $jobOrder = JobOrder::find($id);
        if ($jobOrder) {
            $jobOrder->decrement('total_amount', $item->total_price);
        }

        $item->delete();

        return ApiResponse::success(null, 'Item deleted from job order');
    }

    /**
     * Update job order status.
     */
    public function updateStatus(Request $request, $id)
    {
        $jobOrder = JobOrder::find($id);
        if (! $jobOrder) {
            return ApiResponse::notFound('Job order not found.');
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|string|in:draft,pending,approved,in-progress,completed,cancelled',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors());
        }

        $status = $request->status;
        $updates = ['status' => $status];

        if ($status === 'in-progress' && ! $jobOrder->start_date) {
            $updates['start_date'] = now();
        } elseif ($status === 'completed' && ! $jobOrder->completion_date) {
            $updates['completion_date'] = now();
        }

        $jobOrder->update($updates);

        return ApiResponse::success($jobOrder, 'Job order status updated');
    }

    /**
     * Assign staff to job order.
     */
    public function assign(Request $request, $id)
    {
        $jobOrder = JobOrder::find($id);
        if (! $jobOrder) {
            return ApiResponse::notFound('Job order not found.');
        }

        $validator = Validator::make($request->all(), [
            'assigned_to' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors());
        }

        $jobOrder->update(['assigned_to' => $request->assigned_to]);

        return ApiResponse::success($jobOrder, 'Job order assigned successfully');
    }
}
