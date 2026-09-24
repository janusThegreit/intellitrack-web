import { useEffect, useState } from 'react';
import { AppLayout } from '../../Layouts/AppLayout';
import { 
  Search, UserPlus, Eye, Edit2, Trash2, X, Download,
  CheckCircle2, XCircle, Shield, Wrench, TrendingUp, Target,
  Truck, UserCheck, Mail, Phone, Key, Lock, Clock,
  Calendar, Activity, Sparkles, Check, AlertTriangle, RefreshCw,
  User as UserIcon, KeyRound, Copy, ShieldAlert
} from 'lucide-react';
import clsx from 'clsx';
import Modal from '../../Components/Modal';
import axios from 'axios';

interface User {
  id: number;
  name: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: string;
  is_active: boolean;
  last_login_at?: string;
  avatar_url?: string;
  created_at: string;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
  recent: number;
}

interface UserDossierData {
  user: User;
  metrics: {
    assigned_jobs: number;
    managed_projects: number;
    assigned_tasks: number;
    quotations: number;
    activity_logs: number;
  };
  recent_logs: Array<{
    id: number;
    action: string;
    description: string;
    created_at: string;
    ip_address?: string;
  }>;
}

interface PasswordResetRequestItem {
  id: number;
  user_id: number;
  email: string;
  reason?: string;
  status: 'pending' | 'approved' | 'used' | 'rejected' | 'expired';
  token?: string;
  requested_at: string;
  token_expires_at?: string;
  is_used: boolean;
  used_at?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    avatar_url?: string;
  };
  approved_by?: {
    id: number;
    name: string;
    email: string;
  };
}

interface RoleConfig {
  label: string;
  shortRole: string;
  border: string;
  text: string;
  bg: string;
  badgeBg: string;
  icon: any;
  description: string;
  clearanceLevel: string;
  scope: string;
  granted: string[];
  restricted: string[];
}

const ROLE_CONFIGS: Record<string, RoleConfig> = {
  administrator: {
    label: 'Administrator',
    shortRole: 'Superadmin',
    border: 'border-purple-500/40',
    text: 'text-purple-400',
    bg: 'bg-purple-950/30',
    badgeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    icon: Shield,
    description: 'Unrestricted IAM administrative authority across fleet assets, financial models, user credentials, and root configurations.',
    clearanceLevel: 'Tier 1 — Full System Superadmin',
    scope: 'IAM Governance & Strategic Operations',
    granted: [
      'Full User Management & Role Elevation (IAM)',
      'System Maintenance Mode & Emergency Broadcasts',
      'High-Value Quotation Final Approvals & Margin Overrides',
      'Fleet Logistics, Maintenance & Inventory Records',
      'Security Audit Log Inspection & Compliance Export',
      'Sales Intelligence AI Copilot Analytics',
    ],
    restricted: [],
  },
  operations_technical: {
    label: 'Operations & Technical Staff',
    shortRole: 'Operations & Tech',
    border: 'border-emerald-500/40',
    text: 'text-emerald-400',
    bg: 'bg-emerald-950/30',
    badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    icon: Wrench,
    description: 'Specialized heavy equipment monitoring, tower crane maintenance logs, inspection checklists, and job order scheduling & execution.',
    clearanceLevel: 'Tier 2 — Operations & Technical Authority',
    scope: 'Fleet Reliability, Crane Maintenance & Job Order Dispatch',
    granted: [
      'Heavy Equipment & Tower Crane Fleet Status Monitoring',
      'Preventative & Emergency Maintenance Scheduling',
      'Job Order Scheduling, Crew Dispatch & Task Checklists',
      'Equipment Mobilization & Return Demobilization Inspections',
      'Operational Dashboard Telemetry & Fleet Matrix',
      'Project Milestones & Logistics Task Management',
    ],
    restricted: [
      'User Account Creation & Role Modification (IAM)',
      'Quotation Discount & Financial Margin Overrides',
      'System Maintenance Mode & Root Configuration',
    ],
  },
  sales_manager: {
    label: 'Sales Manager',
    shortRole: 'Sales Manager',
    border: 'border-amber-500/40',
    text: 'text-amber-400',
    bg: 'bg-amber-950/30',
    badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    icon: TrendingUp,
    description: 'Commercial sales leadership, quotation approval workflows, deal pipeline governance, and client relationship management.',
    clearanceLevel: 'Tier 2 — Commercial Management Authority',
    scope: 'Quotation Approvals, Revenue Pipelines & Client Relations',
    granted: [
      'Quotation Creation, Pricing & Margin Approvals',
      'CRM Deals Pipeline & Opportunity Stage Tracking',
      'Customer 360 Relationship Profiles & Engagement',
      'Sales Performance Analytics & AI Copilot Insights',
      'Client Inquiry Conversion to Formal Quotations',
    ],
    restricted: [
      'Heavy Fleet Maintenance Log Modifications',
      'User Provisioning & IAM Security Governance',
    ],
  },
  sales_business_development: {
    label: 'Sales Business Development',
    shortRole: 'Sales BD',
    border: 'border-blue-500/40',
    text: 'text-blue-400',
    bg: 'bg-blue-950/30',
    badgeBg: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    icon: Target,
    description: 'Client prospecting, customer inquiry intake, initial draft quotation preparation, and communication logging.',
    clearanceLevel: 'Tier 3 — Field Sales & Client Acquisition',
    scope: 'Client Acquisition, Inquiry Intake & Lead Pipeline',
    granted: [
      'Client Inquiries Intake & Lead Follow-ups',
      'Draft Quotation Preparation & Submission',
      'Customer Profiles & Communications Log',
      'View Active Equipment Availability Catalog',
    ],
    restricted: [
      'Final Quotation Price Approval & Margin Override',
      'Fleet Maintenance Operations',
      'User Administration & Security Settings',
    ],
  },
  staff: {
    label: 'Operations Staff',
    shortRole: 'Field Staff',
    border: 'border-slate-500/40',
    text: 'text-slate-300',
    bg: 'bg-slate-900/30',
    badgeBg: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
    icon: Truck,
    description: 'Field operations staff responsible for job order checklists, on-site equipment handling, and task execution.',
    clearanceLevel: 'Tier 4 — Field Logistics & Support',
    scope: 'On-site Execution & Assigned Task Fulfillment',
    granted: [
      'Assigned Job Orders & Task Fulfillment Checklists',
      'Equipment Check-in / Demobilization Checklist',
      'Personal Profile & Account Activity View',
    ],
    restricted: [
      'Financial Quotations & Margin Controls',
      'User Management & System Settings',
      'Executive BI Reports',
    ],
  },
  customer: {
    label: 'Customer / Client Portal',
    shortRole: 'Client Portal',
    border: 'border-indigo-500/40',
    text: 'text-indigo-300',
    bg: 'bg-indigo-950/30',
    badgeBg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    icon: UserCheck,
    description: 'External client account with restricted visibility into company-specific rentals, active job orders, and approved quotations.',
    clearanceLevel: 'Tier 5 — External Client Access',
    scope: 'Client Self-Service & Rental Visibility',
    granted: [
      'View Own Approved Quotations & Rental Contracts',
      'Track Active Job Orders on Assigned Job Sites',
      'Submit Project Inquiries & Rental Requirements',
    ],
    restricted: [
      'Internal Fleet Maintenance Records',
      'All Other Client Accounts & Corporate Financials',
      'Internal System Management',
    ],
  },
};

