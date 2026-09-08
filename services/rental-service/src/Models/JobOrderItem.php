<?php

namespace IntelliTrack\Services\Rental\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobOrderItem extends Model
{
    protected $table = 'job_order_items';

    protected $fillable = [
        'job_order_id', 'equipment_id', 'description', 'quantity',
        'unit_price', 'total_price', 'notes'
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    public function jobOrder(): BelongsTo
    {
        return $this->belongsTo(JobOrder::class);
    }
}
