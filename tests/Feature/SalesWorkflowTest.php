<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\CustomerInquiry;
use App\Models\JobOrder;
use App\Models\Quotation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SalesWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_sales_manager_end_to_end_connected_workflow(): void
    {
        $salesManager = User::factory()->create(['role' => 'sales_manager']);
        $salesBd = User::factory()->create(['role' => 'sales_business_development']);
        $staffUser = User::factory()->create(['role' => 'staff', 'is_active' => true]);

        // 1. Client and Inquiry Creation
        $customer = Customer::create([
            'name' => 'Metro Manila Rail Consortium',
            'company_name' => 'Metro Manila Rail Consortium',
            'contact_person' => 'Engr. Bautista',
            'email' => 'bautista@mmrc.ph',
            'customer_type' => 'corporate',
            'status' => 'active',
        ]);

        $inquiry = CustomerInquiry::create([
            'inquiry_number' => 'INQ-TEST-001',
            'customer_id' => $customer->id,
            'created_by' => $salesBd->id,
            'source' => 'email',
            'subject' => 'Crane and Excavator Rental for Line 7',
            'details' => 'Heavy crane rental for Quezon City Line 7 depot',
            'status' => 'new',
            'priority' => 'high',
        ]);

        // 2. Convert Customer Inquiry to Sales Quotation
        $convertRes = $this->actingAs($salesBd)
            ->postJson("/api/customer-inquiries/{$inquiry->id}/convert-to-quotation");
        
        $convertRes->assertCreated();
        $quotationId = $convertRes->json('id');
        $this->assertEquals('quoted', $inquiry->fresh()->status);

        // 3. Sales Manager Approves and Client Accepts Quotation
        $quotation = Quotation::find($quotationId);
        $quotation->update(['status' => 'under_review']);

        $approveRes = $this->actingAs($salesManager)
            ->postJson("/api/quotations/{$quotation->id}/approve", [
                'comments' => 'Terms and discount approved by Sales Manager',
            ]);
        $approveRes->assertOk();

        // Simulate Client Acceptance
        $quotation->update(['status' => 'accepted']);

        // 4. 1-Click Convert Accepted Quotation to Job Order
        $convertJoRes = $this->actingAs($salesManager)
            ->postJson("/api/quotations/{$quotation->id}/convert-to-job-order");
        
        $convertJoRes->assertCreated();
        $jobOrderId = $convertJoRes->json('id');
        $this->assertNotNull($quotation->fresh()->job_order_id);

        // 5. Staff Assignment to Job Order
        $assignRes = $this->actingAs($salesManager)
            ->postJson("/api/job-orders/{$jobOrderId}/assign", [
                'assigned_to' => $staffUser->id,
            ]);
        $assignRes->assertOk();
        $this->assertEquals($staffUser->id, JobOrder::find($jobOrderId)->assigned_to);

        // 6. Scheduling and Mobilization of Job Order
        $scheduleRes = $this->actingAs($salesManager)
            ->postJson("/api/job-orders/{$jobOrderId}/schedule", [
                'scheduled_date' => now()->addDays(2)->toDateString(),
                'start_date' => now()->addDays(3)->toDateString(),
                'due_date' => now()->addDays(14)->toDateString(),
                'location' => 'Quezon City Depot',
                'notes' => 'Mobilize 2 heavy cranes with certified rigging crew',
            ]);
        $scheduleRes->assertOk();
        $this->assertEquals('in-progress', JobOrder::find($jobOrderId)->status);

        // 7. Sales Manager can fetch assignable staff
        $staffRes = $this->actingAs($salesManager)->getJson('/api/assignable-staff');
        $staffRes->assertOk();
        $this->assertGreaterThanOrEqual(1, count($staffRes->json()));
    }
}
