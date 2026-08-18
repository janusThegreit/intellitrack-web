<?php

namespace App\Http\Controllers\Api;

use App\Models\JobOrder;
use App\Models\Rental;
use App\Models\Customer;
use App\Models\Quotation;
use App\Models\Project;
use Carbon\Carbon;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class ReportController extends Controller
{
    /**
     * Generate job order report
     */
    public function jobOrderReport(Request $request)
    {
        [$from, $to] = $this->dateRange($request, now()->subMonth());
        $status = $request->input('status');

        $query = JobOrder::whereBetween('created_at', [$from, $to]);

        if ($status) {
            $query->where('status', $status);
        }

        $jobOrders = $query->with(['customer', 'assignedTo'])
            ->get();

        $summary = [
            'total_orders' => $jobOrders->count(),
            'total_value' => $jobOrders->sum('total_amount'),
            'completed_orders' => $jobOrders->where('status', 'completed')->count(),
            'average_order_value' => $jobOrders->avg('total_amount') ?? 0,
            'by_priority' => $jobOrders->groupBy('priority')->map->count(),
            'by_status' => $jobOrders->groupBy('status')->map->count(),
        ];

        return response()->json([
            'summary' => $summary,
            'data' => $jobOrders,
        ]);
    }

    /**
     * Generate rental report
     */
    public function rentalReport(Request $request)
    {
        [$from, $to] = $this->dateRange($request, now()->subMonth());

        $rentals = Rental::whereBetween('created_at', [$from, $to])
            ->with(['customer', 'equipment'])
            ->get();

        $summary = [
            'total_rentals' => $rentals->count(),
            'total_revenue' => $rentals->sum('total_amount'),
            'completed_rentals' => $rentals->where('status', 'completed')->count(),
            'active_rentals' => $rentals->where('status', 'active')->count(),
            'overdue_rentals' => $rentals->where('status', 'overdue')->count(),
            'average_rental_value' => $rentals->avg('total_amount') ?? 0,
            'total_deposits' => $rentals->sum('deposit_amount'),
        ];

        return response()->json([
            'summary' => $summary,
            'data' => $rentals,
        ]);
    }

    /**
     * Generate customer report
     */
    public function customerReport(Request $request)
    {
        [$from, $to] = $this->dateRange($request, now()->subMonth());

        $customers = Customer::whereBetween('created_at', [$from, $to])
            ->with(['jobOrders', 'rentals'])
            ->get();

        $summary = [
            'total_customers' => $customers->count(),
            'active_customers' => $customers->where('status', 'active')->count(),
            'total_spending' => $customers->sum('total_spending'),
            'average_spending' => $customers->avg('total_spending') ?? 0,
            'by_type' => $customers->groupBy('customer_type')->map->count(),
            'by_status' => $customers->groupBy('status')->map->count(),
        ];

        return response()->json([
            'summary' => $summary,
            'data' => $customers,
        ]);
    }

    /**
     * Generate revenue report
     */
    public function revenueReport(Request $request)
    {
        [$from, $to] = $this->dateRange($request, now()->subYear());

        $jobOrders = JobOrder::where('status', 'completed')
            ->whereBetween('completion_date', [$from, $to])
            ->get();

        $rentals = Rental::where('status', 'completed')
            ->whereBetween('created_at', [$from, $to])
            ->get();

        $summary = [
            'total_revenue' => $jobOrders->sum('total_amount') + $rentals->sum('total_amount'),
            'job_order_revenue' => $jobOrders->sum('total_amount'),
            'rental_revenue' => $rentals->sum('total_amount'),
            'job_order_count' => $jobOrders->count(),
            'rental_count' => $rentals->count(),
            'by_month' => $this->getRevenueByMonth($from, $to),
        ];

        return response()->json($summary);
    }

    private function dateRange(Request $request, Carbon $defaultFrom): array
    {
        $request->validate([
            'from_date' => ['nullable', 'date'],
            'to_date' => ['nullable', 'date', 'after_or_equal:from_date'],
        ]);

        return [
            Carbon::parse($request->input('from_date') ?? $defaultFrom)->startOfDay(),
            Carbon::parse($request->input('to_date') ?? now())->endOfDay(),
        ];
    }

    /**
     * Get revenue by month
     */
    private function getRevenueByMonth($from, $to)
    {
        $months = [];

        $current = $from->copy();
        while ($current <= $to) {
            $month = $current->format('Y-m');

            $jobOrderRevenue = JobOrder::where('status', 'completed')
                ->whereYear('completion_date', $current->year)
                ->whereMonth('completion_date', $current->month)
                ->sum('total_amount');

            $rentalRevenue = Rental::where('status', 'completed')
                ->whereYear('created_at', $current->year)
                ->whereMonth('created_at', $current->month)
                ->sum('total_amount');

            $months[$month] = $jobOrderRevenue + $rentalRevenue;

            $current->addMonth();
        }

        return $months;
    }
}
