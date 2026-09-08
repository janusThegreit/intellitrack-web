<?php

namespace App\Http\Controllers\Api;

use App\Models\Quotation;
use App\Models\JobOrder;
use App\Models\JobOrderItem;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use App\Services\NotificationService;
use App\Services\ActivityLogService;

class QuotationController extends Controller
{
    /**
     * Display a listing of quotations.
     */
    public function index(Request $request)
    {
        Gate::authorize('view-crm');
        $query = Quotation::query()->with(['customer', 'createdBy', 'items.equipment', 'history.user']);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->input('customer_id'));
        }

        if ($request->filled('search')) {
            $search = '%' . strtolower($request->input('search')) . '%';
            $query->where(function ($q) use ($search) {
                $q->where(\Illuminate\Support\Facades\DB::raw('LOWER(quotation_number)'), 'like', $search)
                  ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(description)'), 'like', $search)
                  ->orWhereHas('customer', fn ($cq) => $cq->where(\Illuminate\Support\Facades\DB::raw('LOWER(name)'), 'like', $search)->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(company_name)'), 'like', $search));
            });
        }

        $quotations = $query->orderByDesc('created_at')->paginate($request->input('per_page', 15));

        return response()->json($quotations);
    }

    /**
     * Store a newly created quotation.
     */
    public function store(Request $request)
    {
        Gate::authorize('manage-crm');
        $validated = $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
            'job_order_id' => ['nullable', 'exists:job_orders,id'],
            'description' => ['nullable', 'string'],
            'sales_opportunity_id' => ['nullable', 'exists:sales_opportunities,id'],
            'subtotal' => ['nullable', 'numeric', 'min:0'],
            'tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'valid_until' => ['nullable', 'date'],
            'terms_conditions' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'status' => ['nullable', 'in:draft,submitted,under_review,revision_requested,approved,sent,accepted,rejected,expired'],
            'items' => ['nullable', 'array'],
            'items.*.equipment_id' => ['nullable', 'exists:equipment,id'],
            'items.*.description' => ['required_with:items', 'string'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1'],
            'items.*.rental_duration' => ['nullable', 'integer', 'min:1'],
            'items.*.rental_duration_unit' => ['nullable', 'in:day,week,month'],
            'items.*.unit_rate' => ['required_with:items', 'numeric', 'min:0'],
            'items.*.additional_charges' => ['nullable', 'numeric', 'min:0'],
        ]);

        $validated['quotation_number'] = 'QT-' . date('Ymd') . '-' . strtoupper(Str::random(6));
        $validated['created_by'] = Auth::id();
        $validated['quotation_date'] = now();
        $validated['status'] = $validated['status'] ?? 'draft';

        return DB::transaction(function () use ($validated) {
            $items = $validated['items'] ?? [];
            unset($validated['items']);
            $validated['subtotal'] = $this->itemsSubtotal($items, $validated['subtotal'] ?? 0);
            $quotation = Quotation::create($this->withTotals($validated));
            $this->syncItems($quotation, $items);
            $this->record($quotation, 'created', null, $quotation->status, 'Quotation prepared.');

            return response()->json($quotation->load(['customer', 'items.equipment', 'history.user']), Response::HTTP_CREATED);
        });
    }

    /**
     * Display the specified quotation.
     */
    public function show(Quotation $quotation)
    {
        Gate::authorize('view-crm');
        $quotation->load(['customer', 'createdBy', 'jobOrder', 'opportunity', 'items.equipment', 'history.user']);
        return response()->json($quotation);
    }

    /**
     * Update the specified quotation.
     */
    public function update(Request $request, Quotation $quotation)
    {
        Gate::authorize('manage-crm');
        $validated = $request->validate([
            'status' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'subtotal' => ['nullable', 'numeric', 'min:0'],
            'tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'valid_until' => ['nullable', 'date'],
            'terms_conditions' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'items' => ['nullable', 'array'],
            'items.*.equipment_id' => ['nullable', 'exists:equipment,id'],
            'items.*.description' => ['required_with:items', 'string'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1'],
            'items.*.rental_duration' => ['nullable', 'integer', 'min:1'],
            'items.*.rental_duration_unit' => ['nullable', 'in:day,week,month'],
            'items.*.unit_rate' => ['required_with:items', 'numeric', 'min:0'],
            'items.*.additional_charges' => ['nullable', 'numeric', 'min:0'],
        ]);

        return DB::transaction(function () use ($quotation, $validated) {
            $items = $validated['items'] ?? null;
            unset($validated['items']);
            $validated['subtotal'] = $items === null ? ($validated['subtotal'] ?? $quotation->subtotal) : $this->itemsSubtotal($items, 0);
            $quotation->update($this->withTotals([...$quotation->only(['tax_rate', 'discount_amount']), ...$validated]));
            if ($items !== null) { $this->syncItems($quotation, $items); }
            $this->record($quotation, 'updated', $quotation->status, $quotation->status, 'Quotation updated.');

            return response()->json($quotation->fresh()->load(['items.equipment', 'history.user']));
        });
    }

    /**
     * Delete the specified quotation.
     */
    public function destroy(Quotation $quotation)
    {
        Gate::authorize('manage-crm');
        $quotation->delete();
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * Send quotation to customer.
     */
    public function submitForApproval(Request $request, Quotation $quotation)
    {
        Gate::authorize('manage-crm');
        $request->validate([
            'notes' => ['nullable', 'string'],
        ]);

        $quotation->update([
            'status' => 'under_review',
            'submitted_at' => now(),
            'notes' => $request->input('notes', $quotation->notes),
        ]);
        $this->record($quotation, 'submitted_for_approval', 'draft', 'under_review', $request->input('notes'));
        app(NotificationService::class)->notifyRoles(['administrator', 'sales_manager'], 'warning', 'Quotation awaiting approval', "{$quotation->quotation_number} was submitted for review.", Quotation::class, $quotation->id);

        return response()->json($quotation);
    }

    public function approve(Request $request, Quotation $quotation)
    {
        $user = Auth::user();

        if (! $user || (! $user->isSalesManager() && ! $user->isAdministrator())) {
            abort(403, 'Only the Sales Manager or Administrator can approve quotations.');
        }

        if ($user->id === $quotation->created_by && ! $user->isAdministrator()) {
            abort(403, 'A quotation cannot be approved by its creating user.');
        }

        $quotation->update([
            'status' => 'approved',
            'approved_by' => $user->id,
            'approved_at' => now(),
            'approval_notes' => $request->input('approval_notes', null),
        ]);
        $this->record($quotation, 'approved', 'under_review', 'approved', $request->input('approval_notes'));
        if ($quotation->createdBy) {
            app(NotificationService::class)->create($quotation->createdBy, 'success', 'Quotation approved', "{$quotation->quotation_number} is approved and ready to send.", Quotation::class, $quotation->id);
        }

        return response()->json($quotation);
    }

    public function requestRevision(Request $request, Quotation $quotation)
    {
        $user = Auth::user();

        if (! $user || (! $user->isSalesManager() && ! $user->isAdministrator())) {
            abort(403, 'Only the Sales Manager or Administrator can request quotation revisions.');
        }

        $request->validate([
            'revision_notes' => ['required', 'string'],
        ]);

        $quotation->update([
            'status' => 'revision_requested',
            'revision_notes' => $request->revision_notes,
            'approved_by' => null,
            'approved_at' => null,
        ]);
        $this->record($quotation, 'revision_requested', 'under_review', 'revision_requested', $request->revision_notes);
        if ($quotation->createdBy) {
            app(NotificationService::class)->create($quotation->createdBy, 'warning', 'Quotation revision requested', "{$quotation->quotation_number} needs revision.", Quotation::class, $quotation->id);
        }

        return response()->json($quotation);
    }

    public function reject(Request $request, Quotation $quotation)
    {
        $user = Auth::user();

        if (! $user || (! $user->isSalesManager() && ! $user->isAdministrator())) {
            abort(403, 'Only the Sales Manager or Administrator can reject quotations.');
        }

        $request->validate([
            'notes' => ['nullable', 'string'],
        ]);

        $oldStatus = $quotation->status;
        $quotation->update([
            'status' => 'rejected',
            'rejected_at' => now(),
            'notes' => $request->input('notes', $quotation->notes),
        ]);
        $this->record($quotation, 'rejected', $oldStatus, 'rejected', $request->input('notes'));

        return response()->json($quotation);
    }

    public function send(Request $request, Quotation $quotation)
    {
        Gate::authorize('manage-crm');
        abort_unless($quotation->status === 'approved', 422, 'Only approved quotations can be sent.');
        $quotation->update([
            'status' => 'sent',
            'sent_date' => now(),
        ]);
        $this->record($quotation, 'sent_to_customer', 'approved', 'sent');

        return response()->json($quotation);
    }

    /**
     * Accept quotation.
     */
    public function accept(Request $request, Quotation $quotation)
    {
        Gate::authorize('manage-crm');
        $request->validate(['customer_response' => ['nullable', 'string']]);
        abort_unless($quotation->status === 'sent', 422, 'Only sent quotations can be accepted.');
        $quotation->update([
            'status' => 'accepted',
            'accepted_date' => now(),
            'customer_response' => $request->input('customer_response'),
            'customer_response_at' => now(),
        ]);
        $this->record($quotation, 'customer_accepted', 'sent', 'accepted', $request->input('customer_response'));

        return response()->json($quotation);
    }

    public function recordCustomerResponse(Request $request, Quotation $quotation)
    {
        Gate::authorize('manage-crm');
        $data = $request->validate(['response' => ['required', 'in:accepted,rejected,revision_requested'], 'notes' => ['nullable', 'string']]);
        abort_unless($quotation->status === 'sent', 422, 'Only sent quotations can receive a customer response.');
        $quotation->update(['status' => $data['response'], 'customer_response' => $data['notes'] ?? null, 'customer_response_at' => now(), 'accepted_date' => $data['response'] === 'accepted' ? now() : null, 'rejected_at' => $data['response'] === 'rejected' ? now() : null]);
        $this->record($quotation, 'customer_response', 'sent', $data['response'], $data['notes'] ?? null);

        return response()->json($quotation->fresh()->load('history.user'));
    }

    /**
     * Convert an accepted quotation into an active Job Order with line items.
     */
    public function convertToJobOrder(Request $request, Quotation $quotation)
    {
        $user = Auth::user();
        if (! $user || (! $user->isSalesManager() && ! $user->isAdministrator())) {
            abort(403, 'Only the Sales Manager or Administrator can generate job orders from quotations.');
        }

        abort_unless(in_array($quotation->status, ['accepted', 'approved']), 422, 'Only accepted or approved quotations can be converted into job orders.');

        if ($quotation->job_order_id && $quotation->jobOrder) {
            return response()->json($quotation->jobOrder->load(['customer', 'jobOrderItems.equipment']));
        }

        return DB::transaction(function () use ($quotation, $user) {
            $customerName = $quotation->customer?->company_name ?: $quotation->customer?->name;
            $description = $quotation->description ?: "Equipment Rental & Commercial Service for {$customerName}";

            $jobOrder = JobOrder::create([
                'job_order_number' => 'JO-' . date('Ymd') . '-' . strtoupper(Str::random(6)),
                'customer_id' => $quotation->customer_id,
                'created_by' => $user->id,
                'description' => $description,
                'status' => 'pending',
                'priority' => 'high',
                'scheduled_date' => now()->addDays(2),
                'due_date' => $quotation->valid_until ?: now()->addMonths(1),
                'estimated_cost' => $quotation->subtotal,
                'total_amount' => $quotation->total_amount,
                'location' => $quotation->customer?->address ?: ($quotation->customer?->city ?: 'Client Project Site'),
                'notes' => "Generated from Quotation {$quotation->quotation_number}. " . ($quotation->notes ?: ''),
                'equipment_count' => $quotation->items->count(),
            ]);

            foreach ($quotation->items as $qItem) {
                JobOrderItem::create([
                    'job_order_id' => $jobOrder->id,
                    'equipment_id' => $qItem->equipment_id,
                    'quantity' => $qItem->quantity,
                    'unit_price' => $qItem->unit_rate,
                    'unit' => $qItem->rental_duration_unit ?: 'day',
                    'total_price' => $qItem->line_total,
                    'notes' => $qItem->description,
                ]);
            }

            $quotation->update([
                'job_order_id' => $jobOrder->id,
            ]);

            $this->record($quotation, 'converted_to_job_order', $quotation->status, $quotation->status, "Generated Job Order {$jobOrder->job_order_number}");

            app(NotificationService::class)->notifyRoles(
                ['administrator', 'sales_manager', 'staff'],
                'success',
                'Job Order Generated',
                "{$jobOrder->job_order_number} was created from {$quotation->quotation_number}.",
                JobOrder::class,
                $jobOrder->id
            );

            return response()->json($jobOrder->load(['customer', 'jobOrderItems.equipment']), Response::HTTP_CREATED);
        });
    }

    /**
     * Convert an accepted quotation into an active Project with budget and initial milestones.
     */
    public function convertToProject(Request $request, Quotation $quotation)
    {
        $user = Auth::user();
        if (! $user || (! $user->isSalesManager() && ! $user->isAdministrator())) {
            abort(403, 'Only the Sales Manager or Administrator can initialize projects from quotations.');
        }

        abort_unless(in_array($quotation->status, ['accepted', 'approved']), 422, 'Only accepted or approved quotations can be initialized as projects.');

        return DB::transaction(function () use ($quotation, $user) {
            $customerName = $quotation->customer?->company_name ?: $quotation->customer?->name;
            $projectName = "Project: " . ($quotation->project_name ?: "Heavy Lift Operations for {$customerName}");

            $project = Project::create([
                'project_code' => 'PRJ-' . date('Y') . '-' . strtoupper(Str::random(6)),
                'project_name' => $projectName,
                'description' => $quotation->description ?: "Initialized from Quotation {$quotation->quotation_number}.",
                'customer_id' => $quotation->customer_id,
                'project_manager_id' => $user->id,
                'start_date' => now(),
                'deadline' => $quotation->valid_until ?: now()->addMonths(6),
                'status' => 'active',
                'budget' => $quotation->total_amount,
                'spent_amount' => 0,
                'progress_percentage' => 10,
                'objectives' => "Fulfill contractual crane rentals and rigging execution for {$customerName}.",
                'deliverables' => "Mobilization, erection, scheduled lift operations, and final DOLE compliance handover.",
            ]);

            // Default milestones
            $phases = [
                ['name' => 'Site Engineering Survey & Foundation Anchor Verification', 'hours' => 24, 'status' => 'in-progress', 'progress' => 40],
                ['name' => 'Heavy Equipment & Crane Mobilization to Site Pad', 'hours' => 48, 'status' => 'todo', 'progress' => 0],
                ['name' => 'Crane Mast Assembly & Hook Height Calibration', 'hours' => 60, 'status' => 'todo', 'progress' => 0],
                ['name' => 'Active Contract Rigging Operations', 'hours' => 120, 'status' => 'todo', 'progress' => 0],
                ['name' => 'DOLE Safety Inspection & Demobilization', 'hours' => 32, 'status' => 'todo', 'progress' => 0],
            ];

            foreach ($phases as $p) {
                $project->tasks()->create([
                    'task_name' => $p['name'],
                    'priority' => 'high',
                    'status' => $p['status'],
                    'progress_percentage' => $p['progress'],
                    'assigned_to' => $user->id,
                    'estimated_hours' => $p['hours'],
                    'description' => 'Contractual milestone phase.',
                ]);
            }

            $this->record($quotation, 'converted_to_project', $quotation->status, $quotation->status, "Initialized Project {$project->project_code}");

            return response()->json($project->load(['customer', 'projectManager', 'tasks']), Response::HTTP_CREATED);
        });
    }

    private function itemsSubtotal(array $items, mixed $fallback): float
    {
        return $items ? collect($items)->sum(fn (array $item) => $item['quantity'] * ($item['rental_duration'] ?? 1) * $item['unit_rate'] + ($item['additional_charges'] ?? 0)) : (float) $fallback;
    }

    private function withTotals(array $data): array
    {
        $data['tax_amount'] = $data['subtotal'] * (($data['tax_rate'] ?? 0) / 100);
        $data['total_amount'] = max(0, $data['subtotal'] + $data['tax_amount'] - ($data['discount_amount'] ?? 0));
        return $data;
    }

    private function syncItems(Quotation $quotation, array $items): void
    {
        $quotation->items()->delete();
        foreach ($items as $item) { $quotation->items()->create([...$item, 'line_total' => $item['quantity'] * ($item['rental_duration'] ?? 1) * $item['unit_rate'] + ($item['additional_charges'] ?? 0)]); }
    }

    private function record(Quotation $quotation, string $action, ?string $oldStatus, ?string $newStatus, ?string $notes = null): void
    {
        $quotation->history()->create(['user_id' => Auth::id(), 'action' => $action, 'old_status' => $oldStatus, 'new_status' => $newStatus, 'notes' => $notes]);

        ActivityLogService::log(
            Auth::user(),
            $action,
            Quotation::class,
            $quotation->id,
            $notes ?: "Quotation {$quotation->quotation_number} action '{$action}' performed.",
            $oldStatus ? ['status' => $oldStatus] : null,
            $newStatus ? ['status' => $newStatus] : null
        );
    }
}
