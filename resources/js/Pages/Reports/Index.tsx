import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { AlertCircle, BarChart3, Calendar, Download, RefreshCw } from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';
import { Card, CardBody, CardHeader } from '../../Components/Card';
import Stat from '../../Components/Stat';
import Button from '../../Components/Button';
import { formatPeso } from '../../Utils/currency';

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

interface RevenueSummary {
  total_revenue: number;
  job_order_revenue: number;
  rental_revenue: number;
  job_order_count: number;
  rental_count: number;
  by_month: Record<string, number>;
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
  <div className="flex items-center justify-between gap-4 border-b border-neutral-200 py-2 last:border-b-0">
    <span className="text-sm text-neutral-600">{label}</span>
    <span className={`text-sm font-semibold ${valueClassName}`}>{value}</span>
  </div>
);

const Reports = () => {
  const [dateRange, setDateRange] = useState(() => ({
    start: formatDate(new Date(new Date().setMonth(new Date().getMonth() - 1))),
    end: formatDate(new Date()),
  }));
  const [jobOrders, setJobOrders] = useState<ReportResponse<JobOrderSummary> | null>(null);
  const [rentals, setRentals] = useState<ReportResponse<RentalSummary> | null>(null);
  const [customers, setCustomers] = useState<ReportResponse<CustomerSummary> | null>(null);
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReports = async () => {
    setLoading(true);
    setError('');

    const query = new URLSearchParams({
      from_date: dateRange.start,
      to_date: dateRange.end,
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

  const revenueMonths = Object.entries(revenue?.by_month ?? {});
  const largestMonth = Math.max(...revenueMonths.map(([, amount]) => amount), 1);

  return (
    <>
      <Head title="Reports & Analytics" />
      <AppLayout title="Reports & Analytics">
        <div className="space-y-6">
          <Card>
            <CardBody>
              <div className="flex flex-col items-end gap-4 lg:flex-row">
                <div className="w-full lg:max-w-xl">
                  <label className="mb-2 block text-sm font-medium text-neutral-700" htmlFor="report-start-date">
                    <Calendar className="mr-2 inline h-4 w-4" />
                    Reporting period
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input id="report-start-date" type="date" value={dateRange.start} max={dateRange.end}
                      onChange={(event) => setDateRange({ ...dateRange, start: event.target.value })}
                      className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-4 py-2 text-sm" />
                    <input id="report-end-date" type="date" value={dateRange.end} min={dateRange.start}
                      onChange={(event) => setDateRange({ ...dateRange, end: event.target.value })}
                      className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-4 py-2 text-sm" />
                  </div>
                </div>
                <div className="flex w-full gap-2 sm:w-auto">
                  <Button variant="secondary" onClick={() => void loadReports()} loading={loading} className="flex-1 sm:flex-none">
                    <RefreshCw className="h-4 w-4" />
                    Apply
                  </Button>
                  <Button variant="outline" onClick={exportReport} disabled={loading || !revenue} className="flex-1 sm:flex-none">
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700" role="alert">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4" aria-live="polite">
            <Stat title="Total Revenue" value={formatCurrency(revenue?.total_revenue ?? 0)} icon={<BarChart3 className="h-6 w-6" />} color="success" />
            <Stat title="Job Orders" value={jobOrders?.summary.total_orders ?? 0} icon={<BarChart3 className="h-6 w-6" />} color="primary" />
            <Stat title="Active Rentals" value={rentals?.summary.active_rentals ?? 0} icon={<BarChart3 className="h-6 w-6" />} color="warning" />
            <Stat title="Average Job Value" value={formatCurrency(jobOrders?.summary.average_order_value ?? 0)} icon={<BarChart3 className="h-6 w-6" />} color="neutral" />
          </div>

          <Card>
            <CardHeader title="Revenue Trend" subtitle="Completed job orders and rentals across the selected period" />
            <CardBody>
              {loading ? (
                <div className="flex h-64 items-center justify-center text-sm text-neutral-500">Loading revenue trend...</div>
              ) : revenueMonths.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-sm text-neutral-500">No completed revenue in this period.</div>
              ) : (
                <div className="flex h-64 items-end gap-3 overflow-x-auto border-b border-neutral-200 pb-7">
                  {revenueMonths.map(([month, amount]) => (
                    <div className="flex h-full min-w-14 flex-1 flex-col justify-end gap-2" key={month}>
                      <span className="text-center text-xs font-medium text-neutral-600">{formatCurrency(amount)}</span>
                      <div className="min-h-1 rounded-t bg-primary-600" style={{ height: `${Math.max((amount / largestMonth) * 100, 2)}%` }} title={`${month}: ${formatCurrency(amount)}`} />
                      <span className="text-center text-xs text-neutral-500">{month}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Job Orders" />
              <CardBody>
                <MetricRow label="Total orders" value={jobOrders?.summary.total_orders ?? 0} />
                <MetricRow label="Completed" value={jobOrders?.summary.completed_orders ?? 0} valueClassName="text-success-600" />
                <MetricRow label="In progress" value={jobOrders?.summary.by_status['in-progress'] ?? 0} valueClassName="text-primary-600" />
                <MetricRow label="Pending" value={jobOrders?.summary.by_status.pending ?? 0} valueClassName="text-warning-600" />
                <MetricRow label="Total value" value={formatCurrency(jobOrders?.summary.total_value ?? 0)} />
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Customers" />
              <CardBody>
                <MetricRow label="Customers created" value={customers?.summary.total_customers ?? 0} />
                <MetricRow label="Active customers" value={customers?.summary.active_customers ?? 0} valueClassName="text-success-600" />
                <MetricRow label="Total spending" value={formatCurrency(customers?.summary.total_spending ?? 0)} />
                <MetricRow label="Average spending" value={formatCurrency(customers?.summary.average_spending ?? 0)} />
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Rentals" />
              <CardBody>
                <MetricRow label="Total rentals" value={rentals?.summary.total_rentals ?? 0} />
                <MetricRow label="Active rentals" value={rentals?.summary.active_rentals ?? 0} valueClassName="text-primary-600" />
                <MetricRow label="Overdue rentals" value={rentals?.summary.overdue_rentals ?? 0} valueClassName="text-error-600" />
                <MetricRow label="Average rental value" value={formatCurrency(rentals?.summary.average_rental_value ?? 0)} />
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Revenue Mix" />
              <CardBody>
                <MetricRow label="Job order revenue" value={formatCurrency(revenue?.job_order_revenue ?? 0)} />
                <MetricRow label="Rental revenue" value={formatCurrency(revenue?.rental_revenue ?? 0)} />
                <MetricRow label="Completed job orders" value={revenue?.job_order_count ?? 0} />
                <MetricRow label="Completed rentals" value={revenue?.rental_count ?? 0} />
              </CardBody>
            </Card>
          </div>
        </div>
      </AppLayout>
    </>
  );
};

export default Reports;