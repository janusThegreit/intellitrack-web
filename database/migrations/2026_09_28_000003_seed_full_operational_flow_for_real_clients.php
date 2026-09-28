<?php

use App\Models\Customer;
use App\Models\Equipment;
use App\Models\JobOrder;
use Database\Seeders\AlibatonOperationalWorkflowSeeder;
use Database\Seeders\AlibatonRealEquipmentSeeder;
use Database\Seeders\PhilippineRealCustomersSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Automatically populate and wire the 50 Philippine enterprise clients,
     * the Alibaton heavy equipment fleet, and end-to-end operational workflows
     * (Pending Authorization, In Field Operations, Completed Orders) on live systems.
     */
    public function up(): void
    {
        // 1. Ensure Equipment catalog is populated
        if (Equipment::count() < 10) {
            $equipmentSeeder = new AlibatonRealEquipmentSeeder();
            $equipmentSeeder->run();
        }

        // 2. Ensure 50 Philippine Real Customers are populated and mapped to sales roles
        if (Customer::count() < 50 || Customer::whereNotNull('pipeline_stage')->count() === 0) {
            $customerSeeder = new PhilippineRealCustomersSeeder();
            $customerSeeder->run();
        }

        // 3. Populate complete end-to-end operational workflow for live system
        $workflowSeeder = new AlibatonOperationalWorkflowSeeder();
        $workflowSeeder->run();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Keep data intact on rollback
    }
};
