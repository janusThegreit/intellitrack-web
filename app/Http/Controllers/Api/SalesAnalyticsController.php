<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerInquiry;
use App\Models\Equipment;
use App\Models\JobOrder;
use App\Models\Project;
use App\Models\Quotation;
use App\Models\Rental;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Http;

class SalesAnalyticsController extends Controller
{
    /**
     * Executive AI Analytics & Decision Support System (DSS) Summary
     */
    public function summary()
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
        $pipelineValue = (float) Quotation::whereIn('status', ['under_review', 'approved', 'sent', 'accepted'])->sum('total_amount');
        $avgQuoteValue = $quotationTotal > 0 ? (float) Quotation::avg('total_amount') : 0;
        $conversionRate = $quotationTotal > 0 ? round(($acceptedQuotations / $quotationTotal) * 100, 1) : 0;

        $equipmentTotal = Equipment::count();
        $availableEquipment = Equipment::where('status', 'available')->count();
        $rentedEquipment = Equipment::where('status', 'rented')->count();
        $maintenanceEquipment = Equipment::where('status', 'maintenance')->count();
        $utilizationRate = $equipmentTotal > 0 ? round(($rentedEquipment / $equipmentTotal) * 100, 1) : 0;

        // Overdue Rentals Detection
        $overdueRentalsQuery = Rental::with(['customer:id,name,company_name,phone', 'equipment:id,name,category,rental_rate'])
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->whereDate('rental_end_date', '<', today());

        $overdueCount = $overdueRentalsQuery->count();
        $overdueItems = $overdueRentalsQuery->limit(10)->get()->map(function ($rental) {
            $daysOverdue = max(1, (int) now()->diffInDays($rental->rental_end_date));
            $rate = (float) ($rental->daily_rate ?? $rental->equipment?->rental_rate ?? 0);
            return [
                'id' => $rental->id,
                'rental_number' => $rental->rental_number ?? 'RNT-' . $rental->id,
                'customer_name' => $rental->customer?->company_name ?: ($rental->customer?->name ?: 'Client Account'),
                'customer_phone' => $rental->customer?->phone ?? 'N/A',
                'equipment_name' => $rental->equipment?->name ?? 'Heavy Equipment',
                'days_overdue' => $daysOverdue,
                'rental_end_date' => $rental->rental_end_date ? $rental->rental_end_date->format('Y-m-d') : 'N/A',
                'estimated_penalty' => round($daysOverdue * $rate, 2),
            ];
        });

        $monthlyRevenue = $this->monthlyRevenue();
        $forecast = $this->forecast($monthlyRevenue);
        $recommendations = $this->generateRecommendations(
            $overdueCount,
            $conversionRate,
            $utilizationRate,
            $agingInquiries,
            $underReviewQuotations
        );

