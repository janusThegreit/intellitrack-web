<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerInquiry;
use App\Models\JobOrder;
use App\Models\Project;
use App\Models\Quotation;
use App\Models\Rental;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class GlobalSearchController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('view-core-dashboard');
        $term = trim((string) $request->input('q'));

        if (mb_strlen($term) < 2) {
            return response()->json(['data' => []]);
        }

        $user = $request->user();
        $like = '%' . strtolower($term) . '%';
        $results = collect();

        // Administrator Role: Search Users, Audit Logs, and User Profiles
        if ($user && $user->role === 'administrator') {
            // 1. Search Users & User Profiles
            User::where(function ($query) use ($like) {
                $query->where(DB::raw('LOWER(name)'), 'like', $like)
                    ->orWhere(DB::raw('LOWER(email)'), 'like', $like)
                    ->orWhere(DB::raw("LOWER(COALESCE(nickname, ''))"), 'like', $like)
                    ->orWhere(DB::raw("LOWER(COALESCE(first_name, ''))"), 'like', $like)
                    ->orWhere(DB::raw("LOWER(COALESCE(last_name, ''))"), 'like', $like)
                    ->orWhere(DB::raw('LOWER(role)'), 'like', $like)
                    ->orWhere(DB::raw("LOWER(COALESCE(phone, ''))"), 'like', $like);
            })
            ->limit(8)
            ->get()
            ->each(function (User $u) use ($results) {
                $roleLabel = ucwords(str_replace('_', ' ', $u->role));
                $nicknameSuffix = $u->nickname ? " ({$u->nickname})" : '';
                $statusText = $u->is_active ? 'Active' : 'Deactivated';
                
                $results->push([
                    'type' => 'User Account',
                    'title' => "{$u->name}{$nicknameSuffix}",
                    'subtitle' => "{$roleLabel} · {$u->email} · {$statusText}",
                    'href' => "/users?search=" . urlencode($u->email),
                ]);
            });

            // 2. Search Audit Logs & Security Trails
            ActivityLog::with('user:id,name,email,role')
                ->where(function ($query) use ($like) {
                    $query->where(DB::raw('LOWER(action)'), 'like', $like)
                        ->orWhere(DB::raw('LOWER(description)'), 'like', $like)
                        ->orWhere(DB::raw("LOWER(COALESCE(loggable_type, ''))"), 'like', $like)
                        ->orWhere(DB::raw("LOWER(COALESCE(ip_address, ''))"), 'like', $like)
                        ->orWhereHas('user', function ($uq) use ($like) {
                            $uq->where(DB::raw('LOWER(name)'), 'like', $like)
                               ->orWhere(DB::raw('LOWER(email)'), 'like', $like);
                        });
                })
                ->latest()
                ->limit(8)
                ->get()
                ->each(function (ActivityLog $log) use ($results) {
                    $actor = $log->user ? $log->user->name : 'System';
                    $actionLabel = ucwords(str_replace('_', ' ', $log->action));
                    $timeAgo = $log->created_at ? $log->created_at->diffForHumans() : '';
                    
                    $results->push([
                        'type' => 'Audit Log',
                        'title' => "{$actionLabel}: " . Str::limit($log->description, 55),
                        'subtitle' => "Actor: {$actor} · {$log->ip_address} · {$timeAgo}",
                        'href' => "/logs?search=" . urlencode($log->action ?: $log->description),
                    ]);
                });

            // 3. Quick System & Profile Navigation Shortcuts
            $lowerTerm = strtolower($term);
            if (str_contains('profile my profile avatar password account settings personal credentials', $lowerTerm) || str_contains($lowerTerm, 'profile') || str_contains($lowerTerm, 'settings')) {
                $results->push([
                    'type' => 'Profile Settings',
                    'title' => 'My User Profile & Security Settings',
                    'subtitle' => 'Update personal profile, avatar, credentials & password',
                    'href' => '/settings',
                ]);
            }

            if (str_contains('users user accounts team rbac iam manage directory', $lowerTerm) || str_contains($lowerTerm, 'user')) {
                $results->push([
                    'type' => 'System Administration',
                    'title' => 'User Management & IAM Directory',
                    'subtitle' => 'Create, edit, deactivate users and review credentials',
                    'href' => '/users',
                ]);
            }

            if (str_contains('logs audit activity events security history tracking', $lowerTerm) || str_contains($lowerTerm, 'log') || str_contains($lowerTerm, 'audit')) {
                $results->push([
                    'type' => 'System Administration',
                    'title' => 'Security Audit Logs Console',
                    'subtitle' => 'Full activity timeline, authentication events, and audit trails',
                    'href' => '/logs',
                ]);
            }

            if (str_contains('roles permissions rbac access security matrix privileges', $lowerTerm) || str_contains($lowerTerm, 'role')) {
                $results->push([
                    'type' => 'System Administration',
                    'title' => 'Roles & RBAC Access Matrix',
                    'subtitle' => 'System permissions, role configurations, and access policies',
                    'href' => '/roles',
                ]);
            }

            return response()->json(['data' => $results->take(20)->values()]);
        }

        Customer::whereNull('archived_at')
            ->where(fn ($query) => $query->where(DB::raw('LOWER(name)'), 'like', $like)
                ->orWhere(DB::raw('LOWER(company_name)'), 'like', $like)
                ->orWhere(DB::raw('LOWER(email)'), 'like', $like))
            ->limit(5)->get()->each(fn (Customer $customer) => $results->push([
                'type' => 'Client',
                'title' => $customer->company_name ?: $customer->name,
                'subtitle' => $customer->email,
                'href' => "/record/client/{$customer->id}",
            ]));

        CustomerInquiry::where(fn ($query) => $query->where(DB::raw('LOWER(inquiry_number)'), 'like', $like)
                ->orWhere(DB::raw('LOWER(subject)'), 'like', $like))
            ->limit(5)->get()->each(fn (CustomerInquiry $inquiry) => $results->push([
                'type' => 'CRM inquiry',
                'title' => $inquiry->subject,
                'subtitle' => $inquiry->inquiry_number,
                'href' => "/record/inquiry/{$inquiry->id}",
            ]));

        Quotation::where(fn ($query) => $query->where(DB::raw('LOWER(quotation_number)'), 'like', $like)
                ->orWhere(DB::raw('LOWER(description)'), 'like', $like))
            ->limit(5)->get()->each(fn (Quotation $quotation) => $results->push([
                'type' => 'Quotation',
                'title' => $quotation->quotation_number,
                'subtitle' => $quotation->status,
                'href' => "/record/quotation/{$quotation->id}",
            ]));

        JobOrder::where(fn ($query) => $query->where(DB::raw('LOWER(job_order_number)'), 'like', $like)
                ->orWhere(DB::raw('LOWER(description)'), 'like', $like))
            ->limit(5)->get()->each(fn (JobOrder $jobOrder) => $results->push([
                'type' => 'Job order',
                'title' => $jobOrder->job_order_number,
                'subtitle' => $jobOrder->description,
                'href' => "/record/job-order/{$jobOrder->id}",
            ]));

        Rental::where(DB::raw('LOWER(rental_number)'), 'like', $like)
            ->limit(5)->get()->each(fn (Rental $rental) => $results->push([
                'type' => 'Rental',
                'title' => $rental->rental_number,
                'subtitle' => $rental->status,
                'href' => "/record/rental/{$rental->id}",
            ]));

        Project::where(fn ($query) => $query->where(DB::raw('LOWER(project_code)'), 'like', $like)
                ->orWhere(DB::raw('LOWER(project_name)'), 'like', $like))
            ->limit(5)->get()->each(fn (Project $project) => $results->push([
                'type' => 'Project',
                'title' => $project->project_name,
                'subtitle' => $project->project_code,
                'href' => "/record/project/{$project->id}",
            ]));

        return response()->json(['data' => $results->take(20)->values()]);
    }
}