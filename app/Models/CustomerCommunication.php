<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CustomerCommunication extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'customer_communications';

    protected $fillable = [
        'customer_id',
        'customer_inquiry_id',
        'type',
        'direction',
        'subject',
        'content',
        'outcome',
        'communicated_at',
        'created_by',
    ];

    protected $casts = [
        'communicated_at' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function inquiry(): BelongsTo
    {
        return $this->belongsTo(CustomerInquiry::class, 'customer_inquiry_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
