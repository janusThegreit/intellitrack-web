import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';
import { formatPeso } from '../Utils/currency';
import {
  Users,
  Briefcase,
  MessageSquare,
  FileText,
  ClipboardList,
  Truck,
  FolderKanban,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  BrainCircuit,
  AlertTriangle,
  Clock,
  ChevronRight,
} from 'lucide-react';

interface DashboardData {
  total_customers: number;
  active_clients?: number;
  customer_inquiries?: number;
  pending_quotations?: number;
  active_job_orders: number;
  rental_requests?: number;
  active_rentals: number;
  overdue_rentals: number;
  active_projects: number;
  total_equipment: number;
  available_equipment: number;
  revenue_this_month: number;
  revenue_this_year: number;
  pending_notifications: number;
  completion_status: {
    total: number;
    completed: number;
    percentage: number;
  };
  top_customers: Array<{
    id: number;
    name: string;
    total_spending: number;
    job_orders_count: number;
  }>;
  recent_rentals: Array<{
    id: number;
    customer_name: string;
    equipment_name: string;
    status: string;
    rental_start_date: string;
    rental_end_date: string;
  }>;
  job_order_statuses?: Record<string, number>;
  project_statuses?: Record<string, number>;
  quotation_statuses?: Record<string, number>;
}

interface DashboardPageProps {
  data?: DashboardData;
}

type Period = 'week' | 'month' | 'quarter' | 'year';

const normalizeDashboardData = (d: DashboardData): DashboardData => ({
  ...d,
  revenue_this_month: Number(d.revenue_this_month ?? 0),
  revenue_this_year: Number(d.revenue_this_year ?? 0),
  top_customers: (d.top_customers ?? []).map(c => ({
    ...c,
    total_spending: Number(c.total_spending ?? 0),
    job_orders_count: c.job_orders_count ?? (c as { total_job_orders?: number }).total_job_orders ?? 0,
  })),
});

const TrendBadge = ({ value, suffix = '' }: { value: number; suffix?: string }) => {
  if (value === 0) return <span className="text-xs font-medium text-slate-400">0</span>;
  const positive = value > 0;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-semibold ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {positive ? '+' : ''}{value}{suffix}
    </span>
  );
};

interface KpiCardProps {
  title: string;
  value: string | number;
  trend?: number;
  trendSuffix?: string;
  icon: React.ReactNode;
  iconBg: string;
  href?: string;
}

const KpiCard = ({ title, value, trend, trendSuffix, icon, iconBg, href }: KpiCardProps) => (
  <a href={href ?? '#'} className="group block rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md">
    <div className="flex items-start justify-between">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
        {icon}
      </div>
      {trend !== undefined && <TrendBadge value={trend} suffix={trendSuffix} />}
    </div>
    <p className="mt-3 text-2xl font-bold text-slate-800">{value}</p>
    <p className="mt-0.5 text-sm text-slate-500">{title}</p>
  </a>
);

const StatusRow = ({ label, count, color }: { label: string; count: number; color: string }) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
    <div className="flex items-center gap-2">
      <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="text-sm text-slate-600">{label}</span>
    </div>
    <span className="text-sm font-semibold text-slate-800">{count}</span>
  </div>
);

