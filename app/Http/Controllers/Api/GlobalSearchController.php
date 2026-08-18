<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerInquiry;
use App\Models\JobOrder;
use App\Models\Project;
use App\Models\Quotation;
use App\Models\Rental;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class GlobalSearchController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('view-core-dashboard');
        $term = trim((string) $request->input('q'));

        if (mb_strlen($term) < 2) {
            return response()->json(['data' => []]);
        }

        $like = "%{$term}%";
        $results = collect();

        Customer::whereNull('archived_at')->where(fn ($query) => $query->where('name', 'like', $like)->orWhere('company_name', 'like', $like)->orWhere('email', 'like', $like))->limit(5)->get()->each(fn (Customer $customer) => $results->push(['type' => 'Client', 'title' => $customer->company_name ?: $customer->name, 'subtitle' => $customer->email, 'href' => "/record/client/{$customer->id}"]));
        CustomerInquiry::where(fn ($query) => $query->where('inquiry_number', 'like', $like)->orWhere('subject', 'like', $like))->limit(5)->get()->each(fn (CustomerInquiry $inquiry) => $results->push(['type' => 'CRM inquiry', 'title' => $inquiry->subject, 'subtitle' => $inquiry->inquiry_number, 'href' => "/record/inquiry/{$inquiry->id}"]));
        Quotation::where(fn ($query) => $query->where('quotation_number', 'like', $like)->orWhere('description', 'like', $like))->limit(5)->get()->each(fn (Quotation $quotation) => $results->push(['type' => 'Quotation', 'title' => $quotation->quotation_number, 'subtitle' => $quotation->status, 'href' => "/record/quotation/{$quotation->id}"]));
        JobOrder::where(fn ($query) => $query->where('job_order_number', 'like', $like)->orWhere('description', 'like', $like))->limit(5)->get()->each(fn (JobOrder $jobOrder) => $results->push(['type' => 'Job order', 'title' => $jobOrder->job_order_number, 'subtitle' => $jobOrder->description, 'href' => "/record/job-order/{$jobOrder->id}"]));
        Rental::where('rental_number', 'like', $like)->limit(5)->get()->each(fn (Rental $rental) => $results->push(['type' => 'Rental', 'title' => $rental->rental_number, 'subtitle' => $rental->status, 'href' => "/record/rental/{$rental->id}"]));
        Project::where(fn ($query) => $query->where('project_code', 'like', $like)->orWhere('project_name', 'like', $like))->limit(5)->get()->each(fn (Project $project) => $results->push(['type' => 'Project', 'title' => $project->project_name, 'subtitle' => $project->project_code, 'href' => "/record/project/{$project->id}"]));

        return response()->json(['data' => $results->take(20)->values()]);
    }
}