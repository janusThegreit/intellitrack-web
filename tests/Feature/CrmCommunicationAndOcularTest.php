<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\CustomerCommunication;
use App\Models\CustomerFollowUp;
use App\Models\Equipment;
use App\Models\Project;
use App\Models\Quotation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CrmCommunicationAndOcularTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_log_communication_with_site_inspection_and_entity_linking(): void
    {
        $salesManager = User::factory()->create(['role' => 'sales_manager']);

        $customer = Customer::create([
            'name' => 'Megaworld Prime Builders Corp.',
            'company_name' => 'Megaworld Prime Builders Corp.',
            'contact_person' => 'Engr. Alvarez',
            'email' => 'alvarez@megaworld.com',
            'customer_type' => 'corporate',
            'status' => 'active',
        ]);

        $quotation = Quotation::create([
            'quotation_number' => 'QT-20260925-001',
            'customer_id' => $customer->id,
            'created_by' => $salesManager->id,
            'quotation_date' => now(),
            'valid_until' => now()->addDays(30),
            'status' => 'approved',
            'subtotal' => 500000,
            'tax_rate' => 12,
            'tax_amount' => 60000,
            'total_amount' => 560000,
        ]);

        $project = Project::create([
            'project_code' => 'PRJ-2026-MEGA01',
            'project_name' => 'Megaworld Uptown Tower 3 Rigging',
            'customer_id' => $customer->id,
            'project_manager_id' => $salesManager->id,
            'start_date' => now(),
            'status' => 'active',
        ]);

        $response = $this->actingAs($salesManager)->postJson('/api/crm/communications', [
            'customer_id' => $customer->id,
            'quotation_id' => $quotation->id,
            'project_id' => $project->id,
            'type' => 'site_visit',
            'direction' => 'outbound',
            'subject' => 'Ocular inspection for 60m tower crane mast foundation',
            'content' => 'Inspected entrance gate, turn radius, and high-voltage power line clearances.',
            'outcome' => 'Client approved mobilization window; schedule delivery next week.',
            'site_location' => 'Lot 4, Block 7, Grand Central Park, BGC, Taguig City',
            'trailer_truck_accessible' => 'restricted',
            'trailer_access_notes' => 'Gate width 4.8m; tight right turn from 32nd St; 10 PM - 5 AM window.',
            'crane_setup_clearance' => 'adequate',
            'crane_clearance_notes' => 'Full 360-degree free jib swing with 18m buffer from power cables.',
        ]);

        $response->assertCreated();
        $commId = $response->json('id');

        $this->assertDatabaseHas('customer_communications', [
            'id' => $commId,
            'customer_id' => $customer->id,
            'quotation_id' => $quotation->id,
            'project_id' => $project->id,
            'type' => 'site_visit',
            'trailer_truck_accessible' => 'restricted',
            'crane_setup_clearance' => 'adequate',
            'site_location' => 'Lot 4, Block 7, Grand Central Park, BGC, Taguig City',
        ]);

        // Test listing with eager-loaded relations and search
        $listRes = $this->actingAs($salesManager)->getJson('/api/crm/communications?search=QT-20260925-001');
        $listRes->assertOk();
        $this->assertEquals(1, count($listRes->json('data')));
        $this->assertEquals('QT-20260925-001', $listRes->json('data.0.quotation.quotation_number'));
        $this->assertEquals('PRJ-2026-MEGA01', $listRes->json('data.0.project.project_code'));

        // Test filter by quotation_id
        $filterRes = $this->actingAs($salesManager)->getJson("/api/crm/communications?quotation_id={$quotation->id}");
        $filterRes->assertOk();
        $this->assertEquals(1, count($filterRes->json('data')));

        // Test quick follow-up task spawning
        $followUpRes = $this->actingAs($salesManager)->postJson('/api/crm/follow-ups', [
            'customer_id' => $customer->id,
            'title' => 'Follow-up: Ocular inspection for 60m tower crane mast foundation',
            'notes' => 'Follow up on road right-of-way permit for low-bed trailer delivery.',
            'scheduled_date' => now()->addDay()->toDateString(),
            'due_time' => '10:00 AM',
            'priority' => 'high',
        ]);

        $followUpRes->assertCreated();
        $this->assertDatabaseHas('customer_follow_ups', [
            'customer_id' => $customer->id,
            'priority' => 'high',
            'status' => 'pending',
        ]);
    }

    public function test_follow_up_equipment_and_project_badges_and_critical_permit_flags(): void
    {
        $salesManager = User::factory()->create(['role' => 'sales_manager']);

        $customer = Customer::create([
            'name' => 'DMCI Holdings Rigging Div',
            'company_name' => 'DMCI Holdings Rigging Div',
            'contact_person' => 'Engr. Tan',
            'email' => 'tan@dmci.ph',
            'customer_type' => 'corporate',
            'status' => 'active',
        ]);

        $equipment = Equipment::create([
            'code' => 'CRN-TC6015-01',
            'name' => 'Zoomlion TC6015-10E',
            'category' => 'tower_crane',
            'crane_category' => 'topless',
            'crane_model' => 'TC6015',
            'rental_rate' => 180000,
            'rental_unit' => 'month',
            'status' => 'available',
        ]);

        $project = Project::create([
            'project_code' => 'PRJ-2026-DMCI01',
            'project_name' => 'DMCI Acacia Residences Crane Erection',
            'customer_id' => $customer->id,
            'project_manager_id' => $salesManager->id,
            'start_date' => now(),
            'status' => 'active',
        ]);

        $response = $this->actingAs($salesManager)->postJson('/api/crm/follow-ups', [
            'customer_id' => $customer->id,
            'equipment_id' => $equipment->id,
            'project_id' => $project->id,
            'title' => 'Urgent Highway Night Hauling & MMDA Truck Ban Clearance',
            'notes' => 'Secure MMDA special permit for low-bed multi-axle trailer transport through C5.',
            'scheduled_date' => now()->addDay()->toDateString(),
            'due_time' => '02:00 PM',
            'priority' => 'urgent',
            'category' => 'safety_permit',
            'is_permit_critical' => true,
        ]);

        $response->assertCreated();
        $followUpId = $response->json('id');

        $this->assertDatabaseHas('customer_follow_ups', [
            'id' => $followUpId,
            'customer_id' => $customer->id,
            'equipment_id' => $equipment->id,
            'project_id' => $project->id,
            'category' => 'safety_permit',
            'is_permit_critical' => true,
            'priority' => 'urgent',
        ]);

        // Verify eager-loaded relations in indexFollowUps
        $listRes = $this->actingAs($salesManager)->getJson('/api/crm/follow-ups?search=CRN-TC6015-01');
        $listRes->assertOk();
        $this->assertEquals(1, count($listRes->json('data')));
        $this->assertEquals('Zoomlion TC6015-10E', $listRes->json('data.0.equipment.name'));
        $this->assertEquals('PRJ-2026-DMCI01', $listRes->json('data.0.project.project_code'));
        $this->assertTrue($listRes->json('data.0.is_permit_critical'));
    }
}
