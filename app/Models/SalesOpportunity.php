<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalesOpportunity extends Model
{
    protected $fillable = ['customer_id', 'customer_inquiry_id', 'opportunity_number', 'title', 'estimated_value', 'expected_close_date', 'status', 'notes', 'created_by'];

    protected function casts(): array
    {
        return ['estimated_value' => 'decimal:2', 'expected_close_date' => 'date'];
    }

    public function customer(): BelongsTo { return $this->belongsTo(Customer::class); }
    public function inquiry(): BelongsTo { return $this->belongsTo(CustomerInquiry::class, 'customer_inquiry_id'); }
    public function quotations(): HasMany { return $this->hasMany(Quotation::class); }
}