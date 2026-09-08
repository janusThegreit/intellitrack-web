import { useEffect, useState } from 'react';
import { AppLayout } from '../../Layouts/AppLayout';
import { 
  Shield, Wrench, TrendingUp, Target, Truck, UserCheck, 
  CheckCircle2, Lock, Users, UserPlus, 
  Activity, Search, Download, 
  Sparkles, ChevronRight, 
  Sliders, Layers, FileCheck, Briefcase, 
  Check, X
} from 'lucide-react';
import clsx from 'clsx';
import Modal from '../../Components/Modal';
import axios from 'axios';

interface AssignedUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatar_url?: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
}

interface RoleItem {
  key: string;
  value: string;
  name: string;
  label: string;
  badge: string;
  tier: string;
  scope: string;
  description: string;
  user_count: number;
  active_count: number;
  users: AssignedUser[];
}

interface AuditLog {
  id: number;
  action: string;
  description: string;
  created_at: string;
  ip_address?: string;
  user_id?: number;
}

interface PermissionDef {
  key: string;
  label: string;
  description: string;
  module: 'IAM & Administration' | 'Fleet & Tower Cranes' | 'Crane Maintenance' | 'Job Orders & Dispatch' | 'CRM & Quotations' | 'Analytics & AI';
  // Allowed roles for this permission
  allowedRoles: string[];
}

