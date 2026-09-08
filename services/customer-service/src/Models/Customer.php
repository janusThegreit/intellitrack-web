<?php

namespace IntelliTrack\Services\Customer\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use SoftDeletes;

    protected $table = 'customers';

    protected $fillable = [
        'name', 'email', 'phone', 'company_name', 'contact_person',
        'address', 'project_location', 'technical_requirements', 'site_condition',
        'estimated_budget', 'city', 'province', 'postal_code', 'tax_id',
        'customer_type', 'status', 'notes', 'total_job_orders',
        'total_spending', 'last_order_date', 'archived_at'
    ];

    protected $casts = [
        'last_order_date' => 'datetime',
        'archived_at' => 'datetime',
        'total_spending' => 'decimal:2',
        'estimated_budget' => 'decimal:2',
    ];

    public function inquiries(): HasMany
    {
        return $this->hasMany(CustomerInquiry::class);
    }
}
