<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PasswordResetRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'email',
        'reason',
        'status',
        'token',
        'requested_at',
        'token_expires_at',
        'approved_by',
        'is_used',
        'used_at',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'requested_at' => 'datetime',
        'token_expires_at' => 'datetime',
        'used_at' => 'datetime',
        'is_used' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved' && !empty($this->token);
    }

    public function isExpired(): bool
    {
        return $this->token_expires_at !== null && $this->token_expires_at->isPast();
    }

    public function isValidOneTime(): bool
    {
        return !$this->is_used &&
               $this->status === 'approved' &&
               !empty($this->token) &&
               !$this->isExpired();
    }
}
