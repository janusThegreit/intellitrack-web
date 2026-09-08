<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Customer extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'customer_code',
        'name',
        'company_name',
        'business_reg_no',
        'tax_id',
        'industry',
        'contact_person',
        'position',
        'phone',
        'mobile_number',
        'email',
        'address',
        'barangay',
        'city',
        'province',
        'postal_code',
        'customer_type',
        'source',
        'status',
        'notes',
        'project_location',
        'technical_requirements',
        'site_condition',
        'estimated_budget',
        'total_job_orders',
        'total_spending',
        'last_order_date',
        'archived_at',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($customer) {
            if (empty($customer->customer_code)) {
                $maxId = (int) static::max('id');
                $customer->customer_code = 'CUS-' . str_pad($maxId + 1, 4, '0', STR_PAD_LEFT);
            }
            if (empty($customer->name) && !empty($customer->company_name)) {
                $customer->name = $customer->company_name;
            }
            if (empty($customer->company_name) && !empty($customer->name)) {
                $customer->company_name = $customer->name;
            }
        });
    }

    protected $casts = [
        'last_order_date' => 'datetime',
        'archived_at' => 'datetime',
        'total_spending' => 'decimal:2',
        'estimated_budget' => 'decimal:2',
    ];

    public function jobOrders(): HasMany
    {
        return $this->hasMany(JobOrder::class);
    }

    public function rentals(): HasMany
    {
        return $this->hasMany(Rental::class);
    }

    public function quotations(): HasMany
    {
        return $this->hasMany(Quotation::class);
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    public function inquiries(): HasMany
    {
        return $this->hasMany(CustomerInquiry::class);
    }

    public function followUps(): HasMany
    {
        return $this->hasMany(CustomerFollowUp::class);
    }

    public function communications(): HasMany
    {
        return $this->hasMany(CustomerCommunication::class);
    }

    public function feedbacks(): HasMany
    {
        return $this->hasMany(CustomerFeedback::class);
    }
}
