<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerInquiry;
use App\Models\Equipment;
use App\Models\JobOrder;
use App\Models\Project;
use App\Models\Quotation;
use App\Models\Rental;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;

class SalesAnalyticsController extends Controller
{
    public function summary()
    {
        Gate::authorize('view-reports');

        $inquiryTotal = CustomerInquiry::count();
        $quotationTotal = Quotation::count();
        $acceptedQuotations = Quotation::where('status', 'accepted')->count();
        $monthlyRevenue = $this->monthlyRevenue();

        return response()->json([
            'customer_activity' => [
                'inquiries_total' => $inquiryTotal,
                'active_inquiries' => CustomerInquiry::whereNotIn('status', ['closed', 'archived'])->count(),
                'inquiries_by_status' => CustomerInquiry::selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status'),
            ],
            'quotation_performance' => [
                'total' => $quotationTotal,
                'accepted' => $acceptedQuotations,
                'rejected' => Quotation::where('status', 'rejected')->count(),
                'conversion_rate' => $quotationTotal ? round(($acceptedQuotations / $quotationTotal) * 100, 2) : 0,
            ],
            'rental_trends' => [
                'active' => Rental::where('status', 'active')->count(),
                'pending' => Rental::where('status', 'pending')->count(),
                'overdue' => Rental::whereNotIn('status', ['completed', 'cancelled'])->whereDate('rental_end_date', '<', today())->count(),
            ],
            'equipment_utilization' => [
                'total' => Equipment::count(),
                'available' => Equipment::where('status', 'available')->count(),
                'rented' => Equipment::where('status', 'rented')->count(),
                'maintenance' => Equipment::where('status', 'maintenance')->count(),
            ],
            'job_orders' => JobOrder::selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status'),
            'projects' => Project::selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status'),
            'revenue_history' => $monthlyRevenue,
            'forecast' => $this->forecast($monthlyRevenue),
        ]);
    }

    private function monthlyRevenue(): array
    {
        return collect(range(5, 0))->map(function (int $offset) {
            $month = now()->subMonths($offset);
            $jobOrders = JobOrder::where('status', 'completed')->whereYear('completion_date', $month->year)->whereMonth('completion_date', $month->month)->sum('total_amount');
            $rentals = Rental::where('status', 'completed')->whereYear('created_at', $month->year)->whereMonth('created_at', $month->month)->sum('total_amount');

            return ['month' => $month->format('Y-m'), 'amount' => (float) $jobOrders + (float) $rentals];
        })->all();
    }

    private function forecast(array $history): array
    {
        $observations = collect($history)->pluck('amount')->filter(fn (float $amount) => $amount > 0)->values();

        if ($observations->count() < 3) {
            return ['available' => false, 'reason' => 'At least three months with completed revenue are required for forecasting.'];
        }

        $growth = ($observations->last() - $observations->first()) / max($observations->first(), 1);
        $nextMonth = Carbon::now()->addMonth()->format('Y-m');

        return [
            'available' => true,
            'month' => $nextMonth,
            'predicted_revenue' => round($observations->last() * (1 + ($growth / max($observations->count() - 1, 1))), 2),
            'method' => 'Historical completed-revenue trend',
        ];
    }
}