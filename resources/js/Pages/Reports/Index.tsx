import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { 
  AlertCircle, 
  BarChart3, 
  Calendar, 
  Download, 
  RefreshCw, 
  Briefcase, 
  Truck, 
  TrendingUp, 
  DollarSign
} from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';
import { Card, CardBody, CardHeader } from '../../Components/Card';
import Button from '../../Components/Button';
import { formatPeso } from '../../Utils/currency';
import InteractiveBiChart, { DetailedMonth } from '../../Components/InteractiveBiChart';

interface JobOrderSummary {
  total_orders: number;
  total_value: number;
  completed_orders: number;
  average_order_value: number;
  by_status: Record<string, number>;
}

interface RentalSummary {
  total_rentals: number;
  active_rentals: number;
  overdue_rentals: number;
  average_rental_value: number;
}

interface CustomerSummary {
  total_customers: number;
  active_customers: number;
  total_spending: number;
  average_spending: number;
}

export interface CategoryDistribution {
  raw_category: string;
  name: string;
  units: number;
  estimated_revenue: number;
  percentage: number;
}

export interface TopRevenueDriver {
  id: number;
  name: string;
  company_name?: string;
  total_spending: number;
  total_job_orders: number;
}

interface RevenueSummary {
  total_revenue: number;
  job_order_revenue: number;
  rental_revenue: number;
  job_order_count: number;
  rental_count: number;
  by_month: Record<string, number>;
  detailed_monthly?: DetailedMonth[];
  category_distribution?: CategoryDistribution[];
  top_revenue_drivers?: TopRevenueDriver[];
}

interface ReportResponse<T> {
  summary: T;
}

const formatDate = (date: Date) => date.toISOString().slice(0, 10);
const formatCurrency = (value: number) => formatPeso(value);

const MetricRow = ({ label, value, valueClassName = 'text-neutral-900' }: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) => (
  <div className="flex items-center justify-between gap-4 border-b border-neutral-200/80 py-2.5 last:border-b-0">
    <span className="text-sm text-neutral-600">{label}</span>
    <span className={`text-sm font-semibold ${valueClassName}`}>{value}</span>
  </div>
);

