<?php

namespace IntelliTrack\Services\Quotation\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuotationHistory extends Model
{
    protected $table = 'quotation_histories';

    protected $fillable = [
        'quotation_id', 'user_id', 'action', 'from_status', 'to_status', 'notes'
    ];

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }
}