const PERMISSIONS: PermissionDef[] = [
  // IAM & Administration
  {
    key: 'manage-users',
    label: 'User Account Provisioning & Deactivation',
    description: 'Create, modify credentials, and revoke system access for internal and external accounts.',
    module: 'IAM & Administration',
    allowedRoles: ['administrator'],
  },
  {
    key: 'manage-roles',
    label: 'Role Elevation & Access Matrix Governance',
    description: 'Reassign user roles, modify authority scopes, and review clearance levels.',
    module: 'IAM & Administration',
    allowedRoles: ['administrator'],
  },
  {
    key: 'system-maintenance',
    label: 'System Maintenance Mode & Emergency Lockdown',
    description: 'Toggle system-wide maintenance broadcasts and restrict non-admin access.',
    module: 'IAM & Administration',
    allowedRoles: ['administrator'],
  },
  {
    key: 'view-audit-logs',
    label: 'Security Audit Log Inspection & Compliance Export',
    description: 'Review tamper-evident security telemetry, login records, and export audit trails.',
    module: 'IAM & Administration',
    allowedRoles: ['administrator'],
  },

  // Fleet & Tower Cranes
  {
    key: 'view-rentals',
    label: 'Fleet Inventory & Live Availability Catalog',
    description: 'Inspect crane specifications, boom configurations, load charts, and real-time status.',
    module: 'Fleet & Tower Cranes',
    allowedRoles: ['administrator', 'operations_technical', 'sales_manager', 'sales_business_development'],
  },
  {
    key: 'manage-rentals',
    label: 'Heavy Asset Deployment & Field Demobilization',
    description: 'Authorize mobilization of cranes to client project sites and process equipment returns.',
    module: 'Fleet & Tower Cranes',
    allowedRoles: ['administrator', 'operations_technical', 'sales_manager', 'sales_business_development'],
  },
  {
    key: 'equipment-inspection',
    label: 'Technical Rigging & Structural Safety Checklists',
    description: 'Complete pre-erection load tests, mast tie-in verifications, and compliance checklists.',
    module: 'Fleet & Tower Cranes',
    allowedRoles: ['administrator', 'operations_technical', 'staff'],
  },

  // Crane Maintenance & Engineering
  {
    key: 'manage-maintenance',
    label: 'Preventative & Emergency Crane Maintenance Scheduling',
    description: 'Schedule routine service intervals, wire rope inspections, and hydraulic maintenance.',
    module: 'Crane Maintenance',
    allowedRoles: ['administrator', 'operations_technical'],
  },
  {
    key: 'complete-maintenance',
    label: 'Maintenance Sign-off & Return to Service Clearance',
    description: 'Certify completed maintenance work and transition equipment back to Available state.',
    module: 'Crane Maintenance',
    allowedRoles: ['administrator', 'operations_technical'],
  },
  {
    key: 'maintenance-telemetry',
    label: 'Crane Telematics & Component Wear Analysis',
    description: 'Monitor operating hours, engine runtimes, and predict component wear lifecycles.',
    module: 'Crane Maintenance',
    allowedRoles: ['administrator', 'operations_technical'],
  },

  // Job Orders & Dispatch
  {
    key: 'manage-job-orders',
    label: 'Job Order Creation, Scheduling & Crew Assignment',
    description: 'Generate operational work orders, assign certified crane operators, and set schedules.',
    module: 'Job Orders & Dispatch',
    allowedRoles: ['administrator', 'operations_technical', 'sales_manager', 'sales_business_development'],
  },
  {
    key: 'job-order-execution',
    label: 'Field Task Fulfillment & Site Checklists',
    description: 'Log on-site setup progress, operator hours, and complete mobilization checklists.',
    module: 'Job Orders & Dispatch',
    allowedRoles: ['administrator', 'operations_technical', 'staff'],
  },
  {
    key: 'view-projects',
    label: 'Project 360 Gantt & Logistics Milestones',
    description: 'Monitor multi-phase construction project timelines and crane allocation milestones.',
    module: 'Job Orders & Dispatch',
    allowedRoles: ['administrator', 'operations_technical', 'sales_manager', 'sales_business_development'],
  },

  // CRM & Quotations
  {
    key: 'view-crm',
    label: 'Client Inquiry Intake & Commercial Pipeline',
    description: 'Review inbound rental inquiries, lead stages, and account communications.',
    module: 'CRM & Quotations',
    allowedRoles: ['administrator', 'sales_manager', 'sales_business_development'],
  },
  {
    key: 'view-clients',
    label: 'Corporate Client 360 Profiles & Relationship History',
    description: 'Access customer company directories, authorized contacts, and historical deals.',
    module: 'CRM & Quotations',
    allowedRoles: ['administrator', 'sales_manager', 'sales_business_development'],
  },
  {
    key: 'create-quotation',
    label: 'Draft Quotation & Crane Rental Estimation',
    description: 'Assemble crane hire proposals, mobilization transport fees, and crew rates.',
    module: 'CRM & Quotations',
    allowedRoles: ['administrator', 'sales_manager', 'sales_business_development'],
  },
  {
    key: 'approve-quotations',
    label: 'Commercial Margin Overrides & Quotation Final Approvals',
    description: 'Authorize client discounts, financial payment terms, and lock official contracts.',
    module: 'CRM & Quotations',
    allowedRoles: ['administrator', 'sales_manager'],
  },
  {
    key: 'customer-portal-access',
    label: 'Client Self-Service Rental & Invoice Visibility',
    description: 'Secure view-only access to approved client quotations and active site job orders.',
    module: 'CRM & Quotations',
    allowedRoles: ['administrator', 'customer'],
  },

  // Analytics & AI
  {
    key: 'view-core-dashboard',
    label: 'Executive Operational Telemetry Dashboard',
    description: 'Access real-time fleet KPIs, revenue velocity, and critical operational alerts.',
    module: 'Analytics & AI',
    allowedRoles: ['administrator', 'operations_technical', 'sales_manager', 'sales_business_development'],
  },
  {
    key: 'view-reports',
    label: 'BI Financial & Equipment Utilization Reports',
    description: 'Generate revenue breakdown reports, rental duration metrics, and client volume stats.',
    module: 'Analytics & AI',
    allowedRoles: ['administrator', 'sales_manager', 'sales_business_development'],
  },
  {
    key: 'use-ai-copilot',
    label: 'Sales Intelligence AI Copilot & Risk Forecasting',
    description: 'Query conversational AI for pipeline forecast, customer sentiment, and deal recommendations.',
    module: 'Analytics & AI',
    allowedRoles: ['administrator', 'sales_manager'],
  },
];

const MODULE_ICONS: Record<string, any> = {
  'IAM & Administration': Shield,
  'Fleet & Tower Cranes': Layers,
  'Crane Maintenance': Wrench,
  'Job Orders & Dispatch': FileCheck,
  'CRM & Quotations': Briefcase,
  'Analytics & AI': Sparkles,
};

