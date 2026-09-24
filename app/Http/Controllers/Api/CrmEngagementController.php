<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerCommunication;
use App\Models\CustomerFeedback;
use App\Models\CustomerFollowUp;
use App\Models\CustomerInquiry;
use App\Models\Quotation;
use App\Models\Project;
use App\Models\Equipment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class CrmEngagementController extends Controller
{
    /**
     * Follow-ups listing with customer, inquiry, equipment, and project relations
     */
    public function indexFollowUps(Request $request): JsonResponse
    {
        Gate::authorize('view-crm');

        $query = CustomerFollowUp::with([
            'customer:id,name,company_name,phone,email',
            'inquiry:id,inquiry_number,subject',
            'equipment:id,name,code,category,crane_category,crane_model',
            'project:id,project_code,project_name,status',
            'assignee:id,name',
            'creator:id,name',
        ]);

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('priority') && $request->input('priority') !== 'all') {
            $query->where('priority', $request->input('priority'));
        }

        if ($request->filled('category') && $request->input('category') !== 'all') {
            $query->where('category', $request->input('category'));
        }

        if ($request->filled('is_permit_critical') && $request->input('is_permit_critical') !== 'all') {
            $query->where('is_permit_critical', $request->boolean('is_permit_critical'));
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->input('customer_id'));
        }

        if ($request->filled('search')) {
            $search = '%' . strtolower($request->input('search')) . '%';
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(title) LIKE ?', [$search])
                  ->orWhereRaw('LOWER(notes) LIKE ?', [$search])
                  ->orWhereRaw('LOWER(category) LIKE ?', [$search])
                  ->orWhereHas('customer', function ($cq) use ($search) {
                      $cq->whereRaw('LOWER(name) LIKE ?', [$search])
                         ->orWhereRaw('LOWER(company_name) LIKE ?', [$search]);
                  })
                  ->orWhereHas('equipment', function ($eq) use ($search) {
                      $eq->whereRaw('LOWER(name) LIKE ?', [$search])
                         ->orWhereRaw('LOWER(code) LIKE ?', [$search])
                         ->orWhereRaw('LOWER(crane_category) LIKE ?', [$search])
                         ->orWhereRaw('LOWER(crane_model) LIKE ?', [$search]);
                  })
                  ->orWhereHas('project', function ($pq) use ($search) {
                      $pq->whereRaw('LOWER(project_code) LIKE ?', [$search])
                         ->orWhereRaw('LOWER(project_name) LIKE ?', [$search]);
                  });
            });
        }

        $followUps = $query->orderBy('scheduled_date', 'asc')->paginate($request->input('per_page', 50));

        return response()->json($followUps);
    }

    /**
     * Store new follow-up reminder
     */
    public function storeFollowUp(Request $request): JsonResponse
    {
        Gate::authorize('view-crm');

        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'customer_inquiry_id' => 'nullable|exists:customer_inquiries,id',
            'equipment_id' => 'nullable|exists:equipment,id',
            'project_id' => 'nullable|exists:projects,id',
            'title' => 'required|string|max:255',
            'notes' => 'nullable|string',
            'scheduled_date' => 'required|date',
            'due_time' => 'nullable|string|max:50',
            'priority' => 'required|in:low,medium,high,urgent',
            'category' => 'nullable|string|max:50',
            'is_permit_critical' => 'nullable|boolean',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        $validated['created_by'] = $request->user()->id;
        $validated['assigned_to'] = $validated['assigned_to'] ?? $request->user()->id;
        $validated['status'] = 'pending';
        $validated['is_permit_critical'] = $validated['is_permit_critical'] ?? false;

        $followUp = CustomerFollowUp::create($validated);

        return response()->json($followUp->load(['customer', 'inquiry', 'equipment', 'project', 'assignee']), 201);
    }

    /**
     * Complete follow-up task
     */
    public function completeFollowUp(Request $request, CustomerFollowUp $followUp): JsonResponse
    {
        Gate::authorize('view-crm');

        $followUp->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        return response()->json($followUp);
    }

    /**
     * Delete follow-up
     */
    public function destroyFollowUp(CustomerFollowUp $followUp): JsonResponse
    {
        Gate::authorize('view-crm');

        $followUp->delete();

        return response()->json(['message' => 'Follow-up deleted successfully.']);
    }

    /**
     * Communications listing with customer details, quotation/project linking, and site inspection telemetry
     */
    public function indexCommunications(Request $request): JsonResponse
    {
        Gate::authorize('view-crm');

        $query = CustomerCommunication::with([
            'customer:id,name,company_name,phone,email',
            'inquiry:id,inquiry_number,subject',
            'quotation:id,quotation_number,status,total_amount,valid_until',
            'project:id,project_code,project_name,status',
            'creator:id,name',
        ]);

        if ($request->filled('type') && $request->input('type') !== 'all') {
            $query->where('type', $request->input('type'));
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->input('customer_id'));
        }

        if ($request->filled('quotation_id')) {
            $query->where('quotation_id', $request->input('quotation_id'));
        }

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->input('project_id'));
        }

        if ($request->filled('search')) {
            $search = '%' . strtolower($request->input('search')) . '%';
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(subject) LIKE ?', [$search])
                  ->orWhereRaw('LOWER(content) LIKE ?', [$search])
                  ->orWhereRaw('LOWER(outcome) LIKE ?', [$search])
                  ->orWhereRaw('LOWER(site_location) LIKE ?', [$search])
                  ->orWhereRaw('LOWER(trailer_access_notes) LIKE ?', [$search])
                  ->orWhereRaw('LOWER(crane_clearance_notes) LIKE ?', [$search])
                  ->orWhereHas('customer', function ($cq) use ($search) {
                      $cq->whereRaw('LOWER(name) LIKE ?', [$search])
                         ->orWhereRaw('LOWER(company_name) LIKE ?', [$search]);
                  })
                  ->orWhereHas('quotation', function ($qq) use ($search) {
                      $qq->whereRaw('LOWER(quotation_number) LIKE ?', [$search]);
                  })
                  ->orWhereHas('project', function ($pq) use ($search) {
                      $pq->whereRaw('LOWER(project_code) LIKE ?', [$search])
                         ->orWhereRaw('LOWER(project_name) LIKE ?', [$search]);
                  });
            });
        }

        $communications = $query->orderBy('communicated_at', 'desc')->paginate($request->input('per_page', 25));

        return response()->json($communications);
    }

    /**
     * Log new communication with optional entity linking and site inspection fields
     */
    public function storeCommunication(Request $request): JsonResponse
    {
        Gate::authorize('view-crm');

        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'customer_inquiry_id' => 'nullable|exists:customer_inquiries,id',
            'quotation_id' => 'nullable|exists:quotations,id',
            'project_id' => 'nullable|exists:projects,id',
            'type' => 'required|in:call,email,meeting,site_visit,sms',
            'direction' => 'required|in:inbound,outbound',
            'subject' => 'required|string|max:255',
            'content' => 'required|string',
            'outcome' => 'nullable|string|max:255',
            'site_location' => 'nullable|string|max:255',
            'trailer_truck_accessible' => 'nullable|string|max:50',
            'trailer_access_notes' => 'nullable|string',
            'crane_setup_clearance' => 'nullable|string|max:50',
            'crane_clearance_notes' => 'nullable|string',
            'communicated_at' => 'nullable|date',
        ]);

        $validated['created_by'] = $request->user()->id;
        $validated['communicated_at'] = $validated['communicated_at'] ?? now();

        $communication = CustomerCommunication::create($validated);

        return response()->json($communication->load(['customer', 'inquiry', 'quotation', 'project', 'creator']), 201);
    }

    /**
     * Feedback listing and ratings
     */
    public function indexFeedback(Request $request): JsonResponse
    {
        Gate::authorize('view-crm');

        $query = CustomerFeedback::with([
            'customer:id,name,company_name,phone',
            'jobOrder:id,job_number,description',
            'rental:id,rental_number',
            'creator:id,name',
        ]);

        if ($request->filled('search')) {
            $search = '%' . strtolower($request->input('search')) . '%';
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(comments) LIKE ?', [$search])
                  ->orWhereHas('customer', function ($cq) use ($search) {
                      $cq->whereRaw('LOWER(name) LIKE ?', [$search])
                         ->orWhereRaw('LOWER(company_name) LIKE ?', [$search]);
                  });
            });
        }

        if ($request->filled('rating') && $request->input('rating') !== 'all') {
            $query->where('overall_rating', (int)$request->input('rating'));
        }

        $feedbacks = $query->orderBy('created_at', 'desc')->paginate($request->input('per_page', 25));

        return response()->json($feedbacks);
    }

    /**
     * Record customer feedback
     */
    public function storeFeedback(Request $request): JsonResponse
    {
        Gate::authorize('view-crm');

        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'job_order_id' => 'nullable|exists:job_orders,id',
            'rental_id' => 'nullable|exists:rentals,id',
            'overall_rating' => 'required|integer|min:1|max:5',
            'equipment_condition_rating' => 'nullable|integer|min:1|max:5',
            'operator_competence_rating' => 'nullable|integer|min:1|max:5',
            'timeliness_rating' => 'nullable|integer|min:1|max:5',
            'comments' => 'nullable|string',
            'status' => 'nullable|in:published,under_review,addressed',
            'action_taken' => 'nullable|string',
        ]);

        $validated['created_by'] = $request->user()->id;
        $validated['status'] = $validated['status'] ?? 'published';

        $feedback = CustomerFeedback::create($validated);

        return response()->json($feedback->load(['customer', 'jobOrder', 'rental', 'creator']), 201);
    }

    /**
     * Overall CRM Dashboard Metrics
     */
    public function metrics(): JsonResponse
    {
        Gate::authorize('view-crm');

        $totalCustomers = Customer::count();
        $totalInquiries = CustomerInquiry::count();
        $openInquiries = CustomerInquiry::whereIn('status', ['new', 'contacted', 'qualified'])->count();
        $pendingFollowUps = CustomerFollowUp::where('status', 'pending')->count();
        $totalCommunications = CustomerCommunication::count();
        $totalQuotations = Quotation::count();
        $avgFeedback = CustomerFeedback::avg('overall_rating') ?: 5.0;

        return response()->json([
            'total_customers' => $totalCustomers,
            'total_inquiries' => $totalInquiries,
            'open_inquiries' => $openInquiries,
            'pending_follow_ups' => $pendingFollowUps,
            'total_communications' => $totalCommunications,
            'total_quotations' => $totalQuotations,
            'average_rating' => round($avgFeedback, 1),
        ]);
    }
}
