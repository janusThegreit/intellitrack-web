import { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
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
  Phone,
  Mail,
  Users,
  MapPin,
  MessageCircle,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  Building2,
  Truck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  CalendarPlus,
  Clock,
  ChevronDown,
  ChevronUp,
  Compass,
  HardHat,
  Eye,
} from 'lucide-react';
import clsx from 'clsx';

interface Customer {
  id: number;
  name: string;
  company_name?: string;
  phone?: string;
  email?: string;
}

interface Quotation {
  id: number;
  quotation_number: string;
  customer_id: number;
  status: string;
  total_amount: number | string;
  valid_until?: string;
}

interface Project {
  id: number;
  project_code: string;
  project_name: string;
  customer_id: number;
  status: string;
}

interface Communication {
  id: number;
  customer_id: number;
  customer_inquiry_id?: number | null;
  quotation_id?: number | null;
  project_id?: number | null;
  type: 'call' | 'email' | 'meeting' | 'site_visit' | 'sms';
  direction: 'inbound' | 'outbound';
  subject: string;
  content: string;
  outcome?: string | null;
  site_location?: string | null;
  trailer_truck_accessible?: 'accessible' | 'restricted' | 'inaccessible' | null;
  trailer_access_notes?: string | null;
  crane_setup_clearance?: 'adequate' | 'restricted' | 'overhead_hazard' | null;
  crane_clearance_notes?: string | null;
  communicated_at: string;
  customer?: Customer;
  inquiry?: { id: number; inquiry_number: string; subject: string };
  quotation?: Quotation;
  project?: Project;
  creator?: { id: number; name: string };
}

