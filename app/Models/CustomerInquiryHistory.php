<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CustomerInquiryHistory extends Model
{
    use SoftDeletes;

    protected $table = 'customer_inquiry_history';

    protected $fillable = [
        'customer_inquiry_id',
        'user_id',
        'action',
        'notes',
        'old_status',
        'new_status',
    ];

    public function inquiry(): BelongsTo
    {
        return $this->belongsTo(CustomerInquiry::class, 'customer_inquiry_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
