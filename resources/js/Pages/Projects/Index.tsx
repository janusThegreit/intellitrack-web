import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import Modal from '../../Components/Modal';
import {
  FolderKanban,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Eye,
  Search,
  LayoutGrid,
  Table as TableIcon,
  Truck,
  Users,
  Briefcase,
  ShieldCheck,
  ExternalLink,
  MapPin,
  Layers,
  ArrowUpRight,
  Check,
} from 'lucide-react';
import { formatPeso } from '../../Utils/currency';

interface ProjectTask {
  id: number;
  task_name: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'in-progress' | 'in-review' | 'completed' | 'blocked';
  progress_percentage: number;
  estimated_hours?: number;
  actual_hours?: number;
  due_date?: string;
}

interface Project {
  id: number;
  project_code: string;
  project_name: string;
  customer_id?: number;
  customer_name: string;
  customer?: any;
  project_manager_id?: number;
  project_manager?: any;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  budget: number;
  spent_amount: number;
  progress_percentage: number;
  start_date: string;
  end_date?: string;
  deadline?: string;
  description?: string;
  objectives?: string;
  deliverables?: string;
  tasks?: ProjectTask[];
  tasks_count?: number;
  job_orders?: any[];
  rentals?: any[];
}

export default function ProjectsIndex({ projects: initialProjects = [] }: { projects?: Project[] }) {
  const [records, setRecords] = useState<Project[]>(initialProjects);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal states
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [detailedProject, setDetailedProject] = useState<Project | null>(null);
  const [activeDossierTab, setActiveDossierTab] = useState<'overview' | 'milestones' | 'fleet' | 'job_orders' | 'team'>('overview');

  // Create modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    project_name: '',
    customer_id: '',
    project_manager_id: '',
    budget: '',
    start_date: new Date().toISOString().slice(0, 10),
    deadline: '',
    status: 'active',
    description: '',
    objectives: '',
    deliverables: '',
  });

  const loadProjects = async () => {
    try {
      const res = await fetch('/api/projects?per_page=100', {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        const raw = data.data ?? [];
        setRecords(
          raw.map((p: any) => ({
            id: p.id,
            project_code: p.project_code || `PRJ-${p.id}`,
            project_name: p.project_name,
            customer_id: p.customer_id,
            customer_name: p.customer?.company_name || p.customer?.name || 'Enterprise Client',
            customer: p.customer,
            project_manager_id: p.project_manager_id,
            project_manager: p.project_manager,
            status: p.status || 'active',
            budget: Number(p.budget ?? 0),
            spent_amount: Number(p.spent_amount ?? 0),
            progress_percentage: Number(p.progress_percentage ?? 0),
            start_date: p.start_date ? p.start_date.slice(0, 10) : '',
            end_date: p.end_date ? p.end_date.slice(0, 10) : '',
            deadline: p.deadline ? p.deadline.slice(0, 10) : '',
            description: p.description,
            objectives: p.objectives,
            deliverables: p.deliverables,
            tasks: p.tasks || [],
            tasks_count: p.tasks_count || (p.tasks ? p.tasks.length : 0),
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load projects', err);
    }
  };

  useEffect(() => {
    loadProjects();

    // Fetch dropdown entities
    fetch('/api/customers?per_page=100', { headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setCustomers(data.data ?? []))
      .catch(() => {});

    fetch('/api/users?per_page=100', { headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setUsers(data.data ?? []))
      .catch(() => {});
  }, []);

  // Open Project 360 Dossier & Fetch Detailed Payload
  const openProjectDossier = async (project: Project) => {
    setSelectedProject(project);
    setDetailedProject(project);
    setActiveDossierTab('overview');

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const fullData = await res.json();
        setDetailedProject({
          ...project,
          ...fullData,
          customer_name: fullData.customer?.company_name || fullData.customer?.name || project.customer_name,
          tasks: fullData.tasks || [],
          job_orders: fullData.job_orders || [],
          rentals: fullData.rentals || [],
        });
      }
    } catch (e) {
      console.error('Failed to fetch detailed project', e);
    }
  };

  // Toggle or update a task status inside Project 360
  const handleTaskStatusToggle = async (taskId: number, currentStatus: string) => {
    if (!detailedProject) return;

    let nextStatus: 'todo' | 'in-progress' | 'completed' = 'in-progress';
    let nextProgress = 50;

    if (currentStatus === 'todo') {
      nextStatus = 'in-progress';
      nextProgress = 50;
    } else if (currentStatus === 'in-progress') {
      nextStatus = 'completed';
      nextProgress = 100;
    } else {
      nextStatus = 'todo';
      nextProgress = 0;
    }

    // Optimistic UI update
    const updatedTasks = (detailedProject.tasks || []).map((t) =>
      t.id === taskId ? { ...t, status: nextStatus, progress_percentage: nextProgress } : t
    );

    // Calculate new overall project progress
    const avgProgress = Math.round(
      updatedTasks.reduce((acc, t) => acc + (t.progress_percentage || 0), 0) / (updatedTasks.length || 1)
    );

    setDetailedProject({
      ...detailedProject,
      tasks: updatedTasks,
      progress_percentage: avgProgress,
    });

    const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
    try {
      await fetch(`/api/project-tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrf,
        },
        body: JSON.stringify({
          status: nextStatus,
          progress_percentage: nextProgress,
        }),
      });

      // Update parent project progress
      await fetch(`/api/projects/${detailedProject.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrf,
        },
        body: JSON.stringify({
          progress_percentage: avgProgress,
        }),
      });

      loadProjects();
    } catch (e) {
      console.error('Failed to update task status', e);
    }
  };

  // Save / Create Project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrf,
        },
        body: JSON.stringify({
          project_name: formData.project_name,
          customer_id: formData.customer_id,
          project_manager_id: formData.project_manager_id || (users[0]?.id ?? 1),
          budget: Number(formData.budget) || 0,
          start_date: formData.start_date,
          deadline: formData.deadline || null,
          status: formData.status,
          description: formData.description,
          objectives: formData.objectives,
          deliverables: formData.deliverables,
        }),
      });

      if (res.ok) {
        setIsCreateModalOpen(false);
        setMessage({ type: 'success', text: 'Project initialized successfully with standard rigging milestone phases.' });
        setFormData({
          project_name: '',
          customer_id: '',
          project_manager_id: '',
          budget: '',
          start_date: new Date().toISOString().slice(0, 10),
          deadline: '',
          status: 'active',
          description: '',
          objectives: '',
          deliverables: '',
        });
        await loadProjects();
      } else {
        const errData = await res.json();
        setMessage({ type: 'error', text: errData.message || 'Failed to create project.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An unexpected error occurred while saving project.' });
    } finally {
      setSaving(false);
    }
  };

  // KPI Computations
  const telemetry = useMemo(() => {
    const totalProjects = records.length;
    const activeProjects = records.filter((r) => r.status === 'active').length;
    const totalBudget = records.reduce((acc, r) => acc + (r.budget || 0), 0);
    const totalSpent = records.reduce((acc, r) => acc + (r.spent_amount || 0), 0);
    const avgProgress =
      totalProjects > 0
        ? Math.round(records.reduce((acc, r) => acc + (r.progress_percentage || 0), 0) / totalProjects)
        : 0;

    return {
      totalProjects,
      activeProjects,
      totalBudget,
      totalSpent,
      avgProgress,
    };
  }, [records]);

  // Filtering
  const filteredProjects = useMemo(() => {
    let list = [...records];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.project_name.toLowerCase().includes(q) ||
          p.project_code.toLowerCase().includes(q) ||
          p.customer_name.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      list = list.filter((p) => p.status === statusFilter);
    }
    return list;
  }, [records, searchQuery, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active Operations
          </span>
        );
      case 'planning':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Clock className="h-3 w-3" />
            Planning & Permits
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </span>
        );
      case 'on-hold':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertTriangle className="h-3 w-3" />
            On Hold
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-input text-content-secondary border border-border-default capitalize">
            {status}
          </span>
        );
    }
  };

  return (
    <AppLayout>
      <Head title="Project Management | IntelliTrack Enterprise" />

      <div className="space-y-6">
        {/* TOP HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
              <FolderKanban className="h-4 w-4" />
              <span>Operations & Site Engineering</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-content-primary">
              Project Management Hub
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-content-secondary">
              Central operational dossier linking client contracts, mobilized crane fleets, job orders, and milestone execution.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* NOTIFICATION */}
        {message && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-xs sm:text-sm transition-all shadow-xs ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="font-bold underline text-xs ml-4">
              Dismiss
            </button>
          </div>
        )}

        {/* TELEMETRY METRIC RIBBON */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Projects */}
          <div className="group relative overflow-hidden rounded-2xl border border-border-default bg-surface-card p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">
                Active Projects
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400">
                <FolderKanban className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-content-primary font-mono">
              {telemetry.activeProjects}{' '}
              <span className="text-xs font-normal text-content-secondary">/ {telemetry.totalProjects} Total</span>
            </p>
            <p className="mt-1 text-xs text-content-secondary">Mobilized & on-site operations</p>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600" />
          </div>

          {/* Aggregate Budget */}
          <div className="group relative overflow-hidden rounded-2xl border border-border-default bg-surface-card p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">
                Contract Pipeline Budget
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-content-primary font-mono truncate">
              {formatPeso(telemetry.totalBudget)}
            </p>
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              Spent: {formatPeso(telemetry.totalSpent)}
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-600" />
          </div>

          {/* Milestone Delivery Velocity */}
          <div className="group relative overflow-hidden rounded-2xl border border-border-default bg-surface-card p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">
                Avg Execution Velocity
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-content-primary font-mono">
                {telemetry.avgProgress}%
              </span>
              <span className="text-xs text-blue-500 font-semibold">Milestones completed</span>
            </div>
            <div className="w-full bg-surface-input rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${telemetry.avgProgress}%` }}
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600" />
          </div>

          {/* Mobilized Crane Fleet */}
          <div className="group relative overflow-hidden rounded-2xl border border-border-default bg-surface-card p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">
                Site Crane Allocations
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Truck className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-content-primary font-mono">
              {records.reduce((acc, r) => acc + (r.rentals?.length || (r.status === 'active' ? 1 : 0)), 0)} Units
            </p>
            <p className="mt-1 text-xs text-content-secondary">Active heavy tower & mobile cranes</p>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-purple-600" />
          </div>
        </div>

        {/* SEARCH, STATUS TABS & VIEW TOGGLE */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-3 rounded-2xl border border-border-default bg-surface-card shadow-xs">
          {/* Status filter tabs */}
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-surface-app border border-border-default">
            {[
              { key: 'all', label: 'All Projects' },
              { key: 'active', label: 'Active Site Ops' },
              { key: 'planning', label: 'Planning' },
              { key: 'completed', label: 'Completed' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === tab.key
                    ? 'bg-surface-card text-content-primary shadow-xs border border-border-default'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search bar and View Switcher */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-content-secondary absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search project, code, client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-surface-input border border-border-default text-content-primary rounded-xl text-xs focus:outline-none focus:border-amber-500 placeholder:text-content-secondary/60"
              />
            </div>

            {/* Grid / Table switch */}
            <div className="flex items-center p-1 rounded-xl bg-surface-app border border-border-default">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-surface-card text-amber-500 shadow-xs'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-surface-card text-amber-500 shadow-xs'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
                title="Table View"
              >
                <TableIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* PROJECTS CONTENT */}
        {filteredProjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-default bg-surface-card p-12 text-center">
            <FolderKanban className="h-12 w-12 text-content-secondary mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-bold text-content-primary">No Projects Found</h3>
            <p className="mt-1 text-xs text-content-secondary max-w-sm mx-auto">
              There are no projects matching the selected filter or search query.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-surface-input text-content-primary border border-border-default text-xs font-semibold hover:bg-surface-app transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((project) => {
              const spentPct = project.budget > 0 ? Math.min(100, Math.round((project.spent_amount / project.budget) * 100)) : 0;

              return (
                <div
                  key={project.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-border-default bg-surface-card p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-amber-500/40"
                >
                  <div>
                    {/* Top row: Code badge & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        {project.project_code}
                      </span>
                      {getStatusBadge(project.status)}
                    </div>

                    {/* Project Name & Customer */}
                    <h3 className="mt-3 text-base font-bold text-content-primary group-hover:text-amber-500 transition-colors line-clamp-2">
                      {project.project_name}
                    </h3>

                    <div className="mt-2 flex items-center gap-1.5 text-xs text-content-secondary">
                      <Building2 className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                      <span className="font-medium truncate">{project.customer_name}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-content-secondary font-medium">Milestone Progress</span>
                        <span className="font-mono font-bold text-content-primary">
                          {project.progress_percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-surface-input rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${project.progress_percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Budget & Spend Gauge */}
                    <div className="mt-4 pt-3 border-t border-border-subtle grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-content-secondary text-[11px] uppercase tracking-wider block">Contract Budget</span>
                        <span className="font-mono font-bold text-content-primary text-sm">
                          {formatPeso(project.budget)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-content-secondary text-[11px] uppercase tracking-wider block">Realized / Spent</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                          {formatPeso(project.spent_amount)}{' '}
                          <span className="text-[11px] font-normal text-content-secondary">({spentPct}%)</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="mt-5 pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-content-secondary">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{project.start_date || 'Ongoing'}</span>
                    </div>

                    <button
                      onClick={() => openProjectDossier(project)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition-all"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Project 360</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="rounded-2xl border border-border-default bg-surface-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border-default bg-surface-app text-content-secondary font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Project & Code</th>
                    <th className="py-3.5 px-4">Client Enterprise</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Contract Budget</th>
                    <th className="py-3.5 px-4">Spent / Realized</th>
                    <th className="py-3.5 px-4">Milestone Progress</th>
                    <th className="py-3.5 px-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {filteredProjects.map((project) => (
                    <tr key={project.id} className="hover:bg-surface-app/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-[11px] font-bold text-amber-500">
                          {project.project_code}
                        </div>
                        <div className="font-bold text-content-primary text-sm mt-0.5">
                          {project.project_name}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-content-primary font-medium">
                        {project.customer_name}
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(project.status)}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-content-primary">
                        {formatPeso(project.budget)}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatPeso(project.spent_amount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-surface-input rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-amber-500 h-1.5 rounded-full"
                              style={{ width: `${project.progress_percentage}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-content-primary">
                            {project.progress_percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openProjectDossier(project)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-input hover:bg-amber-500/10 text-content-primary hover:text-amber-500 border border-border-default text-xs font-semibold transition-all"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View 360</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =======================================================
            PROJECT 360 DOSSIER MODAL (CENTRAL OPERATIONAL HUB)
        ======================================================= */}
        <Modal
          isOpen={!!selectedProject}
          onClose={() => {
            setSelectedProject(null);
            setDetailedProject(null);
          }}
          size="5xl"
          title={
            detailedProject ? (
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/30 font-bold">
                  {detailedProject.project_code}
                </span>
                <span className="text-content-primary font-bold text-base">
                  {detailedProject.project_name}
                </span>
                <span className="hidden sm:inline-block text-xs text-content-secondary font-normal">
                  — Project 360 Dossier
                </span>
              </div>
            ) : (
              'Project Operational Dossier'
            )
          }
        >
          {detailedProject && (
            <div className="space-y-6">
              {/* TOP HEADER SUMMARY BAR */}
              <div className="rounded-2xl border border-border-default bg-surface-app p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/30 font-black text-lg">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-content-primary">
                      {detailedProject.customer_name}
                    </h4>
                    <p className="text-xs text-content-secondary flex items-center gap-1.5 mt-0.5">
                      <Calendar className="h-3 w-3 text-amber-500" />
                      <span>Period: {detailedProject.start_date || 'Active'}</span>
                      {detailedProject.deadline && <span>· Deadline: {detailedProject.deadline}</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {getStatusBadge(detailedProject.status)}
                  <button
                    onClick={() =>
                      router.visit(`/job-orders?action=create&customer_id=${detailedProject.customer_id}`)
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-xs transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>Dispatch JO</span>
                  </button>
                </div>
              </div>

              {/* DOSSIER NAVIGATION TABS */}
              <div className="flex flex-wrap items-center gap-1 border-b border-border-subtle pb-2">
                {[
                  { key: 'overview', label: 'Executive Overview', icon: Briefcase },
                  {
                    key: 'milestones',
                    label: `Site Milestones (${detailedProject.tasks?.length || 0})`,
                    icon: CheckCircle2,
                  },
                  {
                    key: 'fleet',
                    label: `Mobilized Fleet (${detailedProject.rentals?.length || 0})`,
                    icon: Truck,
                  },
                  {
                    key: 'job_orders',
                    label: `Connected JOs (${detailedProject.job_orders?.length || 0})`,
                    icon: Layers,
                  },
                  { key: 'team', label: 'Site Team & Safety', icon: Users },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveDossierTab(tab.key as any)}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        activeDossierTab === tab.key
                          ? 'bg-amber-500 text-neutral-950 shadow-sm'
                          : 'text-content-secondary hover:text-content-primary hover:bg-surface-input'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: EXECUTIVE OVERVIEW */}
              {activeDossierTab === 'overview' && (
                <div className="space-y-5">
                  {/* Financial Burndown Meter */}
                  <div className="rounded-2xl border border-border-default bg-surface-card p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">
                        Project Contract Financial Burndown
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-500">
                        {detailedProject.budget > 0
                          ? Math.round((detailedProject.spent_amount / detailedProject.budget) * 100)
                          : 0}
                        % Utilized
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      <div className="p-3 rounded-xl bg-surface-app border border-border-default">
                        <span className="text-xs text-content-secondary block">Total Approved Budget</span>
                        <span className="text-lg font-bold font-mono text-content-primary">
                          {formatPeso(detailedProject.budget)}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-surface-app border border-border-default">
                        <span className="text-xs text-content-secondary block">Realized / Invoiced</span>
                        <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          {formatPeso(detailedProject.spent_amount)}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-surface-app border border-border-default">
                        <span className="text-xs text-content-secondary block">Remaining Working Balance</span>
                        <span className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400">
                          {formatPeso(Math.max(0, detailedProject.budget - detailedProject.spent_amount))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Scope & Objectives */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-border-default bg-surface-card p-5 space-y-2">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5" />
                        <span>Project Scope & Operational Description</span>
                      </h5>
                      <p className="text-xs text-content-secondary leading-relaxed whitespace-pre-line">
                        {detailedProject.description || 'Comprehensive heavy crane hoisting and site structural erection.'}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border-default bg-surface-card p-5 space-y-2">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-blue-500 flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Key Deliverables & DOLE Safety Targets</span>
                      </h5>
                      <p className="text-xs text-content-secondary leading-relaxed whitespace-pre-line">
                        {detailedProject.deliverables ||
                          'Certified crane riggers, daily telemetry logging, load charts, and final DOLE compliance sign-off.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SITE MILESTONES & PHASES */}
              {activeDossierTab === 'milestones' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-content-secondary">
                      Showing{' '}
                      <span className="text-content-primary font-bold">
                        {detailedProject.tasks?.length || 0}
                      </span>{' '}
                      mandatory operational phases. Click status to toggle completion!
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {(detailedProject.tasks || []).map((task, idx) => {
                      const isDone = task.status === 'completed';
                      const isInProg = task.status === 'in-progress';

                      return (
                        <div
                          key={task.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border-default bg-surface-card shadow-xs hover:border-amber-500/30 transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => handleTaskStatusToggle(task.id, task.status)}
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-all ${
                                isDone
                                  ? 'bg-emerald-500 text-neutral-950 border-emerald-500 font-bold'
                                  : isInProg
                                  ? 'bg-amber-500/20 text-amber-500 border-amber-500'
                                  : 'border-border-default text-transparent hover:border-content-secondary'
                              }`}
                              title="Click to toggle status"
                            >
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            </button>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-content-primary">
                                  Phase {idx + 1}: {task.task_name}
                                </span>
                                <span
                                  className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                    task.priority === 'critical'
                                      ? 'bg-rose-500/10 text-rose-500'
                                      : 'bg-blue-500/10 text-blue-500'
                                  }`}
                                >
                                  {task.priority}
                                </span>
                              </div>
                              {task.description && (
                                <p className="text-[11px] text-content-secondary mt-1">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-center">
                            {task.estimated_hours && (
                              <span className="text-[11px] text-content-secondary font-mono">
                                {task.estimated_hours} hrs
                              </span>
                            )}
                            <button
                              onClick={() => handleTaskStatusToggle(task.id, task.status)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                                isDone
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : isInProg
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                  : 'bg-surface-input text-content-secondary border border-border-default'
                              }`}
                            >
                              {task.status}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: MOBILIZED FLEET & CRANES */}
              {activeDossierTab === 'fleet' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-content-secondary">
                      Heavy cranes and equipment deployed under client service contracts.
                    </span>
                    <button
                      onClick={() =>
                        router.visit(`/rentals?action=create&customer_id=${detailedProject.customer_id}`)
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Dispatch Crane</span>
                    </button>
                  </div>

                  {(!detailedProject.rentals || detailedProject.rentals.length === 0) ? (
                    <div className="rounded-xl border border-dashed border-border-default p-8 text-center text-xs text-content-secondary">
                      No active crane rental dispatches currently registered for this client site.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {detailedProject.rentals.map((rental: any) => {
                        const eq = rental.equipment;
                        return (
                          <div
                            key={rental.id}
                            className="rounded-xl border border-border-default bg-surface-card p-4 space-y-2 shadow-xs"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h5 className="font-bold text-content-primary text-sm">
                                  {eq?.name || 'Heavy Rigging Unit'}
                                </h5>
                                <p className="text-xs text-amber-500 font-mono mt-0.5">
                                  {rental.rental_number} · {eq?.maximum_load || '50'} {eq?.maximum_load_unit || 'Tons'}
                                </p>
                              </div>
                              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold capitalize">
                                {rental.status}
                              </span>
                            </div>

                            <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-xs text-content-secondary">
                              <span>Daily Rate: {formatPeso(rental.daily_rate || 15000)}</span>
                              <button
                                onClick={() => router.visit(`/rentals?search=${encodeURIComponent(rental.rental_number)}`)}
                                className="text-blue-500 hover:underline flex items-center gap-1 font-medium"
                              >
                                <span>View Fleet</span>
                                <ArrowUpRight className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: CONNECTED JOB ORDERS */}
              {activeDossierTab === 'job_orders' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-content-secondary">
                      Active operational field dispatches and engineering tickets.
                    </span>
                    <button
                      onClick={() =>
                        router.visit(`/job-orders?action=create&customer_id=${detailedProject.customer_id}`)
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>New Job Order</span>
                    </button>
                  </div>

                  {(!detailedProject.job_orders || detailedProject.job_orders.length === 0) ? (
                    <div className="rounded-xl border border-dashed border-border-default p-8 text-center text-xs text-content-secondary">
                      No linked Job Orders found for this client.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {detailedProject.job_orders.map((jo: any) => (
                        <div
                          key={jo.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border-default bg-surface-card shadow-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-amber-500">
                                {jo.job_order_number}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 capitalize font-medium">
                                {jo.status}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-content-primary mt-1">
                              {jo.description || 'Crane rigging operation'}
                            </p>
                            {jo.location && (
                              <p className="text-[11px] text-content-secondary flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3" />
                                {jo.location}
                              </p>
                            )}
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 block">
                              {formatPeso(jo.total_amount || 0)}
                            </span>
                            <button
                              onClick={() => router.visit(`/job-orders?search=${encodeURIComponent(jo.job_order_number)}`)}
                              className="mt-1 inline-flex items-center gap-1 text-xs text-blue-500 hover:underline"
                            >
                              <span>Open Ticket</span>
                              <ExternalLink className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: SITE TEAM & SAFETY */}
              {activeDossierTab === 'team' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl border border-border-default bg-surface-card space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        <span>Project Manager In-Charge</span>
                      </span>
                      <p className="text-sm font-bold text-content-primary">
                        {detailedProject.project_manager?.name || 'Lead Rigging Operations Manager'}
                      </p>
                      <p className="text-xs text-content-secondary">
                        {detailedProject.project_manager?.email || 'operations@intellitrack.demo'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl border border-border-default bg-surface-card space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>DOLE OSH Safety Standard</span>
                      </span>
                      <p className="text-sm font-bold text-content-primary">
                        Certified Compliant (Level 3 Heavy Lift)
                      </p>
                      <p className="text-xs text-content-secondary">
                        Mandatory daily pre-lift safety toolbox meeting and wind anemometer inspection active.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* =======================================================
            NEW PROJECT CREATION MODAL
        ======================================================= */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Initialize New Heavy Crane Project"
          size="2xl"
        >
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-content-secondary mb-1">
                Project Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Cebu Harbor Berth 4 Heavy Lift & Crane Erection"
                value={formData.project_name}
                onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-surface-input border border-border-default text-content-primary rounded-xl text-xs sm:text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-content-secondary mb-1">
                  Customer Entity *
                </label>
                <select
                  required
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface-input border border-border-default text-content-primary rounded-xl text-xs sm:text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="">Select Client Enterprise...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name || c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-content-secondary mb-1">
                  Contract Budget (₱)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="e.g. 4500000"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface-input border border-border-default text-content-primary rounded-xl text-xs sm:text-sm focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-content-secondary mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface-input border border-border-default text-content-primary rounded-xl text-xs sm:text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-content-secondary mb-1">
                  Target Deadline
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface-input border border-border-default text-content-primary rounded-xl text-xs sm:text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-content-secondary mb-1">
                Project Scope & Description
              </label>
              <textarea
                rows={3}
                placeholder="Details on crane capacity needed, site location, foundation preparations..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-surface-input border border-border-default text-content-primary rounded-xl text-xs sm:text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
              💡 <strong>Automatic Rigging Template</strong>: Initializing this project will automatically generate the 5 industry-standard milestone phases (Soil survey, Mobilization, Tower erection, Heavy lifts, DOLE compliance).
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-surface-input text-content-secondary text-xs font-bold hover:bg-surface-app"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold shadow-md shadow-amber-500/20 disabled:opacity-50"
              >
                {saving ? 'Initializing...' : 'Create & Launch Project'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AppLayout>
  );
}
