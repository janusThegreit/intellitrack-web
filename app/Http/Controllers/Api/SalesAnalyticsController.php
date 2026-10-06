<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerInquiry;
use App\Models\Equipment;
use App\Models\JobOrder;
use App\Models\Project;
use App\Models\Quotation;
use App\Models\Rental;
use App\Services\RevenueTrendModel;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class SalesAnalyticsController extends Controller
{
    public function summary(RevenueTrendModel $revenueTrendModel)
    {
        Gate::authorize('view-reports');

        $inquiryTotal = CustomerInquiry::count();
        $activeInquiries = CustomerInquiry::whereNotIn('status', ['closed', 'archived'])->count();
        $agingInquiries = CustomerInquiry::where('status', 'new')
            ->where('created_at', '<', now()->subDays(3))
            ->count();

        $quotationTotal = Quotation::count();
        $acceptedQuotations = Quotation::where('status', 'accepted')->count();
        $rejectedQuotations = Quotation::where('status', 'rejected')->count();
        $underReviewQuotations = Quotation::where('status', 'under_review')->count();
        $equipmentTotal = Equipment::count();
        $availableEquipment = Equipment::where('status', 'available')->count();
        $rentedEquipment = Equipment::where('status', 'rented')->count();
        $maintenanceEquipment = Equipment::where('status', 'maintenance')->count();
        $overdueRentals = Rental::with(['equipment:id,name,category'])
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->whereDate('rental_end_date', '<', today());
        $overdueRentalCount = (clone $overdueRentals)->count();
        $overdueRentalItems = (clone $overdueRentals)
            ->limit(10)
            ->get()
            ->map(function (Rental $rental): array {
                return [
                    'id' => $rental->id,
                    'rental_number' => $rental->rental_number,
                    'equipment_name' => $rental->equipment?->name,
                    'days_overdue' => max(1, (int) now()->diffInDays($rental->rental_end_date)),
                    'rental_end_date' => $rental->rental_end_date?->format('Y-m-d'),
                ];
            });

        $revenueHistory = $this->monthlyRevenue();
        $forecast = $revenueTrendModel->forecast();

        return response()->json([
            'customer_activity' => [
                'inquiries_total' => $inquiryTotal,
                'active_inquiries' => $activeInquiries,
                'aging_inquiries' => $agingInquiries,
                'inquiries_by_status' => CustomerInquiry::selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status'),
            ],
            'quotation_performance' => [
                'total' => $quotationTotal,
                'accepted' => $acceptedQuotations,
                'rejected' => $rejectedQuotations,
                'under_review' => $underReviewQuotations,
                'conversion_rate' => $quotationTotal > 0 ? round(($acceptedQuotations / $quotationTotal) * 100, 1) : null,
            ],
            'rental_trends' => [
                'active' => Rental::where('status', 'active')->count(),
                'pending' => Rental::where('status', 'pending')->count(),
                'overdue' => $overdueRentalCount,
                'overdue_items' => $overdueRentalItems,
            ],
            'equipment_utilization' => [
                'total' => $equipmentTotal,
                'available' => $availableEquipment,
                'rented' => $rentedEquipment,
                'maintenance' => $maintenanceEquipment,
                'utilization_rate' => $equipmentTotal > 0 ? round(($rentedEquipment / $equipmentTotal) * 100, 1) : null,
                'categories' => Equipment::selectRaw("COALESCE(category, 'Uncategorized') as category_name, count(*) as total, SUM(CASE WHEN status = 'rented' THEN 1 ELSE 0 END) as rented_count")
                    ->groupByRaw("COALESCE(category, 'Uncategorized')")
                    ->get()
                    ->map(fn ($item): array => [
                        'category' => $item->category_name,
                        'total' => (int) $item->total,
                        'rented' => (int) $item->rented_count,
                        'rate' => $item->total > 0 ? round(($item->rented_count / $item->total) * 100, 1) : null,
                    ]),
            ],
            'job_orders' => [
                'counts' => JobOrder::selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status'),
                'active' => JobOrder::whereIn('status', ['approved', 'in-progress'])->count(),
                'completed' => JobOrder::where('status', 'completed')->count(),
            ],
            'projects' => Project::selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status'),
            'revenue_history' => $revenueHistory,
            'forecast' => $forecast,
            'ai_assistant_available' => filled(config('services.gemini.api_key')),
            'recommendations' => $this->generateRecommendations(
                $overdueRentalCount,
                $quotationTotal > 0 ? ($acceptedQuotations / $quotationTotal) * 100 : null,
                $equipmentTotal > 0 ? ($rentedEquipment / $equipmentTotal) * 100 : null,
                $agingInquiries,
                $underReviewQuotations,
                $equipmentTotal,
                $quotationTotal
            ),
        ]);
    }

    public function trainModel(RevenueTrendModel $revenueTrendModel)
    {
        Gate::authorize('manage-users');

        $result = $revenueTrendModel->train();

        return response()->json($result, $result['trained'] ? 200 : 422);
    }

    public function copilot(Request $request, RevenueTrendModel $revenueTrendModel)
    {
        Gate::authorize('view-reports');

        $validated = $request->validate([
            'prompt' => ['required', 'string', 'max:1000'],
        ]);

        $apiKey = trim((string) config('services.gemini.api_key'));
        if ($apiKey === '') {
            return response()->json([
                'message' => 'The AI assistant is unavailable because its server-side provider is not configured.',
            ], 503);
        }

        $quotationCount = Quotation::count();
        $acceptedCount = Quotation::where('status', 'accepted')->count();
        $forecast = $revenueTrendModel->forecast();
        $context = [
            'inquiries_total' => CustomerInquiry::count(),
            'quotations_total' => $quotationCount,
            'accepted_quotations' => $acceptedCount,
            'under_review_quotations' => Quotation::where('status', 'under_review')->count(),
            'active_job_orders' => JobOrder::whereIn('status', ['approved', 'in-progress'])->count(),
            'completed_job_orders' => JobOrder::where('status', 'completed')->count(),
            'equipment_total' => Equipment::count(),
            'equipment_rented' => Equipment::where('status', 'rented')->count(),
            'overdue_rentals' => Rental::whereNotIn('status', ['completed', 'cancelled'])
                ->whereDate('rental_end_date', '<', today())
                ->count(),
            'revenue_trend_model_forecast' => $forecast['available'] ? [
                'month' => $forecast['month'],
                'completed_job_order_value' => $forecast['predicted_revenue'],
                'training_period' => [
                    'start' => $forecast['period_start'],
                    'end' => $forecast['period_end'],
                    'months_with_data' => $forecast['months_with_data'],
                    'months_in_dataset' => $forecast['months_in_dataset'],
                ],
            ] : null,
        ];

        try {
            $response = Http::timeout(15)
                ->withHeaders(['x-goog-api-key' => $apiKey])
                ->post(
                    'https://generativelanguage.googleapis.com/v1beta/models/' . config('services.gemini.model', 'gemini-2.5-flash') . ':generateContent',
                    [
                        'contents' => [[
                            'role' => 'user',
                            'parts' => [[
                                'text' => "Answer clearly and state when the provided data is insufficient. Do not infer facts beyond these aggregate business metrics.\n"
                                    . 'Current aggregate data: ' . json_encode($context, JSON_THROW_ON_ERROR) . "\n"
                                    . 'Question: ' . trim($validated['prompt']),
                            ]],
                        ]],
                    ]
                );
        } catch (\Illuminate\Http\Client\ConnectionException $exception) {
            Log::warning('Analytics AI provider connection failed.', ['exception' => $exception::class]);

            return response()->json(['message' => 'The AI provider is temporarily unavailable.'], 503);
        }

        if (! $response->successful()) {
            Log::warning('Analytics AI provider rejected the request.', ['status' => $response->status()]);

            return response()->json(['message' => 'The AI provider could not complete the request.'], 502);
        }

        $answer = $response->json('candidates.0.content.parts.0.text');
        if (! is_string($answer) || trim($answer) === '') {
            return response()->json(['message' => 'The AI provider returned no answer.'], 502);
        }

        return response()->json([
            'response' => trim($answer),
            'source' => 'Google Gemini (' . config('services.gemini.model', 'gemini-2.5-flash') . ')',
        ]);
    }

    private function monthlyRevenue(): array
    {
        $start = now()->startOfMonth()->subMonths(5);
        $end = now()->endOfMonth();
        $driver = DB::connection()->getDriverName();
        $periodExpression = match ($driver) {
            'pgsql' => "TO_CHAR(completion_date, 'YYYY-MM')",
            'sqlite' => "strftime('%Y-%m', completion_date)",
            'mysql' => "DATE_FORMAT(completion_date, '%Y-%m')",
            'sqlsrv' => "FORMAT(completion_date, 'yyyy-MM')",
            default => throw new RuntimeException("Analytics does not support the [{$driver}] database driver."),
        };

        $monthlyValues = JobOrder::query()
            ->where('status', 'completed')
            ->whereNotNull('completion_date')
            ->whereBetween('completion_date', [$start, $end])
            ->selectRaw("{$periodExpression} as period, SUM(total_amount) as amount")
            ->groupByRaw($periodExpression)
            ->get()
            ->keyBy('period');

        return collect(range(0, 5))->map(function (int $offset) use ($start, $monthlyValues): array {
            $month = $start->copy()->addMonths($offset);
            $amount = round((float) ($monthlyValues[$month->format('Y-m')]->amount ?? 0), 2);

            return [
                'month' => $month->format('Y-m'),
                'label' => $month->format('M Y'),
                'amount' => $amount,
            ];
        })->all();
    }

    private function generateRecommendations(
        int $overdueCount,
        ?float $conversionRate,
        ?float $utilizationRate,
        int $agingInquiries,
        int $underReviewQuotes,
        int $equipmentTotal,
        int $quotationTotal
    ): array {
        $recommendations = [];

        if ($overdueCount > 0) {
            $recommendations[] = [
                'id' => 'overdue_mitigation',
                'priority' => 'high',
                'title' => 'Overdue Equipment Returns',
                'description' => "{$overdueCount} active rental records have passed their scheduled end date.",
                'action_label' => 'View Overdue Rentals',
                'action_href' => '/rentals',
                'badge' => 'Record-based alert',
            ];
        }

        if ($underReviewQuotes > 0) {
            $recommendations[] = [
                'id' => 'pending_quotations',
                'priority' => 'high',
                'title' => 'Quotations Awaiting Review',
                'description' => "{$underReviewQuotes} quotations currently have under-review status.",
                'action_label' => 'Review Quotations',
                'action_href' => '/quotations',
                'badge' => 'Record-based alert',
            ];
        }

        if ($conversionRate !== null && $conversionRate < 45 && $quotationTotal > 0) {
            $recommendations[] = [
                'id' => 'conversion_optimization',
                'priority' => 'medium',
                'title' => 'Quotation Acceptance Rate',
                'description' => 'The current accepted-quotation share is below the configured 45% review threshold.',
                'action_label' => 'Analyze Quotations',
                'action_href' => '/quotations',
                'badge' => 'Rule-based indicator',
            ];
        }

        if ($agingInquiries > 0) {
            $recommendations[] = [
                'id' => 'inquiry_aging',
                'priority' => 'medium',
                'title' => 'Aging New Inquiries',
                'description' => "{$agingInquiries} inquiries remain in new status for more than three days.",
                'action_label' => 'Inspect Inquiries',
                'action_href' => '/inquiries',
                'badge' => 'Record-based alert',
            ];
        }

        if ($equipmentTotal > 0 && $utilizationRate !== null && $utilizationRate < 50) {
            $recommendations[] = [
                'id' => 'fleet_utilization',
                'priority' => 'opportunity',
                'title' => 'Equipment Availability',
                'description' => "The current rented-equipment share is {$utilizationRate}%, below the configured 50% review threshold.",
                'action_label' => 'Check Availability',
                'action_href' => '/equipment/availability',
                'badge' => 'Rule-based indicator',
            ];
        }

        return $recommendations;
    }
}
