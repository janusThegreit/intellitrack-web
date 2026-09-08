import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
  User,
  Shield,
  Bell,
  Camera,
  Check,
  Save,
  Lock,
  Wrench,
  AlertTriangle,
  Server,
  Database,
  ExternalLink,
  CheckCircle2,
  Radio,
  Cpu,
  RefreshCw,
  Phone,
  TrendingUp,
  Target,
  Truck,
  UserCheck,
  Sliders,
} from 'lucide-react';
import clsx from 'clsx';
import { AppLayout } from '../../Layouts/AppLayout';

interface Profile {
  id?: number;
  name: string;
  email: string;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  phone?: string;
  avatar_url?: string;
  role: string;
  last_login_at?: string;
}

interface Telemetry {
  php_version: string;
  laravel_version: string;
  environment: string;
  db_status: string;
  cache_driver: string;
  server_time: string;
  admin_count: number;
  total_users: number;
}

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  read_at?: string;
  created_at: string;
}

interface RoleThemeConfig {
  badgeTitle: string;
  pageTitle: string;
  pageSubtitle: string;
  verifiedBadge: string;
  department: string;
  roleLabel: string;
  badgeBg: string;
  tabLabel: string;
  icon: any;
  preferencesTitle: string;
  preferencesSubtitle: string;
  preferencesItems: Array<{
    id: string;
    title: string;
    description: string;
    defaultChecked: boolean;
  }>;
}

