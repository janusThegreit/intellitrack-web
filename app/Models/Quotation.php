<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Quotation extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'quotation_number', 'customer_id', 'sales_opportunity_id', 'created_by', 'job_order_id',
        'quotation_date', 'valid_until', 'status', 'description',
        'subtotal', 'tax_rate', 'tax_amount', 'discount_amount',
        'total_amount', 'terms_conditions', 'notes', 'sent_date',
        'accepted_date', 'approved_by', 'approved_at', 'approval_notes',
        'revision_notes', 'submitted_at', 'rejected_at', 'customer_response', 'customer_response_at'
    ];

    protected $casts = [
        'quotation_date' => 'datetime',
        'valid_until' => 'datetime',
        'sent_date' => 'datetime',
        'accepted_date' => 'datetime',
        'approved_at' => 'datetime',
        'submitted_at' => 'datetime',
        'rejected_at' => 'datetime',
        'customer_response_at' => 'datetime',
        'subtotal' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
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

    public function jobOrder(): BelongsTo
    {
        return $this->belongsTo(JobOrder::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function opportunity(): BelongsTo { return $this->belongsTo(SalesOpportunity::class, 'sales_opportunity_id'); }
    public function items(): HasMany { return $this->hasMany(QuotationItem::class); }
    public function history(): HasMany { return $this->hasMany(QuotationHistory::class); }
}