const CommunicationsPage = () => {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [quotationFilter, setQuotationFilter] = useState('all');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [staffList, setStaffList] = useState<Array<{ id: number; name: string }>>([]);

  // Modal State - Log Communication
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [showOcularFields, setShowOcularFields] = useState(false);

  // Form State
  const [newComm, setNewComm] = useState({
    customer_id: '',
    quotation_id: '',
    project_id: '',
    type: 'call' as 'call' | 'email' | 'meeting' | 'site_visit' | 'sms',
    direction: 'outbound' as 'inbound' | 'outbound',
    subject: '',
    content: '',
    outcome: '',
    site_location: '',
    trailer_truck_accessible: 'accessible',
    trailer_access_notes: '',
    crane_setup_clearance: 'adequate',
    crane_clearance_notes: '',
  });

  // Modal State - Quick Follow-Up Trigger
  const [followUpComm, setFollowUpComm] = useState<Communication | null>(null);
  const [followUpSaving, setFollowUpSaving] = useState(false);
  const [followUpForm, setFollowUpForm] = useState({
    title: '',
    notes: '',
    scheduled_date: '',
    due_time: '10:00 AM',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    assigned_to: '',
  });

  // Expanded site inspection detail state
  const [expandedInspectionId, setExpandedInspectionId] = useState<number | null>(null);

  const loadCommunications = () => {
    setLoading(true);
    const query = new URLSearchParams({
      per_page: '100',
      ...(search ? { search } : {}),
      ...(typeFilter !== 'all' ? { type: typeFilter } : {}),
      ...(quotationFilter !== 'all' ? { quotation_id: quotationFilter } : {}),
    });

    fetch(`/api/crm/communications?${query}`, { headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setCommunications(data.data ?? []))
      .catch(() => setCommunications([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCommunications();
  }, [search, typeFilter, quotationFilter]);

  useEffect(() => {
    // Load supporting entities: Customers, Quotations, Projects, Staff
    fetch('/api/customers?per_page=100', { headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setCustomers(data.data ?? []))
      .catch(() => {});

    fetch('/api/quotations?per_page=100', { headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setQuotations(data.data ?? []))
      .catch(() => {});

    fetch('/api/projects?per_page=100', { headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setProjects(data.data ?? []))
      .catch(() => {});

    fetch('/api/assignable-staff', { headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setStaffList(data.staff ?? data ?? []))
      .catch(() => {});

    // Check query params to pre-open modal if requested
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const customerId = params.get('customer_id');
      const quotationId = params.get('quotation_id');
      const projectId = params.get('project_id');
      const typeParam = params.get('type') as any;

      if (customerId || quotationId || projectId || params.get('create') === 'true') {
        setIsModalOpen(true);
        if (typeParam === 'site_visit') setShowOcularFields(true);
        setNewComm((prev) => ({
          ...prev,
          ...(customerId ? { customer_id: customerId } : {}),
          ...(quotationId ? { quotation_id: quotationId } : {}),
          ...(projectId ? { project_id: projectId } : {}),
          ...(typeParam ? { type: typeParam } : {}),
        }));
      }
    }
  }, []);

  // Filter quotations and projects by selected customer in the modal
  const filteredQuotations = newComm.customer_id
    ? quotations.filter((q) => q.customer_id === Number(newComm.customer_id))
    : quotations;

  const filteredProjects = newComm.customer_id
    ? projects.filter((p) => p.customer_id === Number(newComm.customer_id))
    : projects;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

    const payload = {
      ...newComm,
      customer_id: Number(newComm.customer_id),
      quotation_id: newComm.quotation_id ? Number(newComm.quotation_id) : null,
      project_id: newComm.project_id ? Number(newComm.project_id) : null,
      // If ocular section wasn't active or wasn't a site visit, pass clean values if empty
      site_location: newComm.site_location || null,
      trailer_truck_accessible: newComm.trailer_truck_accessible || null,
      trailer_access_notes: newComm.trailer_access_notes || null,
      crane_setup_clearance: newComm.crane_setup_clearance || null,
      crane_clearance_notes: newComm.crane_clearance_notes || null,
    };

    try {
      const res = await fetch('/api/crm/communications', {
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
        setMessage('Communication record and site telemetry logged successfully.');
        setNewComm({
          customer_id: '',
          quotation_id: '',
          project_id: '',
          type: 'call',
          direction: 'outbound',
          subject: '',
          content: '',
          outcome: '',
          site_location: '',
          trailer_truck_accessible: 'accessible',
          trailer_access_notes: '',
          crane_setup_clearance: 'adequate',
          crane_clearance_notes: '',
        });
        setShowOcularFields(false);
        loadCommunications();
        setTimeout(() => setMessage(''), 4000);
      } else {
        const errorData = await res.json();
        setMessageType('error');
        setMessage(errorData.message || 'Failed to record communication.');
      }
    } catch {
      setMessageType('error');
      setMessage('Failed to record communication.');
    } finally {
      setSaving(false);
    }
  };

  // Quick Follow-Up Trigger Handler
  const handleOpenFollowUp = (comm: Communication) => {
    setFollowUpComm(comm);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowFormatted = tomorrow.toISOString().split('T')[0];

    // Build intelligent context notes
    let notesContext = `Action Follow-Up from ${comm.type.replace('_', ' ').toUpperCase()} on ${new Date(comm.communicated_at).toLocaleDateString()}:\n`;
    notesContext += `Discussion Summary: ${comm.content.slice(0, 160)}${comm.content.length > 160 ? '...' : ''}\n`;
    if (comm.outcome) {
      notesContext += `Agreed Next Steps: ${comm.outcome}\n`;
    }
    if (comm.quotation) {
      notesContext += `Commercial Ref: Quotation ${comm.quotation.quotation_number}\n`;
    }
    if (comm.site_location) {
      notesContext += `Site Location: ${comm.site_location}\n`;
    }
    if (comm.trailer_truck_accessible && comm.trailer_truck_accessible !== 'accessible') {
      notesContext += `Access Warning: Trailer accessibility flagged as '${comm.trailer_truck_accessible.toUpperCase()}'.\n`;
    }
    if (comm.crane_setup_clearance && comm.crane_setup_clearance !== 'adequate') {
      notesContext += `Clearance Warning: Crane setup clearance flagged as '${comm.crane_setup_clearance.toUpperCase()}'.\n`;
    }

    setFollowUpForm({
      title: `Follow-up: ${comm.subject}`,
      notes: notesContext,
      scheduled_date: tomorrowFormatted,
      due_time: '10:00 AM',
      priority: comm.trailer_truck_accessible === 'inaccessible' || comm.crane_setup_clearance === 'overhead_hazard' ? 'urgent' : 'high',
      assigned_to: '',
    });
  };

  const handleScheduleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpComm) return;

    setFollowUpSaving(true);
    const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

    try {
      const res = await fetch('/api/crm/follow-ups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify({
          customer_id: followUpComm.customer_id,
          customer_inquiry_id: followUpComm.customer_inquiry_id || null,
          title: followUpForm.title,
          notes: followUpForm.notes,
          scheduled_date: followUpForm.scheduled_date,
          due_time: followUpForm.due_time,
          priority: followUpForm.priority,
          assigned_to: followUpForm.assigned_to ? Number(followUpForm.assigned_to) : null,
        }),
      });

      if (res.ok) {
        setFollowUpComm(null);
        setMessageType('success');
        setMessage(`Follow-up task scheduled successfully in CRM queue for ${followUpComm.customer?.company_name || 'Client'}.`);
        setTimeout(() => setMessage(''), 4000);
      } else {
        const errorData = await res.json();
        setMessageType('error');
        setMessage(errorData.message || 'Failed to spawn follow-up task.');
      }
    } catch {
      setMessageType('error');
      setMessage('Failed to spawn follow-up task.');
    } finally {
      setFollowUpSaving(false);
    }
  };

  // Metrics calculation
  const callsCount = communications.filter((c) => c.type === 'call').length;
  const siteVisitsCount = communications.filter((c) => c.type === 'site_visit').length;
  const quotedLinkedCount = communications.filter((c) => !!c.quotation_id).length;
  const emailsAndOthersCount = communications.filter((c) => c.type === 'email' || c.type === 'sms' || c.type === 'meeting').length;

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'call':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Phone className="h-3 w-3" /> Phone Call
          </span>
        );
      case 'meeting':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Users className="h-3 w-3" /> Meeting
          </span>
        );
      case 'site_visit':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-sm shadow-purple-500/10">
            <Compass className="h-3 w-3" /> Site Inspection
          </span>
        );
      case 'email':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Mail className="h-3 w-3" /> Email
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <MessageCircle className="h-3 w-3" /> SMS / Viber
          </span>
        );
    }
  };

  const getTrailerBadge = (status?: string | null) => {
    if (!status) return null;
    switch (status) {
      case 'accessible':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Truck className="h-2.5 w-2.5" /> Trailer: Clear
          </span>
        );
      case 'restricted':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="h-2.5 w-2.5" /> Trailer: Restricted
          </span>
        );
      case 'inaccessible':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="h-2.5 w-2.5" /> Trailer: Impassable
          </span>
        );
      default:
        return null;
    }
  };

  const getCraneClearanceBadge = (status?: string | null) => {
    if (!status) return null;
    switch (status) {
      case 'adequate':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-2.5 w-2.5" /> Crane: 360° Clear
          </span>
        );
      case 'restricted':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="h-2.5 w-2.5" /> Crane: Restricted Swing
          </span>
        );
      case 'overhead_hazard':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse">
            <ShieldAlert className="h-2.5 w-2.5" /> Crane: Hazard Alert
          </span>
        );
      default:
        return null;
    }
  };

  const columns: TableColumn<Communication>[] = [
    {
      key: 'communicated_at',
      label: 'Date & Channel',
      width: '18%',
      render: (_, row) => (
        <div>
          <span className="text-xs font-semibold text-content-primary">
            {new Date(row.communicated_at).toLocaleDateString()} {new Date(row.communicated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <div className="flex items-center gap-1.5 mt-1.5">
            {getTypeBadge(row.type)}
            <span
              className={clsx(
                'inline-flex items-center text-[10px] font-bold px-1 py-0.5 rounded',
                row.direction === 'inbound' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-amber-500/10 text-amber-400'
              )}
            >
              {row.direction === 'inbound' ? (
                <>
                  <ArrowDownLeft className="h-3 w-3 mr-0.5" /> In
                </>
              ) : (
                <>
                  <ArrowUpRight className="h-3 w-3 mr-0.5" /> Out
                </>
              )}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'customer_id',
      label: 'Client & Commercial Link',
      width: '24%',
      render: (_, row) => (
        <div className="space-y-1.5">
          <div>
            <p className="font-semibold text-sm text-content-primary leading-tight">
              {row.customer?.company_name || row.customer?.name || 'Unassigned Account'}
            </p>
            {row.customer?.phone && (
              <p className="text-xs text-content-muted">{row.customer.phone}</p>
            )}
          </div>

          {/* Linked Commercial Entities */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {row.quotation && (
              <Link
                href="/quotations"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/25 hover:bg-amber-500/20 transition"
                title={`Linked Quotation: ${row.quotation.status}`}
              >
                <FileText className="h-3 w-3 text-amber-400" />
                {row.quotation.quotation_number}
              </Link>
            )}

            {row.project && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-blue-500/10 text-blue-300 border border-blue-500/25"
                title={row.project.project_name}
              >
                <Building2 className="h-3 w-3 text-blue-400" />
                {row.project.project_code}
              </span>
            )}

            {row.site_location && (
              <span className="inline-flex items-center gap-1 text-[11px] text-content-muted w-full truncate" title={row.site_location}>
                <MapPin className="h-3 w-3 text-zinc-400 shrink-0" />
                <span className="truncate">{row.site_location}</span>
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'subject',
      label: 'Interaction & Rigging Telemetry',
      width: '38%',
      render: (_, row) => {
        const hasInspection = !!row.trailer_truck_accessible || !!row.crane_setup_clearance || !!row.trailer_access_notes || !!row.crane_clearance_notes;
        const isExpanded = expandedInspectionId === row.id;

        return (
          <div className="space-y-1.5">
            <div>
              <p className="font-bold text-sm text-content-primary">{row.subject}</p>
              <p className="text-xs text-content-secondary mt-0.5 line-clamp-2">{row.content}</p>
            </div>

            {row.outcome && (
              <div className="p-1.5 rounded-lg bg-surface-elevated/70 border border-border-default text-xs text-amber-300 flex items-start gap-1.5">
                <span className="font-semibold shrink-0">Agreed Next Step:</span>
                <span>{row.outcome}</span>
              </div>
            )}

            {/* Site Inspection Badges & Accordion Trigger */}
            {hasInspection && (
              <div className="pt-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  {getTrailerBadge(row.trailer_truck_accessible)}
                  {getCraneClearanceBadge(row.crane_setup_clearance)}

                  <button
                    type="button"
                    onClick={() => setExpandedInspectionId(isExpanded ? null : row.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-400 hover:text-purple-300 transition ml-auto"
                  >
                    <Eye className="h-3 w-3" />
                    {isExpanded ? 'Hide Ocular Notes' : 'View Ocular Notes'}
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-2 p-3 rounded-xl bg-purple-950/20 border border-purple-500/25 space-y-2 text-xs animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-1 border-b border-purple-500/20 font-bold text-purple-300">
                      <span className="flex items-center gap-1.5">
                        <HardHat className="h-3.5 w-3.5" /> Site Ocular Logistics Assessment
                      </span>
                      {row.site_location && <span className="font-normal text-zinc-400">{row.site_location}</span>}
                    </div>

                    {row.trailer_access_notes && (
                      <div>
                        <span className="font-semibold text-amber-300">Trailer Access & Turning Radius:</span>
                        <p className="text-zinc-300 mt-0.5">{row.trailer_access_notes}</p>
                      </div>
                    )}

                    {row.crane_clearance_notes && (
                      <div>
                        <span className="font-semibold text-emerald-300">Crane Clearance & Hazard Buffer:</span>
                        <p className="text-zinc-300 mt-0.5">{row.crane_clearance_notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'id',
      label: 'Staff & Quick Action',
      width: '20%',
      render: (_, row) => (
        <div className="space-y-2">
          <div className="text-xs text-content-muted">
            <span>Logged by:</span>
            <p className="font-semibold text-content-primary">
              {row.creator?.name || 'Account Executive'}
            </p>
          </div>

          {/* Quick Follow-Up Action Button */}
          <button
            type="button"
            onClick={() => handleOpenFollowUp(row)}
            className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 shadow-sm transition active:scale-95"
            title="Spawn a task into the CRM Follow-Up Queue"
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            Schedule Follow-Up
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Head title="Client Communications & Interaction History - CRM" />
      <AppLayout title="CRM & Client Management">
        <div className="space-y-5">
          <CrmNavTabs
            actionButton={
              <Button
                variant="primary"
                onClick={() => {
                  setShowOcularFields(false);
                  setIsModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Log Communication
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

          {/* Telemetry Metric Scorecards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-surface-card border border-border-default flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs font-semibold text-content-secondary uppercase">Phone Calls Logged</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">{callsCount}</p>
                <span className="text-[11px] text-content-muted">Client outreach & follow-ups</span>
              </div>
              <Phone className="h-8 w-8 text-emerald-500/40" />
            </div>

            <div className="p-4 rounded-2xl bg-surface-card border border-border-default flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs font-semibold text-content-secondary uppercase">Site Ocular Visits</p>
                <p className="text-2xl font-black text-purple-400 mt-1">{siteVisitsCount}</p>
                <span className="text-[11px] text-content-muted">Trailer & crane clearance verified</span>
              </div>
              <Compass className="h-8 w-8 text-purple-500/40" />
            </div>

            <div className="p-4 rounded-2xl bg-surface-card border border-border-default flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs font-semibold text-content-secondary uppercase">Linked Quotations</p>
                <p className="text-2xl font-black text-amber-400 mt-1">{quotedLinkedCount}</p>
                <span className="text-[11px] text-content-muted">Commercial proposals discussed</span>
              </div>
              <FileText className="h-8 w-8 text-amber-500/40" />
            </div>

            <div className="p-4 rounded-2xl bg-surface-card border border-border-default flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs font-semibold text-content-secondary uppercase">Meetings & Inquiries</p>
                <p className="text-2xl font-black text-blue-400 mt-1">{emailsAndOthersCount}</p>
                <span className="text-[11px] text-content-muted">In-person & electronic channels</span>
              </div>
              <Users className="h-8 w-8 text-blue-500/40" />
            </div>
          </div>

          {/* Filtering and Search Controls */}
          <Card>
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  placeholder="Search discussion, client, proposal #, site..."
                  startIcon={<Search className="h-4 w-4" />}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                >
                  <option value="all">All Communication Channels</option>
                  <option value="call">Phone Calls</option>
                  <option value="site_visit">Site Ocular Inspections</option>
                  <option value="meeting">In-Person Meetings</option>
                  <option value="email">Emails</option>
                  <option value="sms">SMS / Viber</option>
                </select>

                <select
                  value={quotationFilter}
                  onChange={(e) => setQuotationFilter(e.target.value)}
                  className="px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                >
                  <option value="all">All Quotations Filter</option>
                  {quotations.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.quotation_number} ({q.status.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            </CardBody>
          </Card>

          {/* Communications Data Table */}
          <Card noPadding>
            <Table
              columns={columns}
              data={communications}
              loading={loading}
              emptyMessage="No communications logged yet matching the filter criteria. Click 'Log Communication' to record interactions."
            />
          </Card>

          {/* Modal: Log Interaction with Site Inspection & Entity Linking */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => !saving && setIsModalOpen(false)}
            title="Log Client Interaction & Heavy Equipment Inspection"
            size="2xl"
            footer={
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" form="comm-form" loading={saving} variant="primary">
                  Save Interaction Log
                </Button>
              </div>
            }
          >
            <form id="comm-form" onSubmit={handleCreate} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* Account Selection */}
              <div>
                <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">
                  Client / Contractor Account *
                </label>
                <select
                  required
                  value={newComm.customer_id}
                  onChange={(e) => setNewComm({ ...newComm, customer_id: e.target.value, quotation_id: '', project_id: '' })}
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

              {/* Commercial Entity Linking: Quotation & Project */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-surface-elevated/40 border border-border-default">
                <div>
                  <label className="block text-xs font-semibold text-amber-400 uppercase mb-1 flex items-center gap-1">
                    <FileText className="h-3 w-3" /> Link Active Quotation
                  </label>
                  <select
                    value={newComm.quotation_id}
                    onChange={(e) => setNewComm({ ...newComm, quotation_id: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-xs focus:border-amber-500 focus:outline-none font-mono"
                  >
                    <option value="">-- No Quotation Linked --</option>
                    {filteredQuotations.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.quotation_number} ({q.status.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-blue-400 uppercase mb-1 flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> Link Project Site
                  </label>
                  <select
                    value={newComm.project_id}
                    onChange={(e) => setNewComm({ ...newComm, project_id: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-xs focus:border-amber-500 focus:outline-none font-mono"
                  >
                    <option value="">-- No Project Linked --</option>
                    {filteredProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.project_code} - {p.project_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Channel and Direction */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">
                    Channel Type *
                  </label>
                  <select
                    value={newComm.type}
                    onChange={(e) => {
                      const selectedType = e.target.value as any;
                      setNewComm({ ...newComm, type: selectedType });
                      if (selectedType === 'site_visit') {
                        setShowOcularFields(true);
                      }
                    }}
                    className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                  >
                    <option value="call">Phone Call</option>
                    <option value="site_visit">Site Ocular Inspection</option>
                    <option value="meeting">Office / Site Meeting</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS / Viber</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">
                    Direction
                  </label>
                  <select
                    value={newComm.direction}
                    onChange={(e) => setNewComm({ ...newComm, direction: e.target.value as any })}
                    className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                  >
                    <option value="outbound">Outbound (We contacted client)</option>
                    <option value="inbound">Inbound (Client contacted us)</option>
                  </select>
                </div>
              </div>

              {/* Subject & Summary */}
              <div>
                <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">
                  Subject / Topic *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Site ocular visit for 60m crane foundation tie-in & trailer delivery"
                  value={newComm.subject}
                  onChange={(e) => setNewComm({ ...newComm, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">
                  Discussion Summary / Meeting Notes *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Key discussion points, crane lifting specs discussed, contractor constraints..."
                  value={newComm.content}
                  onChange={(e) => setNewComm({ ...newComm, content: e.target.value })}
                  className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">
                  Agreed Outcome & Next Steps
                </label>
                <input
                  type="text"
                  placeholder="e.g. Client approved delivery schedule; submit revised quotation with mobilization fee"
                  value={newComm.outcome}
                  onChange={(e) => setNewComm({ ...newComm, outcome: e.target.value })}
                  className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Ocular Inspection Toggle / Section */}
              <div className="border border-purple-500/30 rounded-xl bg-purple-950/15 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowOcularFields(!showOcularFields)}
                  className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-purple-900/20 transition"
                >
                  <div className="flex items-center gap-2">
                    <Compass className="h-4 w-4 text-purple-400" />
                    <div>
                      <p className="text-xs font-bold text-purple-300 uppercase">
                        Site Ocular Inspection & Heavy Equipment Logistics
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Trailer truck road access, gate width, and crane mast/jib swing clearance
                      </p>
                    </div>
                  </div>
                  {showOcularFields ? <ChevronUp className="h-4 w-4 text-purple-300" /> : <ChevronDown className="h-4 w-4 text-purple-300" />}
                </button>

                {showOcularFields && (
                  <div className="p-4 pt-1 space-y-3 border-t border-purple-500/20">
                    <div>
                      <label className="block text-xs font-semibold text-purple-200 uppercase mb-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-purple-400" /> Exact Site / Drop-off Location
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Lot 4 Block 7, Grand Central Park, BGC, Taguig City"
                        value={newComm.site_location}
                        onChange={(e) => setNewComm({ ...newComm, site_location: e.target.value })}
                        className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-purple-400 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1 flex items-center gap-1">
                          <Truck className="h-3 w-3 text-amber-400" /> Trailer Truck Accessibility
                        </label>
                        <select
                          value={newComm.trailer_truck_accessible}
                          onChange={(e) => setNewComm({ ...newComm, trailer_truck_accessible: e.target.value })}
                          className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-xs focus:border-amber-400 focus:outline-none"
                        >
                          <option value="accessible">🟢 Fully Accessible (Wide Access, Low-Bed Passable)</option>
                          <option value="restricted">🟡 Restricted Access (Narrow Road / Tight Turn / Window Hours)</option>
                          <option value="inaccessible">🔴 Inaccessible (Weight Limit / Overhead Barrier Prevents Entry)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Crane Setup Clearance
                        </label>
                        <select
                          value={newComm.crane_setup_clearance}
                          onChange={(e) => setNewComm({ ...newComm, crane_setup_clearance: e.target.value })}
                          className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-xs focus:border-emerald-400 focus:outline-none"
                        >
                          <option value="adequate">🟢 Adequate Clearance (360° Free Jib Swing, Stable Pad)</option>
                          <option value="restricted">🟡 Restricted Swing (Close to Building / Adjacent Rig)</option>
                          <option value="overhead_hazard">🔴 Hazard Present (High-Voltage Cables / Overhangs)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">
                          Trailer Access & Route Notes:
                        </label>
                        <textarea
                          rows={2}
                          placeholder="e.g. 5m gate width, right-turn radius clear from 32nd St; MMDA truck ban window: 10 PM - 5 AM."
                          value={newComm.trailer_access_notes}
                          onChange={(e) => setNewComm({ ...newComm, trailer_access_notes: e.target.value })}
                          className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-xs focus:border-purple-400 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">
                          Crane Foundation & Swing Notes:
                        </label>
                        <textarea
                          rows={2}
                          placeholder="e.g. Power line 15m northeast requires insulation blanket; foundation pad bearing capacity verified at 250 kPa."
                          value={newComm.crane_clearance_notes}
                          onChange={(e) => setNewComm({ ...newComm, crane_clearance_notes: e.target.value })}
                          className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-xs focus:border-purple-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </Modal>

          {/* Modal: Quick Follow-Up Scheduler Trigger */}
          <Modal
            isOpen={!!followUpComm}
            onClose={() => !followUpSaving && setFollowUpComm(null)}
            title="Schedule Follow-Up Task"
            size="lg"
            footer={
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setFollowUpComm(null)} disabled={followUpSaving}>
                  Cancel
                </Button>
                <Button type="submit" form="quick-follow-up-form" loading={followUpSaving} variant="primary">
                  Spawn Follow-Up Task
                </Button>
              </div>
            }
          >
            {followUpComm && (
              <form id="quick-follow-up-form" onSubmit={handleScheduleFollowUp} className="space-y-4">
                {/* Context banner */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5">
                  <Clock className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-amber-300">
                      Scheduling Task for: {followUpComm.customer?.company_name || followUpComm.customer?.name}
                    </p>
                    <p className="text-zinc-300 mt-0.5">
                      Origin: {followUpComm.type.toUpperCase()} interaction on {new Date(followUpComm.communicated_at).toLocaleDateString()} ({followUpComm.subject})
                    </p>
                    {followUpComm.quotation && (
                      <p className="text-amber-400 font-mono mt-0.5">
                        Commercial Quotation: {followUpComm.quotation.quotation_number}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={followUpForm.title}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">
                      Scheduled Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={followUpForm.scheduled_date}
                      onChange={(e) => setFollowUpForm({ ...followUpForm, scheduled_date: e.target.value })}
                      className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">
                      Due Time
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 10:00 AM"
                      value={followUpForm.due_time}
                      onChange={(e) => setFollowUpForm({ ...followUpForm, due_time: e.target.value })}
                      className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">
                      Priority *
                    </label>
                    <select
                      value={followUpForm.priority}
                      onChange={(e) => setFollowUpForm({ ...followUpForm, priority: e.target.value as any })}
                      className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">
                    Assign To Staff (Optional)
                  </label>
                  <select
                    value={followUpForm.assigned_to}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, assigned_to: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                  >
                    <option value="">Assign to Me / Default Officer</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">
                    Action Plan & Notes
                  </label>
                  <textarea
                    rows={4}
                    value={followUpForm.notes}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-xs font-sans focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </form>
            )}
          </Modal>
        </div>
      </AppLayout>
    </>
  );
};

export default CommunicationsPage;
