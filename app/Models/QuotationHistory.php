<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuotationHistory extends Model
{
    protected $table = 'quotation_history';

    protected $fillable = ['quotation_id', 'user_id', 'action', 'old_status', 'new_status', 'notes'];
    public function quotation(): BelongsTo { return $this->belongsTo(Quotation::class); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}