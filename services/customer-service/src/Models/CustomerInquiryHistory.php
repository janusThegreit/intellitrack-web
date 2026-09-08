<?php

namespace IntelliTrack\Services\Customer\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerInquiryHistory extends Model
{
    protected $table = 'customer_inquiry_histories';

    protected $fillable = [
        'customer_inquiry_id', 'user_id', 'status_from', 'status_to',
        'action', 'notes',
    ];

    public function inquiry(): BelongsTo
    {
        return $this->belongsTo(CustomerInquiry::class, 'customer_inquiry_id');
    }
}
