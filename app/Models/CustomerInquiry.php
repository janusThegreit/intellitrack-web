<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class CustomerInquiry extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'customer_id',
        'inquiry_number',
        'source',
        'subject',
        'details',
        'status',
        'priority',
        'remarks',
        'created_by',
        'assigned_to',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $appends = [
        'company_name',
        'contact_name',
        'phone',
        'email',
        'estimated_budget',
        'equipment_type',
    ];

    public function getCompanyNameAttribute(): ?string
    {
        return $this->customer?->company_name ?: ($this->customer?->name ?: null);
    }

    public function getContactNameAttribute(): ?string
    {
        return $this->customer?->contact_person ?: ($this->customer?->name ?: null);
    }

    public function getPhoneAttribute(): ?string
    {
        return $this->customer?->phone ?: ($this->customer?->mobile_number ?: null);
    }

    public function getEmailAttribute(): ?string
    {
        return $this->customer?->email ?: null;
    }

    public function getEstimatedBudgetAttribute(): ?float
    {
        if ($this->customer?->estimated_budget) {
            return (float) $this->customer->estimated_budget;
        }
        if ($this->customer?->total_contract_value) {
            return (float) $this->customer->total_contract_value;
        }
        return null;
    }

    public function getEquipmentTypeAttribute(): ?string
    {
        $firstReq = $this->rentalRequirements?->first();
        if ($firstReq) {
            if ($firstReq->equipment?->name) {
                return $firstReq->equipment->name;
            }
            if ($firstReq->crane_category) {
                return ucwords(str_replace('_', ' ', $firstReq->crane_category)) . ' Crane';
            }
        }

        $subjectLower = strtolower($this->subject . ' ' . $this->details);
        if (str_contains($subjectLower, 'tower crane') || str_contains($subjectLower, 'topless') || str_contains($subjectLower, 'hammerhead') || str_contains($subjectLower, 'luffing')) {
            return 'Tower Crane';
        }
        if (str_contains($subjectLower, 'mobile crane') || str_contains($subjectLower, 'all-terrain') || str_contains($subjectLower, 'all terrain') || str_contains($subjectLower, 'truck crane')) {
            return 'Mobile Crane';
        }
        if (str_contains($subjectLower, 'crawler')) {
            return 'Crawler Crane';
        }
        if (str_contains($subjectLower, 'crane')) {
            return 'Heavy Crane';
        }

        return $this->customer?->active_lease_summary ? explode(',', $this->customer->active_lease_summary)[0] : 'Heavy Equipment';
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function rentalRequirements(): HasMany
    {
        return $this->hasMany(RentalRequirement::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function history(): HasMany
    {
        return $this->hasMany(CustomerInquiryHistory::class);
    }
}
