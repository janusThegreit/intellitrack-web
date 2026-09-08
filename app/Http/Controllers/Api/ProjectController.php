<?php

namespace App\Http\Controllers\Api;

use App\Models\Project;
use App\Models\ProjectTask;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class ProjectController extends Controller
{
    /**
     * Display a listing of projects.
     */
    public function index(Request $request)
    {
        Gate::authorize('view-projects');
        $query = Project::query()->with(['customer', 'projectManager', 'tasks'])->withCount('tasks');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->input('customer_id'));
        }

        $projects = $query->orderByDesc('id')->paginate($request->input('per_page', 25));

        return response()->json($projects);
    }

    /**
     * Store a newly created project.
     */
    public function store(Request $request)
    {
        Gate::authorize('manage-projects');
        $validated = $request->validate([
            'project_name' => ['required', 'string', 'max:255'],
            'customer_id' => ['required', 'exists:customers,id'],
            'project_manager_id' => ['required', 'exists:users,id'],
            'description' => ['nullable', 'string'],
            'start_date' => ['required', 'date'],
            'deadline' => ['nullable', 'date'],
            'budget' => ['nullable', 'numeric', 'min:0'],
            'objectives' => ['nullable', 'string'],
            'deliverables' => ['nullable', 'string'],
            'status' => ['nullable', 'in:planning,active,on-hold,completed,cancelled'],
        ]);

        $validated['project_code'] = 'PRJ-' . date('Y') . '-' . strtoupper(Str::random(6));
        $validated['status'] = $validated['status'] ?? 'active';

        $project = Project::create($validated);

        // Auto-seed default industry milestone phases
        $defaultPhases = [
            ['task_name' => 'Site Survey, Soil Bearing Capacity & Anchor Bolt Inspection', 'priority' => 'critical', 'hours' => 24],
            ['task_name' => 'Mobilization of Heavy Equipment, Boom Trucks & Counterweights', 'priority' => 'high', 'hours' => 48],
            ['task_name' => 'Tower Crane Mast Erection & Hook Height Calibration', 'priority' => 'critical', 'hours' => 60],
            ['task_name' => 'Active Project Rigging & Structural Steel Operations', 'priority' => 'high', 'hours' => 120],
            ['task_name' => 'DOLE Third-Party Load Testing Certification & Site Demob', 'priority' => 'medium', 'hours' => 32],
        ];

        foreach ($defaultPhases as $idx => $phase) {
            $project->tasks()->create([
                'task_name' => $phase['task_name'],
                'priority' => $phase['priority'],
                'status' => $idx === 0 ? 'in-progress' : 'todo',
                'progress_percentage' => $idx === 0 ? 30 : 0,
                'assigned_to' => $project->project_manager_id,
                'estimated_hours' => $phase['hours'],
                'actual_hours' => 0,
                'description' => 'Mandatory operational phase for crane site rigging and safety protocol.',
            ]);
        }

        $project->load(['customer', 'projectManager', 'tasks']);

        return response()->json($project, Response::HTTP_CREATED);
    }

    /**
     * Display the specified project with full connected operational intelligence.
     */
    public function show(Project $project)
    {
        Gate::authorize('view-projects');
        $project->load(['customer', 'projectManager', 'tasks.assignedTo']);

        // Attach connected Job Orders
        $jobOrders = \App\Models\JobOrder::where('customer_id', $project->customer_id)
            ->with(['createdBy', 'assignedTo'])
            ->latest()
            ->get();

        // Attach connected Rentals & Fleet
        $rentals = \App\Models\Rental::where('customer_id', $project->customer_id)
            ->with(['equipment'])
            ->latest()
            ->get();

        $data = $project->toArray();
        $data['job_orders'] = $jobOrders;
        $data['rentals'] = $rentals;

        return response()->json($data);
    }

    /**
     * Update the specified project.
     */
    public function update(Request $request, Project $project)
    {
        Gate::authorize('manage-projects');
        $validated = $request->validate([
            'project_name' => ['string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['in:planning,active,on-hold,completed,cancelled'],
            'deadline' => ['nullable', 'date'],
            'budget' => ['nullable', 'numeric', 'min:0'],
            'spent_amount' => ['nullable', 'numeric', 'min:0'],
            'progress_percentage' => ['nullable', 'integer', 'min:0', 'max:100'],
            'objectives' => ['nullable', 'string'],
            'deliverables' => ['nullable', 'string'],
        ]);

        $project->update($validated);

        return response()->json($project);
    }

    /**
     * Delete the specified project.
     */
    public function destroy(Project $project)
    {
        Gate::authorize('manage-projects');
        $project->delete();
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * Display a listing of project tasks.
     */
    public function indexTasks(Request $request, Project $project)
    {
        Gate::authorize('view-projects');
        $tasks = $project->tasks()->paginate($request->input('per_page', 15));
        return response()->json($tasks);
    }

    /**
     * Store a newly created task.
     */
    public function storeTask(Request $request, Project $project)
    {
        Gate::authorize('manage-projects');
        $validated = $request->validate([
            'task_name' => ['required', 'string'],
            'description' => ['nullable', 'string'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'priority' => ['in:low,medium,high,critical'],
            'due_date' => ['nullable', 'date'],
            'estimated_hours' => ['nullable', 'integer', 'min:1'],
            'notes' => ['nullable', 'string'],
        ]);

        $task = $project->tasks()->create($validated);

        return response()->json($task, Response::HTTP_CREATED);
    }

    /**
     * Update task status.
     */
    public function updateTaskStatus(Request $request, ProjectTask $task)
    {
        Gate::authorize('manage-projects');
        $validated = $request->validate([
            'status' => ['required', 'in:todo,in-progress,in-review,completed,blocked'],
            'progress_percentage' => ['nullable', 'integer', 'min:0', 'max:100'],
            'actual_hours' => ['nullable', 'integer', 'min:0'],
        ]);

        $task->update($validated);

        return response()->json($task);
    }
}
