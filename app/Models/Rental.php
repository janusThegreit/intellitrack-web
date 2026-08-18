<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Rental extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'rental_number', 'job_order_id', 'customer_id', 'equipment_id',
        'quantity', 'rental_start_date', 'rental_end_date', 'actual_return_date',
        'status', 'daily_rate', 'rental_days', 'rental_cost', 'deposit_amount',
        'deposit_returned', 'additional_charges', 'total_amount',
        'damage_notes', 'notes'
    ];

    protected $casts = [
        'rental_start_date' => 'datetime',
        'rental_end_date' => 'datetime',
        'actual_return_date' => 'datetime',
        'daily_rate' => 'decimal:2',
        'rental_cost' => 'decimal:2',
        'deposit_amount' => 'decimal:2',
        'deposit_returned' => 'decimal:2',
        'additional_charges' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    public function jobOrder(): BelongsTo
    {
        return $this->belongsTo(JobOrder::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function equipment(): BelongsTo
    {
        return $this->belongsTo(Equipment::class);
    }

    public function isOverdue(): bool
    {
        if ($this->status === 'completed' || $this->status === 'cancelled') {
            return false;
        }

        return now()->gt($this->rental_end_date);
    }
}