const ROLE_SETTINGS_MAP: Record<string, RoleThemeConfig> = {
  administrator: {
    badgeTitle: 'Administration & System Governance',
    pageTitle: 'Settings & System Governance',
    pageSubtitle: 'Manage your administrator identity, security credentials, and system-wide maintenance policies.',
    verifiedBadge: 'Verified Super Administrator',
    department: 'IntelliTrack Core Infrastructure & IAM',
    roleLabel: 'Administrator',
    badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    tabLabel: 'Governance Policy',
    icon: Shield,
    preferencesTitle: 'System & Security Governance Preferences',
    preferencesSubtitle: 'Emergency lockout overrides, database health triggers, and compliance audit log alerts.',
    preferencesItems: [
      { id: 'sec_lockout', title: 'Security Threat & Brute-Force Lockout Alerts', description: 'Immediate notification on multiple failed login attempts or unauthorized IP activity.', defaultChecked: true },
      { id: 'sys_maint', title: 'System Maintenance Broadcast Confirmations', description: 'Dispatch confirmation whenever maintenance lockdown is activated or restored.', defaultChecked: true },
      { id: 'role_elevate', title: 'IAM Role Elevation Audit Digest', description: 'Instant alerts when any user role, clearance tier, or account status is altered.', defaultChecked: true },
      { id: 'db_health', title: 'Database & Redis Health Heartbeat Alerts', description: 'Notify administrator if PostgreSQL connection latency exceeds standard thresholds.', defaultChecked: true },
    ],
  },
  operations_technical: {
    badgeTitle: 'Heavy Fleet & Technical Operations',
    pageTitle: 'Technical Operations & Fleet Settings',
    pageSubtitle: 'Manage your engineering profile, dispatch contact details, crane telematics alerts, and rigging safety certifications.',
    verifiedBadge: 'Certified Technical Authority',
    department: 'Heavy Fleet Engineering & Rigging Logistics',
    roleLabel: 'Operations & Technical Staff',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    tabLabel: 'Technical & Fleet Alerts',
    icon: Wrench,
    preferencesTitle: 'Crane Maintenance & Field Telemetry Preferences',
    preferencesSubtitle: 'Configure alert triggers for preventative maintenance, wind speed stand-downs, and work orders.',
    preferencesItems: [
      { id: 'crane_maint', title: 'Crane Preventative Maintenance Due Alerts', description: 'Receive reminder alerts 3 days before scheduled mast bolt torque checks and wire rope testing.', defaultChecked: true },
      { id: 'wind_alert', title: 'Anemometer Wind Speed Stand-Down Alerts (>45 km/h)', description: 'Immediate high-priority push notification when crane jib wind speed sensors exceed safe lifting limits.', defaultChecked: true },
      { id: 'job_dispatch', title: 'Job Order Rigging & Operator Dispatch Updates', description: 'Instant notification when new tower crane erection or field repair tasks are assigned to your team.', defaultChecked: true },
      { id: 'dole_cert', title: 'DOLE Annual Crane Safety Re-Certification Warnings', description: '30-day advance notice before third-party load deflection safety certificates expire.', defaultChecked: true },
    ],
  },
  sales_manager: {
    badgeTitle: 'Commercial & Sales Management',
    pageTitle: 'Commercial Management Settings',
    pageSubtitle: 'Manage your commercial approval credentials, deal review preferences, and contact details.',
    verifiedBadge: 'Authorized Commercial Manager',
    department: 'Commercial Strategy & Deal Governance',
    roleLabel: 'Sales Manager',
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    tabLabel: 'Commercial Alerts',
    icon: TrendingUp,
    preferencesTitle: 'Deal Pipeline & Quotation Approval Preferences',
    preferencesSubtitle: 'Quotation review queues, customer acceptance notices, and revenue forecasting updates.',
    preferencesItems: [
      { id: 'quot_approval', title: 'Pending Quotation Approval Queue Alerts', description: 'Instant alerts when sales executives submit draft proposals exceeding standard discount thresholds.', defaultChecked: true },
      { id: 'deal_won', title: 'Client Contract Acceptance & Signing Notices', description: 'Get notified as soon as a customer formally accepts or signs a crane hire agreement.', defaultChecked: true },
      { id: 'ai_digest', title: 'AI Sales Intelligence Weekly Demand Forecast', description: 'Automated weekly pipeline review and equipment demand analytics generated by AI Copilot.', defaultChecked: true },
    ],
  },
  sales_business_development: {
    badgeTitle: 'Client Acquisition & Frontline Sales',
    pageTitle: 'Sales Account Settings',
    pageSubtitle: 'Manage your sales representative identity, client communication preferences, and inquiry notifications.',
    verifiedBadge: 'Authorized Account Executive',
    department: 'Frontline Business Development & Client Relations',
    roleLabel: 'Sales Business Development',
    badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    tabLabel: 'Lead & Inquiry Alerts',
    icon: Target,
    preferencesTitle: 'Client Inquiries & Lead Pipeline Preferences',
    preferencesSubtitle: 'Inquiry response timers, quotation revisions, and client follow-up reminders.',
    preferencesItems: [
      { id: 'lead_inquiry', title: 'New Inbound Client Rental Inquiries', description: 'Instant alert when a construction client submits an equipment inquiry or crane request.', defaultChecked: true },
      { id: 'follow_up', title: 'Client Proposal Follow-up Reminders', description: 'Daily task notifications for pending customer inquiries and quotation follow-ups.', defaultChecked: true },
      { id: 'quot_status', title: 'Quotation Review & Approval Notifications', description: 'Receive notification when your submitted draft proposals are approved by the Sales Manager.', defaultChecked: true },
    ],
  },
  staff: {
    badgeTitle: 'Field Operations & Support',
    pageTitle: 'Operator Profile & Settings',
    pageSubtitle: 'Manage your operator credentials, job site assignments, and safety notifications.',
    verifiedBadge: 'Verified Field Operations Personnel',
    department: 'Field Logistics & Equipment Handling',
    roleLabel: 'Operations Staff',
    badgeBg: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
    tabLabel: 'Field Task Alerts',
    icon: Truck,
    preferencesTitle: 'Field Dispatch & Task Checklist Preferences',
    preferencesSubtitle: 'Assigned job order updates, arrival checklists, and site emergency broadcasts.',
    preferencesItems: [
      { id: 'task_assigned', title: 'Assigned Job Order Dispatch Alerts', description: 'Notification when assigned to equipment rigging or site mobilization duties.', defaultChecked: true },
      { id: 'check_complete', title: 'Site Mobilization Checklist Confirmations', description: 'Confirmation alerts when equipment check-ins and returns are logged.', defaultChecked: true },
    ],
  },
  customer: {
    badgeTitle: 'Client Portal Account',
    pageTitle: 'Client Account Settings',
    pageSubtitle: 'Manage your authorized company contact details, rental notifications, and billing preferences.',
    verifiedBadge: 'Verified Corporate Client Partner',
    department: 'Authorized Client Organization',
    roleLabel: 'Customer / Client Portal',
    badgeBg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    tabLabel: 'Rental Notifications',
    icon: UserCheck,
    preferencesTitle: 'Rental & Proposal Notifications',
    preferencesSubtitle: 'Approved quotations, on-site crane mobilization progress, and invoice reminders.',
    preferencesItems: [
      { id: 'cust_quot', title: 'Quotation Delivery & Approval Notices', description: 'Receive immediate notifications when new equipment proposals are ready for your review.', defaultChecked: true },
      { id: 'cust_mob', title: 'Crane Site Mobilization & Erection Updates', description: 'Real-time progress updates when rented cranes are en-route or erected on your project site.', defaultChecked: true },
    ],
  },
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'system' | 'preferences' | 'notifications'>('profile');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState({ current_password: '', password: '', password_confirmation: '' });

  // Role Preferences State
  const [preferenceToggles, setPreferenceToggles] = useState<Record<string, boolean>>({});

  // System & Maintenance Mode State (Admin only)
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [broadcastMessage, setBroadcastMessage] = useState<string>('');
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState<boolean>(false);

  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

  // Check URL query parameters for tab selection (e.g. /settings?tab=system)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'system' || tabParam === 'maintenance') {
        setActiveTab('system');
      } else if (tabParam === 'security') {
        setActiveTab('security');
      } else if (tabParam === 'notifications') {
        setActiveTab('notifications');
      } else if (tabParam === 'preferences') {
        setActiveTab('preferences');
      }
    }
  }, []);

  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  // Fetch initial profile data
  useEffect(() => {
    fetch('/api/profile', { headers: { Accept: 'application/json' } })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then((data: Profile) => {
        setProfile(data);
        const config = ROLE_SETTINGS_MAP[data.role] || ROLE_SETTINGS_MAP.administrator;
        const initialPrefs: Record<string, boolean> = {};
        config.preferencesItems.forEach(item => {
          initialPrefs[item.id] = item.defaultChecked;
        });
        setPreferenceToggles(initialPrefs);

        if (data.role === 'administrator') {
          fetchMaintenanceDetails();
        }
      })
      .catch(() => showNotification('Could not load profile settings.', 'error'));
  }, []);

  const fetchMaintenanceDetails = async () => {
    setLoadingTelemetry(true);
    try {
      const res = await fetch('/api/system/maintenance', { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        setMaintenanceMode(Boolean(data.enabled));
        setBroadcastMessage(data.broadcast_message || '');
        setStartedAt(data.started_at || null);
        if (data.telemetry) {
          setTelemetry(data.telemetry);
        }
      }
    } catch {
      // Ignored if non-admin or failed
    } finally {
      setLoadingTelemetry(false);
    }
  };

  const loadNotifications = () => {
    fetch('/api/dashboard/notifications?per_page=20', { headers: { Accept: 'application/json' } })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setNotifications(data.data ?? []))
      .catch(() => showNotification('Notifications could not be loaded.', 'error'));
  };

  useEffect(() => {
    if (activeTab === 'notifications') {
      loadNotifications();
    }
    if (activeTab === 'system') {
      fetchMaintenanceDetails();
    }
  }, [activeTab]);

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrf,
        },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setProfile(updated);
      showNotification('Profile information successfully updated.');
    } catch {
      showNotification('Failed to update profile. Please verify your entries.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const avatar = event.target.files?.[0];
    if (!avatar || !profile) return;
    setSaving(true);
    const form = new FormData();
    form.append('avatar', avatar);
    try {
      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrf },
        body: form,
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAvatarLoadError(false);
      setProfile({ ...profile, avatar_url: `${data.avatar_url}?t=${Date.now()}` });
      showNotification('Profile avatar updated successfully.');
    } catch {
      showNotification('Could not upload image. Supported: JPG, PNG, WEBP (< 2MB).', 'error');
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrf,
        },
        body: JSON.stringify(password),
      });
      if (!res.ok) throw new Error();
      setPassword({ current_password: '', password: '', password_confirmation: '' });
      showNotification('Security password updated successfully.');
    } catch {
      showNotification('Password update failed. Verify current password and 8+ char confirmation.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const togglePreference = (id: string) => {
    setPreferenceToggles(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
    showNotification('Preference updated.');
  };

  const toggleMaintenanceMode = async () => {
    const nextState = !maintenanceMode;
    setSaving(true);
    try {
      const res = await fetch('/api/system/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrf,
        },
        body: JSON.stringify({
          enabled: nextState,
          broadcast_message: broadcastMessage,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMaintenanceMode(data.enabled);
      setBroadcastMessage(data.broadcast_message || broadcastMessage);
      showNotification(data.message || `Maintenance mode ${nextState ? 'enabled' : 'disabled'}.`);
      fetchMaintenanceDetails();
    } catch {
      showNotification('Failed to toggle maintenance mode.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveBroadcastMessage = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/system/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrf,
        },
        body: JSON.stringify({
          enabled: maintenanceMode,
          broadcast_message: broadcastMessage,
        }),
      });
      if (!res.ok) throw new Error();
      showNotification('Maintenance broadcast message saved.');
    } catch {
      showNotification('Failed to save announcement message.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const markAllRead = async () => {
    await fetch('/api/dashboard/notifications/read-all', {
      method: 'POST',
      headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrf },
    });
    loadNotifications();
    showNotification('All notifications marked as read.');
  };

  const initial = (profile?.name || 'U').slice(0, 1).toUpperCase();
  const unreadCount = notifications.filter(n => !n.read_at).length;
  const isAdmin = profile?.role === 'administrator';

  // Active Role Theme Config
  const roleConfig = ROLE_SETTINGS_MAP[profile?.role || 'administrator'] || ROLE_SETTINGS_MAP.administrator;
  const RoleIcon = roleConfig.icon;

  return (
    <AppLayout title="Settings">
      <Head title={`${roleConfig.pageTitle} — IntelliTrack`} />

      <div className="space-y-6 pb-12">
        {/* Dynamic Role-Tailored Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className={clsx("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-1.5 border shadow-xs", roleConfig.badgeBg)}>
              <RoleIcon className="w-3.5 h-3.5" />
              <span>{roleConfig.badgeTitle}</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-content-primary sm:text-3xl">
              {roleConfig.pageTitle}
            </h1>
            <p className="mt-1 text-sm text-content-secondary max-w-2xl leading-relaxed">
              {roleConfig.pageSubtitle}
            </p>
          </div>

          {/* Quick Status Pill */}
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <div
                className={clsx(
                  'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border shadow-sm',
                  maintenanceMode
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                )}
              >
                <Radio className="w-3 h-3" />
                <span>{maintenanceMode ? 'Maintenance Mode: Active' : 'System: Online'}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className={clsx("inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border shadow-sm", roleConfig.badgeBg)}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Session Active & Authorized</span>
              </div>
            </div>
          )}
        </div>

        {/* Global Feedback Banner */}
        {message && (
          <div
            className={clsx(
              'rounded-xl border p-4 text-xs font-semibold flex items-center gap-2 shadow-sm transition-all',
              messageType === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            )}
          >
            {messageType === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{message}</span>
          </div>
        )}

        {/* Layout: Left Tab Navigation + Right Panel Content */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Navigation Tabs (Sidebar) */}
          <div className="w-full md:w-64 shrink-0">
            <div className="rounded-2xl border border-border-default/80 bg-surface-card p-3 shadow-sm space-y-1">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={clsx(
                  'w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all text-left',
                  activeTab === 'profile'
                    ? 'bg-surface-app text-content-primary shadow-sm border border-border-default font-bold'
                    : 'text-content-secondary hover:text-content-primary hover:bg-surface-app/60'
                )}
              >
                <User className="w-4 h-4 text-emerald-500" />
                <span>Public Profile</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={clsx(
                  'w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all text-left',
                  activeTab === 'security'
                    ? 'bg-surface-app text-content-primary shadow-sm border border-border-default font-bold'
                    : 'text-content-secondary hover:text-content-primary hover:bg-surface-app/60'
                )}
              >
                <Lock className="w-4 h-4 text-indigo-500" />
                <span>Password & Security</span>
              </button>

              {/* Role-Specific Preferences Tab */}
              <button
                type="button"
                onClick={() => setActiveTab('preferences')}
                className={clsx(
                  'w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all text-left',
                  activeTab === 'preferences'
                    ? 'bg-surface-app text-content-primary shadow-sm border border-border-default font-bold'
                    : 'text-content-secondary hover:text-content-primary hover:bg-surface-app/60'
                )}
              >
                <Sliders className="w-4 h-4 text-amber-500" />
                <span>{roleConfig.tabLabel}</span>
              </button>

              {/* System & Maintenance Mode (Admin Only) */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setActiveTab('system')}
                  className={clsx(
                    'w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all text-left',
                    activeTab === 'system'
                      ? 'bg-surface-app text-content-primary shadow-sm border border-border-default font-bold'
                      : 'text-content-secondary hover:text-content-primary hover:bg-surface-app/60'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Wrench className="w-4 h-4 text-amber-500" />
                    <span>System & Maintenance</span>
                  </div>
                  {maintenanceMode && (
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTab('notifications')}
                className={clsx(
                  'w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all text-left',
                  activeTab === 'notifications'
                    ? 'bg-surface-app text-content-primary shadow-sm border border-border-default font-bold'
                    : 'text-content-secondary hover:text-content-primary hover:bg-surface-app/60'
                )}
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-blue-500" />
                  <span>Notifications</span>
                </div>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-600 text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Quick Session Identity Badge */}
            {profile && (
              <div className="mt-4 rounded-2xl border border-border-default/80 bg-surface-card p-4 shadow-sm text-xs space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-content-muted">Session Identity</span>
                <p className="font-bold text-content-primary truncate">{profile.name}</p>
                <div className={clsx("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border", roleConfig.badgeBg)}>
                  <RoleIcon className="w-3 h-3" />
                  <span>{roleConfig.roleLabel}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel Main Content */}
          <div className="flex-1 min-w-0">
            {/* TAB 1: PUBLIC PROFILE */}
            {activeTab === 'profile' && profile && (
              <div className="space-y-6">
                {/* Modern Profile Header Card */}
                <div className="relative overflow-hidden rounded-3xl border border-border-default/80 bg-surface-card p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    {/* Modern Avatar with Hover Camera Overlay */}
                    <div className="relative group shrink-0">
                      <div className="h-24 w-24 rounded-2xl overflow-hidden border-2 border-emerald-500/40 bg-surface-app shadow-lg flex items-center justify-center">
                        {profile.avatar_url && !avatarLoadError ? (
                          <img
                            src={profile.avatar_url}
                            alt={profile.name}
                            className="h-full w-full object-cover"
                            onError={() => setAvatarLoadError(true)}
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-3xl font-black text-emerald-400 bg-gradient-to-tr from-slate-900 to-slate-800">
                            {initial}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => inputRef.current?.click()}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-semibold cursor-pointer"
                        >
                          <Camera className="w-5 h-5 mb-1" />
                          <span>Update</span>
                        </button>
                      </div>
                      <input
                        ref={inputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        className="hidden"
                        onChange={uploadAvatar}
                      />
                    </div>

                    {/* Profile Information Summary */}
                    <div className="flex-1 text-center sm:text-left space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <h2 className="text-xl font-extrabold text-content-primary">{profile.name}</h2>
                        <span className={clsx("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border w-fit mx-auto sm:mx-0", roleConfig.badgeBg)}>
                          <CheckCircle2 className="w-3 h-3" /> {roleConfig.verifiedBadge}
                        </span>
                      </div>
                      <p className="text-xs text-content-secondary font-mono">{profile.email}</p>
                      <p className="text-xs text-content-muted pt-1">
                        {roleConfig.department} &bull; Role:{' '}
                        <span className="font-semibold text-content-primary">
                          {roleConfig.roleLabel}
                        </span>
                      </p>

                      <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <button
                          type="button"
                          onClick={() => inputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border border-border-default bg-surface-app hover:bg-surface-card text-content-primary transition-colors"
                        >
                          <Camera className="w-3.5 h-3.5 text-emerald-500" />
                          Change Picture
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Form Details */}
                <div className="rounded-3xl border border-border-default/80 bg-surface-card p-6 shadow-sm space-y-5">
                  <div className="border-b border-border-subtle pb-3">
                    <h3 className="text-base font-bold text-content-primary">Personal Details</h3>
                    <p className="text-xs text-content-secondary">
                      Update your official display name, nickname, and contact telephone number.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-content-primary mb-1">Full Name</label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={e => setProfile({ ...profile, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border-default bg-surface-app text-content-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                      <p className="mt-1 text-[11px] text-content-muted">Appears across all system audit trails.</p>
                    </div>

                    <div>
                      <label className="block font-semibold text-content-primary mb-1">Official Sign-in Email</label>
                      <div className="relative">
                        <input
                          type="email"
                          value={profile.email}
                          disabled
                          className="w-full px-3 py-2 rounded-xl border border-border-default bg-surface-app/50 text-content-muted font-mono cursor-not-allowed"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          Primary
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-content-muted">Email credentials are managed via IAM.</p>
                    </div>

                    <div>
                      <label className="block font-semibold text-content-primary mb-1">First Name</label>
                      <input
                        type="text"
                        value={profile.first_name || ''}
                        onChange={e => setProfile({ ...profile, first_name: e.target.value })}
                        placeholder="First name"
                        className="w-full px-3 py-2 rounded-xl border border-border-default bg-surface-app text-content-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-content-primary mb-1">Last Name</label>
                      <input
                        type="text"
                        value={profile.last_name || ''}
                        onChange={e => setProfile({ ...profile, last_name: e.target.value })}
                        placeholder="Last name"
                        className="w-full px-3 py-2 rounded-xl border border-border-default bg-surface-app text-content-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-content-primary mb-1">Call Sign / Nickname</label>
                      <input
                        type="text"
                        value={profile.nickname || ''}
                        onChange={e => setProfile({ ...profile, nickname: e.target.value })}
                        placeholder="e.g. John"
                        className="w-full px-3 py-2 rounded-xl border border-border-default bg-surface-app text-content-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-content-primary mb-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-content-muted" />
                        <input
                          type="text"
                          value={profile.phone || ''}
                          onChange={e => setProfile({ ...profile, phone: e.target.value })}
                          placeholder="+63 9XX XXX XXXX"
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-border-default bg-surface-app text-content-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border-subtle flex justify-end">
                    <button
                      type="button"
                      onClick={saveProfile}
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 transition-all disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save Profile Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PASSWORD & SECURITY */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-border-default/80 bg-surface-card p-6 shadow-sm space-y-5">
                  <div className="border-b border-border-subtle pb-3">
                    <h3 className="text-base font-bold text-content-primary">Rotate Access Password</h3>
                    <p className="text-xs text-content-secondary">
                      Maintain account security by rotating passwords in compliance with enterprise policies.
                    </p>
                  </div>

                  <div className="space-y-4 max-w-md text-xs">
                    <div>
                      <label className="block font-semibold text-content-primary mb-1">Current Password</label>
                      <input
                        type="password"
                        value={password.current_password}
                        onChange={e => setPassword({ ...password, current_password: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border-default bg-surface-app text-content-primary focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-content-primary mb-1">New Security Password</label>
                      <input
                        type="password"
                        value={password.password}
                        onChange={e => setPassword({ ...password, password: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border-default bg-surface-app text-content-primary focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      />
                      <p className="mt-1 text-[11px] text-content-muted">Minimum 8 characters with numbers and symbols.</p>
                    </div>

                    <div>
                      <label className="block font-semibold text-content-primary mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        value={password.password_confirmation}
                        onChange={e => setPassword({ ...password, password_confirmation: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border-default bg-surface-app text-content-primary focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={savePassword}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition-all disabled:opacity-50"
                      >
                        <Lock className="w-4 h-4" />
                        {saving ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Security Standard Card */}
                <div className="rounded-3xl border border-border-default/80 bg-surface-card p-6 shadow-sm space-y-3 text-xs">
                  <h4 className="font-bold text-content-primary flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-500" /> Active Security Controls
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-surface-app border border-border-default/60">
                      <p className="font-bold text-content-primary">Brute-Force Shield</p>
                      <p className="text-[11px] text-content-secondary mt-0.5">5 max attempts, 120s lockout throttle</p>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-app border border-border-default/60">
                      <p className="font-bold text-content-primary">Session Isolation</p>
                      <p className="text-[11px] text-content-secondary mt-0.5">Automated regeneration on login</p>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-app border border-border-default/60">
                      <p className="font-bold text-content-primary">Audit Log Trail</p>
                      <p className="text-[11px] text-content-secondary mt-0.5">Immutable event recording enabled</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ROLE-TAILORED PREFERENCES */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-border-default/80 bg-surface-card p-6 shadow-sm space-y-5">
                  <div className="border-b border-border-subtle pb-4 flex items-center justify-between">
                    <div>
                      <div className={clsx("inline-flex items-center gap-1.5 px-3 py-0.5 rounded-md text-xs font-semibold mb-1 border", roleConfig.badgeBg)}>
                        <RoleIcon className="w-3.5 h-3.5" />
                        <span>{roleConfig.roleLabel}</span>
                      </div>
                      <h3 className="text-lg font-bold text-content-primary">
                        {roleConfig.preferencesTitle}
                      </h3>
                      <p className="text-xs text-content-secondary mt-0.5">
                        {roleConfig.preferencesSubtitle}
                      </p>
                    </div>
                    <span className="text-xs text-content-muted">
                      {roleConfig.preferencesItems.length} Available Rules
                    </span>
                  </div>

                  {/* Toggle items list */}
                  <div className="divide-y divide-border-subtle/70">
                    {roleConfig.preferencesItems.map((item) => {
                      const isChecked = preferenceToggles[item.id] ?? item.defaultChecked;

                      return (
                        <div key={item.id} className="py-4 flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-bold text-content-primary">{item.title}</p>
                            <p className="text-[11px] text-content-secondary mt-0.5 leading-relaxed max-w-xl">
                              {item.description}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => togglePreference(item.id)}
                            className={clsx(
                              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                              isChecked ? 'bg-emerald-500' : 'bg-slate-700'
                            )}
                          >
                            <span
                              className={clsx(
                                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
                                isChecked ? 'translate-x-5' : 'translate-x-0'
                              )}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-4 border-t border-border-subtle flex justify-between items-center text-xs">
                    <span className="text-content-muted">Changes are saved automatically to your profile session.</span>
                    <span className="text-emerald-500 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Active & Synced
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SYSTEM GOVERNANCE & MAINTENANCE MODE (ADMIN ONLY) */}
            {activeTab === 'system' && isAdmin && (
              <div className="space-y-6">
                {/* Main Maintenance Mode Control Panel */}
                <div
                  className={clsx(
                    'rounded-3xl border p-6 shadow-sm transition-all',
                    maintenanceMode
                      ? 'border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-surface-card to-surface-card shadow-amber-500/5'
                      : 'border-border-default/80 bg-surface-card'
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-5">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-2 bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Wrench className="w-3.5 h-3.5" /> Emergency & Scheduled Maintenance Control
                      </div>
                      <h3 className="text-xl font-extrabold text-content-primary">
                        System Maintenance Mode
                      </h3>
                      <p className="mt-1 text-xs text-content-secondary max-w-xl leading-relaxed">
                        When enabled, non-administrator users (Sales Managers, Staff, Clients) are locked out and served a 503 Maintenance Screen. Only Administrators can access and operate the console.
                      </p>
                    </div>

                    {/* Master Switch */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={toggleMaintenanceMode}
                        disabled={saving}
                        className={clsx(
                          'relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                          maintenanceMode ? 'bg-amber-500' : 'bg-slate-700'
                        )}
                        aria-label="Toggle system maintenance mode"
                      >
                        <span
                          className={clsx(
                            'pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
                            maintenanceMode ? 'translate-x-7' : 'translate-x-0'
                          )}
                        />
                      </button>
                      <span className="text-[11px] font-bold font-mono text-content-primary">
                        {maintenanceMode ? 'STATUS: ACTIVE' : 'STATUS: OFFLINE'}
                      </span>
                    </div>
                  </div>

                  {/* Broadcast Notice Configuration */}
                  <div className="mt-5 space-y-4 text-xs">
                    <div>
                      <label className="block font-semibold text-content-primary mb-1.5 flex items-center justify-between">
                        <span>Maintenance Broadcast Notice (Publicly Visible on 503 Screen)</span>
                        <Link
                          href="/maintenance"
                          target="_blank"
                          className="text-amber-400 hover:underline inline-flex items-center gap-1 text-[11px]"
                        >
                          <ExternalLink className="w-3 h-3" /> Preview 503 Screen
                        </Link>
                      </label>
                      <textarea
                        rows={3}
                        value={broadcastMessage}
                        onChange={e => setBroadcastMessage(e.target.value)}
                        placeholder="Enter notice explaining the downtime, expected restoration time, and contact info..."
                        className="w-full p-3 rounded-xl border border-border-default bg-surface-app text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all leading-relaxed"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] text-content-muted">
                        {startedAt ? `Active since: ${new Date(startedAt).toLocaleString()}` : 'System currently operating normally.'}
                      </span>
                      <button
                        type="button"
                        onClick={saveBroadcastMessage}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border border-border-default bg-surface-card hover:bg-surface-app text-content-primary transition-all"
                      >
                        <Save className="w-3.5 h-3.5 text-amber-500" />
                        Save Notice
                      </button>
                    </div>
                  </div>
                </div>

                {/* System Infrastructure Telemetry Grid */}
                <div className="rounded-3xl border border-border-default/80 bg-surface-card p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                    <div>
                      <h4 className="text-base font-bold text-content-primary flex items-center gap-2">
                        <Server className="w-4 h-4 text-emerald-500" /> Infrastructure Telemetry & Diagnostics
                      </h4>
                      <p className="text-xs text-content-secondary">Real-time runtime environment and cluster status.</p>
                    </div>
                    <button
                      type="button"
                      onClick={fetchMaintenanceDetails}
                      disabled={loadingTelemetry}
                      className="p-1.5 text-content-secondary hover:text-content-primary rounded-lg border border-border-default bg-surface-app"
                      title="Refresh Telemetry"
                    >
                      <RefreshCw className={clsx('w-3.5 h-3.5', loadingTelemetry && 'animate-spin')} />
                    </button>
                  </div>

                  {telemetry ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3.5 rounded-2xl bg-surface-app border border-border-default/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-content-muted block">Database</span>
                        <p className="mt-1 font-bold text-emerald-400 flex items-center gap-1">
                          <Database className="w-3.5 h-3.5" /> {telemetry.db_status}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-surface-app border border-border-default/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-content-muted block">PHP Runtime</span>
                        <p className="mt-1 font-bold text-content-primary font-mono flex items-center gap-1">
                          <Cpu className="w-3.5 h-3.5 text-indigo-400" /> {telemetry.php_version}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-surface-app border border-border-default/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-content-muted block">Framework</span>
                        <p className="mt-1 font-bold text-content-primary font-mono">
                          Laravel {telemetry.laravel_version}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-surface-app border border-border-default/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-content-muted block">Cache Driver</span>
                        <p className="mt-1 font-bold text-content-primary font-mono uppercase">
                          {telemetry.cache_driver}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-surface-app border border-border-default/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-content-muted block">Environment</span>
                        <p className="mt-1 font-bold text-content-primary capitalize">
                          {telemetry.environment}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-surface-app border border-border-default/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-content-muted block">Active Admins</span>
                        <p className="mt-1 font-bold text-content-primary">
                          {telemetry.admin_count} accounts
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-surface-app border border-border-default/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-content-muted block">Total User Base</span>
                        <p className="mt-1 font-bold text-content-primary">
                          {telemetry.total_users} accounts
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-surface-app border border-border-default/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-content-muted block">Audit Trail</span>
                        <Link href="/logs" className="mt-1 font-bold text-emerald-400 hover:underline flex items-center gap-1">
                          View Logs <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-content-secondary">
                      Loading telemetry metrics...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <div className="rounded-3xl border border-border-default/80 bg-surface-card p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-4">
                    <div>
                      <h3 className="text-base font-bold text-content-primary">System Notifications</h3>
                      <p className="text-xs text-content-secondary">Alerts, security dispatches, and workflow updates.</p>
                    </div>
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="text-xs font-semibold text-blue-500 hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div className="py-12 text-center text-xs text-content-secondary">
                      <Bell className="mx-auto h-8 w-8 text-content-muted opacity-40 mb-2" />
                      <p className="font-semibold">No notifications</p>
                      <p className="text-[11px] text-content-muted mt-0.5">You are all caught up on system updates.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border-subtle/70 text-xs">
                      {notifications.map(n => (
                        <div
                          key={n.id}
                          className={clsx(
                            'p-3.5 rounded-xl transition-colors flex items-start gap-3',
                            n.read_at ? 'opacity-60' : 'bg-surface-app/40'
                          )}
                        >
                          <div className="mt-0.5">
                            <span
                              className={clsx(
                                'block h-2.5 w-2.5 rounded-full',
                                n.type === 'warning'
                                  ? 'bg-amber-400'
                                  : n.type === 'urgent'
                                  ? 'bg-rose-500'
                                  : 'bg-blue-500'
                              )}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-content-primary">{n.title}</p>
                            <p className="text-content-secondary mt-0.5 leading-relaxed">{n.message}</p>
                            <p className="text-[10px] text-content-muted mt-1">
                              {new Date(n.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}