<?php

namespace App\Http\Controllers\Api;

use App\Models\Quotation;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Services\NotificationService;

class QuotationController extends Controller
{
    /**
     * Display a listing of quotations.
     */
    public function index(Request $request)
    {
        $query = Quotation::query()->with(['customer', 'createdBy', 'items.equipment', 'history.user']);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->input('customer_id'));
        }

        $quotations = $query->orderByDesc('created_at')->paginate($request->input('per_page', 15));

        return response()->json($quotations);
    }

    /**
     * Store a newly created quotation.
     */
    public function store(Request $request)
    {
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

        $validated['quotation_number'] = 'QT-' . date('Ymd') . '-' . Str::random(6);
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
        $quotation->load(['customer', 'createdBy', 'jobOrder', 'opportunity', 'items.equipment', 'history.user']);
        return response()->json($quotation);
    }

    /**
     * Update the specified quotation.
     */
    public function update(Request $request, Quotation $quotation)
    {
        $validated = $request->validate([
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
        $quotation->delete();
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * Send quotation to customer.
     */
    public function submitForApproval(Request $request, Quotation $quotation)
    {
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

        if (! $user || ($user->role !== 'sales_manager' && $user->role !== 'administrator')) {
            abort(403, 'Only the Sales Manager or Administrator can approve quotations.');
        }

        if ($user->id === $quotation->created_by) {
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

        if (! $user || ($user->role !== 'sales_manager' && $user->role !== 'administrator')) {
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

        if (! $user || ($user->role !== 'sales_manager' && $user->role !== 'administrator')) {
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
        $data = $request->validate(['response' => ['required', 'in:accepted,rejected,revision_requested'], 'notes' => ['nullable', 'string']]);
        abort_unless($quotation->status === 'sent', 422, 'Only sent quotations can receive a customer response.');
        $quotation->update(['status' => $data['response'], 'customer_response' => $data['notes'] ?? null, 'customer_response_at' => now(), 'accepted_date' => $data['response'] === 'accepted' ? now() : null, 'rejected_at' => $data['response'] === 'rejected' ? now() : null]);
        $this->record($quotation, 'customer_response', 'sent', $data['response'], $data['notes'] ?? null);

        return response()->json($quotation->fresh()->load('history.user'));
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
    }
}
