import React, { useEffect, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';
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
  UserPlus,
  PhoneCall,
  FileEdit,
  ClipboardCheck,
  CalendarPlus,
  Rocket,
} from 'lucide-react';
import axios from 'axios';

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
  recent_inquiries?: any[];
  recent_quotations?: any[];
  recent_job_orders?: any[];
  recent_projects?: any[];
}

const TrendBadge = ({ value, suffix = '', text }: { value: number; suffix?: string, text?: string }) => {
  if (value === 0) return <span className="text-xs font-medium text-content-secondary">{text ?? '0'}</span>;
  const positive = value > 0;
  return (
    <span className={`flex items-center gap-0.5 text-[10px] font-semibold mt-2 ${positive ? 'text-emerald-500' : 'text-red-500'}`}>
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {positive ? '+' : ''}{value}{suffix} {text}
    </span>
  );
};

const StatusPill = ({ status }: { status: string }) => {
  const getStyle = () => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'approved':
      case 'completed':
        return 'text-emerald-400 border border-emerald-900/50 bg-emerald-900/10';
      case 'pending':
      case 'in progress':
      case 'ongoing':
        return 'text-amber-400 border border-amber-900/50 bg-amber-900/10';
      case 'draft':
      default:
        return 'text-content-secondary border border-border-subtle bg-zinc-900/50';
    }
  };
  return (
    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${getStyle()}`}>
      {status}
    </span>
  );
};

const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('/api/dashboard/summary');
        setData(response.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Map the API response to the KPI array structure, or fallback to 0/empty if loading
  const kpis = [
    { title: 'CUSTOMERS', value: data?.total_customers?.toString() || '0', sub: 'total', trend: 0, trendText: 'vs last week', icon: <Users className="h-3 w-3 text-brand" /> },
    { title: 'JOB ORDERS', value: data?.active_job_orders?.toString() || '0', sub: 'active', trend: 0, trendText: 'vs last week', icon: <ClipboardList className="h-3 w-3 text-brand" /> },
    { title: 'RENTALS', value: data?.active_rentals?.toString() || '0', sub: 'active', trend: 0, trendText: 'flat vs last week', icon: <Truck className="h-3 w-3 text-brand" /> },
    { title: 'OVERDUE RENTALS', value: data?.overdue_rentals?.toString() || '0', sub: 'overdue', trend: 0, trendText: 'action needed', icon: <Truck className="h-3 w-3 text-brand" /> },
    { title: 'PROJECTS', value: data?.active_projects?.toString() || '0', sub: 'ongoing', trend: 0, trendText: 'new this week', icon: <FolderKanban className="h-3 w-3 text-brand" /> },
    { title: 'REVENUE', value: `P${data?.revenue_this_month?.toLocaleString() || '0'}`, sub: 'this month', trend: 0, trendText: 'vs last month', icon: <TrendingUp className="h-3 w-3 text-brand" /> },
  ];

  const quickActions = [
    { label: 'Add Customer', icon: <UserPlus className="h-4 w-4" />, href: '/customers' },
    { label: 'Record Inquiry', icon: <PhoneCall className="h-4 w-4" />, href: '/inquiries' },
    { label: 'Create Quotation', icon: <FileEdit className="h-4 w-4" />, href: '/quotations' },
    { label: 'Create Job Order', icon: <ClipboardCheck className="h-4 w-4" />, href: '/job-orders' },
    { label: 'Create Rental Request', icon: <CalendarPlus className="h-4 w-4" />, href: '/rental-requirements' },
    { label: 'Create Project', icon: <Rocket className="h-4 w-4" />, href: '/projects' },
  ];

  // Use API data or fallback to empty arrays
  const inquiries = data?.recent_inquiries || [];
  const quotations = data?.recent_quotations || [];
  const jobOrders = data?.recent_job_orders || [];
  const projects = data?.recent_projects || [];

  const pipelineStages = ['Requested', 'Availability Check', 'Available', 'Confirmed', 'Scheduled', 'Ongoing'];
  const currentPipelineStage = 2; // 'Available' is active

  return (
    <>
      <Head title="Dashboard" />
      <AppLayout title="Dashboard" dark={true}>
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Main Content (Left, 3/4 width) */}
          <div className="flex-1 space-y-6">
            
            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {kpis.map((kpi, idx) => (
                <div key={idx} className="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-content-secondary tracking-wider">
                      {kpi.icon} {kpi.title}
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-bold text-white">{kpi.value}</span>
                      <span className="text-[10px] font-medium text-content-secondary">{kpi.sub}</span>
                    </div>
                  </div>
                  <TrendBadge value={kpi.trend} text={kpi.trendText} />
                </div>
              ))}
            </div>

            {/* Rental Requests Pipeline */}
            <div className="bg-surface-card border border-border-subtle rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-sm font-bold text-white">Rental Requests</h3>
                  <p className="text-[11px] text-content-secondary mt-1">Live fulfillment pipeline - 12 open requests</p>
                </div>
                <a href="#" className="text-[10px] font-semibold text-brand hover:underline">View all</a>
              </div>
              
              <div className="relative flex justify-between items-center px-4 md:px-8 max-w-4xl">
                {/* Connecting Line Base */}
                <div className="absolute left-8 right-8 top-[6px] h-[2px] bg-zinc-800 -z-10" />
                {/* Connecting Line Active */}
                <div 
                  className="absolute left-8 top-[6px] h-[2px] bg-brand -z-10 transition-all duration-500" 
                  style={{ width: `calc(${(currentPipelineStage / (pipelineStages.length - 1)) * 100}% - 2rem)` }} 
                />
                
                {pipelineStages.map((stage, idx) => {
                  const isActive = idx <= currentPipelineStage;
                  return (
                    <div key={stage} className="flex flex-col items-center gap-3 relative z-10 bg-surface-card">
                      <div className={`h-3.5 w-3.5 rounded-full border-2 ${isActive ? 'bg-brand border-brand shadow-[0_0_10px_rgba(255,204,0,0.4)]' : 'bg-surface-card border-border-default'}`} />
                      <span className={`absolute top-6 text-[9px] font-semibold text-center w-24 leading-tight ${isActive ? 'text-content-primary' : 'text-zinc-600'}`}>{stage}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tables Row 1: Inquiries & Quotations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
              
              {/* Recent Customer Inquiries */}
              <div className="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-sm font-bold text-content-primary">Recent Inquiries</h3>
                  <Link href="/inquiries" className="text-[10px] font-semibold text-brand hover:underline">View all</Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-content-secondary border-b border-border-subtle">
                        <th className="pb-3 font-semibold uppercase text-[9px] tracking-wider whitespace-nowrap">Inquiry ID</th>
                        <th className="pb-3 font-semibold uppercase text-[9px] tracking-wider whitespace-nowrap">Customer</th>
                        <th className="pb-3 font-semibold uppercase text-[9px] tracking-wider whitespace-nowrap">Source</th>
                        <th className="pb-3 font-semibold uppercase text-[9px] tracking-wider whitespace-nowrap">Inquiry</th>
                        <th className="pb-3 font-semibold uppercase text-[9px] tracking-wider whitespace-nowrap text-center">Status</th>
                        <th className="pb-3 font-semibold uppercase text-[9px] tracking-wider whitespace-nowrap text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {inquiries.length > 0 ? inquiries.map((inq: any) => (
                        <tr key={inq.id} className="text-content-primary hover:bg-surface-input transition">
                          <td className="py-3 text-content-secondary font-medium text-[10px] whitespace-nowrap">#{inq.id}</td>
                          <td className="py-3 font-semibold text-content-primary whitespace-nowrap pr-4">{inq.customer?.name || inq.customer_name}</td>
                          <td className="py-3 text-content-secondary whitespace-nowrap">{inq.source || 'Web'}</td>
                          <td className="py-3 whitespace-nowrap pr-4">{inq.subject || inq.inquiry_type || 'General Inquiry'}</td>
                          <td className="py-3 text-center whitespace-nowrap"><StatusPill status={inq.status} /></td>
                          <td className="py-3 text-right text-content-secondary text-[10px] whitespace-nowrap pl-2">{new Date(inq.created_at).toLocaleDateString()}</td>
                        </tr>
                      )) : <tr><td colSpan={6} className="py-4 text-center text-content-secondary">No recent inquiries</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Quotations */}
              <div className="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-sm font-bold text-white">Recent Quotations</h3>
                  <Link href="/quotations" className="text-[10px] font-semibold text-brand hover:underline">View all</Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-content-secondary border-b border-border-subtle">
                        <th className="pb-3 font-semibold uppercase text-[9px] tracking-wider whitespace-nowrap">Quotation No.</th>
                        <th className="pb-3 font-semibold uppercase text-[9px] tracking-wider whitespace-nowrap">Customer</th>
                        <th className="pb-3 font-semibold uppercase text-[9px] tracking-wider whitespace-nowrap">Project</th>
                        <th className="pb-3 font-semibold uppercase text-[9px] tracking-wider whitespace-nowrap">Amount</th>
                        <th className="pb-3 font-semibold uppercase text-[9px] tracking-wider whitespace-nowrap text-center">Status</th>
                        <th className="pb-3 font-semibold uppercase text-[9px] tracking-wider whitespace-nowrap text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {quotations.length > 0 ? quotations.map((qt: any) => (
                        <tr key={qt.id} className="text-content-primary hover:bg-surface-input transition">
                          <td className="py-3 text-content-secondary font-medium text-[10px] whitespace-nowrap">{qt.quotation_number || `#QT-${qt.id}`}</td>
                          <td className="py-3 font-semibold text-content-primary whitespace-nowrap pr-4">{qt.customer?.name}</td>
                          <td className="py-3 text-content-secondary whitespace-nowrap pr-4">{qt.project?.name || 'N/A'}</td>
                          <td className="py-3 font-medium whitespace-nowrap">P{Number(qt.total_amount).toLocaleString()}</td>
                          <td className="py-3 text-center whitespace-nowrap"><StatusPill status={qt.status} /></td>
                          <td className="py-3 text-right text-content-secondary text-[10px] whitespace-nowrap pl-2">{new Date(qt.created_at).toLocaleDateString()}</td>
                        </tr>
                      )) : <tr><td colSpan={6} className="py-4 text-center text-content-secondary">No recent quotations</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Tables Row 2: Job Orders & Projects */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Recent Job Orders */}
              <div className="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-sm font-bold text-white">Recent Job Orders</h3>
                  <Link href="/job-orders" className="text-[10px] font-semibold text-brand hover:underline">View all</Link>
                </div>
                <div className="space-y-4">
                  {jobOrders.length > 0 ? jobOrders.map((jo: any, idx: number) => (
                    <div key={jo.id} className="flex gap-3 group relative">
                      <div className="mt-1 flex flex-col items-center">
                        <div className={`h-2.5 w-2.5 rounded-full border-2 border-surface-app ring-1 ${jo.status === 'completed' ? 'bg-emerald-500 ring-emerald-500/50' : 'bg-brand ring-brand/50'}`} />
                        {idx !== jobOrders.length - 1 && <div className="w-[1px] h-full bg-border-subtle mt-1" />}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xs font-bold text-content-primary">{jo.jo_number || `JO-${jo.id}`}</h4>
                            <p className="text-[11px] text-content-secondary mt-0.5"><span className="font-medium text-content-primary">Client:</span> {jo.customer?.name}</p>
                            <p className="text-[10px] text-content-secondary mt-0.5">Project: {jo.project?.name || 'N/A'}</p>
                            <div className="mt-2">
                              <StatusPill status={jo.status} />
                            </div>
                          </div>
                          <span className="text-[10px] text-content-secondary">{new Date(jo.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  )) : <div className="text-center text-sm text-content-secondary py-4">No recent job orders</div>}
                </div>
              </div>

              {/* Projects */}
              <div className="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-sm font-bold text-white">Projects</h3>
                  <Link href="/projects" className="text-[10px] font-semibold text-brand hover:underline">View all</Link>
                </div>
                <div className="space-y-6">
                  {projects.length > 0 ? projects.map((proj: any, idx: number) => (
                    <div key={proj.id}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-xs font-bold text-content-primary">{proj.name || proj.title}</h4>
                          <p className="text-[10px] text-content-secondary mt-0.5">Client: {proj.customer?.name} • {new Date(proj.start_date).toLocaleDateString()} - {new Date(proj.end_date).toLocaleDateString()}</p>
                        </div>
                        <StatusPill status={proj.status} />
                      </div>
                      <div className="w-full bg-surface-input rounded-full h-1.5 overflow-hidden">
                        <div className={`h-1.5 rounded-full ${proj.status === 'completed' ? 'bg-emerald-500' : 'bg-brand'}`} style={{ width: `${proj.progress || 0}%` }} />
                      </div>
                    </div>
                  )) : <div className="text-center text-sm text-content-secondary py-4">No recent projects</div>}
                </div>
              </div>

            </div>

          </div>

          {/* Quick Actions Sidebar (Right, 1/4 width) */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-sm sticky top-24">
              <h3 className="text-sm font-bold text-white mb-1">Quick Actions</h3>
              <p className="text-[11px] text-content-secondary mb-5">Start a new record or request</p>
              
              <div className="space-y-2">
                {quickActions.map((action, idx) => (
                  <Link 
                    key={idx}
                    href={action.href}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-border-subtle bg-surface-app/30 text-content-secondary hover:text-content-primary hover:border-border-default hover:bg-surface-input transition group"
                  >
                    <span className="text-[11px] font-semibold">{action.label}</span>
                    <span className="text-content-secondary group-hover:text-brand transition-colors">{action.icon}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

        </div>
      </AppLayout>
    </>
  );
};

export default Dashboard;
