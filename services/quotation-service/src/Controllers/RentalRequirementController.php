<?php

namespace IntelliTrack\Services\Quotation\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;
use IntelliTrack\Services\Quotation\Models\RentalRequirement;
use IntelliTrack\Shared\Http\ApiResponse;

class RentalRequirementController extends Controller
{
    /**
     * List all rental requirements assessments.
     */
    public function index(Request $request)
    {
        $query = RentalRequirement::query();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        $requirements = $query->orderByDesc('created_at')->paginate($request->input('per_page', 25));

        return ApiResponse::success($requirements);
    }

    /**
     * Store new rental requirement.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => 'required|integer',
            'project_name' => 'required|string|max:255',
            'project_location' => 'nullable|string|max:500',
            'project_duration' => 'nullable|string|max:100',
            'required_load' => 'required|numeric|min:0',
            'required_load_unit' => 'nullable|string|max:20',
            'required_radius' => 'required|numeric|min:0',
            'required_radius_unit' => 'nullable|string|max:20',
            'required_height' => 'required|numeric|min:0',
            'required_height_unit' => 'nullable|string|max:20',
            'site_conditions' => 'nullable|string',
            'power_supply' => 'nullable|string',
            'foundation_type' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors());
        }

        $data = $validator->validated();
        $data['status'] = 'submitted';

        $requirement = RentalRequirement::create($data);

        return ApiResponse::created($requirement, 'Rental requirement submitted');
    }

    /**
     * Assess tower crane suitability.
     */
    public function assess(Request $request, $id)
    {
        $requirement = RentalRequirement::find($id);
        if (! $requirement) {
            return ApiResponse::notFound('Rental requirement not found.');
        }

        $validator = Validator::make($request->all(), [
            'recommended_crane_model' => 'required|string|max:255',
            'match_confidence' => 'nullable|numeric|min:0|max:100',
            'match_details' => 'nullable|array',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors());
        }

        $userId = (int) $request->header('X-User-Id', 1);

        $requirement->update([
            'recommended_crane_model' => $request->recommended_crane_model,
            'match_confidence' => $request->match_confidence ?? 95.0,
            'match_details' => $request->match_details,
            'notes' => $request->notes ?? $requirement->notes,
            'status' => 'assessed',
            'assessed_at' => now(),
            'assessed_by' => $userId,
        ]);

        return ApiResponse::success($requirement, 'Technical requirement assessed successfully');
    }
}
