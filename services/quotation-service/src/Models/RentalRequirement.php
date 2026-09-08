<?php

namespace IntelliTrack\Services\Quotation\Models;

use Illuminate\Database\Eloquent\Model;

class RentalRequirement extends Model
{
    protected $table = 'rental_requirements';

    protected $fillable = [
        'customer_id', 'project_name', 'project_location', 'project_duration',
        'required_load', 'required_load_unit', 'required_radius', 'required_radius_unit',
        'required_height', 'required_height_unit', 'site_conditions', 'power_supply',
        'foundation_type', 'notes', 'status', 'recommended_crane_model',
        'match_confidence', 'match_details', 'assessed_at', 'assessed_by'
    ];

    protected $casts = [
        'required_load' => 'decimal:2',
        'required_radius' => 'decimal:2',
        'required_height' => 'decimal:2',
        'match_confidence' => 'decimal:2',
        'match_details' => 'array',
        'assessed_at' => 'datetime',
    ];
}
