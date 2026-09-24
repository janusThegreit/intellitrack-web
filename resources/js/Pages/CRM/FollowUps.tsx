import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { Card, CardBody } from '../../Components/Card';
import Table, { TableColumn } from '../../Components/Table';
import Button from '../../Components/Button';
import { Input } from '../../Components/Form';
import Modal from '../../Components/Modal';
import CrmNavTabs from '../../Components/CrmNavTabs';
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Calendar,
  CalendarCheck,
  Phone,
  Mail,
  Truck,
  Building2,
  ShieldAlert,
  AlertTriangle,
  Zap,
  Copy,
  Check,
  HardHat,
} from 'lucide-react';
import clsx from 'clsx';

interface Customer {
  id: number;
  name: string;
  company_name?: string;
  phone?: string;
  email?: string;
}

interface EquipmentItem {
  id: number;
  name: string;
  code: string;
  category: string;
  crane_category?: string;
  crane_model?: string;
}

interface ProjectItem {
  id: number;
  project_code: string;
  project_name: string;
  customer_id?: number;
  status: string;
}

interface FollowUp {
  id: number;
  customer_id: number;
  customer_inquiry_id?: number | null;
  equipment_id?: number | null;
  project_id?: number | null;
  title: string;
  notes?: string;
  scheduled_date: string;
  due_time?: string;
  status: 'pending' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string | null;
  is_permit_critical?: boolean;
  customer?: Customer;
  inquiry?: { id: number; inquiry_number: string; subject: string };
  equipment?: EquipmentItem;
  project?: ProjectItem;
  assignee?: { id: number; name: string };
  creator?: { id: number; name: string };
  completed_at?: string;
}