const formatRole = (role: string) => {
  return ROLE_CONFIGS[role]?.label || role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const formatDateTime = (dateString?: string) => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getInitials = (name: string) => {
  if (!name) return '??';
  return name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

export default function UsersIndex() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0, recent: 0 });
  
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [dossierData, setDossierData] = useState<UserDossierData | null>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'operations_technical',
    password: '',
    is_active: true,
  });
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tab state: 'directory' or 'reset_requests'
  const [activeTab, setActiveTab] = useState<'directory' | 'reset_requests'>('directory');
  const [resetRequests, setResetRequests] = useState<PasswordResetRequestItem[]>([]);
  const [resetStats, setResetStats] = useState({ total: 0, pending: 0, approved: 0, used: 0 });
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [generatedLinkModal, setGeneratedLinkModal] = useState<{
    isOpen: boolean;
    request: PasswordResetRequestItem | null;
    resetUrl: string;
    copied: boolean;
  }>({
    isOpen: false,
    request: null,
    resetUrl: '',
    copied: false,
  });

  const loadResetRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await axios.get('/api/password-reset-requests');
      setResetRequests(res.data.requests || []);
      setResetStats(res.data.stats || { total: 0, pending: 0, approved: 0, used: 0 });
    } catch (err) {
      console.error('Failed to load password reset requests', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const generateOneTimeLink = async (item: PasswordResetRequestItem) => {
    try {
      const res = await axios.post(`/api/password-reset-requests/${item.id}/generate-link`);
      showToast('One-time password reset link generated successfully!');
      setGeneratedLinkModal({
        isOpen: true,
        request: res.data.request || item,
        resetUrl: res.data.reset_url,
        copied: false,
      });
      loadResetRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate reset link.');
    }
  };

  const copyLinkToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setGeneratedLinkModal(prev => ({ ...prev, copied: true }));
    showToast('Reset link copied to clipboard!');
    setTimeout(() => {
      setGeneratedLinkModal(prev => ({ ...prev, copied: false }));
    }, 2500);
  };

  const rejectResetRequest = async (item: PasswordResetRequestItem) => {
    if (!confirm(`Are you sure you want to reject the reset request for ${item.email}?`)) return;
    try {
      await axios.post(`/api/password-reset-requests/${item.id}/reject`);
      showToast('Password reset request has been rejected.');
      loadResetRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject request.');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const clearErrors = () => setErrors({});
  const resetForm = () => setFormData({ 
    name: '', 
    email: '', 
    phone: '', 
    role: 'operations_technical', 
    password: '', 
    is_active: true 
  });

  const load = () => {
    const query = new URLSearchParams();
    if (search) query.append('search', search);
    if (roleFilter !== 'all') query.append('role', roleFilter);
    if (statusFilter !== 'all') query.append('status', statusFilter);

    fetch(`/api/users?${query.toString()}`, { headers: { Accept: 'application/json' } })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        setUsers(data.users?.data || data.data || []);
        if (data.stats) setStats(data.stats);
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadResetRequests();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, roleFilter, statusFilter]);

  const openAddModal = () => {
    clearErrors();
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (user: User) => {
    clearErrors();
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      password: '',
      is_active: user.is_active,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const openViewModal = async (user: User) => {
    setViewUser(user);
    setDossierData(null);
    setIsViewModalOpen(true);
    setLoadingDossier(true);

    try {
      const res = await axios.get(`/api/users/${user.id}`);
      setDossierData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDossier(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password: pwd }));
    showToast('Secure temporary password generated!');
  };

  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    clearErrors();
    try {
      await axios.post('/api/users', formData);
      setIsAddModalOpen(false);
      showToast(`User ${formData.name} created successfully!`);
      load();
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const flatErrors: Record<string, string> = {};
        Object.entries(err.response.data.errors).forEach(([key, value]) => {
          flatErrors[key] = (value as string[])[0];
        });
        setErrors(flatErrors);
      } else if (err.response?.data?.message) {
        setErrors({ email: err.response.data.message });
      }
    } finally {
      setProcessing(false);
    }
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setProcessing(true);
    clearErrors();
    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        is_active: formData.is_active,
      };
      if (formData.password) {
        payload.password = formData.password;
      }
      await axios.put(`/api/users/${selectedUser.id}`, payload);
      setIsEditModalOpen(false);
      showToast(`User ${formData.name} updated successfully!`);
      load();
      if (viewUser && viewUser.id === selectedUser.id) {
        openViewModal({ ...viewUser, ...payload });
      }
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const flatErrors: Record<string, string> = {};
        Object.entries(err.response.data.errors).forEach(([key, value]) => {
          flatErrors[key] = (value as string[])[0];
        });
        setErrors(flatErrors);
      } else if (err.response?.data?.message) {
        setErrors({ email: err.response.data.message });
      }
    } finally {
      setProcessing(false);
    }
  };

  const toggleStatus = async (user: User) => {
    try {
      await axios.patch(`/api/users/${user.id}/status`, {
        is_active: !user.is_active
      });
      showToast(`User status updated to ${!user.is_active ? 'ACTIVE' : 'INACTIVE'}`);
      load();
      if (viewUser && viewUser.id === user.id) {
        setViewUser(prev => prev ? { ...prev, is_active: !prev.is_active } : null);
      }
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to update user status.');
    }
  };

  const submitDelete = async () => {
    if (!selectedUser) return;
    setProcessing(true);
    try {
      await axios.delete(`/api/users/${selectedUser.id}`);
      setIsDeleteModalOpen(false);
      showToast(`User ${selectedUser.name} deleted.`);
      load();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to delete user.');
    } finally {
      setProcessing(false);
    }
  };

  const exportUsersCsv = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Last Login', 'Created Date'];
    const rows = users.map(u => [
      u.id,
      `"${u.name.replace(/"/g, '""')}"`,
      `"${u.email}"`,
      `"${u.phone || 'N/A'}"`,
      `"${formatRole(u.role)}"`,
      u.is_active ? 'Active' : 'Inactive',
      `"${u.last_login_at ? formatDateTime(u.last_login_at) : 'Never'}"`,
      `"${formatDate(u.created_at)}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `intellitrack_users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported users to CSV file.');
  };

  return (
    <AppLayout showHeader={false}>
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/90 px-4 py-3 text-sm font-medium text-emerald-200 shadow-2xl backdrop-blur-md transition-all">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-content-primary sm:text-2xl">User Management & IAM</h1>
              <p className="text-xs text-content-secondary">
                Configure identity, role assignments, technical clearances, and system authorization.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportUsersCsv}
            className="flex items-center gap-1.5 rounded-lg border border-border-default bg-surface-card px-3.5 py-2 text-xs font-semibold text-content-secondary transition hover:border-amber-500/40 hover:text-content-primary"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-lg bg-[#ffcc00] px-4 py-2 text-xs font-bold text-black shadow-lg shadow-amber-500/10 transition hover:bg-[#ffcc00]/90 hover:scale-[1.01]"
          >
            <UserPlus className="h-4 w-4" />
            Add New User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-xl border border-border-subtle bg-surface-card p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-content-secondary">Total Accounts</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-input text-content-secondary">
              <UserIcon className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-content-primary font-mono">{stats.total}</p>
          <p className="mt-1 text-[11px] text-content-secondary">Configured system identities</p>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-border-subtle bg-surface-card p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Active Users</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-emerald-400 font-mono">{stats.active}</p>
          <p className="mt-1 text-[11px] text-emerald-400/80">Authorized & operational</p>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-border-subtle bg-surface-card p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-400">Inactive / Suspended</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-rose-400 font-mono">{stats.inactive}</p>
          <p className="mt-1 text-[11px] text-rose-400/80">Revoked / pending review</p>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-border-subtle bg-surface-card p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">Recently Onboarded</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-content-primary font-mono">
            {stats.recent} <span className="text-xs font-normal text-content-secondary">this month</span>
          </p>
          <p className="mt-1 text-[11px] text-content-secondary">New staff accounts added</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('directory')}
            className={clsx(
              'flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer',
              activeTab === 'directory'
                ? 'bg-[#ffcc00] text-black shadow-lg shadow-amber-500/20'
                : 'text-content-secondary hover:bg-surface-card hover:text-white'
            )}
          >
            <UserCheck className="h-4 w-4" />
            <span>User Directory & Clearances</span>
            <span className={clsx(
              'rounded-full px-2 py-0.5 text-[10px] font-mono',
              activeTab === 'directory' ? 'bg-black/20 text-black font-black' : 'bg-surface-input text-zinc-400'
            )}>
              {stats.total}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('reset_requests');
              loadResetRequests();
            }}
            className={clsx(
              'flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer relative',
              activeTab === 'reset_requests'
                ? 'bg-[#ffcc00] text-black shadow-lg shadow-amber-500/20'
                : 'text-content-secondary hover:bg-surface-card hover:text-white'
            )}
          >
            <KeyRound className="h-4 w-4" />
            <span>Password Reset Requests</span>
            {resetStats.pending > 0 ? (
              <span className="flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-black animate-pulse shadow-sm">
                <span>{resetStats.pending}</span>
                <span className="hidden sm:inline">PENDING</span>
              </span>
            ) : (
              <span className={clsx(
                'rounded-full px-2 py-0.5 text-[10px] font-mono',
                activeTab === 'reset_requests' ? 'bg-black/20 text-black font-black' : 'bg-surface-input text-zinc-400'
              )}>
                {resetStats.total}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'reset_requests' && (
          <button
            onClick={loadResetRequests}
            disabled={loadingRequests}
            className="flex items-center gap-1.5 rounded-lg border border-border-default px-3 py-1.5 text-xs text-content-secondary hover:bg-surface-card hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className={clsx('h-3.5 w-3.5', loadingRequests && 'animate-spin')} />
            <span>Refresh Requests</span>
          </button>
        )}
      </div>

      {/* Main Content Area - User Directory */}
      {activeTab === 'directory' && (
        <div className="rounded-xl border border-border-subtle bg-surface-card shadow-xl">
        
        {/* Filters Bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-b border-border-subtle p-4 sm:flex-row">
          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-secondary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, or role..."
                className="w-full rounded-lg border border-border-default bg-surface-input py-2 pl-9 pr-4 text-xs text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
            
            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-content-secondary">Role:</span>
              <select 
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-lg border border-border-default bg-surface-input py-1.5 pl-3 pr-8 text-xs text-white focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              >
                <option value="all">All Roles</option>
                <option value="administrator">Administrator</option>
                <option value="operations_technical">Operations & Technical Staff</option>
                <option value="sales_manager">Sales Manager</option>
                <option value="sales_business_development">Sales Business Dev</option>
                <option value="staff">Operations Staff</option>
                <option value="customer">Customer Portal</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-content-secondary">Status:</span>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-border-default bg-surface-input py-1.5 pl-3 pr-8 text-xs text-white focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive / Suspended</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSearch(''); setRoleFilter('all'); setStatusFilter('all'); }}
              title="Reset Filters"
              className="flex h-8 items-center gap-1.5 rounded-lg border border-border-default px-2.5 text-xs text-content-secondary hover:bg-border-subtle hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-content-secondary">
            <thead className="border-b border-border-subtle bg-surface-card text-[10px] font-bold uppercase tracking-wider text-content-secondary">
              <tr>
                <th className="px-6 py-3.5">User Identity</th>
                <th className="px-6 py-3.5">Assigned Role & IAM Clearance</th>
                <th className="px-6 py-3.5">Account Status</th>
                <th className="px-6 py-3.5">Last Active</th>
                <th className="px-6 py-3.5">Created Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {users.length > 0 ? users.map((user) => {
                const roleConfig = ROLE_CONFIGS[user.role] || ROLE_CONFIGS.staff;
                const RoleIcon = roleConfig.icon;

                return (
                  <tr 
                    key={user.id} 
                    className="group transition-colors hover:bg-zinc-800/30"
                  >
                    {/* User Identity */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={clsx(
                          "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-white shadow-md",
                          user.role === 'operations_technical' ? "bg-gradient-to-br from-emerald-600 to-teal-800" :
                          user.role === 'administrator' ? "bg-gradient-to-br from-purple-600 to-indigo-800" :
                          user.role === 'sales_manager' ? "bg-gradient-to-br from-amber-600 to-orange-800" :
                          user.role === 'sales_business_development' ? "bg-gradient-to-br from-blue-600 to-cyan-800" :
                          "bg-gradient-to-br from-slate-600 to-zinc-800"
                        )}>
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.name} className="h-full w-full rounded-xl object-cover" />
                          ) : (
                            getInitials(user.name)
                          )}
                          {/* Live Status indicator */}
                          <span className={clsx(
                            "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-zinc-900",
                            user.is_active ? "bg-emerald-500" : "bg-zinc-600"
                          )} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-100 group-hover:text-white">
                              {user.name}
                            </span>
                            <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-[9px] font-mono text-zinc-400">
                              #{user.id}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-content-secondary">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-zinc-500" />
                              {user.email}
                            </span>
                            {user.phone && (
                              <span className="flex items-center gap-1 text-zinc-500">
                                • {user.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role & Clearance */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={clsx(
                          "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold",
                          roleConfig.badgeBg
                        )}>
                          <RoleIcon className="h-3.5 w-3.5" />
                          {roleConfig.label}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {roleConfig.clearanceLevel.split('—')[0].trim()}
                        </span>
                      </div>
                    </td>

                    {/* Account Status */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleStatus(user)}
                        title={`Click to ${user.is_active ? 'suspend' : 'activate'} user`}
                        className={clsx(
                          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase transition hover:scale-105",
                          user.is_active 
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" 
                            : "border-rose-500/40 bg-rose-500/10 text-rose-400"
                        )}
                      >
                        <span className={clsx("h-1.5 w-1.5 rounded-full", user.is_active ? "bg-emerald-400 animate-pulse" : "bg-rose-400")} />
                        {user.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </td>

                    {/* Last Login */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Clock className="h-3.5 w-3.5 text-zinc-500" />
                        <span>{user.last_login_at ? formatDateTime(user.last_login_at) : 'Active recently'}</span>
                      </div>
                    </td>

                    {/* Created Date */}
                    <td className="px-6 py-4 text-content-secondary">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                        <span>{formatDate(user.created_at)}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Dossier */}
                        <button 
                          onClick={() => openViewModal(user)}
                          title="View User 360 Dossier & Permissions"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-default text-content-secondary transition hover:border-amber-400 hover:bg-amber-400/10 hover:text-amber-300"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Edit User */}
                        <button 
                          onClick={() => openEditModal(user)}
                          title="Edit User Profile & Role"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-default text-content-secondary transition hover:border-blue-400 hover:bg-blue-400/10 hover:text-blue-300"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        {/* Status Toggle */}
                        <button 
                          onClick={() => toggleStatus(user)} 
                          title={user.is_active ? "Deactivate User" : "Activate User"}
                          className={clsx(
                            "flex h-8 w-8 items-center justify-center rounded-lg border border-border-default transition hover:bg-border-subtle",
                            user.is_active ? "text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/10" : "text-rose-400 hover:border-rose-500/50 hover:bg-rose-500/10"
                          )}
                        >
                          {user.is_active ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                        </button>

                        {/* Delete User */}
                        <button 
                          onClick={() => openDeleteModal(user)} 
                          title="Delete User Account"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-default text-content-secondary transition hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-content-secondary">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="h-8 w-8 text-zinc-600" />
                      <p className="text-sm font-semibold text-zinc-400">No users found</p>
                      <p className="text-xs text-zinc-500">Try adjusting your search criteria or role filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Main Content Area - Password Reset Requests */}
      {activeTab === 'reset_requests' && (
        <div className="space-y-6">
          {/* Reset Request Metrics Summary */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Pending Review</p>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-black text-amber-300 font-mono">{resetStats.pending}</p>
              <p className="mt-1 text-[11px] text-amber-400/80">Awaiting admin link generation</p>
            </div>

            <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-400">Active Links Issued</p>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <KeyRound className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-black text-blue-300 font-mono">{resetStats.approved}</p>
              <p className="mt-1 text-[11px] text-blue-400/80">Single-use links valid for 24h</p>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Completed & Burned</p>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-black text-emerald-300 font-mono">{resetStats.used}</p>
              <p className="mt-1 text-[11px] text-emerald-400/80">Password updated & link expired</p>
            </div>

            <div className="rounded-xl border border-border-subtle bg-surface-card p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-content-secondary">Total Requests Logged</p>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-input text-content-secondary">
                  <Shield className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-black text-content-primary font-mono">{resetStats.total}</p>
              <p className="mt-1 text-[11px] text-content-secondary">Audited reset requests</p>
            </div>
          </div>

          {/* Reset Requests Table Card */}
          <div className="rounded-xl border border-border-subtle bg-surface-card shadow-xl overflow-hidden">
            <div className="border-b border-border-subtle p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-[#ffcc00]" />
                    <span>User Password Reset Authorization Log</span>
                  </h2>
                  <p className="text-xs text-content-secondary mt-1">
                    When you generate a link, provide it to the user. The link will automatically deactivate permanently once the user updates their password.
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-content-secondary">
                <thead className="border-b border-border-subtle bg-surface-card text-[10px] font-bold uppercase tracking-wider text-content-secondary">
                  <tr>
                    <th className="px-6 py-3.5">Requester Identity</th>
                    <th className="px-6 py-3.5">Request Reason / Remarks</th>
                    <th className="px-6 py-3.5">Date & Time</th>
                    <th className="px-6 py-3.5">Status & Single-Use State</th>
                    <th className="px-6 py-3.5 text-right">Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                  {resetRequests.length > 0 ? (
                    resetRequests.map((req) => {
                      const isPending = req.status === 'pending';
                      const isApproved = req.status === 'approved' && !req.is_used;
                      const isUsed = req.is_used || req.status === 'used';
                      const isExpired = req.status === 'expired';
                      const isRejected = req.status === 'rejected';

                      return (
                        <tr key={req.id} className="group transition-colors hover:bg-zinc-800/30">
                          {/* Requester Identity */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 font-bold text-white shadow-sm">
                                {getInitials(req.user?.name || req.email)}
                              </div>
                              <div>
                                <p className="font-bold text-white">{req.user?.name || 'Account Identity'}</p>
                                <p className="text-[11px] text-zinc-400 font-mono">{req.email}</p>
                                {req.user?.role && (
                                  <span className="inline-block mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-400">
                                    {formatRole(req.user.role)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Reason */}
                          <td className="px-6 py-4 max-w-xs">
                            <p className="text-zinc-300 text-xs truncate" title={req.reason}>
                              {req.reason || 'User requested password reset from login.'}
                            </p>
                          </td>

                          {/* Time */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-zinc-300 font-medium">{formatDateTime(req.requested_at)}</p>
                            {req.used_at && (
                              <p className="text-[10px] text-emerald-400 font-mono">
                                Used: {formatDateTime(req.used_at)}
                              </p>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isPending && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-300 border border-amber-500/30">
                                <Clock className="h-3 w-3 animate-spin" />
                                <span>Pending Action</span>
                              </span>
                            )}
                            {isApproved && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-300 border border-blue-500/30">
                                <KeyRound className="h-3 w-3" />
                                <span>Link Active (Unused)</span>
                              </span>
                            )}
                            {isUsed && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Completed &amp; Burned</span>
                              </span>
                            )}
                            {isExpired && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-400 border border-slate-700">
                                <Clock className="h-3 w-3" />
                                <span>Expired (&gt;24h)</span>
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-400 border border-rose-500/30">
                                <XCircle className="h-3 w-3" />
                                <span>Rejected</span>
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              {isPending && (
                                <>
                                  <button
                                    onClick={() => generateOneTimeLink(req)}
                                    className="flex items-center gap-1.5 rounded-lg bg-[#ffcc00] hover:bg-[#ffcc00]/90 px-3 py-1.5 text-xs font-bold text-black shadow-md shadow-amber-500/10 transition-all hover:scale-[1.02] cursor-pointer"
                                  >
                                    <KeyRound className="h-3.5 w-3.5" />
                                    <span>Generate Link</span>
                                  </button>
                                  <button
                                    onClick={() => rejectResetRequest(req)}
                                    className="rounded-lg border border-border-default px-2.5 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-colors cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              {isApproved && (
                                <button
                                  onClick={() => {
                                    const fullUrl = req.token ? `${window.location.origin}/reset-password/${req.token}` : '';
                                    setGeneratedLinkModal({
                                      isOpen: true,
                                      request: req,
                                      resetUrl: fullUrl,
                                      copied: false,
                                    });
                                  }}
                                  className="flex items-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 text-xs font-bold text-blue-300 transition-colors cursor-pointer"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                  <span>View / Copy Link</span>
                                </button>
                              )}

                              {isUsed && (
                                <span className="text-[11px] text-zinc-500 italic">
                                  Link deactivated after single use
                                </span>
                              )}

                              {(isExpired || isRejected) && (
                                <span className="text-[11px] text-zinc-500 italic">
                                  Awaiting new user request
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-content-secondary">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-input text-zinc-500">
                            <KeyRound className="h-6 w-6" />
                          </div>
                          <p className="text-sm font-semibold text-zinc-300">No password reset requests</p>
                          <p className="text-xs text-zinc-500">
                            When users request a password reset from the login page, their requests will appear here for administrator authorization.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* USER 360 PROFILE & IAM DOSSIER MODAL */}
      {/* ========================================================================= */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} size="2xl">
        {viewUser && (() => {
          const roleConfig = ROLE_CONFIGS[viewUser.role] || ROLE_CONFIGS.staff;
          const RoleIcon = roleConfig.icon;

          return (
            <div className="flex flex-col bg-surface-card text-white">
              {/* Header Banner */}
              <div className="relative border-b border-border-subtle bg-gradient-to-r from-zinc-900 via-zinc-800/80 to-zinc-900 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {/* Big Avatar */}
                    <div className={clsx(
                      "relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-black text-white shadow-xl ring-2",
                      viewUser.role === 'operations_technical' ? "bg-gradient-to-br from-emerald-600 to-teal-800 ring-emerald-500/50" :
                      viewUser.role === 'administrator' ? "bg-gradient-to-br from-purple-600 to-indigo-800 ring-purple-500/50" :
                      viewUser.role === 'sales_manager' ? "bg-gradient-to-br from-amber-600 to-orange-800 ring-amber-500/50" :
                      viewUser.role === 'sales_business_development' ? "bg-gradient-to-br from-blue-600 to-cyan-800 ring-blue-500/50" :
                      "bg-gradient-to-br from-slate-600 to-zinc-800 ring-slate-500/50"
                    )}>
                      {viewUser.avatar_url ? (
                        <img src={viewUser.avatar_url} alt={viewUser.name} className="h-full w-full rounded-2xl object-cover" />
                      ) : (
                        getInitials(viewUser.name)
                      )}
                      <span className={clsx(
                        "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-zinc-900",
                        viewUser.is_active ? "bg-emerald-400 ring-2 ring-emerald-400/20" : "bg-rose-500"
                      )} />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-bold text-white">{viewUser.name}</h2>
                        <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs font-mono text-zinc-400">
                          #USR-{viewUser.id.toString().padStart(4, '0')}
                        </span>
                        <span className={clsx(
                          "rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                          viewUser.is_active ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-rose-500/40 bg-rose-500/10 text-rose-400"
                        )}>
                          {viewUser.is_active ? 'ACTIVE ACCOUNT' : 'INACTIVE / SUSPENDED'}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-zinc-500" />
                          {viewUser.email}
                        </span>
                        {viewUser.phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-zinc-500" />
                            {viewUser.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                          Joined {formatDate(viewUser.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setIsViewModalOpen(false)}
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Role Badge Banner */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
                  <div className="flex items-center gap-2.5">
                    <div className={clsx("flex h-8 w-8 items-center justify-center rounded-lg border", roleConfig.border, roleConfig.bg)}>
                      <RoleIcon className={clsx("h-4 w-4", roleConfig.text)} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{roleConfig.label}</p>
                      <p className="text-[11px] text-zinc-400">{roleConfig.scope}</p>
                    </div>
                  </div>
                  <span className={clsx("rounded-md border px-2.5 py-1 text-[11px] font-semibold", roleConfig.badgeBg)}>
                    {roleConfig.clearanceLevel}
                  </span>
                </div>
              </div>

              {/* Dossier Body */}
              <div className="max-h-[60vh] space-y-5 overflow-y-auto p-6">
                {/* Role Summary */}
                <div className="rounded-xl border border-border-subtle bg-surface-input p-4">
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Role Scope & Authorization</p>
                  <p className="mt-1 text-xs text-zinc-300 leading-relaxed">
                    {roleConfig.description}
                  </p>
                </div>

                {/* Operational Telemetry KPIs */}
                <div>
                  <h4 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-zinc-400">System Activity & Allocation</h4>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-border-subtle bg-zinc-900/50 p-3.5 text-center">
                      <p className="text-[10px] font-semibold uppercase text-zinc-400">Assigned Job Orders</p>
                      <p className="mt-1 text-2xl font-bold text-emerald-400">
                        {loadingDossier ? '...' : (dossierData?.metrics.assigned_jobs ?? 0)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border-subtle bg-zinc-900/50 p-3.5 text-center">
                      <p className="text-[10px] font-semibold uppercase text-zinc-400">Managed Projects</p>
                      <p className="mt-1 text-2xl font-bold text-blue-400">
                        {loadingDossier ? '...' : (dossierData?.metrics.managed_projects ?? 0)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border-subtle bg-zinc-900/50 p-3.5 text-center">
                      <p className="text-[10px] font-semibold uppercase text-zinc-400">Assigned Tasks</p>
                      <p className="mt-1 text-2xl font-bold text-amber-400">
                        {loadingDossier ? '...' : (dossierData?.metrics.assigned_tasks ?? 0)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border-subtle bg-zinc-900/50 p-3.5 text-center">
                      <p className="text-[10px] font-semibold uppercase text-zinc-400">Audit Logs Logged</p>
                      <p className="mt-1 text-2xl font-bold text-purple-400">
                        {loadingDossier ? '...' : (dossierData?.metrics.activity_logs ?? 0)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Granted vs Restricted Permissions Matrix */}
                <div>
                  <h4 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-zinc-400">IAM Permissions & Access Controls</h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Granted */}
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4">
                      <div className="mb-2.5 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-300">Authorized Capabilities ({roleConfig.granted.length})</span>
                      </div>
                      <ul className="space-y-2">
                        {roleConfig.granted.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Restricted */}
                    <div className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-4">
                      <div className="mb-2.5 flex items-center gap-2">
                        <Lock className="h-4 w-4 text-rose-400" />
                        <span className="text-xs font-bold text-rose-300">
                          Restricted Actions ({roleConfig.restricted.length > 0 ? roleConfig.restricted.length : '0 - Superadmin'})
                        </span>
                      </div>
                      {roleConfig.restricted.length > 0 ? (
                        <ul className="space-y-2">
                          {roleConfig.restricted.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-zinc-400">
                              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs italic text-zinc-400">
                          No restrictions. User holds highest level Superadmin permissions.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Activity Trail */}
                {dossierData && dossierData.recent_logs && dossierData.recent_logs.length > 0 && (
                  <div>
                    <h4 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-zinc-400">Recent Security & Activity Trail</h4>
                    <div className="divide-y divide-zinc-800 rounded-xl border border-border-subtle bg-surface-input">
                      {dossierData.recent_logs.map(log => (
                        <div key={log.id} className="flex items-center justify-between p-3 text-xs">
                          <div className="flex items-center gap-2.5">
                            <Activity className="h-3.5 w-3.5 text-zinc-500" />
                            <div>
                              <p className="font-medium text-slate-200">{log.description}</p>
                              <p className="text-[10px] text-zinc-500">Action: {log.action} {log.ip_address ? `• IP: ${log.ip_address}` : ''}</p>
                            </div>
                          </div>
                          <span className="text-[10px] text-zinc-400">{formatDate(log.created_at)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between border-t border-border-subtle bg-zinc-900/90 p-4">
                <button
                  onClick={() => toggleStatus(viewUser)}
                  className={clsx(
                    "flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition",
                    viewUser.is_active 
                      ? "border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
                      : "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                  )}
                >
                  {viewUser.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  {viewUser.is_active ? 'Suspend Account' : 'Reactivate Account'}
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      openEditModal(viewUser);
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-border-default bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-zinc-700"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit User Profile
                  </button>
                  <button
                    onClick={() => setIsViewModalOpen(false)}
                    className="rounded-lg bg-[#ffcc00] px-4 py-2 text-xs font-bold text-black transition hover:bg-[#ffcc00]/90"
                  >
                    Close Dossier
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ========================================================================= */}
      {/* ADD USER MODAL (HIGH-END IAM PROVISIONING) */}
      {/* ========================================================================= */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} size="2xl">
        <div className="bg-surface-card text-white">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-subtle p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Provision New User Account</h3>
                <p className="text-xs text-content-secondary">
                  Create credentials and assign system roles with tailored security clearances.
                </p>
              </div>
            </div>
            <button onClick={() => setIsAddModalOpen(false)} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={submitAdd} className="p-6 space-y-5">
            {/* Live Monogram Card */}
            <div className="flex items-center gap-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <div className={clsx(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-bold text-white shadow-md text-base",
                formData.role === 'operations_technical' ? "bg-gradient-to-br from-emerald-600 to-teal-800" :
                formData.role === 'administrator' ? "bg-gradient-to-br from-purple-600 to-indigo-800" :
                formData.role === 'sales_manager' ? "bg-gradient-to-br from-amber-600 to-orange-800" :
                formData.role === 'sales_business_development' ? "bg-gradient-to-br from-blue-600 to-cyan-800" :
                "bg-gradient-to-br from-slate-600 to-zinc-800"
              )}>
                {getInitials(formData.name || 'New User')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-bold text-white">
                  {formData.name || 'Enter User Full Name'}
                </p>
                <p className="truncate text-xs text-zinc-400">
                  {formData.email || 'user@intellitrack.com'}
                </p>
              </div>
              <span className={clsx(
                "rounded-md border px-2.5 py-1 text-xs font-semibold shrink-0",
                ROLE_CONFIGS[formData.role]?.badgeBg || 'bg-zinc-800 text-zinc-300'
              )}>
                {ROLE_CONFIGS[formData.role]?.label || formData.role}
              </span>
            </div>

            {/* Inputs 2-column Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Full Name */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <UserIcon className="h-3.5 w-3.5 text-amber-400" />
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Engr. Marlon Ramos"
                  className="w-full rounded-lg border border-border-default bg-surface-input p-2.5 text-xs text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  required
                />
                {errors.name && <p className="mt-1 text-[11px] text-rose-400">{errors.name}</p>}
              </div>

              {/* Email Address */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <Mail className="h-3.5 w-3.5 text-amber-400" />
                  Work Email Address <span className="text-rose-400">*</span>
                </label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="operations@intellitrack.com"
                  className="w-full rounded-lg border border-border-default bg-surface-input p-2.5 text-xs text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  required
                />
                {errors.email && <p className="mt-1 text-[11px] text-rose-400">{errors.email}</p>}
              </div>

              {/* Direct Phone Number */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <Phone className="h-3.5 w-3.5 text-zinc-400" />
                  Direct Phone / Mobile
                </label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+63 917 555 0192"
                  className="w-full rounded-lg border border-border-default bg-surface-input p-2.5 text-xs text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
                {errors.phone && <p className="mt-1 text-[11px] text-rose-400">{errors.phone}</p>}
              </div>

              {/* Initial Password */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                    <Key className="h-3.5 w-3.5 text-amber-400" />
                    Initial Password <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 hover:underline"
                  >
                    Auto Generate
                  </button>
                </div>
                <input 
                  type="text" 
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min 8 characters or auto-generate"
                  className="w-full rounded-lg border border-border-default bg-surface-input p-2.5 text-xs font-mono text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  required
                  minLength={8}
                />
                {errors.password && <p className="mt-1 text-[11px] text-rose-400">{errors.password}</p>}
              </div>
            </div>

            {/* Interactive Role Selector Cards */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Select IAM Role & Clearance Level <span className="text-rose-400">*</span>
              </label>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(ROLE_CONFIGS).map(([roleKey, config]) => {
                  const Icon = config.icon;
                  const isSelected = formData.role === roleKey;

                  return (
                    <button
                      key={roleKey}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: roleKey })}
                      className={clsx(
                        "flex flex-col text-left rounded-xl border p-3 transition-all relative",
                        isSelected 
                          ? clsx("bg-zinc-800/90 shadow-md ring-2 ring-amber-400/50", config.border) 
                          : "border-border-default bg-surface-input/50 hover:border-zinc-600 hover:bg-surface-input"
                      )}
                    >
                      <div className="flex items-center justify-between w-full mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={clsx("flex h-7 w-7 items-center justify-center rounded-lg border", config.border, config.bg)}>
                            <Icon className={clsx("h-3.5 w-3.5", config.text)} />
                          </div>
                          <span className="text-xs font-bold text-white">{config.shortRole}</span>
                        </div>
                        {isSelected && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-black">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                        {config.description}
                      </p>
                    </button>
                  );
                })}
              </div>
              {errors.role && <p className="mt-1 text-[11px] text-rose-400">{errors.role}</p>}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-border-subtle pt-4">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg border border-border-default px-4 py-2 text-xs font-medium text-content-primary hover:bg-border-subtle"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing}
                className="flex items-center gap-2 rounded-lg bg-[#ffcc00] px-5 py-2 text-xs font-bold text-black shadow-lg shadow-amber-500/10 hover:bg-[#ffcc00]/90 disabled:opacity-50"
              >
                {processing ? 'Provisioning Account...' : 'Provision User'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* EDIT USER MODAL (HIGH-END ENTERPRISE IAM) */}
      {/* ========================================================================= */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} size="2xl">
        <div className="bg-surface-card text-white">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-subtle p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30">
                <Edit2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Edit User Credentials & Access</h3>
                <p className="text-xs text-content-secondary">
                  Update role clearance, active account status, or credentials for this profile.
                </p>
              </div>
            </div>
            <button onClick={() => setIsEditModalOpen(false)} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={submitEdit} className="p-6 space-y-5">
            {/* Live Profile Header Preview */}
            <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="flex items-center gap-3.5">
                <div className={clsx(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-bold text-white shadow-md text-base",
                  formData.role === 'operations_technical' ? "bg-gradient-to-br from-emerald-600 to-teal-800" :
                  formData.role === 'administrator' ? "bg-gradient-to-br from-purple-600 to-indigo-800" :
                  formData.role === 'sales_manager' ? "bg-gradient-to-br from-amber-600 to-orange-800" :
                  formData.role === 'sales_business_development' ? "bg-gradient-to-br from-blue-600 to-cyan-800" :
                  "bg-gradient-to-br from-slate-600 to-zinc-800"
                )}>
                  {getInitials(formData.name || 'User')}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{formData.name}</p>
                  <p className="text-xs text-zinc-400">{formData.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-zinc-400">Account State:</label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className={clsx(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider transition",
                    formData.is_active ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-rose-500/40 bg-rose-500/10 text-rose-400"
                  )}
                >
                  <span className={clsx("h-1.5 w-1.5 rounded-full", formData.is_active ? "bg-emerald-400" : "bg-rose-400")} />
                  {formData.is_active ? 'ACTIVE' : 'SUSPENDED'}
                </button>
              </div>
            </div>

            {/* Inputs 2-column Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Full Name */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <UserIcon className="h-3.5 w-3.5 text-blue-400" />
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-border-default bg-surface-input p-2.5 text-xs text-white placeholder-zinc-500 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  required
                />
                {errors.name && <p className="mt-1 text-[11px] text-rose-400">{errors.name}</p>}
              </div>

              {/* Email Address */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <Mail className="h-3.5 w-3.5 text-blue-400" />
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-border-default bg-surface-input p-2.5 text-xs text-white placeholder-zinc-500 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  required
                />
                {errors.email && <p className="mt-1 text-[11px] text-rose-400">{errors.email}</p>}
              </div>

              {/* Direct Phone Number */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <Phone className="h-3.5 w-3.5 text-zinc-400" />
                  Phone Number
                </label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+63 917 555 0192"
                  className="w-full rounded-lg border border-border-default bg-surface-input p-2.5 text-xs text-white placeholder-zinc-500 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                {errors.phone && <p className="mt-1 text-[11px] text-rose-400">{errors.phone}</p>}
              </div>

              {/* Optional Password Reset */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                    <Key className="h-3.5 w-3.5 text-zinc-400" />
                    Reset Password (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    Generate New
                  </button>
                </div>
                <input 
                  type="text" 
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave blank to preserve current password"
                  className="w-full rounded-lg border border-border-default bg-surface-input p-2.5 text-xs font-mono text-white placeholder-zinc-500 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                {errors.password && <p className="mt-1 text-[11px] text-rose-400">{errors.password}</p>}
              </div>
            </div>

            {/* Interactive Role Selector Cards */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Assigned Role & Authorization Level <span className="text-rose-400">*</span>
              </label>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(ROLE_CONFIGS).map(([roleKey, config]) => {
                  const Icon = config.icon;
                  const isSelected = formData.role === roleKey;

                  return (
                    <button
                      key={roleKey}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: roleKey })}
                      className={clsx(
                        "flex flex-col text-left rounded-xl border p-3 transition-all relative",
                        isSelected 
                          ? clsx("bg-zinc-800/90 shadow-md ring-2 ring-blue-400/50", config.border) 
                          : "border-border-default bg-surface-input/50 hover:border-zinc-600 hover:bg-surface-input"
                      )}
                    >
                      <div className="flex items-center justify-between w-full mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={clsx("flex h-7 w-7 items-center justify-center rounded-lg border", config.border, config.bg)}>
                            <Icon className={clsx("h-3.5 w-3.5", config.text)} />
                          </div>
                          <span className="text-xs font-bold text-white">{config.shortRole}</span>
                        </div>
                        {isSelected && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-400 text-black">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                        {config.description}
                      </p>
                    </button>
                  );
                })}
              </div>
              {errors.role && <p className="mt-1 text-[11px] text-rose-400">{errors.role}</p>}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-border-subtle pt-4">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-lg border border-border-default px-4 py-2 text-xs font-medium text-content-primary hover:bg-border-subtle"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing}
                className="flex items-center gap-2 rounded-lg bg-blue-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-blue-500/10 hover:bg-blue-600 disabled:opacity-50"
              >
                {processing ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} size="sm">
        <div className="bg-surface-card p-6 text-white">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-base font-bold">Delete User Account</h3>
            </div>
            <button onClick={() => setIsDeleteModalOpen(false)} className="text-zinc-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Are you sure you want to permanently delete <span className="font-bold text-white">{selectedUser?.name}</span> ({selectedUser?.email})?
          </p>
          <p className="mt-2 text-[11px] text-rose-400/90">
            This will revoke all system sessions and dissociate assigned work orders. This action cannot be undone.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="rounded-lg border border-border-default px-4 py-2 text-xs font-medium text-content-primary hover:bg-border-subtle"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitDelete}
              disabled={processing}
              className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {processing ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* GENERATED ONE-TIME PASSWORD RESET LINK MODAL */}
      {/* ========================================================================= */}
      <Modal 
        isOpen={generatedLinkModal.isOpen} 
        onClose={() => setGeneratedLinkModal(prev => ({ ...prev, isOpen: false }))} 
        size="md"
      >
        <div className="bg-surface-card p-6 text-white">
          <div className="mb-4 flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2.5 text-amber-400">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">One-Time Reset Link</h3>
                <p className="text-[11px] text-zinc-400">Single-use security token generated</p>
              </div>
            </div>
            <button 
              onClick={() => setGeneratedLinkModal(prev => ({ ...prev, isOpen: false }))} 
              className="text-zinc-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {generatedLinkModal.request && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border-default bg-surface-input p-3 text-xs">
                <p className="text-zinc-400 text-[11px]">Authorized Recipient:</p>
                <p className="font-bold text-white text-sm">
                  {generatedLinkModal.request.user?.name || generatedLinkModal.request.email}
                </p>
                <p className="text-zinc-400 text-xs font-mono">{generatedLinkModal.request.email}</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Single-Use Reset Link (Valid for 24 hours):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedLinkModal.resetUrl}
                    className="w-full rounded-lg border border-amber-500/30 bg-black/60 px-3 py-2 text-xs font-mono text-amber-300 select-all"
                  />
                  <button
                    type="button"
                    onClick={() => copyLinkToClipboard(generatedLinkModal.resetUrl)}
                    className={clsx(
                      "flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all",
                      generatedLinkModal.copied
                        ? "bg-emerald-500 text-black"
                        : "bg-[#ffcc00] text-black hover:bg-[#ffcc00]/90"
                    )}
                  >
                    {generatedLinkModal.copied ? (
                      <>
                        <Check className="h-4 w-4 stroke-[3]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Single-use policy notice */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-300 text-[11px] uppercase tracking-wider">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>Single-Use Security Enforcement</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Send this link to the user. Once the user enters their new password, this link will automatically burn and cannot be used again. If they need to reset their password again in the future, they will need to submit a new request.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setGeneratedLinkModal(prev => ({ ...prev, isOpen: false }))}
                  className="rounded-lg bg-surface-input border border-border-default px-4 py-2 text-xs font-semibold text-white hover:bg-border-subtle"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </AppLayout>
  );
}