        // Equipment by Category Breakdown
        $categoryBreakdown = Equipment::selectRaw("COALESCE(category, 'Heavy Machinery') as category_name, count(*) as total, SUM(CASE WHEN status = 'rented' THEN 1 ELSE 0 END) as rented_count")
            ->groupByRaw("COALESCE(category, 'Heavy Machinery')")
            ->get()
            ->map(function ($item) {
                return [
                    'category' => $item->category_name,
                    'total' => (int) $item->total,
                    'rented' => (int) $item->rented_count,
                    'rate' => $item->total > 0 ? round(($item->rented_count / $item->total) * 100, 1) : 0,
                ];
            });

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
                'conversion_rate' => $conversionRate,
                'pipeline_value' => round($pipelineValue, 2),
                'avg_quote_value' => round($avgQuoteValue, 2),
            ],
            'rental_trends' => [
                'active' => Rental::where('status', 'active')->count(),
                'pending' => Rental::where('status', 'pending')->count(),
                'overdue' => $overdueCount,
                'overdue_items' => $overdueItems,
            ],
            'equipment_utilization' => [
                'total' => $equipmentTotal,
                'available' => $availableEquipment,
                'rented' => $rentedEquipment,
                'maintenance' => $maintenanceEquipment,
                'utilization_rate' => $utilizationRate,
                'categories' => $categoryBreakdown,
            ],
            'job_orders' => [
                'counts' => JobOrder::selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status'),
                'active' => JobOrder::whereIn('status', ['approved', 'in-progress'])->count(),
                'completed' => JobOrder::where('status', 'completed')->count(),
            ],
            'projects' => Project::selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status'),
            'revenue_history' => $monthlyRevenue,
            'forecast' => $forecast,
            'recommendations' => $recommendations,
        ]);
    }

    /**
     * Interactive AI Copilot Assistant Query
     */
    public function copilot(Request $request)
    {
        Gate::authorize('view-reports');

        $validated = $request->validate([
            'prompt' => 'required|string|max:1000',
        ]);

        $prompt = trim($validated['prompt']);

        // Gather real-time system context
        $inquiryCount = CustomerInquiry::count();
        $quoteCount = Quotation::count();
        $acceptedCount = Quotation::where('status', 'accepted')->count();
        $conversionRate = $quoteCount > 0 ? round(($acceptedCount / $quoteCount) * 100, 1) : 0;
        $totalFleet = Equipment::count();
        $rentedFleet = Equipment::where('status', 'rented')->count();
        $utilizationRate = $totalFleet > 0 ? round(($rentedFleet / $totalFleet) * 100, 1) : 0;
        $overdueCount = Rental::whereNotIn('status', ['completed', 'cancelled'])->whereDate('rental_end_date', '<', today())->count();

        $monthly = $this->monthlyRevenue();
        $forecast = $this->forecast($monthly);
        $forecastText = $forecast['available']
            ? "Projected next month revenue is PHP " . number_format($forecast['predicted_revenue'], 2) . " with " . $forecast['method']
            : "Insufficient historical periods (need 3+ months with completed revenue).";

        // Real-time YoY telemetry
        $ytdRevenue = (float) (
            JobOrder::where('status', 'completed')->whereYear('completion_date', now()->year)->sum('total_amount')
            + Rental::where('status', 'completed')->whereYear('created_at', now()->year)->sum('total_amount')
        );
        $prevYearRevenue = (float) (
            JobOrder::where('status', 'completed')->whereYear('completion_date', now()->subYear()->year)->sum('total_amount')
            + Rental::where('status', 'completed')->whereYear('created_at', now()->subYear()->year)->sum('total_amount')
        );
        $diffRevenue = $ytdRevenue - $prevYearRevenue;
        $yoyGrowthPct = $prevYearRevenue > 0
            ? round(($diffRevenue / $prevYearRevenue) * 100, 1)
            : 0;

        $pendingApprovalsCount = Quotation::where('status', 'under_review')->count();
        $pendingApprovalsSum = (float) Quotation::where('status', 'under_review')->sum('total_amount');
        $activeCranesCount = Equipment::where('category', 'like', '%crane%')->where('status', 'rented')->count();
        $totalCranesCount = Equipment::where('category', 'like', '%crane%')->count();

        // 1. Check if Google Gemini API key is configured (via request or .env / services)
        $geminiKey = trim((string) ($request->input('gemini_api_key') ?: config('services.gemini.api_key') ?: env('GEMINI_API_KEY')));
        $availableFleet = Equipment::where('status', 'available')->count();
        $maintenanceFleet = Equipment::where('status', 'maintenance')->count();

        if (! empty($geminiKey)) {
            $modelsToTry = [
                config('services.gemini.model') ?: env('GEMINI_MODEL', 'gemini-3.6-flash'),
                'gemini-3.6-flash',
                'gemini-3.7-flash',
                'gemini-flash-latest',
                'gemini-2.5-flash-lite',
                'gemini-2.5-flash',
            ];

            foreach ($modelsToTry as $model) {
                try {
                    $systemPrompt = "You are IntelliTrack AI Copilot, an expert enterprise AI assistant for a heavy equipment rental, crane service, and construction sales company in the Philippines.\n"
                        . "Live Operational Telemetry from PostgreSQL Database:\n"
                        . "- Fiscal Year-over-Year (YoY) Performance:\n"
                        . "  * 2026 YTD Completed Revenue: PHP " . number_format($ytdRevenue, 2) . "\n"
                        . "  * 2025 Historical Revenue: PHP " . number_format($prevYearRevenue, 2) . "\n"
                        . "  * YoY Growth / Improvement: +" . $yoyGrowthPct . "% (+PHP " . number_format($diffRevenue, 2) . ")\n"
                        . "- Crane Fleet Demand: {$activeCranesCount} out of {$totalCranesCount} heavy cranes actively deployed on project sites.\n"
                        . "- Heavy Equipment Total: {$totalFleet} units ({$rentedFleet} deployed [{$utilizationRate}% utilization], {$availableFleet} ready in yard, {$maintenanceFleet} in maintenance).\n"
                        . "- Quotation Performance: {$conversionRate}% win-rate ({$acceptedCount} accepted proposals out of {$quoteCount} quotes). Total pipeline value: PHP " . number_format(Quotation::sum('total_amount'), 2) . ".\n"
                        . "- Pending Sales Manager Approvals: {$pendingApprovalsCount} quotation(s) under review (Total: PHP " . number_format($pendingApprovalsSum, 2) . ").\n"
                        . "- Overdue Rentals Risk: {$overdueCount} rental contracts exceeding scheduled return dates.\n"
                        . "- Revenue Trajectory: {$forecastText}.\n"
                        . "Guidelines:\n"
                        . "- Answer naturally, warmly, and concisely. Support both English and Tagalog (Taglish).\n"
                        . "- When asked about last year improvement or 'ano yung improvement nong nakaraan taon', provide the concrete numbers: 2026 YTD vs 2025 with the percentage and net growth, explaining the crane demand and quotation wins.\n"
                        . "- When greeted (e.g. 'hi', 'hello', 'kamusta'), greet back warmly and offer assistance.\n"
                        . "- Use Philippine Peso (₱ / PHP) for currency.\n"
                        . "- Highlight key data points using markdown bolding or bullet points.";

                    $geminiResponse = Http::withoutVerifying()->timeout(15)->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$geminiKey}", [
                        'contents' => [
                            [
                                'role' => 'user',
                                'parts' => [
                                    [
                                        'text' => "{$systemPrompt}\n\nUser Question/Message: {$prompt}",
                                    ],
                                ],
                            ],
                        ],
                    ]);

                    if ($geminiResponse->successful()) {
                        $candidate = $geminiResponse->json('candidates.0.content.parts.0.text');
                        if (! empty($candidate)) {
                            return response()->json([
                                'response' => trim($candidate),
                                'source' => "Google Gemini AI ({$model})",
                            ]);
                        }
                    }
                } catch (\Throwable $e) {
                    // Try next model or fallback
                }
            }
        }

        // 2. Attempt calling local microservice if running
        try {
            $microservice = Http::connectTimeout(1)->timeout(2)->post('http://127.0.0.1:8001/api/generate', [
                'prompt' => "Context: IntelliTrack Heavy Equipment & Construction Management. Fleet: {$totalFleet} units ({$utilizationRate}% utilized, {$rentedFleet} rented). Quotation Win-rate: {$conversionRate}% ({$acceptedCount}/{$quoteCount}). Overdue Rentals: {$overdueCount}. Revenue Forecast: {$forecastText}. User question: {$prompt}",
            ]);

            if ($microservice->successful() && ! empty($microservice->json('response'))) {
                return response()->json([
                    'response' => $microservice->json('response'),
                    'source' => 'FastAPI Generative Model',
                ]);
            }
        } catch (\Throwable $e) {
            // Fallback to built-in conversational intelligence
        }

        // 3. Built-in Conversational & Executive Intelligence Engine
        $lower = strtolower($prompt);
        $clean = trim(preg_replace('/[^a-z0-9\s]/i', '', $lower));
        $response = "";

        // YoY Improvement / Growth Check
        if (
            str_contains($lower, 'nakaraan') || str_contains($lower, 'nakaraang taon') ||
            str_contains($lower, 'last year') || str_contains($lower, 'previous year') ||
            str_contains($lower, 'improvement') || str_contains($lower, 'growth') ||
            str_contains($lower, 'pagbabago') || str_contains($lower, 'kumpara') ||
            str_contains($lower, 'yoy') || str_contains($lower, 'tinubo')
        ) {
            $formattedYtd = number_format($ytdRevenue, 2);
            $formattedPrev = number_format($prevYearRevenue, 2);
            $formattedDiff = number_format(abs($diffRevenue), 2);
            $sign = $diffRevenue >= 0 ? '+' : '-';

            $response = "### 📈 Executive Year-over-Year (YoY) Revenue & Performance Analysis\n\n"
                . "Narito ang opisyal na paghahambing ng ating commercial performance mula 2025 hanggang 2026 YTD:\n\n"
                . "- **Kasalukuyang Taon (2026 YTD Revenue):** **PHP {$formattedYtd}**\n"
                . "- **Nakaraang Taon (2025 Total Revenue):** **PHP {$formattedPrev}**\n"
                . "- **Kabuuang Pag-angat (Net Improvement):** **{$sign}PHP {$formattedDiff} ({$sign}{$yoyGrowthPct}%)**\n\n"
                . "#### 💡 Bakit Mas Malakas ang IntelliTrack Ngayong Taon?\n"
                . "1. **Mataas na Demand sa Crane Operations:** Tumataas ang utilization rate ng ating **Tower Cranes** at **Mobile Cranes** para sa malalaking vertical high-rise at infrastructure projects sa Metro Manila at Central Luzon.\n"
                . "2. **Matibay na Sales Pipeline:** Mayroong **PHP " . number_format(Quotation::sum('total_amount'), 2) . "** na total quotation value na sinusubaybayan.\n"
                . "3. **Mas Mabilis na Job Order Turnaround:** Ang ating quotation win-rate ay nasa **{$conversionRate}%**.\n\n"
                . "🎯 **Rekomendasyon para sa Sales Manager:**\n"
                . "- Mayroong **{$pendingApprovalsCount} quotation(s) na naghihintay ng iyong pag-apruba** (nagkakahalaga ng PHP " . number_format($pendingApprovalsSum, 2) . "). Ang agarang sign-off ay magpapabilis sa cash-inflow ng kumpanya.";
        }
        // Cranes and Equipment Demand
        elseif (str_contains($lower, 'crane') || str_contains($lower, 'demand') || str_contains($lower, 'makina') || str_contains($lower, 'pinakamalakas')) {
            $response = "### 🏗️ Crane Fleet Utilization & Rental Demand Report\n\n"
                . "- **Kabuuang Cranes sa Fleet:** **{$totalCranesCount} units** (Tower Cranes, Mobile Telescopic Cranes, at Hydraulic Crawlers).\n"
                . "- **Actively Deployed sa Project Sites:** **{$activeCranesCount} units** na kasalukuyang kumikita sa field.\n"
                . "- **Pinakamalakas ang Demand:** Ang **Tower Cranes (e.g. TC-5013)** at **50-Ton Mobile Cranes** ang may pinakamataas na utilization dahil sa sunod-sunod na bridge girder lifting at high-rise construction.\n\n"
                . "**Operational Takeaway:** Makipag-ugnayan sa Dispatching at Fleet Maintenance bago tanggapin ang mga long-term rental reservations upang masiguro ang safety certification at maintenance schedule.";
        }
        // Pending Quotations & Manager Approvals
        elseif (str_contains($lower, 'approval') || str_contains($lower, 'pending') || str_contains($lower, 'review') || str_contains($lower, 'pirma') || str_contains($lower, 'aprubahan')) {
            $response = "### 📝 Sales Manager Quotation Approval Radar\n\n"
                . "- **Mga Naghihintay ng Sign-off:** Mayroong **{$pendingApprovalsCount} quotation(s)** na nasa status na `Under Review`.\n"
                . "- **Kabuuang Halaga ng Pipeline:** **PHP " . number_format($pendingApprovalsSum, 2) . "**.\n\n"
                . "Maaari mong buksan ang **Quotations Module** o ang **Manager Approval Radar** sa iyong Executive Dashboard upang aprubahan o humiling ng rebisyon.";
        }
        // Conversational Greetings
        elseif (in_array($clean, ['hi', 'hello', 'hey', 'kamusta', 'kumusta', 'hoy', 'musta', 'good day', 'good morning', 'good afternoon', 'good evening', 'magandang araw', 'magandang umaga', 'magandang hapon', 'magandang gabi']) || str_starts_with($clean, 'hi ') || str_starts_with($clean, 'hello ')) {
            $response = "Kumusta! 👋 Ako ang iyong **IntelliTrack AI Copilot**.\n\n"
                . "Handa akong tumulong sa iyo para sa real-time operational data at executive decision support. Maaari mo akong tanungin tungkol sa:\n"
                . "- 📈 **Improvement kumpara sa nakaraang taon (YoY Growth)**\n"
                . "- 🏗️ **Crane Fleet Demand & Rental Utilization**\n"
                . "- 📝 **Quotations Pending Manager Approval**\n"
                . "- 📊 **Revenue Forecast & Monthly Trends**\n\n"
                . "Ano ang gusto mong suriin natin ngayon?";
        } elseif (str_contains($clean, 'sino ka') || str_contains($clean, 'who are you') || str_contains($clean, 'ano kaya mo') || str_contains($clean, 'what can you do') || str_contains($clean, 'help') || str_contains($clean, 'tulong')) {
            $response = "Ako si **IntelliTrack AI Copilot** 🤖 — ang iyong digital assistant para sa heavy equipment rental at construction sales operations.\n\n"
                . "Mabilis kong nasusuri ang mga sumusunod nang direkta mula sa ating live database:\n"
                . "1. **Fleet Status:** Ilang cranes, excavators, o haulers ang available, rented, o nasa maintenance.\n"
                . "2. **Revenue Intelligence:** 6-month historical trajectory at predictive revenue projection.\n"
                . "3. **Sales Performance:** Quotation turnaround, win-rates, at pending reviews.\n"
                . "4. **Risk Radar:** Mga overdue rentals at unassigned customer leads.\n\n"
                . "Mag-type ka lang ng kahit anong tanong sa Tagalog o English!";
        } elseif (in_array($clean, ['salamat', 'thank you', 'thanks', 'thx', 'ty', 'salamat po', 'maraming salamat'])) {
            $response = "Walang anuman! 😊 Laging handang tumulong ang IntelliTrack AI Copilot. Ipaalam mo lang kung may iba ka pang gustong suriin o i-verify sa ating operations.";
        } elseif (in_array($clean, ['ok', 'sige', 'alright', 'got it', 'okay'])) {
            $response = "Noted! 👍 Mayroon ka pa bang gustong i-check sa fleet, quotations, o revenue?";
        } elseif (str_contains($lower, 'forecast') || str_contains($lower, 'revenue') || str_contains($lower, 'sales') || str_contains($lower, 'earn') || str_contains($lower, 'kita') || str_contains($lower, 'tubo')) {
            $response = "### 📊 Executive Revenue & Growth Forecast Analysis\n\n"
                . "- **Current Pipeline Performance:** Total tracked quotation value stands at approximately **PHP " . number_format(Quotation::sum('total_amount'), 2) . "**.\n"
                . "- **Predictive Trajectory:** {$forecastText}.\n"
                . "- **Growth Velocity:** " . ($forecast['available'] ? "Expected growth rate of **{$forecast['growth_rate']}%** month-over-month." : "Accumulating completed job orders and return settlements to calibrate predictive velocity.") . "\n\n"
                . "**Strategic Recommendation:** Maintain active billing cadence for ongoing job orders and prioritize closing high-value commercial quotations under review.";
        } elseif (str_contains($lower, 'fleet') || str_contains($lower, 'equipment') || str_contains($lower, 'machine') || str_contains($lower, 'utiliz') || str_contains($lower, 'makina') || str_contains($lower, 'sasakyan')) {
            $available = Equipment::where('status', 'available')->count();
            $maintenance = Equipment::where('status', 'maintenance')->count();
            $response = "### 🚜 Heavy Equipment Fleet Telemetry & Utilization Report\n\n"
                . "- **Fleet Capacity:** **{$totalFleet} total units** across heavy cranes, earthmovers, and transport equipment.\n"
                . "- **Deployment Status:** **{$rentedFleet} units active on project sites** ({$utilizationRate}% utilization rate).\n"
                . "- **Idle Yard Inventory:** **{$available} units available** ready for immediate client deployment.\n"
                . "- **Service Bay Status:** **{$maintenance} units** undergoing preventive check or repair.\n\n"
                . "**Operational Takeaway:** " . ($utilizationRate > 70 ? "High utilization detected. Monitor upcoming rental expirations to prevent equipment shortages." : "Fleet capacity has room for new rental commitments. Coordinate with Sales BD to target infrastructure contractors for idle machines.");
        } elseif (str_contains($lower, 'quote') || str_contains($lower, 'proposal') || str_contains($lower, 'conversion') || str_contains($lower, 'win') || str_contains($lower, 'presyo')) {
            $underReview = Quotation::where('status', 'under_review')->count();
            $response = "### 🎯 Commercial Quotation Win-Rate & Pipeline Health\n\n"
                . "- **Win-Rate Metric:** **{$conversionRate}%** ({$acceptedCount} accepted proposals out of {$quoteCount} total quotations).\n"
                . "- **Pending Approval Queue:** **{$underReview} quotations** currently awaiting Sales Manager review.\n\n"
                . "**Action Items:** Expeditiously review pending quotations to minimize client response lag, and follow up on quotes in 'Sent' status within 48 hours to boost conversion probability.";
        } elseif (str_contains($lower, 'risk') || str_contains($lower, 'overdue') || str_contains($lower, 'alert') || str_contains($lower, 'late') || str_contains($lower, 'huli')) {
            $response = "### ⚠️ Operational Risk Mitigation Summary\n\n"
                . "- **Overdue Rental Exposure:** **{$overdueCount} rental contracts** have exceeded their scheduled return date.\n"
                . "- **Financial Exposure:** Unreturned machinery risks logistical bottlenecks and uncollected demurrage charges.\n\n"
                . "**Prescriptive Action:** Trigger immediate dispatch of retrieval notices or contract extension billing for all overdue accounts through the Risk Radar.";
        } elseif (str_contains($lower, 'customer') || str_contains($lower, 'kliyente') || str_contains($lower, 'client') || str_contains($lower, 'inquiry') || str_contains($lower, 'tanong')) {
            $aging = CustomerInquiry::where('status', 'new')->where('created_at', '<', now()->subDays(3))->count();
            $response = "### 👥 Customer Inquiries & Lead Status\n\n"
                . "- **Total Inquiries:** **{$inquiryCount} logged leads** sa CRM.\n"
                . "- **Active Inquiries:** **" . CustomerInquiry::whereNotIn('status', ['closed', 'archived'])->count() . " active conversations**.\n"
                . "- **Aging Inquiries (>3 days):** **{$aging} unattended leads** na nangangailangan ng follow-up.\n\n"
                . "**Rekomendasyon:** Bisitahin ang Customer Inquiries page upang asikasuhin ang mga bagong katanungan bago lumamig ang mga leads.";
        } elseif (str_contains($lower, 'job order') || str_contains($lower, 'jo') || str_contains($lower, 'trabaho')) {
            $activeJo = JobOrder::whereIn('status', ['approved', 'in-progress'])->count();
            $completedJo = JobOrder::where('status', 'completed')->count();
            $response = "### 📋 Job Orders Operational Status\n\n"
                . "- **Active Deployments:** **{$activeJo} ongoing Job Orders** sa field.\n"
                . "- **Completed Settlements:** **{$completedJo} closed job orders** na na-invoice na.\n\n"
                . "Maaari mong tingnan ang kumpletong detalye sa Job Orders module para sa dispatch at mobilization.";
        } elseif (str_contains($lower, 'project') || str_contains($lower, 'proyekto') || str_contains($lower, 'site')) {
            $projCount = Project::count();
            $activeProj = Project::where('status', 'active')->count();
            $response = "### 🏗️ Project Sites & Contracts Overview\n\n"
                . "- **Total Projects:** **{$projCount} registered construction sites**.\n"
                . "- **Active Sites:** **{$activeProj} ongoing project commitments**.\n\n"
                . "Ang bawat project ay may nakatalagang heavy machinery at assigned operators.";
        } else {
            $response = "Nakatanggap ako ng iyong mensahe: *\"{$prompt}\"*\n\n"
                . "💡 **Bakit ganito ang sagot:**\n"
                . "Kasalukuyang tumatakbo ang **Built-in Offline Engine** dahil **hindi pa naka-activate ang iyong libreng Google Gemini API Key**. Ang built-in engine ay limitado lamang sa pagsusuri ng live equipment, revenue, quotations, at job orders.\n\n"
                . "✨ **Gusto mo bang sumagot ito sa kahit anong tanong?**\n"
                . "1. I-click ang **`Use Gemini API (Free)`** button sa itaas ng chatbox na ito.\n"
                . "2. Kumuha ng 100% libreng key sa [Google AI Studio](https://aistudio.google.com/) *(walang bayad, walang credit card)*.\n"
                . "3. I-paste ang key at i-save.\n\n"
                . "Kapag naka-connect na si Gemini, maiintindihan at masasagot na ng Copilot ang **kahit anong tanong mo** nang natural at matalino!";
        }

        return response()->json([
            'response' => $response,
            'source' => 'IntelliTrack Executive Analytical Engine',
        ]);
    }

    private function monthlyRevenue(): array
    {
        return collect(range(5, 0))->map(function (int $offset) {
            $month = now()->subMonths($offset);
            $jobOrders = JobOrder::where('status', 'completed')
                ->whereYear('completion_date', $month->year)
                ->whereMonth('completion_date', $month->month)
                ->sum('total_amount');

            $rentals = Rental::where('status', 'completed')
                ->whereYear('created_at', $month->year)
                ->whereMonth('created_at', $month->month)
                ->sum('total_amount');

            return [
                'month' => $month->format('Y-m'),
                'label' => $month->format('M Y'),
                'amount' => round((float) $jobOrders + (float) $rentals, 2),
                'job_orders' => round((float) $jobOrders, 2),
                'rentals' => round((float) $rentals, 2),
            ];
        })->all();
    }

    private function forecast(array $history): array
    {
        $observations = collect($history)->pluck('amount')->filter(fn (float $amount) => $amount > 0)->values();

        if ($observations->count() < 2) {
            return [
                'available' => false,
                'reason' => 'At least two completed revenue periods are required for predictive trend modeling.',
                'month' => Carbon::now()->addMonth()->format('M Y'),
                'predicted_revenue' => 0,
                'growth_rate' => 0,
                'confidence' => 'Low',
                'method' => 'Linear trend synthesis',
            ];
        }

        $growth = ($observations->last() - $observations->first()) / max($observations->first(), 1);
        $nextMonth = Carbon::now()->addMonth()->format('M Y');
        $growthRate = round(($growth / max($observations->count() - 1, 1)) * 100, 1);
        $predicted = round($observations->last() * (1 + ($growthRate / 100)), 2);

        return [
            'available' => true,
            'month' => $nextMonth,
            'predicted_revenue' => max($predicted, 0),
            'growth_rate' => $growthRate,
            'confidence' => $observations->count() >= 4 ? 'High' : 'Moderate',
            'method' => 'Moving growth velocity & completed-revenue trajectory',
        ];
    }

    private function generateRecommendations(int $overdueCount, float $conversionRate, float $utilizationRate, int $agingInquiries, int $underReviewQuotes): array
    {
        $recommendations = [];

        if ($overdueCount > 0) {
            $recommendations[] = [
                'id' => 'overdue_mitigation',
                'priority' => 'high',
                'title' => 'Urgent: Overdue Equipment Return Alert',
                'description' => "There are {$overdueCount} active rental contracts exceeding scheduled return dates. Initiate demurrage billing or unit retrieval.",
                'action_label' => 'View Overdue Rentals',
                'action_href' => '/rentals',
                'badge' => 'Risk Mitigation',
            ];
        }

        if ($underReviewQuotes > 0) {
            $recommendations[] = [
                'id' => 'pending_quotations',
                'priority' => 'high',
                'title' => 'Quotation Approval Backlog',
                'description' => "{$underReviewQuotes} commercial quotations are awaiting Sales Manager review. Prompt turnaround prevents client drop-off.",
                'action_label' => 'Review Quotations',
                'action_href' => '/quotations',
                'badge' => 'Revenue Governance',
            ];
        }

        if ($conversionRate > 0 && $conversionRate < 45) {
            $recommendations[] = [
                'id' => 'conversion_optimization',
                'priority' => 'medium',
                'title' => 'Commercial Proposal Win-Rate Opportunity',
                'description' => "Quotation conversion rate is at {$conversionRate}%. Consider reviewing discount structures or equipment bundling with Sales BD.",
                'action_label' => 'Analyze Quotations',
                'action_href' => '/quotations',
                'badge' => 'Sales Strategy',
            ];
        }

        if ($agingInquiries > 0) {
            $recommendations[] = [
                'id' => 'inquiry_aging',
                'priority' => 'medium',
                'title' => 'Aging Unattended Inquiries',
                'description' => "{$agingInquiries} customer inquiries have been in 'New' status for over 3 days. Assign staff to follow up before leads turn cold.",
                'action_label' => 'Inspect Inquiries',
                'action_href' => '/inquiries',
                'badge' => 'Lead Response',
            ];
        }

        if ($utilizationRate < 50) {
            $recommendations[] = [
                'id' => 'fleet_utilization',
                'priority' => 'opportunity',
                'title' => 'Fleet Capacity Available for Dispatch',
                'description' => "Current heavy equipment utilization is {$utilizationRate}%. Significant crane and earthmoving inventory is available for new construction tenders.",
                'action_label' => 'Check Availability',
                'action_href' => '/equipment/availability',
                'badge' => 'Fleet Utilization',
            ];
        }

        if (empty($recommendations)) {
            $recommendations[] = [
                'id' => 'optimal_health',
                'priority' => 'optimal',
                'title' => 'Operations & Commercial Health Stabilized',
                'description' => 'Quotation win-rate, fleet dispatch, and rental timelines are operating within optimal governance thresholds.',
                'action_label' => 'View Executive Reports',
                'action_href' => '/reports',
                'badge' => 'System Optimal',
            ];
        }

        return $recommendations;
    }
}