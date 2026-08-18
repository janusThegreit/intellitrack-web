<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RentalRequirement extends Model
{
    protected $fillable = [
        'customer_inquiry_id', 'customer_id', 'equipment_id', 'quotation_id', 'job_order_id',
        'requirement_number', 'crane_category', 'required_load', 'required_load_unit',
        'required_radius', 'required_radius_unit', 'required_height', 'required_height_unit',
        'required_from', 'required_until', 'services', 'site_location', 'notes', 'status',
        'created_by', 'assessed_by', 'assessed_at',
    ];

    protected function casts(): array
    {
        return [
            'required_from' => 'date',
            'required_until' => 'date',
            'assessed_at' => 'datetime',
            'services' => 'array',
        ];
    }

    public function inquiry(): BelongsTo
    {
        return $this->belongsTo(CustomerInquiry::class, 'customer_inquiry_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function equipment(): BelongsTo
    {
        return $this->belongsTo(Equipment::class);
    }

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    public function jobOrder(): BelongsTo
    {
        return $this->belongsTo(JobOrder::class);
    }
}