const ROLE_ICONS: Record<string, any> = {
  administrator: Shield,
  operations_technical: Wrench,
  sales_manager: TrendingUp,
  sales_business_development: Target,
  staff: Truck,
  customer: UserCheck,
};

const ROLE_THEMES: Record<string, { bg: string; border: string; text: string; badge: string; gradient: string }> = {
  administrator: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    badge: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    gradient: 'from-purple-600 to-indigo-900',
  },
  operations_technical: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    gradient: 'from-emerald-600 to-teal-900',
  },
  sales_manager: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    gradient: 'from-amber-600 to-orange-900',
  },
  sales_business_development: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    badge: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    gradient: 'from-blue-600 to-cyan-900',
  },
  staff: {
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    text: 'text-slate-300',
    badge: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
    gradient: 'from-slate-600 to-zinc-900',
  },
  customer: {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    text: 'text-indigo-300',
    badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    gradient: 'from-indigo-600 to-violet-900',
  },
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const getInitials = (name: string) => {
  if (!name) return '??';
  return name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

export default function RolesIndex() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  // Selection & Tabs
  const [selectedRoleKey, setSelectedRoleKey] = useState<string>('operations_technical');
  const [activeTab, setActiveTab] = useState<'inspector' | 'matrix'>('inspector');
  
  // Matrix Filters
  const [matrixModuleFilter, setMatrixModuleFilter] = useState<string>('all');
  const [matrixSearch, setMatrixSearch] = useState<string>('');

  // Reassign / Assign Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [allUsersList, setAllUsersList] = useState<AssignedUser[]>([]);
  const [assignSearch, setAssignSearch] = useState('');
  const [processingAssign, setProcessingAssign] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = () => {
    axios.get('/api/roles')
      .then(res => {
        setRoles(res.data.roles || []);
        setTotalUsers(res.data.total_users || 0);
        setAuditLogs(res.data.recent_audit_logs || []);
        
        // Default selection
        if (!selectedRoleKey && res.data.roles?.length > 0) {
          setSelectedRoleKey(res.data.roles[0].key);
        }
      })
      .catch(console.error);

    // Also load full users for assignment modal
    axios.get('/api/users?per_page=100')
      .then(res => {
        setAllUsersList(res.data.users?.data || res.data.data || []);
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedRole = roles.find(r => r.key === selectedRoleKey) || roles[0];
  const selectedTheme = selectedRole ? (ROLE_THEMES[selectedRole.key] || ROLE_THEMES.staff) : ROLE_THEMES.staff;
  const SelectedIcon = selectedRole ? (ROLE_ICONS[selectedRole.key] || Shield) : Shield;

  // Calculate permissions for selected role
  const rolePermissions = PERMISSIONS.map(p => {
    const isGranted = p.allowedRoles.includes(selectedRole?.key || '');
    return {
      ...p,
      isGranted,
    };
  });

  const permissionsByModule = rolePermissions.reduce((acc, curr) => {
    if (!acc[curr.module]) acc[curr.module] = [];
    acc[curr.module].push(curr);
    return acc;
  }, {} as Record<string, typeof rolePermissions>);

  const handleReassignUserRole = async (userId: number, newRole: string) => {
    setProcessingAssign(true);
    try {
      await axios.put(`/api/users/${userId}/role`, { role: newRole });
      showToast(`User role successfully reassigned to ${newRole.replace(/_/g, ' ')}!`);
      loadData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to reassign user role.');
    } finally {
      setProcessingAssign(false);
    }
  };

  const exportMatrixCsv = () => {
    const roleKeys = roles.map(r => r.key);
    const headers = ['Module', 'Permission Key', 'Permission Name', ...roles.map(r => r.name)];
    const rows = PERMISSIONS.map(p => [
      `"${p.module}"`,
      `"${p.key}"`,
      `"${p.label}"`,
      ...roleKeys.map(rKey => p.allowedRoles.includes(rKey) ? 'GRANTED' : 'RESTRICTED')
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `intellitrack_iam_roles_matrix_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported IAM Access Matrix to CSV.');
  };

  const filteredPermissionsForMatrix = PERMISSIONS.filter(p => {
    if (matrixModuleFilter !== 'all' && p.module !== matrixModuleFilter) return false;
    if (matrixSearch) {
      const q = matrixSearch.toLowerCase();
      return p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <AppLayout dark={true} showHeader={false}>
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/90 px-4 py-3 text-sm font-medium text-emerald-200 shadow-2xl backdrop-blur-md transition-all">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Roles & Access Governance (IAM)
              </h1>
              <p className="text-xs text-content-secondary">
                Configure organizational role scopes, clearance tiers, and the multi-tier capability matrix.
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-border-default bg-surface-card p-1">
            <button
              onClick={() => setActiveTab('inspector')}
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition",
                activeTab === 'inspector' 
                  ? "bg-amber-400 text-black shadow-md font-bold" 
                  : "text-content-secondary hover:text-white"
              )}
            >
              <Sliders className="h-3.5 w-3.5" />
              Role Inspector & Members
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition",
                activeTab === 'matrix' 
                  ? "bg-amber-400 text-black shadow-md font-bold" 
                  : "text-content-secondary hover:text-white"
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              Comparative Access Matrix
            </button>
          </div>

          <button
            onClick={exportMatrixCsv}
            title="Export full permission matrix"
            className="flex items-center gap-1.5 rounded-lg border border-border-default bg-surface-card px-3 py-2 text-xs font-semibold text-content-secondary hover:border-zinc-500 hover:text-white"
          >
            <Download className="h-3.5 w-3.5" />
            Export Matrix
          </button>
        </div>
      </div>

      {/* IAM KPI Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-xl border border-border-subtle bg-surface-card p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-content-secondary">Defined IAM Roles</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-content-secondary">
              <Shield className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-white">{roles.length || 6}</p>
          <p className="mt-1 text-[11px] text-content-secondary">Configured role classifications</p>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-border-subtle bg-surface-card p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Assigned Identities</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-emerald-400">{totalUsers}</p>
          <p className="mt-1 text-[11px] text-emerald-400/80">Active user accounts provisioned</p>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-border-subtle bg-surface-card p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">Granular Policies</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <FileCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-white">{PERMISSIONS.length}</p>
          <p className="mt-1 text-[11px] text-content-secondary">Across 6 operational modules</p>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-border-subtle bg-surface-card p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-purple-400">Highest Clearance</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
              <Lock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-xl font-bold text-white">Tier 1 Superadmin</p>
          <p className="mt-1 text-[11px] text-purple-400/80">Strict zero-trust root protection</p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ROLE INSPECTOR & MEMBERS (DEFAULT DEEP DIVE) */}
      {/* ========================================================================= */}
      {activeTab === 'inspector' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          
          {/* Left Column: Role Selector Navigation (4 cols) */}
          <div className="space-y-3 lg:col-span-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">System Roles Directory</span>
              <span className="text-[11px] text-zinc-500">{roles.length} Roles Active</span>
            </div>

            <div className="space-y-2.5">
              {roles.map(role => {
                const isSelected = role.key === selectedRoleKey;
                const theme = ROLE_THEMES[role.key] || ROLE_THEMES.staff;
                const Icon = ROLE_ICONS[role.key] || Shield;

                return (
                  <button
                    key={role.key}
                    onClick={() => setSelectedRoleKey(role.key)}
                    className={clsx(
                      "w-full text-left rounded-xl border p-4 transition-all duration-200 relative overflow-hidden group",
                      isSelected 
                        ? clsx("bg-surface-card shadow-xl ring-2 ring-amber-400/60", theme.border) 
                        : "border-border-default bg-surface-card/60 hover:bg-surface-card hover:border-zinc-600"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={clsx("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-md", theme.border, theme.bg)}>
                          <Icon className={clsx("h-5 w-5", theme.text)} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                            {role.name}
                          </p>
                          <p className="text-[11px] text-zinc-400">
                            {role.tier.split('—')[0].trim()}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className={clsx("rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", theme.badge)}>
                          {role.badge}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                          <Users className="h-3 w-3 text-zinc-500" />
                          <strong className="text-white">{role.user_count}</strong> {role.user_count === 1 ? 'user' : 'users'}
                        </span>
                      </div>
                    </div>

                    <p className="mt-2.5 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {role.description}
                    </p>

                    {isSelected && (
                      <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-2 text-[11px] font-semibold text-amber-400">
                        <span>Currently Inspecting</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Role Comprehensive Dossier (8 cols) */}
          <div className="space-y-6 lg:col-span-8">
            {selectedRole ? (
              <div className="space-y-6">
                
                {/* Role Header Banner */}
                <div className="relative overflow-hidden rounded-2xl border border-border-subtle bg-surface-card p-6 shadow-xl">
                  {/* Decorative background glow */}
                  <div className={clsx(
                    "absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl opacity-15 pointer-events-none",
                    selectedRole.key === 'operations_technical' ? "bg-emerald-500" :
                    selectedRole.key === 'administrator' ? "bg-purple-500" :
                    selectedRole.key === 'sales_manager' ? "bg-amber-500" :
                    selectedRole.key === 'sales_business_development' ? "bg-blue-500" : "bg-slate-500"
                  )} />

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className={clsx("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border shadow-xl ring-2", selectedTheme.border, selectedTheme.bg, "ring-white/10")}>
                        <SelectedIcon className={clsx("h-7 w-7", selectedTheme.text)} />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-extrabold text-white">{selectedRole.name}</h2>
                          <span className={clsx("rounded-md border px-2.5 py-0.5 text-xs font-semibold", selectedTheme.badge)}>
                            {selectedRole.tier}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-amber-400/90 font-medium">
                          Scope: {selectedRole.scope}
                        </p>
                        <p className="mt-2 text-xs text-zinc-300 leading-relaxed max-w-2xl">
                          {selectedRole.description}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsAssignModalOpen(true)}
                      className="flex shrink-0 items-center gap-2 rounded-lg bg-[#ffcc00] px-3.5 py-2 text-xs font-bold text-black shadow-lg shadow-amber-500/10 transition hover:bg-[#ffcc00]/90"
                    >
                      <UserPlus className="h-4 w-4" />
                      Assign User to Role
                    </button>
                  </div>
                </div>

                {/* Assigned Users Card */}
                <div className="rounded-xl border border-border-subtle bg-surface-card p-5 shadow-lg">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-amber-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                        Assigned Role Members ({selectedRole.user_count})
                      </h3>
                    </div>
                    <span className="text-xs text-content-secondary">
                      {selectedRole.active_count} Active accounts
                    </span>
                  </div>

                  {selectedRole.users && selectedRole.users.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {selectedRole.users.map(user => (
                        <div 
                          key={user.id}
                          className="flex items-center justify-between rounded-xl border border-zinc-800 bg-surface-input/60 p-3 hover:border-zinc-700 transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className={clsx(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-white text-xs shadow-md",
                              user.is_active ? "bg-gradient-to-br " + selectedTheme.gradient : "bg-zinc-700"
                            )}>
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.name} className="h-full w-full rounded-xl object-cover" />
                              ) : (
                                getInitials(user.name)
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-slate-100">{user.name}</p>
                              <p className="truncate text-[11px] text-content-secondary">{user.email}</p>
                            </div>
                          </div>

                          <span className={clsx(
                            "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0",
                            user.is_active ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          )}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-xs text-zinc-500">
                      No users are currently assigned to this role. Click "Assign User to Role" above to grant membership.
                    </div>
                  )}
                </div>

                {/* Granular Permission Policies Grouped by Module */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-amber-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                        Access Control Policies for {selectedRole.name}
                      </h3>
                    </div>
                    <span className="text-xs text-zinc-400">
                      {rolePermissions.filter(p => p.isGranted).length} of {PERMISSIONS.length} Granted
                    </span>
                  </div>

                  {Object.entries(permissionsByModule).map(([moduleName, modulePerms]) => {
                    const ModuleIcon = MODULE_ICONS[moduleName] || Shield;
                    const grantedCount = modulePerms.filter(p => p.isGranted).length;

                    return (
                      <div 
                        key={moduleName}
                        className="overflow-hidden rounded-xl border border-border-subtle bg-surface-card shadow-md"
                      >
                        {/* Module Subheader */}
                        <div className="flex items-center justify-between border-b border-border-subtle bg-surface-input/50 px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-amber-400">
                              <ModuleIcon className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-xs font-bold text-slate-100">{moduleName}</span>
                          </div>
                          <span className={clsx(
                            "rounded-md border px-2 py-0.5 text-[10px] font-semibold",
                            grantedCount === modulePerms.length 
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                              : grantedCount > 0 
                                ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                                : "border-zinc-800 bg-zinc-900 text-zinc-500"
                          )}>
                            {grantedCount} / {modulePerms.length} Authorized
                          </span>
                        </div>

                        {/* Module Permissions List */}
                        <div className="divide-y divide-zinc-800/50">
                          {modulePerms.map(perm => (
                            <div 
                              key={perm.key}
                              className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 gap-3 hover:bg-zinc-800/20 transition"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-xs text-white">{perm.label}</span>
                                  <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
                                    {perm.key}
                                  </code>
                                </div>
                                <p className="text-[11px] text-zinc-400">
                                  {perm.description}
                                </p>
                              </div>

                              <div className="shrink-0">
                                {perm.isGranted ? (
                                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Authorized
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                                    <Lock className="h-3.5 w-3.5" />
                                    Restricted
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: COMPARATIVE 2D ACCESS MATRIX TABLE */}
      {/* ========================================================================= */}
      {activeTab === 'matrix' && (
        <div className="rounded-xl border border-border-subtle bg-surface-card shadow-xl">
          {/* Matrix Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle p-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-secondary" />
                <input
                  type="text"
                  value={matrixSearch}
                  onChange={(e) => setMatrixSearch(e.target.value)}
                  placeholder="Filter capabilities or policies..."
                  className="w-full rounded-lg border border-border-default bg-surface-input py-2 pl-9 pr-4 text-xs text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              {/* Module Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-content-secondary">Module:</span>
                <select
                  value={matrixModuleFilter}
                  onChange={(e) => setMatrixModuleFilter(e.target.value)}
                  className="rounded-lg border border-border-default bg-surface-input py-1.5 pl-3 pr-8 text-xs text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="all">All Modules ({PERMISSIONS.length})</option>
                  {Object.keys(MODULE_ICONS).map(mod => (
                    <option key={mod} value={mod}>{mod}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Authorized
              </span>
              <span className="mx-2 text-zinc-600">•</span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-400" /> Restricted
              </span>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-content-secondary">
              <thead className="border-b border-border-subtle bg-surface-input/60 text-[10px] font-bold uppercase tracking-wider text-content-secondary">
                <tr>
                  <th className="px-5 py-4 min-w-[260px]">Capability Policy & Module</th>
                  {roles.map(r => {
                    const theme = ROLE_THEMES[r.key] || ROLE_THEMES.staff;
                    const Icon = ROLE_ICONS[r.key] || Shield;

                    return (
                      <th key={r.key} className="px-4 py-4 text-center min-w-[140px]">
                        <div className="flex flex-col items-center gap-1">
                          <div className={clsx("flex h-7 w-7 items-center justify-center rounded-lg border", theme.border, theme.bg)}>
                            <Icon className={clsx("h-3.5 w-3.5", theme.text)} />
                          </div>
                          <span className="text-xs font-bold text-white">{r.name}</span>
                          <span className="text-[9px] text-zinc-500 font-normal">{r.tier.split('—')[0].trim()}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {filteredPermissionsForMatrix.map(perm => {
                  const ModuleIcon = MODULE_ICONS[perm.module] || Shield;

                  return (
                    <tr key={perm.key} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-zinc-800 text-zinc-400">
                            <ModuleIcon className="h-3 w-3" />
                          </div>
                          <div>
                            <p className="font-semibold text-white text-xs">{perm.label}</p>
                            <p className="text-[10px] text-zinc-400">{perm.description}</p>
                            <span className="mt-1 inline-block text-[9px] font-mono text-zinc-500">{perm.key}</span>
                          </div>
                        </div>
                      </td>

                      {roles.map(r => {
                        const isGranted = perm.allowedRoles.includes(r.key);

                        return (
                          <td key={r.key} className="px-4 py-3.5 text-center align-middle">
                            {isGranted ? (
                              <div className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-sm" title={`Authorized for ${r.name}`}>
                                <Check className="h-4 w-4 stroke-[2.5]" />
                              </div>
                            ) : (
                              <div className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-zinc-800 bg-zinc-900/80 text-zinc-600" title={`Restricted for ${r.name}`}>
                                <Lock className="h-3.5 w-3.5" />
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Security & Role Elevation Audit Trail */}
      {auditLogs && auditLogs.length > 0 && (
        <div className="mt-8 rounded-xl border border-border-subtle bg-surface-card p-5 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Recent IAM Role Reassignment & Security Log
              </h3>
            </div>
            <span className="text-[11px] text-zinc-500">Immutable Audit Records</span>
          </div>

          <div className="divide-y divide-zinc-800 rounded-xl border border-border-subtle bg-surface-input">
            {auditLogs.map(log => (
              <div key={log.id} className="flex items-center justify-between p-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400">
                    <Shield className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-200">{log.description}</p>
                    <p className="text-[10px] text-zinc-500">Action: {log.action} {log.ip_address ? `• IP: ${log.ip_address}` : ''}</p>
                  </div>
                </div>
                <span className="text-[10px] text-zinc-400 shrink-0">{formatDate(log.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ASSIGN USER TO ROLE MODAL */}
      {/* ========================================================================= */}
      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} size="lg">
        <div className="bg-surface-card p-6 text-white">
          <div className="flex items-center justify-between border-b border-border-subtle pb-4">
            <div className="flex items-center gap-3">
              <div className={clsx("flex h-10 w-10 items-center justify-center rounded-xl border shadow-md", selectedTheme.border, selectedTheme.bg)}>
                <SelectedIcon className={clsx("h-5 w-5", selectedTheme.text)} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Assign User to {selectedRole?.name}
                </h3>
                <p className="text-xs text-content-secondary">
                  Grant {selectedRole?.tier} clearance and associated capabilities.
                </p>
              </div>
            </div>
            <button onClick={() => setIsAssignModalOpen(false)} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={assignSearch}
                onChange={(e) => setAssignSearch(e.target.value)}
                placeholder="Search staff by name or email..."
                className="w-full rounded-lg border border-border-default bg-surface-input py-2 pl-9 pr-4 text-xs text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            {/* Users List */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {allUsersList
                .filter(u => {
                  if (!assignSearch) return true;
                  const q = assignSearch.toLowerCase();
                  return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
                })
                .map(user => {
                  const isAlreadyInRole = user.role === selectedRole?.key;

                  return (
                    <div 
                      key={user.id}
                      className="flex items-center justify-between rounded-xl border border-zinc-800 bg-surface-input p-3 hover:border-zinc-700 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 font-bold text-white text-xs">
                          {getInitials(user.name)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">{user.name}</p>
                          <p className="text-[11px] text-zinc-400">{user.email}</p>
                          <p className="text-[10px] text-zinc-500">Current Role: {user.role.replace(/_/g, ' ')}</p>
                        </div>
                      </div>

                      {isAlreadyInRole ? (
                        <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                          Current Role
                        </span>
                      ) : (
                        <button
                          disabled={processingAssign}
                          onClick={() => handleReassignUserRole(user.id, selectedRole?.key || 'staff')}
                          className="flex items-center gap-1.5 rounded-lg bg-[#ffcc00] px-3 py-1.5 text-xs font-bold text-black hover:bg-[#ffcc00]/90 disabled:opacity-50 transition"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          Assign
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="mt-6 flex justify-end border-t border-border-subtle pt-4">
            <button
              onClick={() => setIsAssignModalOpen(false)}
              className="rounded-lg border border-border-default px-4 py-2 text-xs font-medium text-content-primary hover:bg-border-subtle"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

    </AppLayout>
  );
}
