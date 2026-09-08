<?php

namespace IntelliTrack\Services\Quotation\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuotationItem extends Model
{
    protected $table = 'quotation_items';

    protected $fillable = [
        'quotation_id', 'equipment_id', 'description', 'quantity',
        'rental_duration', 'rental_duration_unit', 'unit_rate',
        'additional_charges', 'total_amount', 'notes'
    ];

    protected $casts = [
        'unit_rate' => 'decimal:2',
        'additional_charges' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }
}
