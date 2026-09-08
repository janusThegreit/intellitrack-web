import { useEffect, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';
import {
  Users,
  MessageSquare,
  ClipboardList,
  Truck,
  FolderKanban,
  TrendingUp,
  UserPlus,
  FileEdit,
  Sparkles,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Wrench,
  Compass,
  DollarSign,
  Layers,
  Activity,
  ShieldCheck,
  Shield,
  History,
  Settings,
  Lock,
  AlertTriangle,
  Calendar,
  HardHat,
} from 'lucide-react';
import clsx from 'clsx';
import axios from 'axios';
import { StatusBadge } from '../Components/Badge';
import Button from '../Components/Button';

interface AdminSummary {
  total_users: number;
  active_users: number;
  inactive_users: number;
  roles_breakdown: {
    administrator: number;
    sales_manager: number;
    sales_business_development: number;
    staff: number;
    customer: number;
  };
  total_audit_logs: number;
  maintenance_mode: boolean;
  db_status: string;
  recent_audit_logs: Array<{
    id: number;
    user?: { name: string; email: string; role: string };
    action: string;
    description: string;
    ip_address?: string;
    created_at: string;
  }>;
}

interface SalesManagerSummary {
  ytd_revenue: number;
  prev_year_revenue: number;
  yoy_growth_pct: number;
  pipeline_value: number;
  win_rate: number;
  pending_approvals_count: number;
  pending_approvals: Array<{
    id: number;
    quotation_number: string;
    customer?: { id: number; name: string; company_name?: string };
    total_amount: number;
    valid_until?: string;
    submitted_at?: string;
    description?: string;
  }>;
  active_cranes_count: number;
  total_cranes_count: number;
  active_opportunities_count: number;
}

interface OperationsSummary {
  total_fleet: number;
  available_fleet: number;
  deployed_fleet: number;
  maintenance_fleet: number;
  tower_cranes_count: number;
  cranes_deployed: number;
  cranes_maintenance: number;
  cranes_available: number;
  active_job_orders_count: number;
  scheduled_maintenance_count: number;
  completed_maintenance_count: number;
  upcoming_maintenance: Array<{
    id: number;
    maintenance_type: string;
    description: string;
    scheduled_date: string;
    status: string;
    cost: number;
    findings?: string;
    equipment?: {
      id: number;
      name: string;
      code: string;
      category: string;
      status: string;
    };
    assignedTo?: {
      id: number;
      name: string;
      email: string;
    };
  }>;
  active_job_orders: Array<any>;
  active_projects: Array<any>;
  heavy_fleet: Array<{
    id: number;
    code: string;
    name: string;
    crane_model?: string;
    category: string;
    status: string;
    maximum_load?: string;
    maximum_load_unit?: string;
    location?: string;
  }>;
}

interface DashboardData {
  admin_summary?: AdminSummary | null;
  sales_manager_summary?: SalesManagerSummary | null;
  operations_summary?: OperationsSummary | null;
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
  completion_status?: {
    total: number;
    completed: number;
    percentage: number;
  };
  top_customers?: any[];
  recent_inquiries?: any[];
  recent_quotations?: any[];
  recent_job_orders?: any[];
  recent_projects?: any[];
  recent_rentals?: any[];
}

const Dashboard = () => {
  const { auth } = usePage<any>().props;
  const userRole = auth?.user?.role || (typeof window !== 'undefined' ? localStorage.getItem('intelitrack-user-role') : null) || '';
  const isAdmin = userRole === 'administrator' || userRole === 'admin';
  const isOperationsTechnical = userRole === 'operations_technical' || userRole === 'staff';

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

  const totalEquipment = data?.total_equipment || 24;
  const availableEquipment = data?.available_equipment || 18;
  const utilizationRate = totalEquipment > 0 ? Math.round(((totalEquipment - availableEquipment) / totalEquipment) * 100) : 65;

  if (loading) {
    if (isAdmin) {
      return (
        <AppLayout title="System Administration">
          <Head title="System Administration & IT Governance" />
          <div className="space-y-8 pb-12 animate-pulse">
            <div className="h-44 rounded-3xl bg-slate-900/60 border border-border-default/80 flex items-center justify-center p-8">
              <div className="flex items-center gap-3 text-indigo-300 text-sm font-medium">
                <ShieldCheck className="h-6 w-6 text-indigo-400 animate-spin" />
                <span>Initializing System Administration Console...</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-surface-card/60 border border-border-default/80" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-80 rounded-2xl bg-surface-card/60 border border-border-default/80 lg:col-span-1" />
              <div className="h-80 rounded-2xl bg-surface-card/60 border border-border-default/80 lg:col-span-2" />
            </div>
          </div>
        </AppLayout>
      );
    }

    if (isOperationsTechnical) {
      return (
        <AppLayout title="Fleet & Operations Command">
          <Head title="Heavy Fleet & Technical Operations Command" />
          <div className="space-y-8 pb-12 animate-pulse">
            <div className="h-44 rounded-3xl bg-slate-900/60 border border-border-default/80 flex items-center justify-center p-8">
              <div className="flex items-center gap-3 text-emerald-300 text-sm font-medium">
                <Wrench className="h-6 w-6 text-emerald-400 animate-spin" />
                <span>Loading Heavy Fleet Telemetry & Technical Operations Command...</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-surface-card/60 border border-border-default/80" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-80 rounded-2xl bg-surface-card/60 border border-border-default/80 lg:col-span-2" />
              <div className="h-80 rounded-2xl bg-surface-card/60 border border-border-default/80 lg:col-span-1" />
            </div>
          </div>
        </AppLayout>
      );
    }

    return (
      <AppLayout title="Executive Overview">
        <Head title="Executive Operations Dashboard" />
        <div className="space-y-8 pb-12 animate-pulse">
          <div className="h-44 rounded-3xl bg-slate-900/60 border border-border-default/80 flex items-center justify-center p-8">
            <div className="flex items-center gap-3 text-amber-300 text-sm font-medium">
              <Sparkles className="h-6 w-6 text-amber-400 animate-spin" />
              <span>Loading Commercial Operations & Fleet Portal...</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-surface-card/60 border border-border-default/80" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-80 rounded-2xl bg-surface-card/60 border border-border-default/80 lg:col-span-2" />
            <div className="h-80 rounded-2xl bg-surface-card/60 border border-border-default/80 lg:col-span-1" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (isAdmin || data?.admin_summary) {
    const admin: AdminSummary = data?.admin_summary ?? {
      total_users: 0,
      active_users: 0,
      inactive_users: 0,
      roles_breakdown: { administrator: 0, sales_manager: 0, sales_business_development: 0, staff: 0, customer: 0 },
      total_audit_logs: 0,
      maintenance_mode: false,
      db_status: 'Connected',
      recent_audit_logs: [],
    };
    return (
      <AppLayout title="System Administration">
        <Head title="System Administration & IT Governance" />

        <div className="space-y-8 pb-12">
          {/* Admin Hero Header */}
          <div className="relative overflow-hidden rounded-3xl border border-border-default/80 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-8 text-white shadow-xl backdrop-blur-xl">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-amber-500/15 blur-3xl" />

            <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-400/10 px-3.5 py-1 text-xs font-semibold text-indigo-300 backdrop-blur-sm">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" /> IT Governance & Security Framework
                </div>
                <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  System Administration Console
                </h1>
                <p className="mt-1 text-sm text-slate-400 max-w-xl">
                  Centralized management for Identity & Access (IAM), Role-Based Access Control (RBAC), Security Audit Logs, and Server Health.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-400 border border-emerald-500/20">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                    </span>
                    Database: PostgreSQL 17 (Connected)
                  </span>
                  <span className={clsx(
                    'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium border',
                    admin.maintenance_mode
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                  )}>
                    <Lock className="h-3 w-3" />
                    Maintenance Mode: {admin.maintenance_mode ? 'Active Lockdown' : 'Normal Operations'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/users">
                  <Button variant="primary" size="md" className="shadow-lg shadow-amber-500/20">
                    <UserPlus className="h-4 w-4" />
                    <span>Manage Users</span>
                  </Button>
                </Link>
                <Link href="/roles">
                  <Button variant="glass" size="md">
                    <Shield className="h-4 w-4 text-indigo-400" />
                    <span>Roles & RBAC</span>
                  </Button>
                </Link>
                <Link href="/logs">
                  <Button variant="glass" size="md">
                    <History className="h-4 w-4 text-emerald-400" />
                    <span>Audit Logs</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* 4 Admin KPI Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* KPI 1: System Accounts */}
            <div className="group relative overflow-hidden rounded-2xl border border-border-default/70 bg-surface-card/90 p-6 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">Total System Accounts</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold tracking-tight text-content-primary">
                  {admin.total_users}
                </span>
                <Link href="/users" className="text-xs font-semibold text-indigo-500 hover:underline flex items-center gap-0.5">
                  View IAM <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-content-secondary">
                <span className="text-emerald-500 font-semibold">{admin.active_users} Active</span>
                <span>•</span>
                <span className="text-content-muted">{admin.inactive_users} Inactive</span>
              </div>
            </div>

            {/* KPI 2: Access Roles */}
            <div className="group relative overflow-hidden rounded-2xl border border-border-default/70 bg-surface-card/90 p-6 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">Configured Roles</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Shield className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold tracking-tight text-content-primary">
                  4 Roles
                </span>
                <Link href="/roles" className="text-xs font-semibold text-amber-500 hover:underline flex items-center gap-0.5">
                  View Matrix <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              <p className="mt-3 text-xs text-content-secondary">
                Admin, Sales Manager, Sales BD, Staff
              </p>
            </div>

            {/* KPI 3: Security & Audit Trail */}
            <div className="group relative overflow-hidden rounded-2xl border border-border-default/70 bg-surface-card/90 p-6 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">Security Audit Logs</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <History className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold tracking-tight text-content-primary">
                  {admin.total_audit_logs}
                </span>
                <Link href="/logs" className="text-xs font-semibold text-emerald-500 hover:underline flex items-center gap-0.5">
                  Audit Trail <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              <p className="mt-3 text-xs text-content-secondary">
                Real-time activity audit trail logged
              </p>
            </div>

            {/* KPI 4: Infrastructure & Security */}
            <div className="group relative overflow-hidden rounded-2xl border border-border-default/70 bg-surface-card/90 p-6 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/50 hover:shadow-xl hover:shadow-violet-500/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">System Governance</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/20">
                  <Settings className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold tracking-tight text-content-primary">
                  Active
                </span>
                <Link href="/settings" className="text-xs font-semibold text-violet-500 hover:underline flex items-center gap-0.5">
                  Settings <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              <p className="mt-3 text-xs text-content-secondary">
                Separation of Duties (SoD) Active
              </p>
            </div>
          </div>

          {/* 2-Column Section: Role Matrix & SoD Architecture Framework */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Left: Role Distribution */}
            <div className="lg:col-span-7 rounded-3xl border border-border-default/80 bg-surface-card/90 p-6 shadow-sm backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-border-subtle/80 pb-4">
                <div>
                  <h3 className="text-base font-bold text-content-primary">Identity & Access Roles Distribution</h3>
                  <p className="text-xs text-content-secondary">Current active staff accounts segmented by organizational responsibility</p>
                </div>
                <Link href="/users" className="text-xs font-semibold text-indigo-500 hover:underline flex items-center gap-1">
                  Manage Users <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-app/40 border border-border-subtle/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 font-bold text-xs">
                      ADM
                    </div>
                    <div>
                      <p className="text-xs font-bold text-content-primary">Administrator (System Governance)</p>
                      <p className="text-[11px] text-content-secondary">IT infrastructure, user security, audit trail, system settings</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-content-primary px-3 py-1 rounded-full bg-surface-card border border-border-subtle">
                    {admin.roles_breakdown.administrator || 1} Accounts
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-app/40 border border-border-subtle/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 font-bold text-xs">
                      MGR
                    </div>
                    <div>
                      <p className="text-xs font-bold text-content-primary">Sales Manager (Approval & Operations)</p>
                      <p className="text-[11px] text-content-secondary">Quotation approval, job order assignment, AI analytics, BI reports</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-content-primary px-3 py-1 rounded-full bg-surface-card border border-border-subtle">
                    {admin.roles_breakdown.sales_manager || 0} Accounts
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-app/40 border border-border-subtle/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 font-bold text-xs">
                      SBD
                    </div>
                    <div>
                      <p className="text-xs font-bold text-content-primary">Sales Business Development (Frontline Sales)</p>
                      <p className="text-[11px] text-content-secondary">Client registration, inquiry intake, client communication, quotation drafting</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-content-primary px-3 py-1 rounded-full bg-surface-card border border-border-subtle">
                    {admin.roles_breakdown.sales_business_development || 0} Accounts
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-app/40 border border-border-subtle/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 font-bold text-xs">
                      OPS
                    </div>
                    <div>
                      <p className="text-xs font-bold text-content-primary">Operations & Technical Staff</p>
                      <p className="text-[11px] text-content-secondary">Equipment status, job order scheduling, crane maintenance logs</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-content-primary px-3 py-1 rounded-full bg-surface-card border border-border-subtle">
                    {admin.roles_breakdown.staff || 0} Accounts
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Separation of Duties & Architectural Framework Card */}
            <div className="lg:col-span-5 rounded-3xl border border-border-default/80 bg-surface-card/90 p-6 shadow-sm backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 border-b border-border-subtle/80 pb-4">
                  <ShieldCheck className="h-5 w-5 text-indigo-400" />
                  <div>
                    <h3 className="text-base font-bold text-content-primary">Separation of Duties (SoD)</h3>
                    <p className="text-xs text-content-secondary">Enterprise IT Architecture Standard</p>
                  </div>
                </div>

                <div className="mt-4 space-y-3.5 text-xs text-content-secondary">
                  <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3.5">
                    <p className="font-bold text-indigo-300">1. Operational Isolation</p>
                    <p className="mt-1 text-[11px] text-slate-300">
                      Ang Administrator ay hindi lumilikha ng commercial quotations, customer billing, o rental rates. Ito ay nakatalaga lamang sa Sales BD at Sales Manager.
                    </p>
                  </div>

                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
                    <p className="font-bold text-emerald-300">2. Immutable Audit Logging</p>
                    <p className="mt-1 text-[11px] text-slate-300">
                      Bawat account modification, role elevation, at login attempt ay recorded nang awtomatiko sa system audit trail.
                    </p>
                  </div>

                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
                    <p className="font-bold text-amber-300">3. Lockout Protection</p>
                    <p className="mt-1 text-[11px] text-slate-300">
                      Pinipigilan ng system policy ang pag-delete o deactivation ng huling aktibong Administrator account.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border-subtle">
                <Link href="/settings?tab=system" className="block w-full">
                  <Button variant="secondary" size="md" className="w-full justify-center">
                    <Settings className="h-4 w-4 mr-2" />
                    <span>System Settings & Maintenance Mode</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Security & Audit Trail */}
          <div className="rounded-3xl border border-border-default/80 bg-surface-card/90 p-6 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-border-subtle/80 pb-4">
              <div>
                <h3 className="text-base font-bold text-content-primary">Recent Security & Activity Audit Trail</h3>
                <p className="text-xs text-content-secondary">Real-time system events, logins, and administrative actions</p>
              </div>
              <Link href="/logs" className="text-xs font-semibold text-emerald-500 hover:underline flex items-center gap-1">
                View All Logs <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 divide-y divide-border-subtle/60">
              {admin.recent_audit_logs && admin.recent_audit_logs.length > 0 ? (
                admin.recent_audit_logs.map((log: any) => (
                  <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 hover:bg-surface-app/40 rounded-xl px-2 transition-colors gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Activity className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-content-primary">
                          {log.description || log.action}
                        </p>
                        <p className="text-[11px] text-content-secondary">
                          By: <span className="font-semibold text-content-primary">{log.user?.name || 'System / Authorized User'}</span> ({log.user?.role || 'user'})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      {log.ip_address && (
                        <span className="text-[10px] text-content-muted font-mono bg-surface-card px-2 py-0.5 rounded border border-border-subtle">
                          {log.ip_address}
                        </span>
                      )}
                      <span className="text-[11px] text-content-muted whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-content-secondary">
                  No recent audit events recorded.
                </div>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // =========================================================================
  // OPERATIONS & TECHNICAL STAFF DEDICATED COMMAND CENTER
  // =========================================================================
  if (isOperationsTechnical || (data?.operations_summary && !isAdmin && !data?.sales_manager_summary)) {
    const ops: OperationsSummary = data?.operations_summary ?? {
      total_fleet: totalEquipment,
      available_fleet: availableEquipment,
      deployed_fleet: totalEquipment - availableEquipment,
      maintenance_fleet: 1,
      tower_cranes_count: 5,
      cranes_deployed: 3,
      cranes_maintenance: 1,
      cranes_available: 1,
      active_job_orders_count: data?.active_job_orders || 0,
      scheduled_maintenance_count: 3,
      completed_maintenance_count: 1,
      upcoming_maintenance: [],
      active_job_orders: data?.recent_job_orders || [],
      active_projects: data?.recent_projects || [],
      heavy_fleet: [],
    };

    const opsUtilization = ops.total_fleet > 0 ? Math.round(((ops.total_fleet - ops.available_fleet) / ops.total_fleet) * 100) : 67;

    return (
      <AppLayout title="Fleet & Technical Operations">
        <Head title="Heavy Fleet & Technical Operations Command Center" />

        <div className="space-y-8 pb-12">
          {/* Operations Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-border-default/80 bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 p-8 text-white shadow-xl backdrop-blur-xl">
            {/* Ambient Glows */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-teal-500/15 blur-3xl" />

            <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3.5 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  </span>
                  Technical Operations Command Center
                </div>
                <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  Heavy Fleet & Operations Command
                </h1>
                <p className="mt-1 text-sm text-slate-300 max-w-xl">
                  Real-time tower crane telematics, active job order crew dispatch, preventative maintenance schedules, and rigging safety certifications.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Fleet Readiness: 100% Operational
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-2.5 py-1 font-medium text-blue-400 border border-blue-500/20">
                    <Activity className="h-3.5 w-3.5" />
                    Wind Velocity Monitoring: Active (≤45 km/h Standard)
                  </span>
                </div>
              </div>

              {/* Technical Quick Actions */}
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/equipment/maintenance">
                  <Button variant="primary" size="md" className="bg-[#ffcc00] hover:bg-[#ffcc00]/90 text-black font-bold shadow-lg shadow-amber-500/10">
                    <Wrench className="h-4 w-4 mr-1.5" />
                    <span>Schedule Maintenance</span>
                  </Button>
                </Link>
                <Link href="/job-orders/scheduling">
                  <Button variant="glass" size="md">
                    <Calendar className="h-4 w-4 mr-1.5 text-emerald-400" />
                    <span>Job Order Scheduling</span>
                  </Button>
                </Link>
                <Link href="/equipment">
                  <Button variant="glass" size="md">
                    <Truck className="h-4 w-4 mr-1.5 text-emerald-400" />
                    <span>Fleet Inventory</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Operations Telemetry KPI Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Fleet Availability */}
            <div className="group relative overflow-hidden rounded-2xl border border-border-default/80 bg-surface-card p-5 shadow-xs backdrop-blur-md transition-all duration-300 hover:border-emerald-500/50 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-content-secondary">Crane Fleet Availability</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Truck className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-content-primary tracking-tight font-mono">
                  {ops.available_fleet} <span className="text-sm font-normal text-content-secondary">/ {ops.total_fleet} Units Ready</span>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-content-secondary mb-1">
                    <span>Fleet Utilization</span>
                    <span className="font-bold text-emerald-400">{opsUtilization}% Deployed</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-surface-input overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500" 
                      style={{ width: `${opsUtilization}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
            </div>

            {/* Card 2: Tower Cranes Active In-Field */}
            <div className="group relative overflow-hidden rounded-2xl border border-border-default/80 bg-surface-card p-5 shadow-xs backdrop-blur-md transition-all duration-300 hover:border-blue-500/50 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-content-secondary">Tower Cranes In-Field</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Layers className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-content-primary tracking-tight font-mono">
                  {ops.cranes_deployed} <span className="text-sm font-normal text-content-secondary">Active on Sites</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[11px] font-bold text-blue-400">
                    <Activity className="h-3 w-3" />
                    {ops.tower_cranes_count} Heavy Cranes Configured
                  </span>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-content-secondary">
                {ops.cranes_available} units currently stationed at yard depot
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-indigo-500" />
            </div>

            {/* Card 3: Active Job Orders */}
            <div className="group relative overflow-hidden rounded-2xl border border-border-default/80 bg-surface-card p-5 shadow-xs backdrop-blur-md transition-all duration-300 hover:border-amber-500/50 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-content-secondary">Active Job Orders</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <ClipboardList className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-content-primary tracking-tight font-mono">
                  {ops.active_job_orders_count} <span className="text-sm font-normal text-content-secondary">In Execution</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[11px] font-bold text-amber-400">
                    <Clock className="h-3 w-3" />
                    Rigging & Operator Mobilized
                  </span>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-content-secondary">
                All scheduled work orders running on timetable
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-yellow-500" />
            </div>

            {/* Card 4: Preventative Maintenance Due */}
            <div className="group relative overflow-hidden rounded-2xl border border-border-default/80 bg-surface-card p-5 shadow-xs backdrop-blur-md transition-all duration-300 hover:border-purple-500/50 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-content-secondary">Maintenance & Inspections</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Wrench className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-content-primary tracking-tight font-mono">
                  {ops.scheduled_maintenance_count} <span className="text-sm font-normal text-content-secondary">Due / In-Progress</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    {ops.completed_maintenance_count} Certified this month
                  </span>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-content-secondary">
                Safety compliance load tests & inspections logged
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-indigo-500" />
            </div>
          </div>

          {/* Two-Column Heavy Assets & Maintenance Matrix */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            
            {/* Left: Heavy Crane Fleet Readiness (7 cols) */}
            <div className="lg:col-span-7 rounded-3xl border border-border-default/80 bg-surface-card/90 p-6 shadow-sm backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-border-subtle/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-content-primary">Heavy Crane Fleet Readiness & Telemetry</h3>
                      <p className="text-xs text-content-secondary">Real-time equipment availability, load capacities, and deployment</p>
                    </div>
                  </div>
                  <Link href="/equipment" className="text-xs font-semibold text-emerald-500 hover:underline flex items-center gap-1">
                    Fleet Catalog <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="mt-4 divide-y divide-border-subtle/60">
                  {ops.heavy_fleet && ops.heavy_fleet.length > 0 ? (
                    ops.heavy_fleet.map((crane) => (
                      <div key={crane.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 hover:bg-surface-app/40 rounded-xl px-2 transition-colors gap-3">
                        <div className="flex items-center gap-3">
                          <div className={clsx(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-xs shadow-sm",
                            crane.status === 'rented' ? "bg-blue-500/10 text-blue-400 border border-blue-500/30" :
                            crane.status === 'available' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" :
                            "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          )}>
                            <HardHat className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-content-primary">{crane.name}</p>
                              <span className="rounded bg-surface-input px-1.5 py-0.5 text-[10px] font-mono text-content-muted">
                                {crane.code}
                              </span>
                            </div>
                            <p className="text-[11px] text-content-secondary mt-0.5">
                              Model: {crane.crane_model || crane.category} • Max Load: <strong className="text-content-primary">{crane.maximum_load ? `${crane.maximum_load} ${crane.maximum_load_unit || 'Tons'}` : 'High Capacity'}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[10px] text-content-muted">
                            {crane.location || 'Metro Manila Depot'}
                          </span>
                          <span className={clsx(
                            "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                            crane.status === 'rented' ? "bg-blue-500/10 text-blue-400 border border-blue-500/30" :
                            crane.status === 'available' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" :
                            "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          )}>
                            {crane.status === 'rented' ? 'In-Field' : crane.status === 'available' ? 'Available' : 'Maintenance'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-content-secondary">
                      Loading heavy crane fleet records...
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border-subtle flex justify-between items-center text-xs">
                <span className="text-content-secondary">Ready for job order deployment and mobilization</span>
                <Link href="/equipment/availability" className="text-emerald-500 hover:underline font-semibold flex items-center gap-1">
                  Check Yard Availability <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Right: Preventative Maintenance & Safety Inspections (5 cols) */}
            <div className="lg:col-span-5 rounded-3xl border border-border-default/80 bg-surface-card/90 p-6 shadow-sm backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-border-subtle/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                      <Wrench className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-content-primary">Maintenance & Safety Inspections</h3>
                      <p className="text-xs text-content-secondary">Preventative schedules, wire rope tests, and repairs</p>
                    </div>
                  </div>
                  <Link href="/equipment/maintenance" className="text-xs font-semibold text-amber-500 hover:underline flex items-center gap-1">
                    All Tasks <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="mt-4 space-y-3">
                  {ops.upcoming_maintenance && ops.upcoming_maintenance.length > 0 ? (
                    ops.upcoming_maintenance.map((maint) => (
                      <div key={maint.id} className="rounded-xl border border-zinc-800/80 bg-surface-input/60 p-3.5 hover:border-zinc-700 transition">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={clsx(
                            "rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                            maint.maintenance_type === 'preventive' ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" :
                            maint.maintenance_type === 'corrective' ? "bg-rose-500/15 text-rose-400 border border-rose-500/30" :
                            "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          )}>
                            {maint.maintenance_type}
                          </span>
                          <span className={clsx(
                            "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                            maint.status === 'in-progress' ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" :
                            maint.status === 'completed' ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" :
                            "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                          )}>
                            {maint.status}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-content-primary">
                          {maint.equipment?.name || 'Heavy Crane Unit'}
                        </p>
                        <p className="text-[11px] text-content-secondary mt-0.5 line-clamp-2">
                          {maint.description}
                        </p>
                        <div className="mt-2.5 flex items-center justify-between text-[10px] text-content-muted border-t border-zinc-800/60 pt-2">
                          <span>Lead: <strong className="text-content-primary">{maint.assignedTo?.name || 'Engr. Marlon Ramos'}</strong></span>
                          <span>Due: {maint.scheduled_date ? new Date(maint.scheduled_date).toLocaleDateString() : 'Immediate'}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-content-secondary">
                      No pending crane maintenance tasks. All units certified.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border-subtle">
                <Link href="/equipment/maintenance" className="block w-full">
                  <Button variant="secondary" size="md" className="w-full justify-center">
                    <Wrench className="h-4 w-4 mr-2" />
                    <span>Open Crane Maintenance Log Manager</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Active Job Orders Table */}
          <div className="rounded-3xl border border-border-default/80 bg-surface-card/90 p-6 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-border-subtle/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-content-primary">Active Site Job Orders & Crew Mobilization</h3>
                  <p className="text-xs text-content-secondary">Job orders currently in scheduling, mobilization, or erection phase</p>
                </div>
              </div>
              <Link href="/job-orders" className="text-xs font-semibold text-blue-500 hover:underline flex items-center gap-1">
                View All Orders <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 divide-y divide-border-subtle/60">
              {ops.active_job_orders && ops.active_job_orders.length > 0 ? (
                ops.active_job_orders.map((job: any) => (
                  <div key={job.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 hover:bg-surface-app/40 rounded-xl px-2 transition-colors gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 font-bold text-xs">
                        JO
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-content-primary">{job.job_order_number || `JO-${job.id}`}</p>
                          <span className="text-[11px] text-content-muted">• {job.customer?.company_name || job.customer?.name || 'Project Client'}</span>
                        </div>
                        <p className="text-[11px] text-content-secondary">
                          Site / Scope: {job.site_location || job.description || 'Tower Crane Erection & Operation'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-[11px] text-content-muted">
                        Assigned: <strong className="text-content-primary">{job.assigned_to?.name || 'Technical Crew'}</strong>
                      </span>
                      <span className={clsx(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        job.status === 'in-progress' ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" :
                        job.status === 'completed' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" :
                        "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                      )}>
                        {job.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-content-secondary">
                  No active job orders recorded.
                </div>
              )}
            </div>
          </div>

          {/* Technical Safety & Compliance Protocols Banner */}
          <div className="rounded-3xl border border-border-default/80 bg-surface-card/90 p-6 shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-2 border-b border-border-subtle/80 pb-4">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <div>
                <h3 className="text-base font-bold text-content-primary">Crane Safety & Technical Compliance Protocols</h3>
                <p className="text-xs text-content-secondary">Standard operating guidelines for heavy rigging and tower crane operations</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3 text-xs">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="font-bold text-emerald-300">1. DOLE Crane Re-Certification</p>
                <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
                  Lahat ng tower crane at mobile rigging units ay dapat may updated annual DOLE load deflection certificate bago ma-deploy sa site.
                </p>
              </div>

              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                <p className="font-bold text-blue-300">2. Wind Velocity Stand-Down (≤ 45 km/h)</p>
                <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
                  Awtomatikong ititigil ang lifting operations kapag ang wind speed sensor (anemometer) sa dulo ng jib ay lumampas sa 45 km/h standard threshold.
                </p>
              </div>

              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
                <p className="font-bold text-purple-300">3. Wire Rope NDT Inspection</p>
                <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
                  Buwanang magnetic flux leak testing sa hoist cable at trolley reeving upang masigurong walang sirang strands bago ang mabibigat na buhat.
                </p>
              </div>
            </div>
          </div>

        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Executive Overview">
      <Head title="Executive Operations Dashboard" />

      <div className="space-y-8 pb-12">
        
        {/* Top Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-border-default/80 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-8 text-white shadow-xl backdrop-blur-xl">
          {/* Ambient Glows */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />

          <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1 text-xs font-semibold text-amber-300 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 animate-pulse" /> Live Fleet & Operations Intelligence
              </div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Commercial & Heavy Fleet Portal
              </h1>
              <p className="mt-1 text-sm text-slate-400 max-w-xl">
                Real-time visibility over tower crane specifications, active job orders, quotation pipeline, and heavy equipment allocation.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/quotations">
                <Button variant="primary" size="md" className="shadow-lg shadow-amber-500/20">
                  <FileEdit className="h-4 w-4" />
                  <span>Create Quotation</span>
                </Button>
              </Link>
              <Link href="/inquiries">
                <Button variant="glass" size="md">
                  <MessageSquare className="h-4 w-4 text-amber-400" />
                  <span>New Inquiry</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Sales Manager Executive AI Intelligence & Commercial Roll-Up Strip */}
        {data?.sales_manager_summary && (
          <div className="space-y-5">
            {/* AI Copilot Quick Prompt Launcher Banner */}
            <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-surface-card to-amber-500/5 dark:from-neutral-950 dark:via-neutral-900 dark:to-amber-950/40 p-5 shadow-sm backdrop-blur-xl">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-500/15 blur-2xl" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-neutral-950 font-black shadow-md shadow-amber-500/30">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-content-primary tracking-tight">IntelliTrack AI Sales Intelligence Copilot</h3>
                      <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold">
                        Real-Time Telemetry
                      </span>
                    </div>
                    <p className="text-xs text-content-secondary mt-0.5">
                      Itanong sa AI ang revenue improvement vs nakaraang taon, crane fleet demand, o pipeline forecast.
                    </p>
                  </div>
                </div>

                {/* Direct Prompt Triggers */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('open-sales-ai', { detail: { prompt: 'ano yung improvement nong nakaraan taon' } }))}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 transition shadow-xs cursor-pointer"
                  >
                    <TrendingUp className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Improvement nong nakaraan taon?</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('open-sales-ai', { detail: { prompt: 'aling crane ang pinakamalakas ang demand' } }))}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border-default bg-surface-card hover:bg-surface-app px-3 py-1.5 text-xs font-semibold text-content-primary transition shadow-xs cursor-pointer"
                  >
                    <Truck className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                    <span>Crane demand & rentals?</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('open-sales-ai', { detail: { prompt: 'may pending quotation approval ba tayo ngayon?' } }))}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border-default bg-surface-card hover:bg-surface-app px-3 py-1.5 text-xs font-semibold text-content-primary transition shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                    <span>Pending approvals?</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Commercial Performance Roll-Up Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Card 1: 2026 YTD Revenue with YoY Badge */}
              <div className="group relative overflow-hidden rounded-2xl border border-border-default/80 bg-surface-card dark:border-amber-500/30 dark:bg-gradient-to-b dark:from-neutral-900/90 dark:to-neutral-950/90 p-5 shadow-xs backdrop-blur-md transition-all duration-300 hover:border-amber-500/50 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-content-secondary">2026 YTD Settled Revenue</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-content-primary tracking-tight font-mono">
                    ₱{Number(data.sales_manager_summary.ytd_revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                      <TrendingUp className="h-3 w-3" />
                      +{data.sales_manager_summary.yoy_growth_pct}% vs 2025
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-content-secondary">
                  2025 Baseline: ₱{Number(data.sales_manager_summary.prev_year_revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600" />
              </div>

              {/* Card 2: Sales Pipeline Value */}
              <div className="group relative overflow-hidden rounded-2xl border border-border-default/80 bg-surface-card dark:border-blue-500/30 dark:bg-gradient-to-b dark:from-neutral-900/90 dark:to-neutral-950/90 p-5 shadow-xs backdrop-blur-md transition-all duration-300 hover:border-blue-500/50 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-content-secondary">Active Sales Pipeline</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <Layers className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-content-primary tracking-tight font-mono">
                    ₱{Number(data.sales_manager_summary.pipeline_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:text-blue-400">
                      Commercial Quotes
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-content-secondary">
                  Tracked proposals in active negotiation
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600" />
              </div>

              {/* Card 3: Crane Fleet Demand & Deployment */}
              <div className="group relative overflow-hidden rounded-2xl border border-border-default/80 bg-surface-card dark:border-indigo-500/30 dark:bg-gradient-to-b dark:from-neutral-900/90 dark:to-neutral-950/90 p-5 shadow-xs backdrop-blur-md transition-all duration-300 hover:border-indigo-500/50 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-content-secondary">Crane Fleet Utilization</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    <Truck className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-content-primary tracking-tight font-mono">
                    {data.sales_manager_summary.active_cranes_count} / {data.sales_manager_summary.total_cranes_count} Cranes
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-400">
                      {data.sales_manager_summary.total_cranes_count > 0 ? Math.round((data.sales_manager_summary.active_cranes_count / data.sales_manager_summary.total_cranes_count) * 100) : 0}% Deployed
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-content-secondary">
                  Tower & Mobile Cranes active on project sites
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-400 to-indigo-600" />
              </div>

              {/* Card 4: Manager Approvals Queue */}
              <div className="group relative overflow-hidden rounded-2xl border border-border-default/80 bg-surface-card dark:border-amber-500/40 dark:bg-gradient-to-b dark:from-neutral-900/90 dark:to-neutral-950/90 p-5 shadow-xs backdrop-blur-md transition-all duration-300 hover:border-amber-500/50 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-content-secondary">Manager Approval Radar</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    <FileEdit className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-content-primary tracking-tight font-mono">
                    {data.sales_manager_summary.pending_approvals_count} Proposals
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className={clsx(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold border',
                      data.sales_manager_summary.pending_approvals_count > 0
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400'
                        : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                    )}>
                      {data.sales_manager_summary.pending_approvals_count > 0 ? 'Awaiting Sign-off' : 'All Clear'}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-content-secondary">
                  Requires Sales Manager sign-off
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600" />
              </div>
            </div>

            {/* Manager Quotation Approval Radar Table / Cards */}
            {data.sales_manager_summary.pending_approvals && data.sales_manager_summary.pending_approvals.length > 0 && (
              <div className="rounded-2xl border border-border-default/80 dark:border-amber-500/40 bg-surface-card dark:bg-neutral-900/80 p-5 shadow-xs backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-2">
                    <FileEdit className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-content-primary">
                      Quotations Awaiting Sales Manager Sign-off ({data.sales_manager_summary.pending_approvals.length})
                    </h4>
                  </div>
                  <Link
                    href="/quotations"
                    className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 transition"
                  >
                    <span>View All Quotations</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="mt-3 divide-y divide-border-subtle">
                  {data.sales_manager_summary.pending_approvals.map((q) => (
                    <div key={q.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-700 dark:text-amber-400 text-xs">{q.quotation_number}</span>
                          <span className="text-xs font-semibold text-content-primary">{q.customer?.company_name || q.customer?.name || 'Client'}</span>
                          <span className="rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-1.5 py-0.5 border border-amber-500/30">
                            Under Review
                          </span>
                        </div>
                        <p className="text-xs text-content-secondary mt-1 line-clamp-1">
                          {q.description || 'Commercial crane rental and heavy equipment services proposal'}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-sm font-bold text-content-primary font-mono">
                          ₱{Number(q.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <Link
                          href="/quotations"
                          className="inline-flex items-center gap-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-3 py-1.5 text-xs transition shadow-xs"
                        >
                          <span>Review</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manager Action Alert: Quotations Awaiting Review */}
        {Number(data?.pending_quotations || 0) > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent p-4 text-amber-300 shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-bold">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  Action Required: {data?.pending_quotations} Commercial Proposal{Number(data?.pending_quotations) > 1 ? 's' : ''} Awaiting Manager Review
                </p>
                <p className="text-[11px] text-amber-300/80">
                  Proposals submitted by sales representatives require pricing review, specification check, or formal sign-off.
                </p>
              </div>
            </div>
            <Link
              href="/quotations"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 text-xs transition shadow-sm shrink-0"
            >
              <span>Review Proposals</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* Primary Metric KPI Cards Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* KPI 1: Active Customers */}
          <div className="group relative overflow-hidden rounded-2xl border border-border-default/70 bg-surface-card/90 p-6 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/5">
            <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-500/10 blur-xl transition-all group-hover:scale-150" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">Total Customers</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-content-primary">
                {loading ? '...' : (data?.total_customers ?? 0)}
              </span>
              <span className="text-xs font-semibold text-emerald-500 flex items-center">
                <TrendingUp className="h-3 w-3 mr-0.5" /> +12%
              </span>
            </div>
            <p className="mt-2 text-xs text-content-secondary">Active corporate & construction accounts</p>
          </div>

          {/* KPI 2: Active Job Orders */}
          <div className="group relative overflow-hidden rounded-2xl border border-border-default/70 bg-surface-card/90 p-6 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5">
            <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-500/10 blur-xl transition-all group-hover:scale-150" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">Active Job Orders</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                <ClipboardList className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-content-primary">
                {loading ? '...' : (data?.active_job_orders ?? 0)}
              </span>
              <span className="text-xs font-semibold text-blue-500 flex items-center">
                <Layers className="h-3 w-3 mr-0.5" /> In-Progress
              </span>
            </div>
            <p className="mt-2 text-xs text-content-secondary">Field dispatches & installations</p>
          </div>

          {/* KPI 3: Fleet Rentals */}
          <div className="group relative overflow-hidden rounded-2xl border border-border-default/70 bg-surface-card/90 p-6 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5">
            <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-500/10 blur-xl transition-all group-hover:scale-150" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">Active Rentals</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <Truck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-content-primary">
                {loading ? '...' : (data?.active_rentals ?? 0)}
              </span>
              <span className="text-xs font-semibold text-emerald-500 flex items-center">
                <CheckCircle2 className="h-3 w-3 mr-0.5" /> Deployed
              </span>
            </div>
            <p className="mt-2 text-xs text-content-secondary">Heavy cranes on project sites</p>
          </div>

          {/* KPI 4: Active Projects */}
          <div className="group relative overflow-hidden rounded-2xl border border-border-default/70 bg-surface-card/90 p-6 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/50 hover:shadow-xl hover:shadow-violet-500/5">
            <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-violet-500/10 blur-xl transition-all group-hover:scale-150" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">Projects</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/20">
                <FolderKanban className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-content-primary">
                {loading ? '...' : (data?.active_projects ?? 0)}
              </span>
              <span className="text-xs font-semibold text-violet-500 flex items-center">
                <Compass className="h-3 w-3 mr-0.5" /> Ongoing
              </span>
            </div>
            <p className="mt-2 text-xs text-content-secondary">Construction site contracts</p>
          </div>

        </div>

        {/* Middle Section: Fleet Availability Gauge & Operations Dispatch Dock */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          
          {/* Fleet Availability Card (7 cols) */}
          <div className="rounded-3xl border border-border-default/80 bg-surface-card/90 p-6 shadow-sm backdrop-blur-md lg:col-span-7">
            <div className="flex items-center justify-between border-b border-border-subtle/80 pb-4">
              <div>
                <h3 className="text-base font-bold text-content-primary">Fleet Utilization & Inventory Status</h3>
                <p className="text-xs text-content-secondary">Heavy equipment and tower crane allocation metrics</p>
              </div>
              <Link href="/rental-requirements" className="text-xs font-semibold text-amber-500 hover:underline flex items-center gap-1">
                View Fleet <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
              
              {/* Stat 1 */}
              <div className="rounded-2xl border border-border-subtle bg-surface-app/50 p-4">
                <p className="text-xs font-medium text-content-secondary">Total Fleet Size</p>
                <p className="mt-2 text-2xl font-extrabold text-content-primary">{data?.total_equipment || 24}</p>
                <div className="mt-2 flex items-center gap-1 text-[11px] text-content-muted">
                  <span>Tower & Mobile Cranes</span>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="rounded-2xl border border-border-subtle bg-surface-app/50 p-4">
                <p className="text-xs font-medium text-content-secondary">Available for Rental</p>
                <p className="mt-2 text-2xl font-extrabold text-emerald-500">{data?.available_equipment || 18}</p>
                <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> Ready to dispatch
                </div>
              </div>

              {/* Stat 3 */}
              <div className="rounded-2xl border border-border-subtle bg-surface-app/50 p-4">
                <p className="text-xs font-medium text-content-secondary">Fleet Utilization</p>
                <p className="mt-2 text-2xl font-extrabold text-amber-500">{utilizationRate}%</p>
                <div className="mt-2 flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                  <Activity className="h-3 w-3" /> High demand
                </div>
              </div>
            </div>

            {/* Visual Utilization Progress Bar */}
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-content-secondary">Fleet Deployment Capacity</span>
                <span className="text-amber-500">{utilizationRate}% Allocated</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-surface-input">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 shadow-sm transition-all duration-500" 
                  style={{ width: `${utilizationRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Operations Shortcuts (5 cols) */}
          <div className="rounded-3xl border border-border-default/80 bg-surface-card/90 p-6 shadow-sm backdrop-blur-md lg:col-span-5 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-content-primary">Quick Operations Dispatch</h3>
              <p className="text-xs text-content-secondary mt-0.5">Direct actions for field & sales teams</p>
              
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Link
                  href="/inquiries"
                  className="group flex flex-col justify-between rounded-2xl border border-border-default/70 bg-surface-input/50 p-4 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
                    <UserPlus className="h-4 w-4" />
                  </div>
                  <div className="mt-3">
                    <p className="text-xs font-bold text-content-primary">New Client</p>
                    <p className="text-[10px] text-content-secondary">Register account</p>
                  </div>
                </Link>

                <Link
                  href="/rental-requirements"
                  className="group flex flex-col justify-between rounded-2xl border border-border-default/70 bg-surface-input/50 p-4 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                    <Compass className="h-4 w-4" />
                  </div>
                  <div className="mt-3">
                    <p className="text-xs font-bold text-content-primary">Match Crane</p>
                    <p className="text-[10px] text-content-secondary">Specs calculator</p>
                  </div>
                </Link>

                <Link
                  href="/quotations"
                  className="group flex flex-col justify-between rounded-2xl border border-border-default/70 bg-surface-input/50 p-4 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <div className="mt-3">
                    <p className="text-xs font-bold text-content-primary">Draft Quote</p>
                    <p className="text-[10px] text-content-secondary">Pricing approval</p>
                  </div>
                </Link>

                <Link
                  href="/job-orders"
                  className="group flex flex-col justify-between rounded-2xl border border-border-default/70 bg-surface-input/50 p-4 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500 group-hover:scale-110 transition-transform">
                    <Wrench className="h-4 w-4" />
                  </div>
                  <div className="mt-3">
                    <p className="text-xs font-bold text-content-primary">Job Orders</p>
                    <p className="text-[10px] text-content-secondary">Dispatch crew</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Quick status notice */}
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border-subtle bg-surface-app/60 p-3.5 text-xs">
              <Clock className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-content-secondary">
                Maintenance window scheduled for fleet cranes every Sunday 02:00 AM UTC.
              </span>
            </div>
          </div>

        </div>

        {/* Bottom Split: Recent Quotations & Active Projects */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          
          {/* Recent Quotations */}
          <div className="rounded-3xl border border-border-default/80 bg-surface-card/90 p-6 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-border-subtle/80 pb-4">
              <div>
                <h3 className="text-base font-bold text-content-primary">Recent Quotations</h3>
                <p className="text-xs text-content-secondary">Commercial proposals and approval lifecycle</p>
              </div>
              <Link href="/quotations" className="text-xs font-semibold text-amber-500 hover:underline flex items-center gap-1">
                View All <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 divide-y divide-border-subtle/60">
              {(data?.recent_quotations && data.recent_quotations.length > 0) ? (
                data.recent_quotations.slice(0, 5).map((q: any) => (
                  <div key={q.id} className="flex items-center justify-between py-3.5 hover:bg-surface-app/40 rounded-xl px-2 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-content-primary">{q.quotation_number}</p>
                      <p className="text-[11px] text-content-secondary">{q.customer?.name || 'Customer'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-content-primary">
                        ₱{Number(q.total_amount || 0).toLocaleString()}
                      </span>
                      <StatusBadge status={q.status || 'draft'} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-content-secondary">
                  No recent quotations recorded.
                </div>
              )}
            </div>
          </div>

          {/* Active Construction Projects */}
          <div className="rounded-3xl border border-border-default/80 bg-surface-card/90 p-6 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-border-subtle/80 pb-4">
              <div>
                <h3 className="text-base font-bold text-content-primary">Active Site Projects</h3>
                <p className="text-xs text-content-secondary">On-going construction & tower crane installations</p>
              </div>
              <Link href="/projects" className="text-xs font-semibold text-amber-500 hover:underline flex items-center gap-1">
                View All <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 divide-y divide-border-subtle/60">
              {(data?.recent_projects && data.recent_projects.length > 0) ? (
                data.recent_projects.slice(0, 5).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between py-3.5 hover:bg-surface-app/40 rounded-xl px-2 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-content-primary">{p.project_name}</p>
                      <p className="text-[11px] text-content-secondary">{p.customer?.name || 'Construction Client'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs font-bold text-content-primary">{p.progress || 0}%</span>
                        <p className="text-[10px] text-content-muted">Milestone</p>
                      </div>
                      <StatusBadge status={p.status || 'active'} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-content-secondary">
                  No active projects recorded.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </AppLayout>
  );
};

export default Dashboard;
