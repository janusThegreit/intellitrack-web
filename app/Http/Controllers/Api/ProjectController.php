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
        $query = Project::query()->with(['customer', 'projectManager']);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->input('customer_id'));
        }

        $projects = $query->orderByDesc('created_at')->paginate($request->input('per_page', 15));

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
            'deadline' => ['nullable', 'date', 'after:start_date'],
            'budget' => ['nullable', 'numeric', 'min:0'],
            'objectives' => ['nullable', 'string'],
            'deliverables' => ['nullable', 'string'],
        ]);

        $validated['project_code'] = 'PRJ-' . date('Ymd') . '-' . Str::random(6);

        $project = Project::create($validated);

        return response()->json($project, Response::HTTP_CREATED);
    }

    /**
     * Display the specified project.
     */
    public function show(Project $project)
    {
        Gate::authorize('view-projects');
        $project->load(['customer', 'projectManager', 'tasks']);
        return response()->json($project);
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
    public function indexTasks(Project $project)
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
