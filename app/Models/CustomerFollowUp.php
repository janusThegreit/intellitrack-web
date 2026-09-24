<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CustomerFollowUp extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'customer_follow_ups';

    protected $fillable = [
        'customer_id',
        'customer_inquiry_id',
        'equipment_id',
        'project_id',
        'title',
        'notes',
        'scheduled_date',
        'due_time',
        'status',
        'priority',
        'category',
        'is_permit_critical',
        'assigned_to',
        'created_by',
        'completed_at',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
        'is_permit_critical' => 'boolean',
        'completed_at' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function inquiry(): BelongsTo
    {
        return $this->belongsTo(CustomerInquiry::class, 'customer_inquiry_id');
    }

    public function equipment(): BelongsTo
    {
        return $this->belongsTo(Equipment::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