const Dashboard = ({ data }: DashboardPageProps) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    data ? normalizeDashboardData(data) : null
  );
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<Period>('month');

  useEffect(() => {
    if (!data) {
      fetch('/api/dashboard/summary')
        .then(r => { if (!r.ok) throw new Error(); return r.json(); })
        .then(d => { setDashboardData(normalizeDashboardData(d)); setLoading(false); })
        .catch(() => { setError('Dashboard data could not be loaded.'); setLoading(false); });
    }
  }, [data]);

  if (!dashboardData) {
    return (
      <AppLayout title="Sales Dashboard">
        <div className="flex h-64 items-center justify-center">
          {loading ? (
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2563eb] border-t-transparent" />
          ) : (
            <p className="text-sm text-slate-500">{error || 'Loading...'}</p>
          )}
        </div>
      </AppLayout>
    );
  }

  const d = dashboardData;

  const kpiCards: KpiCardProps[] = [
    {
      title: 'Total Customers',
      value: d.total_customers,
      trend: 12,
      icon: <Users className="h-5 w-5 text-blue-600" />,
      iconBg: 'bg-blue-50',
      href: '/customers',
    },
    {
      title: 'Active Clients',
      value: d.active_clients ?? d.total_customers,
      trend: 4,
      icon: <Briefcase className="h-5 w-5 text-emerald-600" />,
      iconBg: 'bg-emerald-50',
      href: '/clients',
    },
    {
      title: 'Customer Inquiries',
      value: d.customer_inquiries ?? d.pending_notifications ?? 0,
      trend: -3,
      icon: <MessageSquare className="h-5 w-5 text-indigo-500" />,
      iconBg: 'bg-indigo-50',
      href: '/inquiries',
    },
    {
      title: 'Pending Quotations',
      value: d.pending_quotations ?? 0,
      trend: 6,
      icon: <FileText className="h-5 w-5 text-amber-500" />,
      iconBg: 'bg-amber-50',
      href: '/quotations',
    },
    {
      title: 'Active Job Orders',
      value: d.active_job_orders,
      trend: 2,
      icon: <ClipboardList className="h-5 w-5 text-violet-600" />,
      iconBg: 'bg-violet-50',
      href: '/job-orders',
    },
    {
      title: 'Rental Requests',
      value: d.rental_requests ?? d.active_rentals,
      trend: 1,
      icon: <Truck className="h-5 w-5 text-teal-600" />,
      iconBg: 'bg-teal-50',
      href: '/rental-requirements',
    },
    {
      title: 'Active Projects',
      value: d.active_projects,
      trend: 0,
      icon: <FolderKanban className="h-5 w-5 text-slate-500" />,
      iconBg: 'bg-slate-100',
      href: '/projects',
    },
    {
      title: 'Monthly Revenue',
      value: formatPeso(d.revenue_this_month),
      trend: 14,
      trendSuffix: '%',
      icon: <TrendingUp className="h-5 w-5 text-emerald-600" />,
      iconBg: 'bg-emerald-50',
      href: '/reports',
    },
  ];

  const jobOrderStatuses = d.job_order_statuses ?? { Draft: 2, Confirmed: 3, Scheduled: 2, Ongoing: 4, Completed: 18, Cancelled: 1 };
  const projectStatuses = d.project_statuses ?? { Planned: 1, Confirmed: 2, Ongoing: 3, 'On Hold': 1, Completed: 4 };
  const quotationStatuses = d.quotation_statuses ?? { Accepted: 8, Sent: 5, 'For Approval': 4, Draft: 3, Rejected: 2 };

  const jobStatusColors: Record<string, string> = { Draft: 'bg-slate-300', Confirmed: 'bg-blue-400', Scheduled: 'bg-indigo-400', Ongoing: 'bg-amber-400', Completed: 'bg-emerald-500', Cancelled: 'bg-red-400' };
  const projectStatusColors: Record<string, string> = { Planned: 'bg-slate-300', Confirmed: 'bg-blue-400', Ongoing: 'bg-amber-400', 'On Hold': 'bg-orange-400', Completed: 'bg-emerald-500' };
  const quotationStatusColors: Record<string, string> = { Accepted: 'bg-emerald-500', Sent: 'bg-blue-400', 'For Approval': 'bg-amber-400', Draft: 'bg-slate-300', Rejected: 'bg-red-400' };

  const periods: { key: Period; label: string }[] = [
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'quarter', label: 'Quarter' },
    { key: 'year', label: 'Year' },
  ];

  return (
    <>
      <Head title="Sales Dashboard" />
      <AppLayout title="Sales Dashboard">
        <div className="space-y-6">
          {/* Page header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Sales Dashboard</h1>
              <p className="mt-1 text-sm text-slate-500">Overview of sales, clients, transactions and operational activity</p>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-white p-1 ring-1 ring-slate-200 self-start">
              {periods.map(p => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPeriod(p.key)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${period === p.key ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* KPI cards 2-column grid */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {kpiCards.map(card => <KpiCard key={card.title} {...card} />)}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Sales Performance placeholder */}
            <div className="lg:col-span-2 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-800">Sales Performance</h2>
                  <p className="text-xs text-slate-400">Monthly revenue vs quotation activity</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-[#2563eb]" />Revenue</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-emerald-500" />Accepted</span>
                </div>
              </div>
              <div className="mt-4 h-40 flex items-end gap-2">
                {['Mar','Apr','May','Jun','Jul','Aug'].map((m, i) => (
                  <div key={m} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex gap-1 items-end" style={{ height: '120px' }}>
                      <div className="flex-1 rounded-t bg-[#2563eb]/20" style={{ height: `${[55,60,65,72,80,85][i]}%` }} />
                      <div className="flex-1 rounded-t bg-emerald-100" style={{ height: `${[30,35,40,45,50,55][i]}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-400">{m}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quotation Status */}
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h2 className="text-base font-semibold text-slate-800">Quotation Status</h2>
              <p className="text-xs text-slate-400">By status distribution</p>
              <div className="mt-4 space-y-1">
                {Object.entries(quotationStatuses).map(([label, count]) => (
                  <StatusRow key={label} label={label} count={count} color={quotationStatusColors[label] ?? 'bg-slate-300'} />
                ))}
              </div>
            </div>
          </div>

          {/* Status & AI Insights row */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Job Order Status */}
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h2 className="text-base font-semibold text-slate-800">Job Order Status</h2>
              <div className="mt-3 space-y-1">
                {Object.entries(jobOrderStatuses).map(([label, count]) => (
                  <StatusRow key={label} label={label} count={count} color={jobStatusColors[label] ?? 'bg-slate-300'} />
                ))}
              </div>
            </div>

            {/* Project Status */}
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h2 className="text-base font-semibold text-slate-800">Project Status</h2>
              <div className="mt-3 space-y-1">
                {Object.entries(projectStatuses).map(([label, count]) => (
                  <StatusRow key={label} label={label} count={count} color={projectStatusColors[label] ?? 'bg-slate-300'} />
                ))}
              </div>
            </div>

            {/* AI Insights */}
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <BrainCircuit className="h-4 w-4 text-violet-600" />
                <h2 className="text-base font-semibold text-slate-800">AI Insights</h2>
              </div>
              <div className="space-y-3">
                <div className="rounded-lg bg-amber-50 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-700">Opportunity Alert</span>
                  </div>
                  <p className="text-xs text-amber-600">12 active customers have recent inquiries but no quotation.</p>
                  <a href="/customers" className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-amber-700 hover:underline">View Customers <ChevronRight className="h-3 w-3" /></a>
                </div>
                <div className="rounded-lg bg-red-50 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-3.5 w-3.5 text-red-600" />
                    <span className="text-xs font-semibold text-red-700">Quotation Risk</span>
                  </div>
                  <p className="text-xs text-red-600">8 quotations are approaching their expiration date.</p>
                  <a href="/quotations" className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-red-700 hover:underline">Review Quotations <ChevronRight className="h-3 w-3" /></a>
                </div>
                <div className="rounded-lg bg-emerald-50 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-700">Sales Trend +14%</span>
                  </div>
                  <p className="text-xs text-emerald-600">Acceptance rate increased 14% vs last month.</p>
                  <a href="/ai-analytics" className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline">View Analytics <ChevronRight className="h-3 w-3" /></a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
};

export default Dashboard;
