import React, { useEffect, useState, useMemo } from 'react';
import { Link, usePage } from '@inertiajs/react';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Users,
  FileText,
  Truck,
  FolderKanban,
  BarChart3,
  Sparkles,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Bell,
  Search,
  LogOut,
  Settings,
  MessageSquare,
  FileStack,
  UserCircle,
  Moon,
  Sun,
  Shield,
  History,
  PhoneCall,
  Mail,
  MessageSquareQuote,
  UserCheck,
  CalendarClock,
  CheckCircle2,
  Gauge,
  CalendarCheck,
  Wrench,
  Clock,
} from 'lucide-react';

import SalesAiFloatingChatbot from '../Components/SalesAiFloatingChatbot';

// Inline Intelitrack logo icon (compact mode — small square)
const IntelitrackIcon = () => (
  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center">
    <img
      src="/images/intellitrack-icon.png"
      alt="IntelliTrack"
      className="h-7 w-7 object-contain dark:brightness-0 dark:invert"
    />
  </div>
);

const formatRole = (role: string = '') => ({
  administrator: 'Administrator',
  sales_manager: 'Sales Manager',
  sales_business_development: 'Sales BD',
  operations_technical: 'Operations & Technical Staff',
  staff: 'Operations Staff',
  customer: 'Client Portal',
}[role] ?? (role ? role.replace(/_/g, ' ') : 'User'));

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
  children?: NavItem[];
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-4 h-4" />,
    href: '/dashboard',
    roles: ['sales_manager', 'sales_business_development', 'administrator', 'operations_technical', 'staff'],
  },
  {
    label: 'CRM',
    icon: <Users className="w-4 h-4" />,
    href: '/crm',
    roles: ['sales_manager', 'sales_business_development'],
    children: [
      { label: 'Customers', icon: <UserCircle className="w-3.5 h-3.5" />, href: '/customers' },
      { label: 'Inquiries', icon: <MessageSquare className="w-3.5 h-3.5" />, href: '/inquiries' },
      { label: 'Follow-Ups', icon: <PhoneCall className="w-3.5 h-3.5" />, href: '/crm/follow-ups' },
      { label: 'Communications', icon: <Mail className="w-3.5 h-3.5" />, href: '/crm/communications' },
      { label: 'Quotations', icon: <FileStack className="w-3.5 h-3.5" />, href: '/quotations' },
      { label: 'Feedback', icon: <MessageSquareQuote className="w-3.5 h-3.5" />, href: '/crm/feedback' },
    ],
  },
  {
    label: 'Job Orders',
    icon: <FileText className="w-4 h-4" />,
    href: '/job-orders',
    roles: ['sales_manager', 'sales_business_development', 'operations_technical', 'staff'],
    children: [
      { label: 'All Orders', icon: <FileText className="w-3.5 h-3.5" />, href: '/job-orders', roles: ['sales_manager', 'sales_business_development', 'operations_technical', 'staff'] },
      { label: 'Requests & Approvals', icon: <Clock className="w-3.5 h-3.5" />, href: '/job-orders/requests', roles: ['sales_manager', 'sales_business_development', 'operations_technical', 'staff'] },
      { label: 'Assignment', icon: <UserCheck className="w-3.5 h-3.5" />, href: '/job-orders/assignment', roles: ['sales_manager', 'operations_technical', 'staff'] },
      { label: 'Scheduling', icon: <CalendarClock className="w-3.5 h-3.5" />, href: '/job-orders/scheduling', roles: ['sales_manager', 'operations_technical', 'staff'] },
      { label: 'Completion', icon: <CheckCircle2 className="w-3.5 h-3.5" />, href: '/job-orders/completion', roles: ['sales_manager', 'operations_technical', 'staff'] },
    ],
  },
  {
    label: 'Fleet & Rentals',
    icon: <Truck className="w-4 h-4" />,
    href: '/equipment',
    roles: ['sales_manager', 'sales_business_development', 'operations_technical', 'staff'],
    children: [
      { label: 'Equipment', icon: <Truck className="w-3.5 h-3.5" />, href: '/equipment', roles: ['sales_manager', 'sales_business_development', 'operations_technical', 'staff'] },
      { label: 'Availability', icon: <Gauge className="w-3.5 h-3.5" />, href: '/equipment/availability', roles: ['sales_manager', 'sales_business_development', 'operations_technical', 'staff'] },
      { label: 'Rentals', icon: <CalendarCheck className="w-3.5 h-3.5" />, href: '/rentals', roles: ['sales_manager', 'operations_technical', 'staff'] },
      { label: 'Maintenance', icon: <Wrench className="w-3.5 h-3.5" />, href: '/equipment/maintenance', roles: ['sales_manager', 'operations_technical', 'staff'] },
    ],
  },
  {
    label: 'Projects',
    icon: <FolderKanban className="w-4 h-4" />,
    href: '/projects',
    roles: ['sales_manager', 'sales_business_development', 'operations_technical', 'staff'],
  },
  {
    label: 'AI Analytics',
    icon: <Sparkles className="w-4 h-4" />,
    href: '/ai-analytics',
    badge: 'AI',
    roles: ['sales_manager'],
  },
  {
    label: 'Reports & BI',
    icon: <BarChart3 className="w-4 h-4" />,
    href: '/reports',
    roles: ['sales_manager'],
  },
  {
    label: 'User Management',
    icon: <Users className="w-4 h-4" />,
    href: '/users',
    roles: ['administrator'],
  },
  {
    label: 'Roles & Access',
    icon: <Shield className="w-4 h-4" />,
    href: '/roles',
    roles: ['administrator'],
  },
  {
    label: 'Audit Logs',
    icon: <History className="w-4 h-4" />,
    href: '/logs',
    roles: ['administrator'],
  },
  {
    label: 'System Settings',
    icon: <Settings className="w-4 h-4" />,
    href: '/settings',
    roles: ['administrator'],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  currentPath?: string;
  userRole?: string;
}

