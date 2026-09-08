<?php

namespace IntelliTrack\Services\Customer\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CustomerInquiry extends Model
{
    protected $table = 'customer_inquiries';

    protected $fillable = [
        'inquiry_number', 'customer_id', 'contact_name', 'email', 'phone',
        'company_name', 'project_name', 'project_location', 'project_duration',
        'estimated_budget', 'site_condition', 'technical_requirements',
        'status', 'assigned_to', 'priority', 'notes', 'source',
        'contacted_at', 'converted_at', 'closed_at',
    ];

    protected $casts = [
        'estimated_budget' => 'decimal:2',
        'contacted_at' => 'datetime',
        'converted_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function histories(): HasMany
    {
        return $this->hasMany(CustomerInquiryHistory::class);
    }
}
