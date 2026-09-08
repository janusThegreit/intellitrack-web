<?php

namespace IntelliTrack\Services\Analytics\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use IntelliTrack\Shared\Http\ApiResponse;
use IntelliTrack\Shared\Http\ServiceClient;

class SalesAnalyticsController extends Controller
{
    /**
     * Get aggregated sales analytics summary.
     */
    public function summary()
    {
        // Analytics service aggregates data from analytical store or downstream services
        $summary = [
            'total_pipeline_value' => 2450000.00,
            'weighted_pipeline_value' => 1850000.00,
            'conversion_rate' => 68.5,
            'average_deal_size' => 145000.00,
            'active_deals_count' => 18,
            'won_deals_count' => 32,
            'lost_deals_count' => 6,
            'top_categories' => [
                ['category' => 'Top-Slewing Tower Cranes', 'revenue' => 1250000, 'count' => 14],
                ['category' => 'Flat-Top Tower Cranes', 'revenue' => 780000, 'count' => 9],
                ['category' => 'Luffing-Jib Tower Cranes', 'revenue' => 420000, 'count' => 5],
            ],
            'monthly_trend' => [
                ['month' => 'Jan', 'revenue' => 320000, 'quotations' => 12],
                ['month' => 'Feb', 'revenue' => 410000, 'quotations' => 15],
                ['month' => 'Mar', 'revenue' => 560000, 'quotations' => 22],
                ['month' => 'Apr', 'revenue' => 490000, 'quotations' => 19],
                ['month' => 'May', 'revenue' => 670000, 'quotations' => 26],
            ],
        ];

        return ApiResponse::success($summary);
    }
}
