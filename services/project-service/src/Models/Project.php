<?php

namespace IntelliTrack\Services\Project\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    use SoftDeletes;

    protected $table = 'projects';

    protected $fillable = [
        'project_name', 'customer_id', 'project_manager_id', 'status',
        'budget', 'spent_amount', 'progress', 'start_date', 'end_date',
        'deadline', 'description', 'objectives', 'deliverables', 'notes'
    ];

    protected $casts = [
        'budget' => 'decimal:2',
        'spent_amount' => 'decimal:2',
        'progress' => 'integer',
        'start_date' => 'date',
        'end_date' => 'date',
        'deadline' => 'date',
    ];

    public function tasks(): HasMany
    {
        return $this->hasMany(ProjectTask::class);
    }
}