const FollowUpsPage = () => {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([]);
  const [projectsList, setProjectsList] = useState<ProjectItem[]>([]);

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [newFollowUp, setNewFollowUp] = useState({
    customer_id: '',
    equipment_id: '',
    project_id: '',
    title: '',
    category: 'safety_permit',
    is_permit_critical: false,
    scheduled_date: new Date().toISOString().slice(0, 10),
    due_time: '10:00 AM',
    priority: 'high' as 'low' | 'medium' | 'high' | 'urgent',
    notes: '',
  });

  // Quick Communication Outreach Modal State
  const [outreachTarget, setOutreachTarget] = useState<FollowUp | null>(null);
  const [outreachTemplateType, setOutreachTemplateType] = useState('structural_clearance');
  const [outreachText, setOutreachText] = useState('');
  const [copied, setCopied] = useState(false);
  const [loggingComm, setLoggingComm] = useState(false);

  const loadFollowUps = () => {
    setLoading(true);
    const query = new URLSearchParams({
      per_page: '100',
      ...(search ? { search } : {}),
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
      ...(priorityFilter !== 'all' ? { priority: priorityFilter } : {}),
      ...(categoryFilter !== 'all' ? { category: categoryFilter } : {}),
    });

    fetch(`/api/crm/follow-ups?${query}`, { headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setFollowUps(data.data ?? []))
      .catch(() => setFollowUps([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadFollowUps();
  }, [search, statusFilter, priorityFilter, categoryFilter]);

  useEffect(() => {
    fetch('/api/customers?per_page=100', { headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setCustomers(data.data ?? []))
      .catch(() => {});

    fetch('/api/equipment?per_page=100', { headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setEquipmentList(data.data ?? []))
      .catch(() => {});

    fetch('/api/projects?per_page=100', { headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setProjectsList(data.data ?? []))
      .catch(() => {});
  }, []);

  // Filter projects by customer if customer is selected
  const filteredProjects = newFollowUp.customer_id
    ? projectsList.filter((p) => !p.customer_id || p.customer_id === Number(newFollowUp.customer_id))
    : projectsList;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

    const payload = {
      ...newFollowUp,
      customer_id: Number(newFollowUp.customer_id),
      equipment_id: newFollowUp.equipment_id ? Number(newFollowUp.equipment_id) : null,
      project_id: newFollowUp.project_id ? Number(newFollowUp.project_id) : null,
    };

    try {
      const res = await fetch('/api/crm/follow-ups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setMessageType('success');
        setMessage('Follow-up task scheduled successfully in CRM queue.');
        setNewFollowUp({
          customer_id: '',
          equipment_id: '',
          project_id: '',
          title: '',
          category: 'safety_permit',
          is_permit_critical: false,
          scheduled_date: new Date().toISOString().slice(0, 10),
          due_time: '10:00 AM',
          priority: 'high',
          notes: '',
        });
        loadFollowUps();
        setTimeout(() => setMessage(''), 4000);
      } else {
        const errorData = await res.json();
        setMessageType('error');
        setMessage(errorData.message || 'Failed to schedule follow-up.');
      }
    } catch {
      setMessageType('error');
      setMessage('Failed to schedule follow-up.');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (id: number) => {
    const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
    try {
      const res = await fetch(`/api/crm/follow-ups/${id}/complete`, {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
      });
      if (res.ok) {
        setMessageType('success');
        setMessage('Task marked as completed.');
        loadFollowUps();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch {
      setMessageType('error');
      setMessage('Failed to complete task.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this follow-up?')) return;
    const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
    try {
      const res = await fetch(`/api/crm/follow-ups/${id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
      });
      if (res.ok) {
        setMessageType('success');
        setMessage('Follow-up deleted.');
        loadFollowUps();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch {
      setMessageType('error');
      setMessage('Failed to delete follow-up.');
    }
  };

  // Helper to determine overdue state
  const isOverdue = (scheduledDate: string, status: string) => {
    if (status !== 'pending') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(scheduledDate);
    target.setHours(0, 0, 0, 0);
    return target < today;
  };

  const getDaysOverdue = (scheduledDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(scheduledDate);
    target.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - target.getTime();
    return Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  };

  // Helper to check if task is safety / permit critical
  const isSafetyOrPermitCritical = (row: FollowUp) => {
    if (row.is_permit_critical) return true;
    if (row.priority === 'urgent') return true;
    const combined = `${row.title} ${row.notes || ''} ${row.category || ''}`.toLowerCase();
    return /clearance|permit|structural|highway|dole|pemea|hazard|foundation|truck ban|right-of-way/i.test(combined);
  };

  // Open Quick Outreach Template Modal
  const openOutreachModal = (row: FollowUp) => {
    setOutreachTarget(row);
    const clientName = row.customer?.company_name || row.customer?.name || 'Valued Client';
    const equipName = row.equipment?.name ? ` for ${row.equipment.name} (${row.equipment.crane_category || 'Crane Unit'})` : '';
    const projName = row.project?.project_name ? ` at ${row.project.project_name}` : '';

    const defaultText = `Good day ${clientName},\n\nThis is regarding our ongoing equipment leasing coordination${equipName}${projName}. We are following up on the scheduled clearance: "${row.title}".\n\nPlease let us know if the site logistics, permits, or foundation test certificates are ready so we can finalize the mobilization timeline.\n\nBest regards,\nIntelliTrack Leasing & Operations`;
    setOutreachText(defaultText);
    setCopied(false);
  };

  const updateOutreachTemplate = (templateKey: string) => {
    if (!outreachTarget) return;
    setOutreachTemplateType(templateKey);
    const clientName = outreachTarget.customer?.company_name || outreachTarget.customer?.name || 'Valued Client';
    const equipName = outreachTarget.equipment?.name ? ` for ${outreachTarget.equipment.name}` : '';
    const projName = outreachTarget.project?.project_name ? ` at ${outreachTarget.project.project_name}` : '';

    switch (templateKey) {
      case 'structural_clearance':
        setOutreachText(
          `Good day ${clientName},\n\nRegarding the crane erection site${projName}${equipName}: We require the signed structural clearance and soil bearing capacity test reports (minimum 250 kPa). Kindly provide an update before our rigging crew mobilization.\n\nThank you,\nIntelliTrack Technical Operations`
        );
        break;
      case 'highway_permit':
        setOutreachText(
          `Good day ${clientName},\n\nHeavy low-bed trailer hauling for ${outreachTarget.title} requires confirmation of the night delivery window (10:00 PM - 5:00 AM) and local site gate clearance. Please confirm traffic marshals are ready on site.\n\nRegards,\nIntelliTrack Logistics Team`
        );
        break;
      case 'dole_pemea':
        setOutreachText(
          `Good day ${clientName},\n\nWe would like to coordinate the schedule for the mandatory DOLE / PEMEA third-party crane load test certification${projName}. Please advise if the site engineer and safety officer will be present on the target date.\n\nThank you,\nIntelliTrack Safety Compliance`
        );
        break;
      case 'commercial_quote':
        setOutreachText(
          `Good day ${clientName},\n\nFollowing up on our equipment leasing proposal: "${outreachTarget.title}". We are ready to address any technical specifications, payment terms, or mobilization adjustments your committee needs.\n\nBest regards,\nIntelliTrack Commercial Sales`
        );
        break;
      default:
        setOutreachText(
          `Good day ${clientName},\n\nFollowing up regarding our task: "${outreachTarget.title}" scheduled for ${new Date(outreachTarget.scheduled_date).toLocaleDateString()}.\n\nNotes: ${outreachTarget.notes || 'Please let us know how we can assist.'}\n\nWarm regards,\nIntelliTrack CRM`
        );
        break;
    }
    setCopied(false);
  };

  const handleCopyOutreach = () => {
    navigator.clipboard.writeText(outreachText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Directly log outreach message into customer communications
  const handleLogCommunicationFromOutreach = async () => {
    if (!outreachTarget) return;
    setLoggingComm(true);
    const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

    try {
      const res = await fetch('/api/crm/communications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify({
          customer_id: outreachTarget.customer_id,
          project_id: outreachTarget.project_id || null,
          type: outreachTarget.customer?.email ? 'email' : 'call',
          direction: 'outbound',
          subject: `Outreach Log: ${outreachTarget.title}`,
          content: outreachText,
          outcome: 'Quick template outreach transmitted to client contact.',
        }),
      });

      if (res.ok) {
        setOutreachTarget(null);
        setMessageType('success');
        setMessage('Outreach recorded successfully into Interaction History.');
        setTimeout(() => setMessage(''), 4000);
      }
    } catch {
      setMessage('Failed to log interaction.');
    } finally {
      setLoggingComm(false);
    }
  };

  // Metrics computation
  const pendingCount = followUps.filter((f) => f.status === 'pending').length;
  const completedCount = followUps.filter((f) => f.status === 'completed').length;
  const overdueCount = followUps.filter((f) => isOverdue(f.scheduled_date, f.status)).length;
  const criticalSafetyCount = followUps.filter((f) => f.status === 'pending' && isSafetyOrPermitCritical(f)).length;

  const getCraneBadge = (equip?: EquipmentItem) => {
    if (!equip) return null;
    const category = (equip.crane_category || equip.category || 'Crane').toUpperCase();
    const isLuffing = category.includes('LUFFING');
    const isTopless = category.includes('TOPLESS');
    const isHammerhead = category.includes('HAMMERHEAD');

    return (
      <span
        className={clsx(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border',
          isLuffing && 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          isTopless && 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
          isHammerhead && 'bg-purple-500/15 text-purple-300 border-purple-500/30',
          !isLuffing && !isTopless && !isHammerhead && 'bg-blue-500/15 text-blue-300 border-blue-500/30'
        )}
        title={`Heavy Equipment: ${equip.name} (${equip.code})`}
      >
        <Truck className="h-3 w-3" />
        {equip.crane_category ? `${equip.crane_category.replace('_', ' ').toUpperCase()} CRANE` : equip.name}
      </span>
    );
  };

  const getCategoryBadge = (category?: string | null) => {
    switch (category) {
      case 'safety_permit':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/25">
            <ShieldAlert className="h-2.5 w-2.5" /> Safety & Highway Permit
          </span>
        );
      case 'structural_clearance':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/25">
            <HardHat className="h-2.5 w-2.5" /> Structural / Ocular
          </span>
        );
      case 'mobilization':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
            <Truck className="h-2.5 w-2.5" /> Mobilization & Rigging
          </span>
        );
      case 'commercial_quote':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/25">
            Commercial Review
          </span>
        );
      default:
        return null;
    }
  };

  const columns: TableColumn<FollowUp>[] = [
    {
      key: 'scheduled_date',
      label: 'Scheduled Schedule',
      width: '18%',
      render: (_, row) => {
        const overdue = isOverdue(row.scheduled_date, row.status);
        const days = overdue ? getDaysOverdue(row.scheduled_date) : 0;

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-content-primary">
              <Calendar className={clsx('h-3.5 w-3.5', overdue ? 'text-rose-500' : 'text-amber-500')} />
              <span>{new Date(row.scheduled_date).toLocaleDateString()}</span>
            </div>

            {row.due_time && (
              <p className="text-xs text-content-muted flex items-center gap-1">
                <Clock className="h-3 w-3" /> {row.due_time}
              </p>
            )}

            {/* Overdue Escalation Badge */}
            {overdue && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                <AlertTriangle className="h-2.5 w-2.5" /> OVERDUE ({days}d)
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'customer_id',
      label: 'Client & Quick Action',
      width: '24%',
      render: (_, row) => (
        <div className="space-y-1.5">
          <div>
            <p className="font-semibold text-sm text-content-primary leading-tight">
              {row.customer?.company_name || row.customer?.name || 'Unassigned Account'}
            </p>
          </div>

          {/* Quick Communication Actions next to client contact */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {row.customer?.phone && (
              <a
                href={`tel:${row.customer.phone}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
                title={`Click to call ${row.customer.phone}`}
              >
                <Phone className="h-3 w-3" />
                {row.customer.phone}
              </a>
            )}

            {row.customer?.email && (
              <a
                href={`mailto:${row.customer.email}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition"
                title={`Send email to ${row.customer.email}`}
              >
                <Mail className="h-3 w-3" />
                Email
              </a>
            )}

            {/* Quick Outreach Template Modal Trigger */}
            <button
              type="button"
              onClick={() => openOutreachModal(row)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition shadow-sm"
              title="Open crane leasing message templates"
            >
              <Zap className="h-3 w-3 text-amber-400" />
              Quick Outreach
            </button>
          </div>
        </div>
      ),
    },
    {
      key: 'title',
      label: 'Follow-Up Action & Equipment Tags',
      width: '34%',
      render: (_, row) => {
        const isCritical = isSafetyOrPermitCritical(row);

        return (
          <div className="space-y-1.5">
            {/* Urgent / Permit Escalation Highlight */}
            {isCritical && row.status === 'pending' && (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-500/15">
                <ShieldAlert className="h-3 w-3 text-rose-400 shrink-0" />
                <span>CRITICAL SAFETY & CLEARANCE ESCALATION</span>
              </div>
            )}

            <div>
              <p className="font-semibold text-sm text-content-primary leading-tight">{row.title}</p>
              {row.notes && (
                <p className="text-xs text-content-secondary mt-0.5 line-clamp-2 whitespace-pre-line">{row.notes}</p>
              )}
            </div>

            {/* Equipment and Project Site Badges */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {getCraneBadge(row.equipment)}

              {row.project && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-blue-500/10 text-blue-300 border border-blue-500/25"
                  title={row.project.project_name}
                >
                  <Building2 className="h-3 w-3 text-blue-400" />
                  {row.project.project_code}
                </span>
              )}

              {getCategoryBadge(row.category)}

              {row.inquiry && (
                <span className="inline-flex items-center text-[10px] text-content-muted font-mono">
                  Inq: {row.inquiry.inquiry_number}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'priority',
      label: 'Priority',
      width: '10%',
      render: (priority, row) => {
        const isCritical = isSafetyOrPermitCritical(row);

        return (
          <div className="space-y-1">
            <span
              className={clsx(
                'px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1',
                priority === 'urgent' || isCritical
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-500/20'
                  : priority === 'high'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : priority === 'medium'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
              )}
            >
              {(priority === 'urgent' || isCritical) && <AlertTriangle className="h-3 w-3" />}
              {priority}
            </span>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      width: '14%',
      render: (status, row) => (
        <div className="flex items-center gap-1.5">
          <span
            className={clsx(
              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize',
              status === 'completed'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            )}
          >
            {status === 'completed' ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <Clock className="h-3 w-3" />
            )}
            {status}
          </span>

          {row.status === 'pending' && (
            <button
              onClick={() => handleComplete(row.id)}
              className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
              title="Mark Task as Completed"
            >
              <CheckCircle2 className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={() => handleDelete(row.id)}
            className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Delete Follow-Up"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Head title="Client Follow-Ups & Safety Reminders - CRM" />
      <AppLayout title="CRM & Client Management">
        <div className="space-y-5">
          <CrmNavTabs
            actionButton={
              <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Schedule Follow-up
              </Button>
            }
          />

          {message && (
            <div
              className={clsx(
                'p-3.5 rounded-xl text-sm flex items-center justify-between border backdrop-blur-md transition-all',
                messageType === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              )}
            >
              <span>{message}</span>
              <button
                type="button"
                onClick={() => setMessage('')}
                className="text-xs opacity-70 hover:opacity-100"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-surface-card border border-border-default flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs font-semibold text-content-secondary uppercase">Pending Follow-Ups</p>
                <p className="text-2xl font-black text-amber-400 mt-1">{pendingCount}</p>
                <span className="text-[11px] text-content-muted">Scheduled client actions</span>
              </div>
              <Clock className="h-8 w-8 text-amber-500/40" />
            </div>

            <div className="p-4 rounded-2xl bg-surface-card border border-rose-500/30 bg-rose-950/10 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs font-semibold text-rose-300 uppercase flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-400" /> Overdue Tasks
                </p>
                <p className="text-2xl font-black text-rose-400 mt-1">{overdueCount}</p>
                <span className="text-[11px] text-rose-300/70">Past scheduled deadline</span>
              </div>
              <AlertCircle className="h-8 w-8 text-rose-500/40" />
            </div>

            <div className="p-4 rounded-2xl bg-surface-card border border-amber-500/30 bg-amber-950/10 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs font-semibold text-amber-300 uppercase flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-400" /> Safety & Permits Critical
                </p>
                <p className="text-2xl font-black text-amber-400 mt-1">{criticalSafetyCount}</p>
                <span className="text-[11px] text-amber-300/70">Clearances & highway permits</span>
              </div>
              <ShieldAlert className="h-8 w-8 text-amber-500/40" />
            </div>

            <div className="p-4 rounded-2xl bg-surface-card border border-border-default flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs font-semibold text-content-secondary uppercase">Completed Actions</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">{completedCount}</p>
                <span className="text-[11px] text-content-muted">Successfully fulfilled</span>
              </div>
              <CalendarCheck className="h-8 w-8 text-emerald-500/40" />
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <Input
                  placeholder="Search client, equipment, title, project..."
                  startIcon={<Search className="h-4 w-4" />}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                >
                  <option value="all">All Follow-Up Statuses</option>
                  <option value="pending">Pending Only</option>
                  <option value="completed">Completed Only</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent / Critical</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                >
                  <option value="all">All Operations Categories</option>
                  <option value="safety_permit">Safety & Highway Permits</option>
                  <option value="structural_clearance">Structural & Ocular Clearance</option>
                  <option value="mobilization">Site Mobilization</option>
                  <option value="commercial_quote">Commercial Review</option>
                </select>
              </div>
            </CardBody>
          </Card>

          {/* Data Table */}
          <Card noPadding>
            <Table
              columns={columns}
              data={followUps}
              loading={loading}
              emptyMessage="No follow-up reminders found matching criteria. Click 'Schedule Follow-up' to create one."
            />
          </Card>

          {/* Modal: Schedule Follow-Up with Equipment & Project Tagging */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => !saving && setIsModalOpen(false)}
            title="Schedule Heavy Equipment Client Follow-Up"
            size="2xl"
            footer={
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" form="follow-up-form" loading={saving} variant="primary">
                  Schedule Follow-Up Task
                </Button>
              </div>
            }
          >
            <form id="follow-up-form" onSubmit={handleCreate} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">
                  Client / Contractor Account *
                </label>
                <select
                  required
                  value={newFollowUp.customer_id}
                  onChange={(e) => setNewFollowUp({ ...newFollowUp, customer_id: e.target.value, project_id: '' })}
                  className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                >
                  <option value="">Select Client Account</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name ? `${c.company_name} (${c.name})` : c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Equipment and Project Entity Linking */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-surface-elevated/40 border border-border-default">
                <div>
                  <label className="block text-xs font-semibold text-amber-400 uppercase mb-1 flex items-center gap-1">
                    <Truck className="h-3 w-3" /> Related Crane / Equipment
                  </label>
                  <select
                    value={newFollowUp.equipment_id}
                    onChange={(e) => setNewFollowUp({ ...newFollowUp, equipment_id: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-xs focus:border-amber-500 focus:outline-none"
                  >
                    <option value="">-- No Specific Unit Tagged --</option>
                    {equipmentList.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.name} ({eq.crane_category?.toUpperCase() || eq.category}) - {eq.code}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-blue-400 uppercase mb-1 flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> Related Project Site
                  </label>
                  <select
                    value={newFollowUp.project_id}
                    onChange={(e) => setNewFollowUp({ ...newFollowUp, project_id: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-xs focus:border-amber-500 focus:outline-none"
                  >
                    <option value="">-- No Project Tagged --</option>
                    {filteredProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.project_code} - {p.project_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Title */}
              <div>
                <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">
                  Follow-Up Action Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Verify MMDA night hauling permit & foundation anchor bolt inspection"
                  value={newFollowUp.title}
                  onChange={(e) => setNewFollowUp({ ...newFollowUp, title: e.target.value })}
                  className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Category and Critical Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">
                    Follow-Up Classification *
                  </label>
                  <select
                    value={newFollowUp.category}
                    onChange={(e) => setNewFollowUp({ ...newFollowUp, category: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                  >
                    <option value="safety_permit">Safety & Highway Permits</option>
                    <option value="structural_clearance">Structural & Foundation Clearance</option>
                    <option value="mobilization">Site Mobilization & Rigging</option>
                    <option value="commercial_quote">Commercial Quotation Review</option>
                    <option value="general">General Client Follow-Up</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="relative flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newFollowUp.is_permit_critical}
                      onChange={(e) => setNewFollowUp({ ...newFollowUp, is_permit_critical: e.target.checked })}
                      className="rounded border-border-default text-rose-500 focus:ring-rose-500 h-4 w-4 bg-surface-input"
                    />
                    <span className="text-xs font-bold text-rose-300 flex items-center gap-1">
                      <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                      Mark as Urgent Safety / Permit Critical
                    </span>
                  </label>
                </div>
              </div>

              {/* Scheduling & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newFollowUp.scheduled_date}
                    onChange={(e) => setNewFollowUp({ ...newFollowUp, scheduled_date: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">
                    Target Time
                  </label>
                  <input
                    type="text"
                    placeholder="10:00 AM"
                    value={newFollowUp.due_time}
                    onChange={(e) => setNewFollowUp({ ...newFollowUp, due_time: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">
                    Priority Level
                  </label>
                  <select
                    value={newFollowUp.priority}
                    onChange={(e) => setNewFollowUp({ ...newFollowUp, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">
                  Internal Notes & Technical Agenda
                </label>
                <textarea
                  rows={3}
                  placeholder="Notes on client requirements, permits required, contractor constraints, or specific crane specs..."
                  value={newFollowUp.notes}
                  onChange={(e) => setNewFollowUp({ ...newFollowUp, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>
            </form>
          </Modal>

          {/* Modal: Quick Client Outreach Templates */}
          <Modal
            isOpen={!!outreachTarget}
            onClose={() => setOutreachTarget(null)}
            title="Quick Client Outreach & Leasing Templates"
            size="lg"
            footer={
              <div className="flex flex-wrap items-center justify-between w-full gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyOutreach}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 transition"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied to Clipboard!' : 'Copy Template'}
                  </button>

                  {outreachTarget?.customer?.phone && (
                    <a
                      href={`tel:${outreachTarget.customer.phone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 transition"
                    >
                      <Phone className="h-3.5 w-3.5" /> Call Client
                    </a>
                  )}

                  {outreachTarget?.customer?.email && (
                    <a
                      href={`mailto:${outreachTarget.customer.email}?subject=${encodeURIComponent(outreachTarget.title)}&body=${encodeURIComponent(outreachText)}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-300 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 transition"
                    >
                      <Mail className="h-3.5 w-3.5" /> Open Email Client
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setOutreachTarget(null)}>
                    Close
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleLogCommunicationFromOutreach}
                    loading={loggingComm}
                    title="Automatically log this outreach into CRM Communication History"
                  >
                    Log into History
                  </Button>
                </div>
              </div>
            }
          >
            {outreachTarget && (
              <div className="space-y-4">
                {/* Target Information Card */}
                <div className="p-3 rounded-xl bg-surface-elevated border border-border-default text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-content-primary">
                      {outreachTarget.customer?.company_name || outreachTarget.customer?.name}
                    </span>
                    <span className="font-mono text-content-muted">
                      {outreachTarget.customer?.phone || 'No phone'} | {outreachTarget.customer?.email || 'No email'}
                    </span>
                  </div>
                  <p className="text-zinc-300">
                    <span className="font-semibold text-amber-400">Context:</span> {outreachTarget.title}
                  </p>
                  {outreachTarget.equipment && (
                    <p className="text-cyan-300 flex items-center gap-1">
                      <Truck className="h-3 w-3" /> Unit: {outreachTarget.equipment.name} ({outreachTarget.equipment.crane_category || 'Heavy Crane'})
                    </p>
                  )}
                </div>

                {/* Preset Template Selector */}
                <div>
                  <label className="block text-xs font-semibold text-content-secondary uppercase mb-1.5">
                    Select Outreach Template
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => updateOutreachTemplate('structural_clearance')}
                      className={clsx(
                        'p-2 rounded-xl text-left border text-xs font-semibold transition',
                        outreachTemplateType === 'structural_clearance'
                          ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                          : 'border-border-default bg-surface-input text-content-secondary hover:text-content-primary'
                      )}
                    >
                      📐 Structural Clearance
                    </button>

                    <button
                      type="button"
                      onClick={() => updateOutreachTemplate('highway_permit')}
                      className={clsx(
                        'p-2 rounded-xl text-left border text-xs font-semibold transition',
                        outreachTemplateType === 'highway_permit'
                          ? 'border-rose-500 bg-rose-500/15 text-rose-300'
                          : 'border-border-default bg-surface-input text-content-secondary hover:text-content-primary'
                      )}
                    >
                      🚛 Highway Permit
                    </button>

                    <button
                      type="button"
                      onClick={() => updateOutreachTemplate('dole_pemea')}
                      className={clsx(
                        'p-2 rounded-xl text-left border text-xs font-semibold transition',
                        outreachTemplateType === 'dole_pemea'
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                          : 'border-border-default bg-surface-input text-content-secondary hover:text-content-primary'
                      )}
                    >
                      🛡️ DOLE / PEMEA
                    </button>

                    <button
                      type="button"
                      onClick={() => updateOutreachTemplate('commercial_quote')}
                      className={clsx(
                        'p-2 rounded-xl text-left border text-xs font-semibold transition',
                        outreachTemplateType === 'commercial_quote'
                          ? 'border-blue-500 bg-blue-500/15 text-blue-300'
                          : 'border-border-default bg-surface-input text-content-secondary hover:text-content-primary'
                      )}
                    >
                      💼 Commercial Proposal
                    </button>
                  </div>
                </div>

                {/* Message Editor */}
                <div>
                  <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">
                    Message Body (Customizable)
                  </label>
                  <textarea
                    rows={6}
                    value={outreachText}
                    onChange={(e) => setOutreachText(e.target.value)}
                    className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-xs font-sans focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </Modal>
        </div>
      </AppLayout>
    </>
  );
};

export default FollowUpsPage;
