<?php

namespace IntelliTrack\Services\Project\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectTask extends Model
{
    protected $table = 'project_tasks';

    protected $fillable = [
        'project_id', 'title', 'description', 'status', 'priority',
        'assigned_to', 'due_date', 'start_date', 'completed_at',
        'estimated_hours', 'actual_hours', 'notes'
    ];

    protected $casts = [
        'due_date' => 'date',
        'start_date' => 'date',
        'completed_at' => 'datetime',
        'estimated_hours' => 'decimal:2',
        'actual_hours' => 'decimal:2',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
