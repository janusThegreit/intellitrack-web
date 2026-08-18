<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobOrder extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'job_order_number', 'customer_id', 'created_by', 'assigned_to',
        'description', 'status', 'priority', 'scheduled_date', 'start_date',
        'completion_date', 'due_date', 'estimated_cost', 'actual_cost',
        'total_amount', 'notes', 'location', 'equipment_count'
    ];

    protected $casts = [
        'scheduled_date' => 'datetime',
        'start_date' => 'datetime',
        'completion_date' => 'datetime',
        'due_date' => 'datetime',
        'estimated_cost' => 'decimal:2',
        'actual_cost' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function jobOrderItems(): HasMany
    {
        return $this->hasMany(JobOrderItem::class);
    }

    public function rentals(): HasMany
    {
        return $this->hasMany(Rental::class);
    }

    public function quotations(): HasMany
    {
        return $this->hasMany(Quotation::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(ActivityLog::class, 'loggable_id')
            ->where('loggable_type', JobOrder::class);
    }
}
