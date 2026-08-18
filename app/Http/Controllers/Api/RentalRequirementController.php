<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Models\RentalRequirement;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class RentalRequirementController extends Controller
{
    private const CATEGORIES = ['hammerhead', 'topless', 'luffing'];

    private const SERVICES = [
        'operator_and_riggers', 'maintenance_and_repair', 'logistic',
        'erection_and_dismantle', 'telescoping_and_climbing',
    ];

    public function index(Request $request)
    {
        Gate::authorize('view-rentals');

        $query = RentalRequirement::with(['inquiry', 'customer', 'equipment', 'quotation', 'jobOrder']);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('crane_category')) {
            $query->where('crane_category', $request->string('crane_category'));
        }

        return response()->json($query->latest()->paginate($request->integer('per_page', 15)));
    }

    public function store(Request $request)
    {
        Gate::authorize('manage-rentals');

        $data = $this->validated($request);
        $data['customer_id'] ??= $request->user()->id ? $request->input('customer_id') : null;
        $data['requirement_number'] = 'REQ-'.now()->format('Ymd').'-'.Str::upper(Str::random(6));
        $data['created_by'] = $request->user()->id;

        $requirement = RentalRequirement::create($data);
        ActivityLogService::log($request->user(), 'created', RentalRequirement::class, $requirement->id, 'Crane rental requirement created.');

        return response()->json($requirement->load(['inquiry', 'customer', 'equipment']), 201);
    }

    public function show(RentalRequirement $rentalRequirement)
    {
        Gate::authorize('view-rentals');

        return response()->json($rentalRequirement->load(['inquiry.history.user', 'customer', 'equipment', 'quotation', 'jobOrder']));
    }

    public function update(Request $request, RentalRequirement $rentalRequirement)
    {
        Gate::authorize('manage-rentals');

        $data = $this->validated($request, true);
        $rentalRequirement->update($data);
        ActivityLogService::log($request->user(), 'updated', RentalRequirement::class, $rentalRequirement->id, 'Crane rental requirement updated.');

        return response()->json($rentalRequirement->fresh()->load(['inquiry', 'customer', 'equipment']));
    }

    public function assess(Request $request, RentalRequirement $rentalRequirement)
    {
        Gate::authorize('manage-users');

        $data = $request->validate([
            'equipment_id' => ['nullable', 'exists:equipment,id'],
            'notes' => ['nullable', 'string'],
        ]);

        if (! empty($data['equipment_id'])) {
            $equipment = Equipment::findOrFail($data['equipment_id']);
            abort_unless($equipment->crane_category === $rentalRequirement->crane_category, 422, 'Selected crane category must match the rental requirement.');
        }

        $rentalRequirement->update([
            ...$data,
            'status' => empty($data['equipment_id']) ? 'assessed' : 'equipment_selected',
            'assessed_by' => $request->user()->id,
            'assessed_at' => now(),
        ]);
        ActivityLogService::log($request->user(), 'assessed', RentalRequirement::class, $rentalRequirement->id, 'Rental requirement assessed.');

        return response()->json($rentalRequirement->fresh()->load(['equipment', 'inquiry']));
    }

    private function validated(Request $request, bool $partial = false): array
    {
        return $request->validate([
            'customer_inquiry_id' => [$partial ? 'sometimes' : 'required', 'exists:customer_inquiries,id'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'equipment_id' => ['nullable', 'exists:equipment,id'],
            'quotation_id' => ['nullable', 'exists:quotations,id'],
            'job_order_id' => ['nullable', 'exists:job_orders,id'],
            'crane_category' => [$partial ? 'sometimes' : 'required', 'in:'.implode(',', self::CATEGORIES)],
            'required_load' => ['nullable', 'numeric', 'min:0'],
            'required_load_unit' => ['nullable', 'string', 'max:20'],
            'required_radius' => ['nullable', 'numeric', 'min:0'],
            'required_radius_unit' => ['nullable', 'string', 'max:20'],
            'required_height' => ['nullable', 'numeric', 'min:0'],
            'required_height_unit' => ['nullable', 'string', 'max:20'],
            'required_from' => ['nullable', 'date'],
            'required_until' => ['nullable', 'date', 'after_or_equal:required_from'],
            'services' => ['nullable', 'array'],
            'services.*' => ['in:'.implode(',', self::SERVICES)],
            'site_location' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'status' => ['sometimes', 'in:draft,assessed,equipment_selected,quoted,job_order_requested,coordinating,closed'],
        ]);
    }
}