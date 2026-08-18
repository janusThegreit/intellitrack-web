<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Equipment;
use App\Models\JobOrder;
use App\Models\Rental;
use Illuminate\Support\Str;

class GeneratorService
{
    /**
     * Generate unique job order number
     */
    public static function generateJobOrderNumber(): string
    {
        $prefix = 'JO-' . date('Ymd') . '-';
        $suffix = Str::random(6);
        return $prefix . $suffix;
    }

    /**
     * Generate unique rental number
     */
    public static function generateRentalNumber(): string
    {
        $prefix = 'RNT-' . date('Ymd') . '-';
        $suffix = Str::random(6);
        return $prefix . $suffix;
    }

    /**
     * Generate unique quotation number
     */
    public static function generateQuotationNumber(): string
    {
        $prefix = 'QT-' . date('Ymd') . '-';
        $suffix = Str::random(6);
        return $prefix . $suffix;
    }

    /**
     * Generate unique project code
     */
    public static function generateProjectCode(): string
    {
        $prefix = 'PRJ-' . date('Ymd') . '-';
        $suffix = Str::random(6);
        return $prefix . $suffix;
    }

    /**
     * Generate unique equipment code
     */
    public static function generateEquipmentCode(): string
    {
        $prefix = 'EQ-' . strtoupper(Str::random(2));
        $number = Equipment::count() + 1;
        return $prefix . str_pad($number, 5, '0', STR_PAD_LEFT);
    }
}
