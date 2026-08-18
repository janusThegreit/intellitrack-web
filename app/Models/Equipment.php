<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Equipment extends Model
{
    use SoftDeletes;

    protected $table = 'equipment';

    protected $fillable = [
        'code', 'name', 'description', 'category', 'rental_rate',
        'rental_unit', 'status', 'serial_number', 'acquisition_date',
        'purchase_price', 'current_value', 'quantity_available',
        'location', 'image_url', 'last_maintenance', 'specifications'
        , 'crane_model', 'crane_category', 'maximum_load', 'maximum_load_unit',
        'maximum_radius', 'maximum_radius_unit', 'final_height', 'final_height_unit', 'rental_services'
    ];

    protected $casts = [
        'acquisition_date' => 'date',
        'last_maintenance' => 'datetime',
        'rental_rate' => 'decimal:2',
        'purchase_price' => 'decimal:2',
        'current_value' => 'decimal:2',
        'maximum_load' => 'decimal:2',
        'maximum_radius' => 'decimal:2',
        'final_height' => 'decimal:2',
        'rental_services' => 'array',
    ];

    public function jobOrderItems(): HasMany
    {
        return $this->hasMany(JobOrderItem::class);
    }

    public function rentals(): HasMany
    {
        return $this->hasMany(Rental::class);
    }

    public function maintenanceRecords(): HasMany
    {
        return $this->hasMany(EquipmentMaintenance::class);
    }
}
