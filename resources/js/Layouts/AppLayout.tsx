import React, { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
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
  HelpCircle,
  Settings,
  MessageSquare,
  TrendingUp,
  FileStack,
  UserCircle,
  Moon,
  Sun,
  Shield,
  History,
} from 'lucide-react';

// Inline Intelitrack logo icon
const IntelitrackIcon = ({ isAdmin = false }: { isAdmin?: boolean }) => (
  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ffcc00] shadow-lg">
    {isAdmin ? (
      <Truck className="h-5 w-5 text-black" />
    ) : (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 13L7 9L10 12L15 5" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="15" cy="5" r="2" fill="black"/>
      </svg>
    )}
  </div>
);

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
    roles: ['sales_manager', 'sales_business_development'],
  },
  {
    label: 'CRM',
    icon: <Users className="w-4 h-4" />,
    href: '/crm',
    children: [
      { label: 'Customers', icon: <UserCircle className="w-3.5 h-3.5" />, href: '/customers' },
      { label: 'Inquiries', icon: <MessageSquare className="w-3.5 h-3.5" />, href: '/inquiries' },
      { label: 'Leads & Opportunities', icon: <TrendingUp className="w-3.5 h-3.5" />, href: '/sales-opportunities' },
      { label: 'Quotations', icon: <FileStack className="w-3.5 h-3.5" />, href: '/quotations' },
    ],
    roles: ['sales_manager', 'sales_business_development'],
  },
  {
    label: 'Clients',
    icon: <Users className="w-4 h-4" />,
    href: '/clients',
    roles: ['sales_manager', 'sales_business_development'],
  },
  {
    label: 'Job Orders',
    icon: <FileText className="w-4 h-4" />,
    href: '/job-orders',
    roles: ['sales_manager', 'sales_business_development'],
  },
  {
    label: 'Rentals',
    icon: <Truck className="w-4 h-4" />,
    href: '/rental-requirements',
    roles: ['sales_manager', 'sales_business_development'],
  },
  {
    label: 'Projects',
    icon: <FolderKanban className="w-4 h-4" />,
    href: '/projects',
    roles: ['sales_manager', 'sales_business_development'],
  },
  {
    label: 'AI Analytics',
    icon: <Sparkles className="w-4 h-4" />,
    href: '/ai-analytics',
    badge: 'AI',
    roles: ['sales_manager'],
  },
  {
    label: 'Reports',
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
    label: 'Roles & Permissions',
    icon: <Shield className="w-4 h-4" />,
    href: '/roles',
    roles: ['administrator'],
  },
  {
    label: 'System Logs',
    icon: <History className="w-4 h-4" />,
    href: '/logs',
    roles: ['administrator'],
  },
  {
    label: 'Settings',
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

const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse, currentPath = '/', userRole = 'sales_manager' }: SidebarProps) => {
  const isCompact = isCollapsed && !isOpen;
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    // Auto-expand CRM if any child is active
    const path = typeof window !== 'undefined' ? window.location.pathname : '/';
    const crmPaths = ['/customers', '/inquiries', '/sales-opportunities', '/quotations'];
    return crmPaths.some(p => path.startsWith(p)) ? ['CRM'] : [];
  });

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    );
  };

  const isPathActive = (href: string, children?: NavItem[]) => {
    if (children) return children.some(c => currentPath.startsWith(c.href));
    return currentPath === href || currentPath.startsWith(href + '/');
  };

  const availableNavItems = navItems.filter((item) => !item.roles || item.roles.includes(userRole));
  const NavLink = ({ item, isChild = false }: { item: NavItem; isChild?: boolean }) => {
    const isActive = isChild
      ? currentPath.startsWith(item.href)
      : isPathActive(item.href, item.children);
    const isExpanded = expandedItems.includes(item.label);
    const hasChildren = !!item.children?.length;

    if (hasChildren) {
      return (
        <div>
          <button
            type="button"
            onClick={() => toggleExpand(item.label)}
            className={clsx( 'flex w-full items-center rounded-lg transition-colors duration-150',
              isCompact ? 'justify-center p-2.5' : 'gap-3 px-3 py-2',
              isActive
                ? isCollapsed ? 'bg-brand text-black' : 'bg-[#ffcc00]/10 text-brand'
                : 'text-content-secondary hover:bg-white/8 hover:text-slate-200'
            )}
          >
            <span className={clsx('shrink-0 flex items-center justify-center', isActive ? 'text-brand' : 'text-content-secondary')}>{item.icon}</span>
            {!isCompact && (
              <>
                <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                <ChevronDown className={clsx('h-3.5 w-3.5 shrink-0 transition-transform duration-200', isExpanded && 'rotate-180')} />
              </>
            )}
          </button>
          {!isCompact && isExpanded && (
            <div className="mt-0.5 ml-3 border-l border-white/10 pl-3">
              {item.children!.map((child) => (
                <NavLink key={child.href} item={child} isChild />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        href={item.href}
        title={isCompact ? item.label : undefined}
        className={clsx( 'flex items-center rounded-lg transition-colors duration-150',
          isCompact ? 'justify-center p-2.5' : 'gap-3 px-3 py-2',
          isChild ? '!py-1.5 !pl-2 text-sm' : 'text-sm font-medium',
          isActive
            ? isCollapsed ? 'bg-brand text-brand-content shadow-md' : 'border-l-[3px] border-brand bg-zinc-900/50 text-brand'
            : 'border-l-[3px] border-transparent text-content-secondary hover:bg-surface-input hover:text-content-primary'
        )}
      >
        <span className={clsx('shrink-0 flex items-center justify-center', isActive ? 'text-brand' : 'text-content-secondary')}>{item.icon}</span>
        {!isCompact && (
          <span className="flex-1">{item.label}</span>
        )}
        {!isCompact && item.badge && (
          <span className="rounded-full bg-[#7c3aed] px-1.5 py-0.5 text-[10px] font-bold text-white">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={clsx( 'fixed lg:static flex h-screen flex-col bg-surface-app border-r border-border-subtle text-content-primary transition-all duration-300 z-40',
          isCompact ? 'w-[72px]' : 'w-64',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className={clsx('flex items-center border-b border-border-subtle py-4', isCompact ? 'justify-center px-4' : 'gap-3 px-5')}>
          <IntelitrackIcon isAdmin={userRole === 'administrator'} />
          {!isCompact && (
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-content-primary">IntelliTrack</span>
              {userRole === 'administrator' && (
                <span className="text-[10px] font-semibold text-content-secondary uppercase tracking-widest">Administration</span>
              )}
            </div>
          )}
          <button
            onClick={onClose}
            className="ml-auto p-1 text-content-secondary hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className={clsx('flex-1 space-y-0.5 overflow-y-auto py-4', isCollapsed ? 'px-2' : 'px-3')}>
          {availableNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* Bottom: role + collapse */}
        <div className="border-t border-border-subtle px-3 py-3">
          {userRole === 'administrator' ? (
            <button
              type="button"
              onClick={async () => {
                const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
                await fetch('/logout', { method: 'POST', headers: { 'X-CSRF-TOKEN': csrfToken, Accept: 'application/json' } });
                window.location.href = '/login';
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              {!isCompact && <span>Logout</span>}
            </button>
          ) : (
            <>
              {!isCollapsed && (
                <div className="mb-2 flex items-center gap-2 rounded-md px-2 py-1.5">
                  <div className="h-2 w-2 rounded-full border border-slate-400" />
                  <span className="text-xs text-content-secondary">{formatRole(userRole)}</span>
                </div>
              )}
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden w-full items-center justify-center rounded-md p-2 text-content-secondary hover:bg-white/8 hover:text-slate-200 lg:flex"
                aria-label={isCollapsed ? 'Expand menu' : 'Collapse menu'}
              >
                <ChevronRight className={clsx('h-4 w-4 transition-transform duration-200', !isCompact && 'rotate-180')} />
              </button>
            </>
          )}
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

const formatRole = (role: string) => ({
  administrator: 'Administrator',
  sales_manager: 'Sales Manager',
  sales_business_development: 'Sales BD',
}[role] ?? 'User');

const Header = ({ onSidebarToggle, title, action, userRole = 'sales_manager', dark = false, onToggleDark }: HeaderProps) => {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [profile, setProfile] = useState<{ name: string; nickname?: string; first_name?: string; avatar_url?: string; role?: string } | null>(null);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ type: string; title: string; subtitle: string; href: string }>>([]);
  const [recentSearches, setRecentSearches] = useState<Array<{ type: string; title: string; subtitle: string; href: string }>>(() => {
    try { return JSON.parse(localStorage.getItem('intelitrack-recent-searches') || '[]'); } catch { return []; }
  });
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

  const rememberSearch = (result: { type: string; title: string; subtitle: string; href: string }) => {
    const next = [result, ...recentSearches.filter(i => i.href !== result.href)].slice(0, 8);
    setRecentSearches(next);
    localStorage.setItem('intelitrack-recent-searches', JSON.stringify(next));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('intelitrack-recent-searches');
  };

  useEffect(() => {
    fetch('/api/profile', { headers: { Accept: 'application/json' } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setProfile)
      .catch(() => setProfile(null));
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

  const accountName = profile?.nickname || profile?.first_name || profile?.name || 'User';
  const initials = accountName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const unreadCount = notifications.filter(n => !n.read_at).length;

  return (
    <header className={clsx("w-full", dark ? "bg-transparent text-white" : "bg-transparent text-content-primary")}>
      <div className="flex h-14 min-w-0 items-center gap-2 px-3 sm:gap-3 sm:px-5">
        {/* Mobile menu */}
        {userRole !== 'sales_manager' && (
          <button onClick={onSidebarToggle} className={clsx("rounded-md p-1.5", dark ? "text-content-secondary hover:bg-border-subtle" : "text-content-secondary hover:bg-surface-input lg:hidden")}>
            <Menu className="h-5 w-5" />
          </button>
        )}

        {/* Breadcrumb */}
        <div className={clsx("flex min-w-0 items-center gap-1.5 text-sm", dark ? "text-content-secondary" : "text-content-secondary")}>
          <span className={clsx("hidden font-medium sm:inline", dark ? "text-slate-200" : "text-content-secondary")}>IntelliTrack</span>
          {title && (
            <>
              <ChevronRight className={clsx("h-3.5 w-3.5", dark ? "text-content-secondary" : "text-content-secondary")} />
              <span className="max-w-[45vw] truncate sm:max-w-none">{title}</span>
            </>
          )}
        </div>

        {/* Search */}
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className={clsx("ml-auto hidden items-center gap-2 rounded-lg border px-3 py-1.5 text-sm md:flex", dark ? "border-border-subtle bg-zinc-900/50 text-content-secondary hover:border-zinc-700 hover:bg-border-subtle" : "border-border-default bg-surface-app text-content-secondary hover:border-slate-300 hover:bg-surface-input")}
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search...</span>
          <span className={clsx("ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium", dark ? "bg-zinc-800 text-content-secondary" : "bg-slate-200 text-content-secondary")}>⌘K</span>
        </button>

        {/* Right actions */}
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1 md:ml-3">
          {action}

          {/* Dark Mode Toggle */}
          <button 
            onClick={onToggleDark} 
            className={clsx("h-8 w-8 items-center justify-center rounded-full flex", dark ? "text-content-secondary hover:bg-border-subtle hover:text-white" : "text-content-secondary hover:bg-surface-input hover:text-slate-600")}
          >
            {dark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setNotificationMenuOpen(!notificationMenuOpen); if (!notificationMenuOpen) loadNotifications(); }}
              className="relative flex h-8 w-8 items-center justify-center rounded-full text-content-secondary hover:bg-surface-input hover:text-slate-600"
              aria-label="Notifications"
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {notificationMenuOpen && (
              <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-border-default bg-surface-card shadow-xl">
                <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
                  <p className="text-sm font-semibold text-content-primary">Notifications</p>
                  <button type="button" onClick={markAllRead} className="text-xs font-medium text-brand">Mark all read</button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length ? notifications.map(n => (
                    <button key={n.id} type="button" onClick={() => void markRead(n.id)} className={`block w-full border-b border-slate-50 px-4 py-3 text-left hover:bg-surface-input ${n.read_at ? 'opacity-60' : ''}`}>
                      <div className="flex items-start gap-2">
                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read_at ? 'bg-slate-300' : n.type === 'urgent' ? 'bg-red-500' : 'bg-brand'}`} />
                        <div>
                          <p className="text-sm font-medium text-content-primary">{n.title}</p>
                          <p className="mt-0.5 text-xs text-content-secondary">{n.message}</p>
                        </div>
                      </div>
                    </button>
                  )) : <p className="p-5 text-center text-sm text-content-secondary">No notifications yet.</p>}
                </div>
              </div>
            )}
          </div>

          {/* User avatar */}
          <div className="relative ml-1">
            <button
              type="button"
              onClick={() => setAccountMenuOpen(!accountMenuOpen)}
              className="flex items-center gap-1.5 rounded-full"
              aria-expanded={accountMenuOpen}
            >
              <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-brand text-xs font-bold text-black">
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" /> : initials}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-content-secondary" />
            </button>
            {accountMenuOpen && (
              <div className="absolute right-0 top-10 z-50 w-44 rounded-xl border border-border-default bg-surface-card p-1 shadow-xl">
                <div className="border-b border-border-subtle px-3 py-2 mb-1">
                  <p className="text-sm font-semibold text-content-primary">{accountName}</p>
                  <p className="text-xs text-content-secondary">{formatRole(profile?.role ?? userRole)}</p>
                </div>
                <a href="/settings" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-content-secondary hover:bg-surface-input">
                  <Settings className="h-3.5 w-3.5" />
                  Settings
                </a>
                <button type="button" onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-slate-950/20 p-4 pt-[12vh] backdrop-blur-sm" onClick={() => setSearchOpen(false)}>
          <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-border-default bg-surface-card shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3">
              <Search className="h-4 w-4 text-content-secondary" />
              <input
                autoFocus
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape') setSearchOpen(false); }}
                placeholder="Search customers, quotations, job orders, rentals, projects..."
                className="w-full border-0 bg-transparent p-0 text-sm outline-none placeholder:text-slate-400"
              />
              <span className="rounded border border-border-default px-2 py-0.5 text-xs text-content-secondary">ESC</span>
            </div>
            <div className="max-h-[55vh] overflow-y-auto">
              {searchTerm.length < 2 ? (
                <div>
                  {recentSearches.length ? (
                    <>
                      <div className="flex items-center justify-between px-5 pt-4">
                        <h3 className="text-xs font-semibold text-content-primary">Recent Searches</h3>
                        <button type="button" onClick={clearRecentSearches} className="text-xs font-medium text-brand">Clear</button>
                      </div>
                      <div className="mt-2">
                        {recentSearches.map((r, i) => (
                          <a key={`${r.href}-${i}`} href={r.href} onClick={() => { rememberSearch(r); setSearchOpen(false); }} className="flex items-center justify-between border-b border-slate-50 px-5 py-3 hover:bg-surface-input">
                            <div>
                              <p className="text-sm font-medium text-content-primary">{r.title}</p>
                              <p className="text-xs text-content-secondary">{r.type} · {r.subtitle}</p>
                            </div>
                            <span className="text-xs text-slate-300">Recent</span>
                          </a>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="p-6 text-center text-sm text-content-secondary">Start typing to search...</p>
                  )}
                </div>
              ) : searchResults.length ? (
                searchResults.map((r, i) => (
                  <a key={`${r.href}-${i}`} href={r.href} onClick={() => { rememberSearch(r); setSearchOpen(false); }} className="flex items-center justify-between border-b border-slate-50 px-5 py-3 hover:bg-surface-input">
                    <div>
                      <p className="text-sm font-medium text-content-primary">{r.title}</p>
                      <p className="text-xs text-content-secondary">{r.type} · {r.subtitle}</p>
                    </div>
                  </a>
                ))
              ) : (
                <p className="p-6 text-center text-sm text-content-secondary">No results found.</p>
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
    } catch {}
  }, [isDark]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState('sales_manager');
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
    } catch {}
  }, [sidebarCollapsed]);

  useEffect(() => {
    fetch('/api/profile', { headers: { Accept: 'application/json' } })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((profile: { role?: string }) => setUserRole(profile.role ?? 'sales_manager'))
      .catch(() => setUserRole('sales_manager'));
  }, []);

  const displayTitle = title === 'Dashboard' 
    ? (userRole.includes('manager') ? 'Sales Manager Dashboard' : 'SBD Dashboard') 
    : title;

  return (
  <div className={clsx("flex h-[100dvh] min-w-0 overflow-hidden", isDark ? "bg-surface-app" : "bg-[#f1f5f9]")}>
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
          <div className={clsx("sticky top-0 z-30 border-b", isDark ? "bg-surface-card border-border-subtle" : "bg-surface-card border-border-default")}>
             <Header
                onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
                title={displayTitle}
                action={headerAction}
                userRole={userRole}
                dark={isDark}
                onToggleDark={() => setIsDark(!isDark)}
              />
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          <div className="min-w-0 p-4 sm:p-5 lg:p-7">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export { AppLayout, Sidebar, Header };
export default AppLayout;
