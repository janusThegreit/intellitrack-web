<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attachment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'attachable_type', 'attachable_id', 'file_name', 'file_path',
        'file_type', 'file_size', 'uploaded_by', 'description'
    ];

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
