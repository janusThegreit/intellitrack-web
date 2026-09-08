<?php

namespace IntelliTrack\Services\Analytics\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use IntelliTrack\Shared\Http\ApiResponse;

class ReportController extends Controller
{
    /**
     * Job order reports with status and cost breakdowns.
     */
    public function jobOrderReport(Request $request)
    {
        $report = [
            'summary' => [
                'total_job_orders' => 45,
                'completed' => 38,
                'in_progress' => 5,
                'pending' => 2,
                'total_revenue' => 3890000.00,
                'total_cost' => 1950000.00,
                'gross_margin_percentage' => 49.87,
            ],
            'period' => $request->input('period', 'monthly'),
            'data' => [
                ['period' => '2026-01', 'total' => 8, 'completed' => 8, 'revenue' => 650000],
                ['period' => '2026-02', 'total' => 11, 'completed' => 10, 'revenue' => 920000],
                ['period' => '2026-03', 'total' => 14, 'completed' => 12, 'revenue' => 1240000],
                ['period' => '2026-04', 'total' => 12, 'completed' => 8, 'revenue' => 1080000],
            ],
        ];

        return ApiResponse::success($report);
    }

    /**
     * Equipment rental utilization report.
     */
    public function rentalReport(Request $request)
    {
        $report = [
            'summary' => [
                'total_fleet' => 32,
                'active_rentals' => 22,
                'utilization_rate' => 68.75,
                'average_rental_days' => 45,
                'overdue_count' => 1,
            ],
            'fleet_breakdown' => [
                ['category' => 'Tower Cranes - Top Slewing', 'total' => 12, 'rented' => 10, 'utilization' => 83.3],
                ['category' => 'Tower Cranes - Flat Top', 'total' => 10, 'rented' => 7, 'utilization' => 70.0],
                ['category' => 'Mobile Cranes', 'total' => 6, 'rented' => 3, 'utilization' => 50.0],
                ['category' => 'Hoists & Lifts', 'total' => 4, 'rented' => 2, 'utilization' => 50.0],
            ],
        ];

        return ApiResponse::success($report);
    }

    /**
     * Customer spending and ranking report.
     */
    public function customerReport(Request $request)
    {
        $report = [
            'summary' => [
                'total_customers' => 58,
                'active_clients' => 24,
                'average_customer_lifetime_value' => 342000.00,
            ],
            'top_clients' => [
                ['id' => 1, 'name' => 'Megawide Construction Corp', 'orders' => 12, 'total_spent' => 2850000.00],
                ['id' => 2, 'name' => 'DMCI Holdings Inc', 'orders' => 9, 'total_spent' => 1920000.00],
                ['id' => 3, 'name' => 'EEI Corporation', 'orders' => 7, 'total_spent' => 1450000.00],
                ['id' => 4, 'name' => 'Monocrete Construction', 'orders' => 5, 'total_spent' => 980000.00],
            ],
        ];

        return ApiResponse::success($report);
    }

    /**
     * Revenue and financial metrics report.
     */
    public function revenueReport(Request $request)
    {
        $report = [
            'summary' => [
                'total_revenue_ytd' => 6250000.00,
                'target_revenue' => 10000000.00,
                'target_achievement_percentage' => 62.5,
                'monthly_recurring_revenue' => 850000.00,
            ],
            'revenue_by_stream' => [
                ['stream' => 'Long-Term Tower Crane Rentals', 'amount' => 4200000.00, 'percentage' => 67.2],
                ['stream' => 'Short-Term Equipment Hire', 'amount' => 1250000.00, 'percentage' => 20.0],
                ['stream' => 'Maintenance & Mobilization Services', 'amount' => 800000.00, 'percentage' => 12.8],
            ],
        ];

        return ApiResponse::success($report);
    }
}
