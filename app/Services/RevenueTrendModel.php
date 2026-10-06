<?php

namespace App\Services;

use App\Models\JobOrder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class RevenueTrendModel
{
    private const MODEL_PATH = 'analytics/revenue-trend-model.json';

    public function train(): array
    {
        $trainingData = $this->trainingData();
        $periodsWithRevenue = collect($trainingData)->where('amount', '>', 0)->count();

        if ($periodsWithRevenue < 3) {
            return [
                'trained' => false,
                'reason' => 'At least three months with completed Job Order values are required.',
                'months_with_data' => $periodsWithRevenue,
                'required_months' => 3,
            ];
        }

        $count = count($trainingData);
        $sumX = 0.0;
        $sumY = 0.0;
        $sumXY = 0.0;
        $sumX2 = 0.0;

        foreach ($trainingData as $index => $observation) {
            $x = (float) $index;
            $y = (float) $observation['amount'];
            $sumX += $x;
            $sumY += $y;
            $sumXY += $x * $y;
            $sumX2 += $x * $x;
        }

        $denominator = ($count * $sumX2) - ($sumX * $sumX);
        if ($denominator == 0.0) {
            throw new RuntimeException('Revenue trend model could not be fitted to the available monthly data.');
        }

        $slope = (($count * $sumXY) - ($sumX * $sumY)) / $denominator;
        $intercept = ($sumY - ($slope * $sumX)) / $count;
        $model = [
            'algorithm' => 'ordinary_least_squares_linear_regression',
            'source' => 'Completed Job Order total_amount grouped by completion_date month',
            'trained_at' => now()->toIso8601String(),
            'period_start' => $trainingData[0]['month'],
            'period_end' => $trainingData[$count - 1]['month'],
            'months_in_dataset' => $count,
            'months_with_data' => $periodsWithRevenue,
            'intercept' => $intercept,
            'slope' => $slope,
            'observations' => $trainingData,
        ];

        $saved = Storage::disk('local')->put(
            self::MODEL_PATH,
            json_encode($model, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR)
        );

        if (! $saved) {
            throw new RuntimeException('The trained revenue model could not be saved.');
        }

        return [
            'trained' => true,
            'algorithm' => $model['algorithm'],
            'source' => $model['source'],
            'trained_at' => $model['trained_at'],
            'period_start' => $model['period_start'],
            'period_end' => $model['period_end'],
            'months_in_dataset' => $count,
            'months_with_data' => $periodsWithRevenue,
            'next_month' => Carbon::parse($model['period_end'])->addMonth()->format('M Y'),
            'projected_value' => round(max(0, $intercept + ($slope * $count)), 2),
        ];
    }

    public function status(): ?array
    {
        $storage = Storage::disk('local');
        if (! $storage->exists(self::MODEL_PATH)) {
            return null;
        }

        $model = json_decode($storage->get(self::MODEL_PATH), true, 512, JSON_THROW_ON_ERROR);
        foreach (['algorithm', 'source', 'trained_at', 'period_start', 'period_end', 'months_in_dataset', 'intercept', 'slope'] as $key) {
            if (! array_key_exists($key, $model)) {
                throw new RuntimeException('The saved revenue trend model is invalid.');
            }
        }

        return $model;
    }

    public function forecast(): array
    {
        $model = $this->status();
        if ($model === null) {
            return [
                'available' => false,
                'reason' => 'Train the revenue trend model using at least three months of completed Job Order values.',
                'month' => Carbon::now()->addMonth()->format('M Y'),
            ];
        }

        return [
            'available' => true,
            'month' => Carbon::parse($model['period_end'])->addMonth()->format('M Y'),
            'predicted_revenue' => round(max(0, (float) $model['intercept'] + ((float) $model['slope'] * (int) $model['months_in_dataset'])), 2),
            'method' => $model['algorithm'],
            'trained_at' => $model['trained_at'],
            'months_with_data' => $model['months_with_data'],
            'months_in_dataset' => $model['months_in_dataset'],
            'period_start' => $model['period_start'],
            'period_end' => $model['period_end'],
            'source' => $model['source'],
        ];
    }

    private function trainingData(): array
    {
        $end = now()->startOfMonth()->subSecond();
        $start = $end->copy()->startOfMonth()->subMonths(11);
        $driver = DB::connection()->getDriverName();
        $periodExpression = match ($driver) {
            'pgsql' => "TO_CHAR(completion_date, 'YYYY-MM')",
            'sqlite' => "strftime('%Y-%m', completion_date)",
            'mysql' => "DATE_FORMAT(completion_date, '%Y-%m')",
            'sqlsrv' => "FORMAT(completion_date, 'yyyy-MM')",
            default => throw new RuntimeException("Revenue trend model does not support the [{$driver}] database driver."),
        };

        $monthlyValues = JobOrder::query()
            ->where('status', 'completed')
            ->whereNotNull('completion_date')
            ->whereBetween('completion_date', [$start, $end])
            ->selectRaw("{$periodExpression} as period, SUM(total_amount) as amount")
            ->groupByRaw($periodExpression)
            ->get()
            ->keyBy('period');

        return collect(range(0, 11))->map(function (int $offset) use ($start, $monthlyValues): array {
            $month = $start->copy()->addMonths($offset);
            $period = $month->format('Y-m');

            return [
                'month' => $period,
                'amount' => round((float) ($monthlyValues[$period]->amount ?? 0), 2),
            ];
        })->all();
    }
}
