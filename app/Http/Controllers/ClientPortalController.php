<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\CustomerFeedback;
use App\Models\CustomerInquiry;
use App\Models\JobOrder;
use App\Models\Project;
use App\Models\Quotation;
use App\Models\Rental;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ClientPortalController extends Controller
{
    /**
     * Retrieve the client customer record for the authenticated user.
     * Enforces strict data isolation.
     */
    private function getAuthenticatedClient(Request $request): ?Customer
    {
        /** @var User $user */
        $user = $request->user();

        if (!$user) {
            abort(401, 'Unauthenticated.');
        }

        // If internal user/admin is simulating or viewing client portal, allow selecting or default to first customer
        if ($user->isAdministrator()) {
            if ($request->has('client_id')) {
                return Customer::find($request->input('client_id')) ?? Customer::first();
            }
            if ($user->client_id) {
                return Customer::find($user->client_id) ?? Customer::first();
            }
            return Customer::first();
        }

        if (!$user->client_id) {
            // Self-repair: automatically create or link a customer record for the client account.
            $customer = Customer::where('email', $user->email)->first();
            if (!$customer) {
                $customer = Customer::create([
                    'name' => $user->name,
                    'company_name' => $user->name,
                    'contact_person' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone ?? '',
                    'address' => 'Pending profile update',
                    'customer_type' => 'business',
                    'status' => 'active',
                    'source' => 'Client Portal',
                ]);
            }

            $user->update(['client_id' => $customer->id]);
            return $customer;
        }

        $customer = Customer::find($user->client_id);
        if (!$customer) {
            abort(404, 'Associated client profile was not found.');
        }

        return $customer;
    }

    /**
     * Client Portal Dashboard View
     */
    public function dashboard(Request $request): Response
    {
        Gate::authorize('access-client-portal');
        $customer = $this->getAuthenticatedClient($request);

        $clientId = $customer ? $customer->id : null;

        $stats = [
            'inquiries_count' => CustomerInquiry::where('customer_id', $clientId)->count(),
            'active_quotations_count' => Quotation::where('customer_id', $clientId)->whereIn('status', ['submitted', 'approved', 'sent'])->count(),
            'job_orders_count' => JobOrder::where('customer_id', $clientId)->count(),
            'active_rentals_count' => Rental::where('customer_id', $clientId)->whereIn('status', ['active', 'reserved', 'in-progress'])->count(),
            'projects_count' => Project::where('customer_id', $clientId)->count(),
        ];

        $recentInquiries = CustomerInquiry::where('customer_id', $clientId)->latest()->take(5)->get();
        $recentQuotations = Quotation::where('customer_id', $clientId)->latest()->take(5)->get();
        $recentJobOrders = JobOrder::where('customer_id', $clientId)->with(['jobOrderItems.equipment'])->latest()->take(5)->get();
        $recentRentals = Rental::where('customer_id', $clientId)->with(['equipment'])->latest()->take(5)->get();
        $recentProjects = Project::where('customer_id', $clientId)->latest()->take(5)->get();

        return Inertia::render('Portal/Dashboard', [
            'client' => $customer,
            'stats' => $stats,
            'recentInquiries' => $recentInquiries,
            'recentQuotations' => $recentQuotations,
            'recentJobOrders' => $recentJobOrders,
            'recentRentals' => $recentRentals,
            'recentProjects' => $recentProjects,
        ]);
    }

    /**
     * My Profile View
     */
    public function profile(Request $request): Response
    {
        Gate::authorize('access-client-portal');
        $customer = $this->getAuthenticatedClient($request);

        return Inertia::render('Portal/Profile', [
            'client' => $customer,
            'user' => $request->user(),
        ]);
    }

    /**
     * Update client profile
     */
    public function updateProfile(Request $request): RedirectResponse
    {
        Gate::authorize('access-client-portal');
        $customer = $this->getAuthenticatedClient($request);
        $user = $request->user();

        $validated = $request->validate([
            'contact_person' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:30'],
            'address' => ['required', 'string', 'max:500'],
            'project_location' => ['nullable', 'string', 'max:500'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ]);

        if ($customer) {
            $customer->update([
                'contact_person' => $validated['contact_person'],
                'phone' => $validated['phone'],
                'address' => $validated['address'],
                'project_location' => $validated['project_location'] ?? $customer->project_location,
            ]);
        }

        $userData = [
            'name' => $validated['contact_person'],
            'phone' => $validated['phone'],
        ];

        if (!empty($validated['password'])) {
            $userData['password'] = Hash::make($validated['password']);
        }

        $user->update($userData);

        ActivityLogService::logAuth($user, 'updated', "Client '{$user->name}' updated their contact details and profile.");

        return back()->with('success', 'Your client profile has been successfully updated.');
    }

    /**
     * My Inquiries View & API
     */
    public function inquiries(Request $request): Response
    {
        Gate::authorize('access-client-portal');
        $customer = $this->getAuthenticatedClient($request);

        $inquiries = CustomerInquiry::where('customer_id', $customer?->id)
            ->latest()
            ->paginate(15);

        return Inertia::render('Portal/Inquiries', [
            'client' => $customer,
            'inquiries' => $inquiries,
        ]);
    }

    /**
     * Submit an Inquiry via Client Portal (Integrates directly into CRM workflow)
     */
    public function storeInquiry(Request $request): RedirectResponse
    {
        Gate::authorize('access-client-portal');
        $customer = $this->getAuthenticatedClient($request);
        $user = $request->user();

        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'details' => ['required', 'string', 'max:3000'],
            'priority' => ['nullable', 'in:low,medium,high,urgent'],
        ]);

        $inquiryNumber = 'INQ-' . date('Ymd') . '-' . strtoupper(Str::random(6));

        $inquiry = CustomerInquiry::create([
            'customer_id' => $customer?->id,
            'inquiry_number' => $inquiryNumber,
            'source' => 'Client Portal',
            'subject' => $validated['subject'],
            'details' => $validated['details'],
            'status' => 'new',
            'priority' => $validated['priority'] ?? 'medium',
            'created_by' => $user->id,
            'remarks' => 'Submitted online by client via IntelliTrack Client Portal.',
        ]);

        // Log and notify sales department
        ActivityLogService::log(
            $user,
            'created',
            CustomerInquiry::class,
            $inquiry->id,
            "Client '{$user->name}' submitted inquiry #{$inquiryNumber} via Client Portal."
        );

        NotificationService::sendToRole(
            'sales_business_development',
            "New Client Inquiry: {$inquiry->subject}",
            "Client {$customer?->company_name} submitted inquiry {$inquiryNumber}.",
            'inquiry',
            $inquiry->id,
            ['inquiry_id' => $inquiry->id]
        );

        NotificationService::sendToRole(
            'sales_manager',
            "New Client Inquiry: {$inquiry->subject}",
            "Client {$customer?->company_name} submitted inquiry {$inquiryNumber}.",
            'inquiry',
            $inquiry->id,
            ['inquiry_id' => $inquiry->id]
        );

        return back()->with('success', "Your inquiry #{$inquiryNumber} has been received. Our sales team has been notified and will review your request.");
    }

    /**
     * My Quotations View (Strictly scoped to own client)
     */
    public function quotations(Request $request): Response
    {
        Gate::authorize('access-client-portal');
        $customer = $this->getAuthenticatedClient($request);

        $quotations = Quotation::where('customer_id', $customer?->id)
            ->with(['items.equipment'])
            ->latest()
            ->paginate(15);

        return Inertia::render('Portal/Quotations', [
            'client' => $customer,
            'quotations' => $quotations,
        ]);
    }

    /**
     * View specific quotation details (Enforces data ownership isolation)
     */
    public function showQuotation(Request $request, Quotation $quotation): JsonResponse
    {
        Gate::authorize('access-client-portal');
        $customer = $this->getAuthenticatedClient($request);

        if (!$request->user()->isAdministrator() && $quotation->customer_id !== $customer?->id) {
            abort(403, 'Unauthorized. You can only view quotations issued to your organization.');
        }

        $quotation->load(['items.equipment', 'createdBy:id,name']);

        return response()->json($quotation);
    }

    /**
     * My Job Orders View (Strictly scoped to own client)
     */
    public function jobOrders(Request $request): Response
    {
        Gate::authorize('access-client-portal');
        $customer = $this->getAuthenticatedClient($request);

        $jobOrders = JobOrder::where('customer_id', $customer?->id)
            ->with(['jobOrderItems.equipment'])
            ->latest()
            ->paginate(15);

        return Inertia::render('Portal/JobOrders', [
            'client' => $customer,
            'jobOrders' => $jobOrders,
        ]);
    }

    /**
     * View specific job order details (Enforces data ownership isolation)
     */
    public function showJobOrder(Request $request, JobOrder $jobOrder): JsonResponse
    {
        Gate::authorize('access-client-portal');
        $customer = $this->getAuthenticatedClient($request);

        if (!$request->user()->isAdministrator() && $jobOrder->customer_id !== $customer?->id) {
            abort(403, 'Unauthorized. You can only view job orders belonging to your organization.');
        }

        $jobOrder->load(['jobOrderItems.equipment', 'assignedTo:id,name']);

        return response()->json($jobOrder);
    }

    /**
     * My Rentals View (Strictly scoped to own client)
     */
    public function rentals(Request $request): Response
    {
        Gate::authorize('access-client-portal');
        $customer = $this->getAuthenticatedClient($request);

        $rentals = Rental::where('customer_id', $customer?->id)
            ->with(['equipment', 'jobOrder:id,job_order_number'])
            ->latest()
            ->paginate(15);

        return Inertia::render('Portal/Rentals', [
            'client' => $customer,
            'rentals' => $rentals,
        ]);
    }

    /**
     * View specific rental details (Enforces data ownership isolation)
     */
    public function showRental(Request $request, Rental $rental): JsonResponse
    {
        Gate::authorize('access-client-portal');
        $customer = $this->getAuthenticatedClient($request);

        if (!$request->user()->isAdministrator() && $rental->customer_id !== $customer?->id) {
            abort(403, 'Unauthorized. You can only view rental records belonging to your organization.');
        }

        $rental->load(['equipment', 'jobOrder']);

        return response()->json($rental);
    }

    /**
     * My Projects View (Strictly scoped to own client)
     */
    public function projects(Request $request): Response
    {
        Gate::authorize('access-client-portal');
        $customer = $this->getAuthenticatedClient($request);

        $projects = Project::where('customer_id', $customer?->id)
            ->with(['tasks'])
            ->withCount('tasks')
            ->latest()
            ->paginate(15);

        return Inertia::render('Portal/Projects', [
            'client' => $customer,
            'projects' => $projects,
        ]);
    }

    /**
     * View specific project details (Enforces data ownership isolation)
     */
    public function showProject(Request $request, Project $project): JsonResponse
    {
        Gate::authorize('access-client-portal');
        $customer = $this->getAuthenticatedClient($request);

        if (!$request->user()->isAdministrator() && $project->customer_id !== $customer?->id) {
            abort(403, 'Unauthorized. You can only view project dossier belonging to your organization.');
        }

        $project->load(['tasks', 'projectManager:id,name']);

        return response()->json($project);
    }

    /**
     * Feedback View & Submission
     */
    public function feedback(Request $request): Response
    {
        Gate::authorize('access-client-portal');
        $customer = $this->getAuthenticatedClient($request);

        $feedbacks = CustomerFeedback::where('customer_id', $customer?->id)
            ->with('jobOrder:id,job_order_number')
            ->latest()
            ->paginate(15);

        $availableJobOrders = JobOrder::where('customer_id', $customer?->id)
            ->select('id', 'job_order_number', 'description')
            ->get();

        return Inertia::render('Portal/Feedback', [
            'client' => $customer,
            'feedbacks' => $feedbacks,
            'availableJobOrders' => $availableJobOrders,
        ]);
    }

    /**
     * Store feedback submitted by client
     */
    public function storeFeedback(Request $request): RedirectResponse
    {
        Gate::authorize('access-client-portal');
        $customer = $this->getAuthenticatedClient($request);
        $user = $request->user();

        $validated = $request->validate([
            'job_order_id' => ['nullable', 'exists:job_orders,id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comments' => ['required', 'string', 'max:2000'],
            'feedback_type' => ['nullable', 'string', 'max:50'],
        ]);

        if (!empty($validated['job_order_id'])) {
            $jobOrder = JobOrder::find($validated['job_order_id']);
            if ($jobOrder && $jobOrder->customer_id !== $customer?->id && !$user->isAdministrator()) {
                abort(403, 'Unauthorized job order reference.');
            }
        }

        $feedback = CustomerFeedback::create([
            'customer_id' => $customer?->id,
            'job_order_id' => $validated['job_order_id'] ?? null,
            'rating' => $validated['rating'],
            'comments' => $validated['comments'],
            'feedback_type' => $validated['feedback_type'] ?? 'service_quality',
            'submitted_by' => $user->name,
        ]);

        ActivityLogService::log(
            $user,
            'created',
            CustomerFeedback::class,
            $feedback->id,
            "Client '{$user->name}' submitted service feedback with rating {$validated['rating']}/5."
        );

        return back()->with('success', 'Thank you! Your feedback has been received.');
    }
}
