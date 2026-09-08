import { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { AppLayout } from '../../Layouts/AppLayout';
import {
  History,
  Shield,
  ShieldAlert,
  Search,
  RefreshCw,
  Download,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Lock,
  UserCheck,
  Calendar,
  Database,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Laptop,
  Copy,
  Check
} from 'lucide-react';
import clsx from 'clsx';
import axios from 'axios';
import Modal from '../../Components/Modal';

interface AuditUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  loggable_type: string | null;
  loggable_id: number | null;
  description: string;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user?: AuditUser;
}

interface PaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  per_page: number;
  to: number;
  total: number;
}

interface Stats {
  total_logs: number;
  today_logs: number;
  security_events: number;
  unique_actors: number;
}

export default function LogsIndex() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    current_page: 1,
    from: 0,
    last_page: 1,
    per_page: 20,
    to: 0,
    total: 0,
  });
  const [stats, setStats] = useState<Stats>({
    total_logs: 0,
    today_logs: 0,
    security_events: 0,
    unique_actors: 0,
  });
  const [usersList, setUsersList] = useState<AuditUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filters State
  const [search, setSearch] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Inspection Modal State
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const fetchLogs = async (page = 1, showRefreshSpinner = false) => {
    if (showRefreshSpinner) setRefreshing(true);
    else setLoading(true);

    try {
      const params: Record<string, any> = {
        page,
        per_page: 20,
      };

      if (search.trim()) params.search = search.trim();
      if (selectedAction !== 'all') params.action = selectedAction;
      if (selectedUser !== 'all') params.user_id = selectedUser;
      if (selectedDateRange !== 'all') params.date_range = selectedDateRange;

      const res = await axios.get('/api/logs', { params });
      if (res.data) {
        setLogs(res.data.logs.data || []);
        setMeta({
          current_page: res.data.logs.current_page,
          from: res.data.logs.from || 0,
          last_page: res.data.logs.last_page,
          per_page: res.data.logs.per_page,
          to: res.data.logs.to || 0,
          total: res.data.logs.total,
        });
        if (res.data.stats) setStats(res.data.stats);
        if (res.data.users) setUsersList(res.data.users);
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Debounce search / filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchLogs(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedAction, selectedUser, selectedDateRange]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= meta.last_page) {
      setCurrentPage(newPage);
      fetchLogs(newPage);
    }
  };

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (selectedAction !== 'all') params.append('action', selectedAction);
    if (selectedUser !== 'all') params.append('user_id', selectedUser);
    if (selectedDateRange !== 'all') params.append('date_range', selectedDateRange);

    window.open(`/api/logs/export?${params.toString()}`, '_blank');
  };

  const handleOpenDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setIsModalOpen(true);
    setCopied(false);
  };

  const handleCopyJson = () => {
    if (!selectedLog) return;
    navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getActionBadge = (action: string) => {
    const act = action.toLowerCase();
    if (act === 'login') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" /> Login
        </span>
      );
    }
    if (act === 'logout') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
          Logout
        </span>
      );
    }
    if (act === 'failed_login' || act === 'blocked_login') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <AlertTriangle className="w-3 h-3" /> Security Alert
        </span>
      );
    }
    if (act === 'role_elevation') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <Shield className="w-3 h-3" /> Role Elevation
        </span>
      );
    }
    if (act === 'password_changed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
          <Lock className="w-3 h-3" /> Password Updated
        </span>
      );
    }
    if (act === 'created' || act === 'registered') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          Created
        </span>
      );
    }
    if (act === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          Approved
        </span>
      );
    }
    if (act === 'status_change') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          Status Change
        </span>
      );
    }
    if (act === 'deleted') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          Deleted
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-content-secondary border border-border-default/60">
        {action}
      </span>
    );
  };

  const formatEntity = (type: string | null, id: number | null) => {
    if (!type) return <span className="text-content-muted">System</span>;
    const cleanType = type.split('\\').pop() || type;
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-content-primary bg-surface-app px-2 py-0.5 rounded border border-border-default/50">
        {cleanType} {id ? `#${id}` : ''}
      </span>
    );
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return {
        formatted: date.toLocaleString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        relative: getRelativeTime(date),
      };
    } catch {
      return { formatted: dateStr, relative: '' };
    }
  };

  const getRelativeTime = (date: Date) => {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return `${Math.floor(diff / 604800)}w ago`;
  };

  return (
    <AppLayout title="Audit Logs">
      <Head title="System Audit Logs & Security Trail" />

      <div className="space-y-6 pb-12">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mb-1.5">
              <Shield className="w-3.5 h-3.5" /> Immutable Security Compliance Trail
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-content-primary sm:text-3xl">
              Audit Logs & Security Trail
            </h1>
            <p className="mt-1 text-sm text-content-secondary">
              Real-time audit log of identity, access, role changes, and workflow transactions across IntelliTrack.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchLogs(currentPage, true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-border-default bg-surface-card hover:bg-surface-app text-content-primary shadow-sm transition-all"
            >
              <RefreshCw className={clsx('w-3.5 h-3.5', refreshing && 'animate-spin text-emerald-500')} />
              Refresh
            </button>
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl border border-border-default/80 bg-surface-card/90 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">Total Events</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                <History className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-content-primary">{stats.total_logs}</p>
            <p className="mt-1 text-[11px] text-content-secondary">All-time recorded security & system activities</p>
          </div>

          <div className="p-5 rounded-2xl border border-border-default/80 bg-surface-card/90 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">Security & IAM</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <ShieldAlert className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-content-primary">{stats.security_events}</p>
            <p className="mt-1 text-[11px] text-content-secondary">Role changes, failed logins, credential events</p>
          </div>

          <div className="p-5 rounded-2xl border border-border-default/80 bg-surface-card/90 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">Active Actors</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <UserCheck className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-content-primary">{stats.unique_actors}</p>
            <p className="mt-1 text-[11px] text-content-secondary">Distinct authenticated accounts logged</p>
          </div>

          <div className="p-5 rounded-2xl border border-border-default/80 bg-surface-card/90 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">Today's Activity</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-content-primary">{stats.today_logs}</p>
            <p className="mt-1 text-[11px] text-content-secondary">Events logged within the past 24 hours</p>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 rounded-2xl border border-border-default/80 bg-surface-card shadow-sm space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search action, user, description, or IP address..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-border-default bg-surface-app text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Action Filter */}
            <div>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border-default bg-surface-app text-content-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              >
                <option value="all">All Event Types</option>
                <option value="security">Security & IAM Events</option>
                <option value="auth">Authentication (Logins/Logouts)</option>
                <option value="mutations">Data Mutations (Create/Update/Delete)</option>
                <option value="login">Logins Only</option>
                <option value="failed_login">Failed Logins</option>
                <option value="role_elevation">Role Elevations</option>
                <option value="status_change">Status Changes</option>
                <option value="password_changed">Password Changes</option>
                <option value="approved">Workflow Approvals</option>
                <option value="scheduled">Scheduling Events</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border-default bg-surface-app text-content-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              >
                <option value="all">All Time</option>
                <option value="today">Today (Last 24 Hours)</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          </div>

          {/* Secondary Row: Actor filter & active filters reset */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border-subtle text-xs">
            <div className="flex items-center gap-2">
              <span className="text-content-secondary font-medium">Filter by Actor:</span>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg border border-border-default bg-surface-app text-content-primary focus:outline-none"
              >
                <option value="all">All Operators & Users</option>
                {usersList.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {(search || selectedAction !== 'all' || selectedUser !== 'all' || selectedDateRange !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedAction('all');
                  setSelectedUser('all');
                  setSelectedDateRange('all');
                }}
                className="text-xs text-rose-500 hover:underline font-medium"
              >
                Reset all filters
              </button>
            )}
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="rounded-2xl border border-border-default/80 bg-surface-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-app/60 text-content-secondary font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Event Description</th>
                  <th className="py-3 px-4">Network / IP</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/70 text-content-primary">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-content-secondary">
                      <div className="inline-flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                        Loading audit logs...
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-content-secondary">
                      <History className="mx-auto h-8 w-8 text-content-muted opacity-40 mb-2" />
                      <p className="font-semibold">No audit logs found</p>
                      <p className="text-[11px] text-content-muted mt-0.5">
                        Try adjusting your search criteria or resetting filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const time = formatTimestamp(log.created_at);
                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-surface-app/50 transition-colors group cursor-pointer"
                        onClick={() => handleOpenDetail(log)}
                      >
                        {/* Timestamp */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <p className="font-medium text-content-primary">{time.formatted}</p>
                          <p className="text-[10px] text-content-muted">{time.relative}</p>
                        </td>

                        {/* Actor */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold text-white uppercase border border-slate-700">
                              {log.user?.name ? log.user.name.charAt(0) : 'S'}
                            </div>
                            <div>
                              <p className="font-semibold text-content-primary leading-tight">
                                {log.user?.name || 'System'}
                              </p>
                              <p className="text-[10px] text-content-muted">{log.user?.role || 'internal'}</p>
                            </div>
                          </div>
                        </td>

                        {/* Action Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getActionBadge(log.action)}
                        </td>

                        {/* Target Entity */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {formatEntity(log.loggable_type, log.loggable_id)}
                        </td>

                        {/* Description */}
                        <td className="py-3.5 px-4 max-w-md truncate">
                          <span className="font-medium text-content-primary">{log.description}</span>
                        </td>

                        {/* IP Address */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-mono text-[11px] text-content-secondary bg-surface-app px-2 py-0.5 rounded border border-border-default/40">
                            {log.ip_address || '127.0.0.1'}
                          </span>
                        </td>

                        {/* Inspect Button */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(log);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg text-content-secondary hover:text-emerald-500 hover:bg-surface-app border border-border-default/40 transition-all"
                          >
                            <Eye className="w-3 h-3" /> Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-border-subtle bg-surface-app/30 text-xs">
            <span className="text-content-secondary">
              Showing <span className="font-semibold text-content-primary">{meta.from}</span> to{' '}
              <span className="font-semibold text-content-primary">{meta.to}</span> of{' '}
              <span className="font-semibold text-content-primary">{meta.total}</span> events
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(meta.current_page - 1)}
                disabled={meta.current_page <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border-default bg-surface-card hover:bg-surface-app text-content-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>

              <span className="px-2 text-content-secondary font-medium">
                Page {meta.current_page} of {meta.last_page}
              </span>

              <button
                onClick={() => handlePageChange(meta.current_page + 1)}
                disabled={meta.current_page >= meta.last_page}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border-default bg-surface-card hover:bg-surface-app text-content-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Inspection Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Audit Event Inspection #${selectedLog?.id}`}
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-5 text-xs text-content-primary">
            {/* Header info */}
            <div className="p-4 rounded-xl bg-surface-app border border-border-default/60 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-content-muted">Event Summary</span>
                  <h4 className="text-sm font-bold text-content-primary mt-0.5">{selectedLog.description}</h4>
                </div>
                <div>{getActionBadge(selectedLog.action)}</div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border-subtle/80 text-[11px]">
                <div>
                  <span className="text-content-muted block">Actor</span>
                  <span className="font-semibold text-content-primary">{selectedLog.user?.name || 'System'}</span>
                </div>
                <div>
                  <span className="text-content-muted block">Role</span>
                  <span className="font-semibold text-content-primary">{selectedLog.user?.role || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-content-muted block">IP Address</span>
                  <span className="font-mono font-semibold text-content-primary">{selectedLog.ip_address || '127.0.0.1'}</span>
                </div>
                <div>
                  <span className="text-content-muted block">Recorded Time</span>
                  <span className="font-semibold text-content-primary">
                    {new Date(selectedLog.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Target Entity & Network Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-border-default/60 bg-surface-card space-y-1.5">
                <div className="flex items-center gap-2 text-content-secondary font-semibold">
                  <Database className="w-3.5 h-3.5" /> Target Resource
                </div>
                <div className="space-y-1 pt-1 text-[11px]">
                  <p>
                    <span className="text-content-muted">Entity Class:</span>{' '}
                    <span className="font-mono text-content-primary">{selectedLog.loggable_type || 'System'}</span>
                  </p>
                  <p>
                    <span className="text-content-muted">Entity ID:</span>{' '}
                    <span className="font-mono font-semibold text-content-primary">
                      {selectedLog.loggable_id ? `#${selectedLog.loggable_id}` : 'N/A'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border-default/60 bg-surface-card space-y-1.5">
                <div className="flex items-center gap-2 text-content-secondary font-semibold">
                  <Laptop className="w-3.5 h-3.5" /> Client User Agent
                </div>
                <div className="pt-1 text-[11px]">
                  <p className="font-mono text-[10px] text-content-secondary break-all bg-surface-app p-2 rounded border border-border-subtle">
                    {selectedLog.user_agent || 'Unknown Client Browser'}
                  </p>
                </div>
              </div>
            </div>

            {/* State Diffs (old_values vs new_values) */}
            {(selectedLog.old_values || selectedLog.new_values) && (
              <div className="space-y-2">
                <h5 className="font-bold text-xs text-content-primary flex items-center gap-1.5">
                  <ArrowUpDown className="w-3.5 h-3.5 text-emerald-500" /> State Payload & Change Diffs
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Previous State */}
                  <div className="p-3 rounded-xl border border-border-default/70 bg-surface-app/40 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
                      Previous Values (Before)
                    </span>
                    <pre className="text-[10px] font-mono bg-surface-card p-2.5 rounded-lg overflow-x-auto border border-border-subtle max-h-48">
                      {selectedLog.old_values
                        ? JSON.stringify(selectedLog.old_values, null, 2)
                        : '// No prior state recorded'}
                    </pre>
                  </div>

                  {/* New State */}
                  <div className="p-3 rounded-xl border border-border-default/70 bg-surface-app/40 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                      Applied Values (After)
                    </span>
                    <pre className="text-[10px] font-mono bg-surface-card p-2.5 rounded-lg overflow-x-auto border border-border-subtle max-h-48">
                      {selectedLog.new_values
                        ? JSON.stringify(selectedLog.new_values, null, 2)
                        : '// No new state payload recorded'}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* Copy raw event JSON button */}
            <div className="pt-2 flex justify-end gap-3 border-t border-border-subtle">
              <button
                type="button"
                onClick={handleCopyJson}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border-default bg-surface-card hover:bg-surface-app text-content-primary transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied JSON!' : 'Copy Event JSON'}
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
