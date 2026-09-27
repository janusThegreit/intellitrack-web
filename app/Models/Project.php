<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Project extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'project_code', 'project_name', 'description', 'customer_id',
        'project_manager_id', 'start_date', 'end_date', 'deadline',
        'expected_end_date', 'location', 'requirements', 'required_equipment',
        'remarks', 'job_order_id', 'rental_id',
        'status', 'budget', 'spent_amount', 'progress_percentage',
        'objectives', 'deliverables'
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'deadline' => 'datetime',
        'expected_end_date' => 'datetime',
        'budget' => 'decimal:2',
        'spent_amount' => 'decimal:2',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function projectManager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'project_manager_id');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(ProjectTask::class);
    }

    public function jobOrder(): BelongsTo
    {
        return $this->belongsTo(JobOrder::class, 'job_order_id');
    }
}
