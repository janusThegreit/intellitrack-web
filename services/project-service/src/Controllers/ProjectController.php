<?php

namespace IntelliTrack\Services\Project\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;
use IntelliTrack\Services\Project\Models\Project;
use IntelliTrack\Services\Project\Models\ProjectTask;
use IntelliTrack\Shared\Http\ApiResponse;

class ProjectController extends Controller
{
    /**
     * List all projects.
     */
    public function index(Request $request)
    {
        $query = Project::with('tasks');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('project_name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $projects = $query->orderByDesc('created_at')->paginate($request->input('per_page', 25));

        return ApiResponse::success($projects);
    }

    /**
     * Store new project.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'project_name' => 'required|string|max:255',
            'customer_id' => 'required|integer',
            'project_manager_id' => 'nullable|integer',
            'status' => 'nullable|string|in:planning,active,on-hold,completed,cancelled',
            'budget' => 'nullable|numeric|min:0',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'deadline' => 'nullable|date',
            'description' => 'nullable|string',
            'objectives' => 'nullable|string',
            'deliverables' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors());
        }

        $data = $validator->validated();
        $data['status'] = $data['status'] ?? 'planning';
        $data['progress'] = 0;
        $data['spent_amount'] = 0;

        $project = Project::create($data);

        return ApiResponse::created($project, 'Project created successfully');
    }

    /**
     * Show single project.
     */
    public function show($id)
    {
        $project = Project::with('tasks')->find($id);
        if (! $project) {
            return ApiResponse::notFound('Project not found.');
        }

        return ApiResponse::success($project);
    }

    /**
     * Update project.
     */
    public function update(Request $request, $id)
    {
        $project = Project::find($id);
        if (! $project) {
            return ApiResponse::notFound('Project not found.');
        }

        $validator = Validator::make($request->all(), [
            'project_name' => 'nullable|string|max:255',
            'project_manager_id' => 'nullable|integer',
            'status' => 'nullable|string|in:planning,active,on-hold,completed,cancelled',
            'budget' => 'nullable|numeric|min:0',
            'spent_amount' => 'nullable|numeric|min:0',
            'progress' => 'nullable|integer|min:0|max:100',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'deadline' => 'nullable|date',
            'description' => 'nullable|string',
            'objectives' => 'nullable|string',
            'deliverables' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors());
        }

        $project->update($validator->validated());

        return ApiResponse::success($project, 'Project updated successfully');
    }

    /**
     * Delete project.
     */
    public function destroy($id)
    {
        $project = Project::find($id);
        if (! $project) {
            return ApiResponse::notFound('Project not found.');
        }

        $project->delete();

        return ApiResponse::success(null, 'Project deleted successfully');
    }

    /**
     * Create project task.
     */
    public function storeTask(Request $request, $projectId)
    {
        $project = Project::find($projectId);
        if (! $project) {
            return ApiResponse::notFound('Project not found.');
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'nullable|string|in:low,medium,high,urgent',
            'assigned_to' => 'nullable|integer',
            'due_date' => 'nullable|date',
            'estimated_hours' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors());
        }

        $data = $validator->validated();
        $data['project_id'] = $projectId;
        $data['status'] = 'todo';

        $task = ProjectTask::create($data);

        return ApiResponse::created($task, 'Task added to project');
    }

    /**
     * Update task status.
     */
    public function updateTaskStatus(Request $request, $taskId)
    {
        $task = ProjectTask::find($taskId);
        if (! $task) {
            return ApiResponse::notFound('Project task not found.');
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|string|in:todo,in-progress,review,completed',
            'actual_hours' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors());
        }

        $updates = ['status' => $request->status];
        if ($request->filled('actual_hours')) {
            $updates['actual_hours'] = $request->actual_hours;
        }

        if ($request->status === 'completed') {
            $updates['completed_at'] = now();
        }

        $task->update($updates);

        // Recalculate project progress
        $project = Project::with('tasks')->find($task->project_id);
        if ($project && $project->tasks->count() > 0) {
            $completed = $project->tasks->where('status', 'completed')->count();
            $progress = round(($completed / $project->tasks->count()) * 100);
            $project->update(['progress' => $progress]);
        }

        return ApiResponse::success($task, 'Task status updated successfully');
    }
}