const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse, currentPath = '/', userRole = '' }: SidebarProps) => {
  const isCompact = isCollapsed && !isOpen;
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    const path = typeof window !== 'undefined' ? window.location.pathname : '/';
    return navItems
      .filter((item) => item.children?.some((c) => path === c.href || path.startsWith(c.href + '/')))
      .map((item) => item.label);
  });

  useEffect(() => {
    const matchingParents = navItems
      .filter((item) => item.children?.some((c) => currentPath === c.href || currentPath.startsWith(c.href + '/')))
      .map((item) => item.label);

    if (matchingParents.length > 0) {
      setExpandedItems((prev) => Array.from(new Set([...prev, ...matchingParents])));
    }
  }, [currentPath]);

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    );
  };

  const isItemActive = (href: string, isChild: boolean, children?: NavItem[]): boolean => {
    const current = currentPath.replace(/\/$/, '') || '/';
    const target = href.replace(/\/$/, '') || '/';

    if (isChild) {
      // Sibling root routes like /job-orders, /equipment, or /crm that have child sub-routes
      // must strictly match exact path, otherwise /job-orders will always match /job-orders/*
      if (target === '/job-orders' || target === '/equipment' || target === '/crm') {
        return current === target;
      }
      return current === target || current.startsWith(target + '/');
    }

    if (children && children.length > 0) {
      return children.some((c) => isItemActive(c.href, true));
    }

    return current === target || current.startsWith(target + '/');
  };

  const normalizedRole = userRole === 'admin' ? 'administrator' : (userRole === 'sales_bd' ? 'sales_business_development' : userRole);

  const availableNavItems = useMemo(() => {
    return navItems
      .filter((item) => !item.roles || item.roles.includes(normalizedRole))
      .map((item) => {
        if (!item.children) return item;
        return {
          ...item,
          children: item.children.filter((child) => !child.roles || child.roles.includes(normalizedRole)),
        };
      });
  }, [normalizedRole]);

  const NavLink = ({ item, isChild = false }: { item: NavItem; isChild?: boolean }) => {
    const isActive = isItemActive(item.href, isChild, item.children);
    const isExpanded = expandedItems.includes(item.label);
    const hasChildren = !!item.children?.length;

    if (hasChildren) {
      return (
        <div className="my-1">
          <button
            type="button"
            onClick={() => toggleExpand(item.label)}
            className={clsx(
              'group flex w-full items-center rounded-xl transition-all duration-200 cursor-pointer select-none',
              isCompact ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
              isActive
                ? 'bg-amber-500/10 text-amber-500 font-semibold border border-amber-500/20'
                : 'text-content-secondary hover:bg-surface-card hover:text-content-primary'
            )}
          >
            <span className={clsx('shrink-0 flex items-center justify-center transition-colors', isActive ? 'text-amber-500' : 'text-content-secondary group-hover:text-content-primary')}>{item.icon}</span>
            {!isCompact && (
              <>
                <span className="flex-1 text-left text-xs font-semibold">{item.label}</span>
                <ChevronDown className={clsx('h-3.5 w-3.5 shrink-0 transition-transform duration-200 text-content-muted', isExpanded && 'rotate-180 text-amber-500')} />
              </>
            )}
          </button>
          {!isCompact && isExpanded && (
            <div className="mt-1 ml-4 border-l border-border-default/60 pl-3 space-y-1">
              {item.children!.map((child) => (
                <NavLink key={child.href} item={child} isChild />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="my-0.5">
        <Link
          href={item.href}
          title={isCompact ? item.label : undefined}
          className={clsx(
            'group flex items-center rounded-xl transition-all duration-200 select-none',
            isCompact ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5',
            isChild ? '!py-2 !pl-2.5 text-xs' : 'text-xs font-semibold',
            isActive
              ? isChild
                ? 'bg-amber-500/15 text-amber-400 font-bold border-l-2 border-amber-500 shadow-sm'
                : 'bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent text-amber-500 font-bold border-l-4 border-amber-500 shadow-sm'
              : isChild
                ? 'border-l-2 border-transparent text-content-secondary hover:bg-surface-card hover:text-content-primary hover:translate-x-0.5'
                : 'border-l-4 border-transparent text-content-secondary hover:bg-surface-card hover:text-content-primary hover:translate-x-0.5'
          )}
        >
          <span className={clsx('shrink-0 flex items-center justify-center transition-colors', isActive ? 'text-amber-500' : 'text-content-secondary group-hover:text-content-primary')}>{item.icon}</span>
          {!isCompact && (
            <span className="flex-1">{item.label}</span>
          )}
          {!isCompact && item.badge && (
            <span className="rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-sm shadow-indigo-500/30">
              {item.badge}
            </span>
          )}
        </Link>
      </div>
    );
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}

      <aside
        className={clsx(
          'fixed lg:static flex h-screen flex-col bg-surface-app border-r border-border-default/80 text-content-primary transition-all duration-300 z-40 select-none',
          isCompact ? 'w-[76px]' : 'w-64',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Top Branding */}
        <div className={clsx('flex items-center border-b border-border-default/80 py-4', isCompact ? 'justify-center px-3' : 'justify-between px-5')}>
          {isCompact ? (
            <IntelitrackIcon />
          ) : (
            <img
              src="/images/intellitrack-logo.png"
              alt="IntelliTrack"
              className="h-7 w-auto object-contain dark:brightness-0 dark:invert"
            />
          )}
          <button
            onClick={onClose}
            className="ml-auto p-1 text-content-secondary hover:text-content-primary lg:hidden rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className={clsx('flex-1 space-y-0.5 overflow-y-auto py-4', isCollapsed ? 'px-2' : 'px-3')}>
          {availableNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* Bottom Role / Collapse toggle */}
        <div className="border-t border-border-default/80 p-3 bg-surface-card/40">
          <div className="flex items-center justify-between">
            {!isCompact && (
              <div className="flex items-center gap-2 px-2 py-1">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold text-content-secondary capitalize">
                  {formatRole(userRole)}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={onToggleCollapse}
              className={clsx(
                'hidden h-8 w-8 items-center justify-center rounded-xl border border-border-default bg-surface-card text-content-secondary hover:text-content-primary hover:border-amber-500/50 shadow-sm transition-all lg:flex cursor-pointer',
                isCompact && 'mx-auto'
              )}
              aria-label={isCollapsed ? 'Expand menu' : 'Collapse menu'}
            >
              <ChevronRight className={clsx('h-4 w-4 transition-transform duration-300', !isCompact && 'rotate-180')} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

interface HeaderProps {
  onSidebarToggle: () => void;
  title?: string;
  action?: React.ReactNode;
  userRole?: string;
  dark?: boolean;
  onToggleDark?: () => void;
}

const Header = ({ onSidebarToggle, title, action, userRole = '', dark = false, onToggleDark }: HeaderProps) => {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const { auth } = usePage<any>().props;
  const [profile, setProfile] = useState<{ name: string; nickname?: string; first_name?: string; avatar_url?: string; role?: string; email?: string } | null>(() => auth?.user ?? null);
  const [avatarError, setAvatarError] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ type: string; title: string; subtitle: string; href: string }>>([]);
  const [notifications, setNotifications] = useState<Array<{ id: number; title: string; message: string; type: string; read_at?: string; created_at: string }>>([]);

  const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

  const loadNotifications = () => {
    fetch('/api/dashboard/notifications?per_page=8', { headers: { Accept: 'application/json' } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setNotifications(d.data ?? []))
      .catch(() => setNotifications([]));
  };

  useEffect(() => {
    loadNotifications();
    const interval = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(interval);
  }, []);

  // Sync profile when auth props change
  useEffect(() => {
    if (auth?.user) {
      setProfile(auth.user);
    }
  }, [auth?.user]);

  // Global Keyboard Shortcut (Cmd+K / Ctrl+K and Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotificationMenuOpen(false);
        setAccountMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchTerm.trim().length < 2) { setSearchResults([]); return; }
    const t = window.setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`, { headers: { Accept: 'application/json' } })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(d => setSearchResults(d.data ?? []))
        .catch(() => setSearchResults([]));
    }, 200);
    return () => window.clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    fetch('/api/profile', { headers: { Accept: 'application/json' } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(p => {
        if (p) setProfile(p);
      })
      .catch(() => {});
  }, []);

  const markRead = async (id: number) => {
    await fetch(`/api/dashboard/notifications/${id}/read`, { method: 'PATCH', headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken } });
    loadNotifications();
  };

  const markAllRead = async () => {
    await fetch('/api/dashboard/notifications/read-all', { method: 'POST', headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken } });
    loadNotifications();
  };

  const signOut = async () => {
    await fetch('/logout', { method: 'POST', headers: { 'X-CSRF-TOKEN': csrfToken, Accept: 'application/json' } });
    window.location.href = '/login';
  };

  const accountName = profile?.nickname || profile?.first_name || profile?.name || 'Authorized User';
  const initials = accountName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const unreadCount = notifications.filter(n => !n.read_at).length;

  return (
    <header className="relative z-40 w-full bg-surface-card/90 backdrop-blur-md border-b border-border-default/80 text-content-primary shrink-0">
      {/* Transparent Click-Outside Backdrop to dismiss open dropdowns */}
      {(notificationMenuOpen || accountMenuOpen) && (
        <div
          className="fixed inset-0 z-[60] bg-transparent"
          onClick={() => {
            setNotificationMenuOpen(false);
            setAccountMenuOpen(false);
          }}
        />
      )}

      <div className="flex h-16 min-w-0 items-center justify-between gap-3 px-4 sm:px-6">

        {/* Left Side: Mobile Menu & Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSidebarToggle}
            className="rounded-xl border border-border-default p-2 text-content-secondary hover:bg-surface-input hover:text-content-primary lg:hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 text-sm">
            <img
              src="/images/intellitrack-logo.png"
              alt="IntelliTrack"
              className="hidden h-6 w-auto object-contain dark:brightness-0 dark:invert sm:block"
            />
            {title && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-content-muted" />
                <span className="max-w-[40vw] truncate font-bold text-content-primary sm:max-w-none text-base">
                  {title}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Center: Command Search Bar */}
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="hidden md:flex items-center gap-2.5 rounded-2xl border border-border-default/80 bg-surface-app/70 px-4 py-2 text-xs font-medium text-content-secondary hover:border-amber-500/50 hover:bg-surface-card hover:text-content-primary shadow-inner transition-all w-64 lg:w-80 cursor-pointer"
        >
          <Search className="h-3.5 w-3.5 text-amber-500" />
          <span className="flex-1 text-left">Search records, cranes, quotes...</span>
          <kbd className="rounded-lg border border-border-default bg-surface-card px-1.5 py-0.5 text-[10px] font-mono text-content-muted shadow-sm">
            Ctrl K
          </kbd>
        </button>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {action}

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={onToggleDark}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-default/80 bg-surface-app/60 text-content-secondary hover:text-amber-500 hover:border-amber-500/40 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setNotificationMenuOpen(!notificationMenuOpen); if (!notificationMenuOpen) loadNotifications(); }}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border-default/80 bg-surface-app/60 text-content-secondary hover:text-amber-500 hover:border-amber-500/40 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-rose-600 text-[9px] font-bold text-white shadow-md shadow-rose-500/40 animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {notificationMenuOpen && (
              <div className="absolute right-0 top-12 z-[70] w-80 sm:w-96 overflow-hidden rounded-2xl border border-border-default/80 bg-surface-card shadow-2xl backdrop-blur-2xl">
                <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3.5 bg-surface-app/50">
                  <p className="text-xs font-bold uppercase tracking-wider text-content-primary">Notifications Center</p>
                  <button type="button" onClick={markAllRead} className="text-xs font-semibold text-amber-500 hover:underline cursor-pointer">Mark all as read</button>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-border-subtle">
                  {notifications.length ? notifications.map(n => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => void markRead(n.id)}
                      className={clsx(
                        'block w-full p-4 text-left hover:bg-surface-app/80 transition-colors',
                        n.read_at && 'opacity-60'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span className={clsx(
                          'mt-1 h-2 w-2 shrink-0 rounded-full',
                          n.read_at ? 'bg-slate-300' : 'bg-amber-500 shadow-sm shadow-amber-500/50'
                        )} />
                        <div className="flex-1">
                          <p className="text-xs font-bold text-content-primary">{n.title}</p>
                          <p className="mt-0.5 text-xs text-content-secondary leading-relaxed">{n.message}</p>
                        </div>
                      </div>
                    </button>
                  )) : (
                    <div className="p-8 text-center text-xs text-content-secondary">
                      No notifications recorded.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setAccountMenuOpen(!accountMenuOpen)}
              className="flex items-center gap-2 rounded-2xl border border-border-default/80 bg-surface-app/60 p-1.5 hover:border-amber-500/40 transition-all cursor-pointer"
              aria-expanded={accountMenuOpen}
            >
              <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-xs font-black text-slate-950 shadow-sm">
                {profile?.avatar_url && !avatarError ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  initials
                )}
              </span>
              <span className="hidden text-xs font-bold text-content-primary sm:inline max-w-[100px] truncate">{accountName}</span>
              <ChevronDown className="h-3.5 w-3.5 text-content-muted" />
            </button>
            {accountMenuOpen && (
              <div className="absolute right-0 top-12 z-[70] w-56 overflow-hidden rounded-2xl border border-border-default/80 bg-surface-card p-1.5 shadow-2xl backdrop-blur-2xl">
                <div className="border-b border-border-subtle px-3.5 py-3 mb-1 bg-surface-app/40 rounded-xl">
                  <p className="text-xs font-bold text-content-primary truncate">{accountName}</p>
                  <p className="text-[10px] font-semibold text-amber-500 uppercase">{formatRole(profile?.role ?? userRole)}</p>
                </div>
                <a href="/settings" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-content-secondary hover:bg-surface-input hover:text-content-primary transition-colors">
                  <Settings className="h-4 w-4" />
                  System Settings
                </a>
                <button
                  type="button"
                  onClick={signOut}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Command Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-slate-950/70 p-4 pt-[12vh] backdrop-blur-md" onClick={() => setSearchOpen(false)}>
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-border-default/80 bg-surface-card shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-border-subtle px-5 py-4 bg-surface-app/50">
              <Search className="h-5 w-5 text-amber-500 shrink-0" />
              <input
                autoFocus
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    setSearchOpen(false);
                  }
                }}
                placeholder="Search customers, quotations, equipment, rentals..."
                className="w-full border-0 bg-transparent text-sm font-medium outline-none placeholder:text-content-muted"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                title="Close search (ESC)"
                className="flex items-center gap-1 rounded-lg border border-border-default bg-surface-card px-2 py-0.5 text-[11px] font-mono font-semibold text-content-muted hover:text-content-primary hover:border-amber-500/50 hover:bg-surface-app shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
              >
                <span>ESC</span>
                <X className="h-3 w-3" />
              </button>
            </div>
            <div className="max-h-[50vh] overflow-y-auto divide-y divide-border-subtle p-2">
              {searchTerm.length < 2 ? (
                <p className="p-8 text-center text-xs text-content-secondary">Type at least 2 characters to search across all microservices...</p>
              ) : searchResults.length ? (
                searchResults.map((r, i) => (
                  <a
                    key={`${r.href}-${i}`}
                    href={r.href}
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center justify-between rounded-xl px-4 py-3 hover:bg-amber-500/10 hover:text-amber-500 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-bold text-content-primary">{r.title}</p>
                      <p className="text-[11px] text-content-secondary capitalize">{r.type} · {r.subtitle}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-content-muted" />
                  </a>
                ))
              ) : (
                <p className="p-8 text-center text-xs text-content-secondary">No records found matching "{searchTerm}".</p>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  headerAction?: React.ReactNode;
  dark?: boolean;
  showHeader?: boolean;
}

const AppLayout = ({ children, title, headerAction, dark = false, showHeader = true }: AppLayoutProps) => {
  const [isDark, setIsDark] = useState(() => {
    try {
      const stored = localStorage.getItem('intelitrack-theme-dark');
      if (stored !== null) return stored === 'true';
      return dark;
    } catch {
      return dark;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('intelitrack-theme-dark', String(isDark));
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch { }
  }, [isDark]);

  const { auth } = usePage<any>().props;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>(() => {
    if (auth?.user?.role) return auth.user.role;
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('intelitrack-user-role');
      if (cached) return cached;
    }
    return '';
  });

  useEffect(() => {
    if (auth?.user?.role) {
      setUserRole(auth.user.role);
      try {
        localStorage.setItem('intelitrack-user-role', auth.user.role);
      } catch {}
    }
  }, [auth?.user?.role]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('intelitrack-sidebar-v2') === 'collapsed';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('intelitrack-sidebar-v2', sidebarCollapsed ? 'collapsed' : 'expanded');
    } catch { }
  }, [sidebarCollapsed]);

  useEffect(() => {
    fetch('/api/profile', { headers: { Accept: 'application/json' } })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((p: { role?: string }) => {
        if (p?.role) {
          setUserRole(p.role);
          try {
            localStorage.setItem('intelitrack-user-role', p.role);
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className={clsx('flex h-[100dvh] min-w-0 overflow-hidden font-sans', isDark ? 'bg-surface-app' : 'bg-slate-50')}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        currentPath={typeof window !== 'undefined' ? window.location.pathname : '/'}
        userRole={userRole}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {showHeader && (
          <Header
            onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
            title={title}
            action={headerAction}
            userRole={userRole}
            dark={isDark}
            onToggleDark={() => setIsDark(!isDark)}
          />
        )}

        <main className="flex-1 overflow-y-auto bg-surface-app/40 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Floating Messenger-style AI Sales Intelligence Chatbot */}
      <SalesAiFloatingChatbot userRole={userRole} />
    </div>
  );
};

export { AppLayout, Sidebar, Header };
export default AppLayout;