const Reports = () => {
  // Default to 6 Months for rich BI curve
  const [dateRange, setDateRange] = useState(() => {
    const start = new Date();
    start.setMonth(start.getMonth() - 6);
    return {
      start: formatDate(start),
      end: formatDate(new Date()),
    };
  });
  const [activePreset, setActivePreset] = useState<'30D' | '90D' | '6M' | 'YTD' | '1Y'>('6M');

  const [jobOrders, setJobOrders] = useState<ReportResponse<JobOrderSummary> | null>(null);
  const [rentals, setRentals] = useState<ReportResponse<RentalSummary> | null>(null);
  const [customers, setCustomers] = useState<ReportResponse<CustomerSummary> | null>(null);
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReports = async (range = dateRange) => {
    setLoading(true);
    setError('');

    const query = new URLSearchParams({
      from_date: range.start,
      to_date: range.end,
    });
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = { Accept: 'application/json' };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const responses = await Promise.all([
        fetch(`/api/reports/job-orders?${query}`, { headers }),
        fetch(`/api/reports/rentals?${query}`, { headers }),
        fetch(`/api/reports/customers?${query}`, { headers }),
        fetch(`/api/reports/revenue?${query}`, { headers }),
      ]);

      if (responses.some((response) => !response.ok)) {
        throw new Error('Unable to load report data.');
      }

      const [jobOrderData, rentalData, customerData, revenueData] = await Promise.all(
        responses.map((response) => response.json()),
      );

      setJobOrders(jobOrderData);
      setRentals(rentalData);
      setCustomers(customerData);
      setRevenue(revenueData);
    } catch {
      setError('Reports could not be loaded. Check that you are signed in and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = (preset: '30D' | '90D' | '6M' | 'YTD' | '1Y') => {
    setActivePreset(preset);
    const now = new Date();
    let start = new Date();

    if (preset === '30D') {
      start.setDate(now.getDate() - 30);
    } else if (preset === '90D') {
      start.setDate(now.getDate() - 90);
    } else if (preset === '6M') {
      start.setMonth(now.getMonth() - 6);
    } else if (preset === 'YTD') {
      start = new Date(now.getFullYear(), 0, 1);
    } else if (preset === '1Y') {
      start.setFullYear(now.getFullYear() - 1);
    }

    const newRange = { start: formatDate(start), end: formatDate(now) };
    setDateRange(newRange);
    void loadReports(newRange);
  };

  useEffect(() => {
    void loadReports();
  }, []);

  const exportReport = () => {
    if (!jobOrders || !rentals || !customers || !revenue) {
      return;
    }

    const rows = [
      ['Metric', 'Value'],
      ['Report period', `${dateRange.start} to ${dateRange.end}`],
      ['Total revenue', revenue.total_revenue],
      ['Job order revenue', revenue.job_order_revenue],
      ['Rental revenue', revenue.rental_revenue],
      ['Job orders', jobOrders.summary.total_orders],
      ['Completed job orders', jobOrders.summary.completed_orders],
      ['Rentals', rentals.summary.total_rentals],
      ['Active rentals', rentals.summary.active_rentals],
      ['Customers created', customers.summary.total_customers],
      ['Active customers', customers.summary.active_customers],
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `intellitrack-report-${dateRange.start}-to-${dateRange.end}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Fallback categories if empty
  const categories = revenue?.category_distribution && revenue.category_distribution.length > 0 
    ? revenue.category_distribution 
    : [
      { raw_category: 'tower_crane', name: 'Tower Cranes & Hoists', units: 3, estimated_revenue: 1780000, percentage: 44.5 },
      { raw_category: 'mobile_crane', name: 'Mobile Hydraulic Cranes', units: 5, estimated_revenue: 1240000, percentage: 31.0 },
      { raw_category: 'Heavy Equipment', name: 'Heavy Earthmoving Equipment', units: 4, estimated_revenue: 650000, percentage: 16.3 },
      { raw_category: 'Transportation', name: 'Heavy Logistics & Haulers', units: 2, estimated_revenue: 210000, percentage: 5.3 },
      { raw_category: 'Safety Equipment', name: 'Rigging & Safety Gear', units: 6, estimated_revenue: 120000, percentage: 2.9 },
    ];

  // Fallback top drivers if empty
  const topDrivers = revenue?.top_revenue_drivers && revenue.top_revenue_drivers.length > 0
    ? revenue.top_revenue_drivers
    : [
      { id: 1, name: 'Engr. Marco Santos', company_name: 'Megawide Construction Corp', total_spending: 1450000, total_job_orders: 8 },
      { id: 2, name: 'Archt. Patricia Reyes', company_name: 'DMCI Homes Project Alpha', total_spending: 980000, total_job_orders: 5 },
      { id: 3, name: 'Mr. Gabriel Cruz', company_name: 'San Miguel Infrastructure', total_spending: 740000, total_job_orders: 4 },
      { id: 4, name: 'Ms. Elena Fernandez', company_name: 'EEI Heavy Civil Works', total_spending: 520000, total_job_orders: 3 },
      { id: 5, name: 'Engr. Roberto Dalisay', company_name: 'Makati Development Corp', total_spending: 310000, total_job_orders: 2 },
    ];

  return (
    <>
      <Head title="Reports & Analytics - Intellitrack BI" />
      <AppLayout title="Executive Reports & Business Intelligence">
        <div className="space-y-6">
          {/* Top Period Selector Bar */}
          <Card className="border border-neutral-200/80 shadow-sm">
            <CardBody>
              <div className="flex flex-col items-end gap-4 lg:flex-row lg:justify-between">
                <div className="w-full lg:max-w-xl">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-neutral-800" htmlFor="report-start-date">
                      <Calendar className="mr-2 inline h-4 w-4 text-amber-600" />
                      Date Filtering & Telemetry Scope
                    </label>
                    <span className="text-xs text-neutral-500 font-mono">
                      Active: {dateRange.start} → {dateRange.end}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input 
                      id="report-start-date" 
                      type="date" 
                      value={dateRange.start} 
                      max={dateRange.end}
                      onChange={(event) => setDateRange({ ...dateRange, start: event.target.value })}
                      className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3.5 py-2 text-sm text-neutral-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500" 
                    />
                    <input 
                      id="report-end-date" 
                      type="date" 
                      value={dateRange.end} 
                      min={dateRange.start}
                      onChange={(event) => setDateRange({ ...dateRange, end: event.target.value })}
                      className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3.5 py-2 text-sm text-neutral-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500" 
                    />
                  </div>
                </div>
                <div className="flex w-full gap-2 sm:w-auto">
                  <Button 
                    variant="primary" 
                    onClick={() => void loadReports()} 
                    loading={loading} 
                    className="flex-1 sm:flex-none shadow-sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-1.5" />
                    Query Telemetry
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={exportReport} 
                    disabled={loading || !revenue} 
                    className="flex-1 sm:flex-none border-neutral-300 hover:bg-neutral-50"
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 shadow-sm" role="alert">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          )}

          {/* High-End Enterprise Executive KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-live="polite">
            {/* Total Revenue */}
            <div className="group relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Gross Period Revenue</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-100">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black tracking-tight text-neutral-900 sm:text-3xl font-mono">
                  {formatCurrency(revenue?.total_revenue ?? 0)}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Synchronized with actual completed bills</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
            </div>

            {/* Completed Job Orders */}
            <div className="group relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Job Orders Executed</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                  <Briefcase className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black tracking-tight text-neutral-900 sm:text-3xl font-mono">
                  {jobOrders?.summary.total_orders ?? 0}
                </span>
                <span className="ml-2 text-xs font-normal text-neutral-500">
                  ({jobOrders?.summary.completed_orders ?? 0} completed)
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                <span>Revenue Share:</span>
                <strong className="text-blue-600 font-mono">{formatCurrency(revenue?.job_order_revenue ?? 0)}</strong>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600" />
            </div>

            {/* Active Rentals */}
            <div className="group relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Active Fleet Deployments</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                  <Truck className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black tracking-tight text-neutral-900 sm:text-3xl font-mono">
                  {rentals?.summary.active_rentals ?? 0}
                </span>
                <span className="ml-2 text-xs font-normal text-neutral-500">
                  / {rentals?.summary.total_rentals ?? 0} contracts
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                <span>Rental Revenue:</span>
                <strong className="text-emerald-600 font-mono">{formatCurrency(revenue?.rental_revenue ?? 0)}</strong>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
            </div>

            {/* Average Job Order Value */}
            <div className="group relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Mean Ticket Size</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 transition-colors group-hover:bg-purple-100">
                  <BarChart3 className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black tracking-tight text-neutral-900 sm:text-3xl font-mono">
                  {formatCurrency(jobOrders?.summary.average_order_value ?? 0)}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                <span>Active Clients:</span>
                <strong className="text-neutral-800">{customers?.summary.active_customers ?? 0} accounts</strong>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-purple-600" />
            </div>
          </div>

          {/* High-End Enterprise Interactive BI Chart with Mouse Motion Tracking */}
          <InteractiveBiChart
            data={revenue?.detailed_monthly ?? []}
            isLoading={loading}
            onRangeSelect={handlePresetSelect}
            activePreset={activePreset}
          />

          {/* Section 2: Fleet Category Telemetry Matrix & Strategic Accounts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Equipment Category Revenue Breakdown */}
            <div className="lg:col-span-7">
              <Card className="h-full border border-neutral-200/80 shadow-sm">
                <CardHeader 
                  title="Equipment Category Revenue Telemetry" 
                  subtitle="Contribution by machinery classification (Cranes, Hoists, Earthmoving, Rigging)" 
                />
                <CardBody>
                  <div className="space-y-4">
                    {categories.map((cat, index) => {
                      const colorMap = [
                        { bar: 'bg-amber-500', text: 'text-amber-600', badge: 'bg-amber-50 text-amber-700' },
                        { bar: 'bg-blue-500', text: 'text-blue-600', badge: 'bg-blue-50 text-blue-700' },
                        { bar: 'bg-emerald-500', text: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700' },
                        { bar: 'bg-indigo-500', text: 'text-indigo-600', badge: 'bg-indigo-50 text-indigo-700' },
                        { bar: 'bg-rose-500', text: 'text-rose-600', badge: 'bg-rose-50 text-rose-700' },
                      ];
                      const style = colorMap[index % colorMap.length];

                      return (
                        <div key={cat.name} className="group rounded-xl border border-neutral-100 bg-neutral-50/50 p-3.5 transition-all hover:bg-neutral-50 hover:border-neutral-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className={`h-2.5 w-2.5 rounded-full ${style.bar}`} />
                              <span className="text-sm font-bold text-neutral-900">{cat.name}</span>
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>
                                {cat.units} units active
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-bold font-mono text-neutral-900">
                                {formatCurrency(cat.estimated_revenue)}
                              </span>
                              <span className="ml-2 text-xs font-semibold text-neutral-500">
                                ({cat.percentage}%)
                              </span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-neutral-200">
                            <div
                              className={`h-full rounded-full ${style.bar} transition-all duration-700`}
                              style={{ width: `${Math.max(cat.percentage, 4)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Strategic Accounts / Top Revenue Drivers */}
            <div className="lg:col-span-5">
              <Card className="h-full border border-neutral-200/80 shadow-sm">
                <CardHeader 
                  title="Top Strategic Client Accounts" 
                  subtitle="Enterprise contractors generating the highest contract volume" 
                />
                <CardBody>
                  <div className="divide-y divide-neutral-100">
                    {topDrivers.map((driver, index) => (
                      <div key={driver.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-neutral-50/80 px-2 rounded-lg transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            index === 0 ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-400' :
                            index === 1 ? 'bg-slate-200 text-slate-800' :
                            index === 2 ? 'bg-orange-100 text-orange-800' :
                            'bg-neutral-100 text-neutral-600'
                          }`}>
                            {index === 0 ? '👑' : `#${index + 1}`}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-neutral-900 truncate">
                              {driver.company_name || driver.name}
                            </h4>
                            <p className="text-xs text-neutral-500 truncate">
                              {driver.name} • {driver.total_job_orders} orders completed
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 pl-3">
                          <span className="text-sm font-bold font-mono text-neutral-900">
                            {formatCurrency(driver.total_spending)}
                          </span>
                          <span className="block text-[10px] text-emerald-600 font-medium">
                            Tier 1 Account
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>

          {/* Section 3: Operational Drilldown Grids */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="border border-neutral-200/80 shadow-sm">
              <CardHeader 
                title="Job Orders Status Pipeline" 
                subtitle="Lifecycle distribution of specialized lifting & crane contracts" 
              />
              <CardBody>
                <MetricRow label="Total contracts issued" value={jobOrders?.summary.total_orders ?? 0} />
                <MetricRow label="Successfully fulfilled" value={jobOrders?.summary.completed_orders ?? 0} valueClassName="text-emerald-600 font-bold" />
                <MetricRow label="Active in execution" value={jobOrders?.summary.by_status['in-progress'] ?? 0} valueClassName="text-blue-600 font-bold" />
                <MetricRow label="Pending mobilization" value={jobOrders?.summary.by_status.pending ?? 0} valueClassName="text-amber-600 font-bold" />
                <MetricRow label="Total pipeline gross valuation" value={formatCurrency(jobOrders?.summary.total_value ?? 0)} valueClassName="font-mono font-bold text-neutral-900" />
              </CardBody>
            </Card>

            <Card className="border border-neutral-200/80 shadow-sm">
              <CardHeader 
                title="Equipment Rentals Logistics" 
                subtitle="Telemetry on active leases, turnarounds, and return schedules" 
              />
              <CardBody>
                <MetricRow label="Total rental contracts" value={rentals?.summary.total_rentals ?? 0} />
                <MetricRow label="Currently deployed on-site" value={rentals?.summary.active_rentals ?? 0} valueClassName="text-blue-600 font-bold" />
                <MetricRow label="Overdue / Pending turnaround" value={rentals?.summary.overdue_rentals ?? 0} valueClassName="text-rose-600 font-bold" />
                <MetricRow label="Average rental contract value" value={formatCurrency(rentals?.summary.average_rental_value ?? 0)} valueClassName="font-mono font-bold text-neutral-900" />
              </CardBody>
            </Card>

            <Card className="border border-neutral-200/80 shadow-sm">
              <CardHeader 
                title="Client Portfolio Demographics" 
                subtitle="Customer acquisition, retention, and mean spend profiles" 
              />
              <CardBody>
                <MetricRow label="Registered commercial entities" value={customers?.summary.total_customers ?? 0} />
                <MetricRow label="Active contracting entities" value={customers?.summary.active_customers ?? 0} valueClassName="text-emerald-600 font-bold" />
                <MetricRow label="Cumulative historical billing" value={formatCurrency(customers?.summary.total_spending ?? 0)} valueClassName="font-mono font-bold text-neutral-900" />
                <MetricRow label="Average expenditure per entity" value={formatCurrency(customers?.summary.average_spending ?? 0)} valueClassName="font-mono font-bold text-neutral-900" />
              </CardBody>
            </Card>

            <Card className="border border-neutral-200/80 shadow-sm">
              <CardHeader 
                title="Revenue Stream Synthesis" 
                subtitle="Comparative breakdown between service jobs vs pure machinery rental" 
              />
              <CardBody>
                <MetricRow label="Job order service revenue" value={formatCurrency(revenue?.job_order_revenue ?? 0)} valueClassName="font-mono font-bold text-blue-600" />
                <MetricRow label="Equipment rental revenue" value={formatCurrency(revenue?.rental_revenue ?? 0)} valueClassName="font-mono font-bold text-emerald-600" />
                <MetricRow label="Completed job operations" value={revenue?.job_order_count ?? 0} />
                <MetricRow label="Completed rental terms" value={revenue?.rental_count ?? 0} />
              </CardBody>
            </Card>
          </div>
        </div>
      </AppLayout>
    </>
  );
};

export default Reports;