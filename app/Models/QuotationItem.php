<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuotationItem extends Model
{
    protected $fillable = ['quotation_id', 'equipment_id', 'description', 'quantity', 'rental_duration', 'rental_duration_unit', 'unit_rate', 'additional_charges', 'line_total'];
    protected function casts(): array { return ['unit_rate' => 'decimal:2', 'additional_charges' => 'decimal:2', 'line_total' => 'decimal:2']; }
    public function quotation(): BelongsTo { return $this->belongsTo(Quotation::class); }
    public function equipment(): BelongsTo { return $this->belongsTo(Equipment::class); }
}