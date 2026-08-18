<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Quotation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class QuotationApprovalController extends Controller
{
    public function index(Request $request)
    {
        $query = Quotation::query()->with(['customer', 'createdBy'])->whereIn('status', ['submitted', 'under_review', 'revision_requested', 'approved', 'rejected']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->latest()->paginate($request->input('per_page', 15)));
    }

    public function approve(Request $request, Quotation $quotation)
    {
        if (Gate::denies('approve-quotation', $quotation)) {
            abort(403);
        }

        $quotation->update([
            'status' => 'approved',
            'approved_by' => $request->user()?->id,
            'approved_at' => now(),
            'approval_notes' => $request->input('approval_notes'),
        ]);

        return response()->json($quotation->fresh());
    }

    public function requestRevision(Request $request, Quotation $quotation)
    {
        if (Gate::denies('approve-quotation', $quotation)) {
            abort(403);
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

        return response()->json($quotation->fresh());
    }
}
