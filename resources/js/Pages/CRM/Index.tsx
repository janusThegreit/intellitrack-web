import { useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
  Search,
  Plus,
  MessageSquare,
  FileEdit,
  ArrowRight,
  Phone,
  Mail,
  Building2,
  MapPin,
  Truck,
  User,
  Banknote,
  AlertTriangle,
  CheckCircle2,
  CalendarPlus,
} from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';
import Button from '../../Components/Button';
import Modal from '../../Components/Modal';
import CrmNavTabs from '../../Components/CrmNavTabs';
import Core1PipelineStepper from '../../Components/Core1PipelineStepper';

interface Customer {
  id?: number;
  name: string;
  company_name?: string;
  contact_person?: string;
  phone?: string;
  mobile_number?: string;
  email?: string;
  city?: string;
  address?: string;
  estimated_budget?: number | string;
  total_contract_value?: number | string;
  project_location?: string;
  active_project_name?: string;
  active_lease_summary?: string;
}

interface EquipmentRequirement {
  id: number;
  crane_category?: string;
  required_load?: number | string;
  equipment?: {
    id: number;
    name: string;
    code: string;
    crane_category?: string;
    crane_model?: string;
  };
}

interface Inquiry {
  id: number;
  inquiry_number: string;
  customer_id?: number | null;
  contact_name?: string;
  email?: string;
  phone?: string;
  company_name?: string;
  project_name?: string;
  project_location?: string;
  estimated_budget?: number | string;
  equipment_type?: string;
  status: string;
  priority: string;
  source?: string;
  subject?: string;
  details?: string;
  notes?: string;
  created_at: string;
  customer?: Customer;
  rental_requirements?: EquipmentRequirement[];
  rentalRequirements?: EquipmentRequirement[];
  histories?: Array<{ id: number; action: string; notes?: string; created_at: string }>;
}

const display = (value?: string) =>
  value ? value.replace(/_/g, ' ').replace(/\b\w/g, (letter: string) => letter.toUpperCase()) : '-';

const CRM = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Inquiry State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [newInquiry, setNewInquiry] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    project_name: '',
    project_location: '',
    estimated_budget: '',
    equipment_type: 'Tower Crane',
    source: 'direct_call',
    subject: '',
    priority: 'high',
    notes: '',
  });

  const loadInquiries = () => {
    setLoading(true);
    const query = new URLSearchParams({
      per_page: '50',
      ...(search ? { search } : {}),
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
      ...(priorityFilter !== 'all' ? { priority: priorityFilter } : {}),
    });

    fetch(`/api/customer-inquiries?${query}`, { headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setInquiries(data.data ?? []);
        setError('');
      })
      .catch(() => setError('CRM Inquiries could not be loaded.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInquiries();
  }, [search, statusFilter, priorityFilter]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('create') === 'true') {
        setIsCreateModalOpen(true);
        setNewInquiry((prev) => ({
          ...prev,
          company_name: params.get('customer_name') || '',
          contact_name: params.get('contact_person') || '',
          phone: params.get('phone') || '',
          email: params.get('email') || '',
        }));
      }
    }
  }, []);

  const handleCreateInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');
    const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
    try {
      const payload = {
        ...newInquiry,
        customer_name: newInquiry.company_name || newInquiry.contact_name,
        company_name: newInquiry.company_name,
        contact_person: newInquiry.contact_name,
        customer_phone: newInquiry.phone,
        customer_email: newInquiry.email,
        estimated_budget: newInquiry.estimated_budget ? Number(newInquiry.estimated_budget) : null,
        subject: newInquiry.subject || (newInquiry.project_name ? `${newInquiry.equipment_type} Inquiry: ${newInquiry.project_name}` : `Heavy Equipment Requirement for ${newInquiry.company_name || newInquiry.contact_name}`),
        details: newInquiry.notes || `Requirement for ${newInquiry.equipment_type} at ${newInquiry.project_location || 'Project Site'}. Scope: ${newInquiry.project_name || 'Heavy Equipment Leasing'}.`,
        source: newInquiry.source || 'direct_call',
      };

      const res = await fetch('/api/customer-inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsCreateModalOpen(false);
        setNewInquiry({
          company_name: '',
          contact_name: '',
          email: '',
          phone: '',
          project_name: '',
          project_location: '',
          estimated_budget: '',
          equipment_type: 'Tower Crane',
          source: 'direct_call',
          subject: '',
          priority: 'high',
          notes: '',
        });
        loadInquiries();
      } else {
        const data = await res.json().catch(() => ({}));
        setCreateError(data.message || 'Failed to submit inquiry. Please review input fields.');
      }
    } catch (err: any) {
      setCreateError(err.message || 'Network error occurred while submitting inquiry.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleStatusUpdate = async (inquiryId: number, newStatus: string) => {
    const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
    try {
      const res = await fetch(`/api/customer-inquiries/${inquiryId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        loadInquiries();
        if (selectedInquiry?.id === inquiryId) {
          setSelectedInquiry({ ...selectedInquiry, status: newStatus });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper extraction utilities for robust B2B rendering
  const getCompanyName = (inquiry: Inquiry): string => {
    return (
      inquiry.company_name ||
      inquiry.customer?.company_name ||
      inquiry.customer?.name ||
      inquiry.contact_name ||
      'Commercial Construction Client'
    );
  };

  const getContactPerson = (inquiry: Inquiry): string => {
    return (
      inquiry.contact_name ||
      inquiry.customer?.contact_person ||
      inquiry.customer?.name ||
      'Authorized Representative'
    );
  };

  const getDirectPhone = (inquiry: Inquiry): string | null => {
    return inquiry.phone || inquiry.customer?.phone || inquiry.customer?.mobile_number || null;
  };

  const getDirectEmail = (inquiry: Inquiry): string | null => {
    return inquiry.email || inquiry.customer?.email || null;
  };

  const getEquipmentType = (inquiry: Inquiry): string => {
    if (inquiry.equipment_type) return inquiry.equipment_type;

    const requirements = inquiry.rental_requirements || inquiry.rentalRequirements;
    if (requirements && requirements.length > 0) {
      const first = requirements[0];
      if (first.equipment?.name) return first.equipment.name;
      if (first.crane_category) return `${first.crane_category.replace('_', ' ').toUpperCase()} CRANE`;
    }

    const text = `${inquiry.subject || ''} ${inquiry.details || ''} ${inquiry.notes || ''}`.toLowerCase();
    if (text.includes('tower crane') || text.includes('topless') || text.includes('hammerhead') || text.includes('luffing')) {
      return 'Tower Crane';
    }
    if (text.includes('mobile crane') || text.includes('all-terrain') || text.includes('all terrain') || text.includes('telescopic')) {
      return 'Mobile Crane';
    }
    if (text.includes('crawler')) {
      return 'Crawler Crane';
    }
    if (text.includes('crane')) {
      return 'Heavy Crane Unit';
    }

    if (inquiry.customer?.active_lease_summary) {
      return inquiry.customer.active_lease_summary.split(',')[0].trim();
    }

    return 'Heavy Equipment';
  };

  const getEstimatedBudget = (inquiry: Inquiry): number | null => {
    const raw = inquiry.estimated_budget ?? inquiry.customer?.estimated_budget ?? inquiry.customer?.total_contract_value;
    const num = Number(raw);
    return !isNaN(num) && num > 0 ? num : null;
  };

  const formatCurrency = (val: number): string => {
    return val.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-500/20 animate-pulse">
            <AlertTriangle className="h-2.5 w-2.5" /> Urgent
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
            High Priority
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-300 border border-blue-500/20">
            Medium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/20">
            Standard
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="h-2.5 w-2.5" /> New Lead
          </span>
        );
      case 'qualified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            Qualified
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30">
            Contacted
          </span>
        );
      case 'quoted':
      case 'proposal_sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Proposal Sent
          </span>
        );
      case 'converted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30">
            Converted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-500/15 text-slate-400 border border-slate-500/25">
            {display(status)}
          </span>
        );
    }
  };

  // Metrics
  const totalCount = inquiries.length;
  const totalPipelineValue = inquiries.reduce((acc, curr) => acc + (getEstimatedBudget(curr) || 0), 0);
  const urgentCount = inquiries.filter((i) => i.priority === 'urgent' || i.priority === 'high').length;
  const newLeadsCount = inquiries.filter((i) => i.status === 'new' || i.status === 'qualified').length;

  return (
    <>
      <Head title="CRM & Customer Inquiries - IntelliTrack" />
      <AppLayout title="CRM & Commercial Inquiries">
        <div className="space-y-6">
          {/* Group 187: Core Transaction 1 Linear Pipeline Tracker */}
          <Core1PipelineStepper currentStep={2} />

          <CrmNavTabs
            actionButton={
              <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4" />
                <span>New Inquiry</span>
              </Button>
            }
          />

          {/* Quick Metrics Scorecards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-surface-card border border-border-default flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs font-semibold text-content-secondary uppercase">Active Inquiries</p>
                <p className="text-2xl font-black text-amber-400 mt-1">{totalCount}</p>
                <span className="text-[11px] text-content-muted">Total registered leads</span>
              </div>
              <MessageSquare className="h-8 w-8 text-amber-500/40" />
            </div>

            <div className="p-4 rounded-2xl bg-surface-card border border-emerald-500/30 bg-emerald-950/10 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs font-semibold text-emerald-300 uppercase flex items-center gap-1">
                  <Banknote className="h-3.5 w-3.5 text-emerald-400" /> Pipeline Est. Value
                </p>
                <p className="text-2xl font-black text-emerald-400 mt-1">
                  ₱{totalPipelineValue > 0 ? (totalPipelineValue / 1000000).toFixed(1) + 'M' : '0.00'}
                </p>
                <span className="text-[11px] text-emerald-300/70">Estimated commercial revenue</span>
              </div>
              <Banknote className="h-8 w-8 text-emerald-500/40" />
            </div>

            <div
              onClick={() => setPriorityFilter(priorityFilter === 'urgent' ? 'all' : 'urgent')}
              className={`p-4 rounded-2xl bg-surface-card border cursor-pointer select-none transition ${
                priorityFilter === 'urgent'
                  ? 'border-rose-500 ring-2 ring-rose-500/40 bg-rose-950/25'
                  : 'border-rose-500/30 bg-rose-950/10 hover:border-rose-500/60'
              } flex items-center justify-between shadow-sm`}
            >
              <div>
                <p className="text-xs font-semibold text-rose-300 uppercase flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-400" /> Urgent & High Priority
                </p>
                <p className="text-2xl font-black text-rose-400 mt-1">{urgentCount}</p>
                <span className="text-[11px] text-rose-300/70">
                  {priorityFilter === 'urgent' ? 'Filtered by urgent (click to reset)' : 'Click to filter urgent tenders'}
                </span>
              </div>
              <AlertTriangle className="h-8 w-8 text-rose-500/40" />
            </div>

            <div className="p-4 rounded-2xl bg-surface-card border border-border-default flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs font-semibold text-content-secondary uppercase">New & Qualified Leads</p>
                <p className="text-2xl font-black text-cyan-400 mt-1">{newLeadsCount}</p>
                <span className="text-[11px] text-content-muted">Ready for sales proposal</span>
              </div>
              <CheckCircle2 className="h-8 w-8 text-cyan-500/40" />
            </div>
          </div>

          {/* Top Filter and Search Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contractor, company name, equipment, project..."
                className="w-full rounded-2xl border border-border-default/80 bg-surface-card/80 py-2.5 pl-10 pr-4 text-xs font-medium text-content-primary placeholder:text-content-muted focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-sm transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="rounded-xl border border-border-default/80 bg-surface-card px-3 py-1.5 text-xs font-semibold text-content-secondary hover:border-amber-500/40 focus:border-amber-500 focus:outline-none cursor-pointer"
                title="Filter by Priority"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>

              {/* Status Pills */}
              <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {['all', 'new', 'qualified', 'contacted', 'quoted', 'converted'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-all select-none cursor-pointer ${
                      statusFilter === status
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-sm font-bold'
                        : 'border border-border-default/80 bg-surface-card text-content-secondary hover:text-content-primary hover:border-amber-500/40'
                    }`}
                  >
                    {status === 'all' ? 'All Inquiries' : display(status)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-medium text-rose-500">
              {error}
            </div>
          )}

          {/* Inquiries Cards Grid */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {inquiries.map((inquiry) => {
              const companyName = getCompanyName(inquiry);
              const contactPerson = getContactPerson(inquiry);
              const directPhone = getDirectPhone(inquiry);
              const directEmail = getDirectEmail(inquiry);
              const equipmentType = getEquipmentType(inquiry);
              const budget = getEstimatedBudget(inquiry);
              const projectLoc = inquiry.project_location || inquiry.customer?.project_location || inquiry.customer?.city;

              return (
                <div
                  key={inquiry.id}
                  onClick={() => {
                    setSelectedInquiry(inquiry);
                    setIsModalOpen(true);
                  }}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border-default/80 bg-surface-card/90 p-5 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/10 cursor-pointer"
                >
                  <div className="space-y-3.5">
                    {/* Top Row: Ref #, Priority, Status */}
                    <div className="flex items-center justify-between gap-2 border-b border-border-subtle/80 pb-3">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-amber-500">
                        <span>{inquiry.inquiry_number}</span>
                        <span className="text-zinc-600">·</span>
                        <span className="font-sans font-normal text-content-muted text-[10px]">
                          {new Date(inquiry.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {getPriorityBadge(inquiry.priority)}
                        {getStatusBadge(inquiry.status)}
                      </div>
                    </div>

                    {/* Prominent Company Header */}
                    <div>
                      <h3 className="text-base font-black text-content-primary group-hover:text-amber-400 transition-colors leading-snug flex items-start gap-2">
                        <Building2 className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{companyName}</span>
                      </h3>

                      {/* Project Scope or Inquired Subject */}
                      <p className="text-xs font-semibold text-content-secondary line-clamp-1 mt-1 pl-6">
                        {inquiry.subject || inquiry.project_name || inquiry.customer?.active_project_name || 'Heavy Equipment Leasing Requirement'}
                      </p>
                    </div>

                    {/* Commercial Budget Badge & Heavy Equipment Micro-Tag */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      {/* Estimated Value Badge */}
                      {budget ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 text-emerald-400 border border-emerald-500/35 shadow-sm shadow-emerald-500/10">
                          <Banknote className="h-3.5 w-3.5 text-emerald-400" />
                          <span>₱{formatCurrency(budget)}</span>
                          <span className="text-[10px] font-normal uppercase text-emerald-300/70 tracking-wide">Est. Value</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-surface-elevated/60 text-content-muted border border-border-default/60">
                          <Banknote className="h-3 w-3 opacity-50" /> Budget TBD
                        </span>
                      )}

                      {/* Equipment Tag */}
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/10">
                        <Truck className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <span className="truncate max-w-[160px]">{equipmentType}</span>
                      </span>
                    </div>

                    {/* Contact & Location Micro-Tags (No empty N/A) */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                      {/* Contact Person */}
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-medium bg-surface-elevated border border-border-default text-content-primary"
                        title="Contact Person"
                      >
                        <User className="h-3 w-3 text-amber-400 shrink-0" />
                        <span className="truncate max-w-[130px]">{contactPerson}</span>
                      </span>

                      {/* Direct Phone */}
                      {directPhone ? (
                        <a
                          href={`tel:${directPhone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
                          title="Call Direct"
                        >
                          <Phone className="h-3 w-3 shrink-0" />
                          <span>{directPhone}</span>
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-content-muted bg-surface-elevated/40 border border-border-default/40">
                          <Phone className="h-3 w-3 opacity-50 shrink-0" /> Pending Phone
                        </span>
                      )}

                      {/* Direct Email */}
                      {directEmail && (
                        <a
                          href={`mailto:${directEmail}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition truncate max-w-[150px]"
                          title={directEmail}
                        >
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{directEmail}</span>
                        </a>
                      )}
                    </div>

                    {/* Project Location & Brief Specs */}
                    {projectLoc && (
                      <p className="text-[11px] text-content-secondary flex items-center gap-1 pt-0.5">
                        <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">{projectLoc}</span>
                      </p>
                    )}

                    {inquiry.details && (
                      <p className="text-xs text-content-muted line-clamp-2 pt-1 border-t border-border-subtle/50">
                        {inquiry.details}
                      </p>
                    )}
                  </div>

                  {/* Card Footer: Quick Commercial Triggers */}
                  <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs text-content-muted">
                    <span className="text-[11px]">
                      Source: <strong className="text-content-primary capitalize">{inquiry.source?.replace('_', ' ') || 'Direct'}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/quotations?customer_id=${inquiry.customer_id || ''}&description=${encodeURIComponent(companyName + ' - ' + equipmentType)}`}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 font-bold text-xs flex items-center gap-1 transition-all border border-amber-500/30 shadow-sm"
                        onClick={(e) => e.stopPropagation()}
                        title="Generate Sales Quotation"
                      >
                        <FileEdit className="h-3 w-3" /> Quote
                      </Link>

                      <span className="text-amber-500 font-semibold text-xs group-hover:underline flex items-center gap-0.5">
                        Details <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!loading && !inquiries.length && !error && (
            <div className="rounded-3xl border border-border-default/80 bg-surface-card p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-content-primary">No Customer Inquiries Found</h3>
              <p className="mt-1 text-xs text-content-secondary max-w-sm mx-auto">
                No CRM customer inquiries match the current search or status filter. Click "New Inquiry" to register a prospect.
              </p>
            </div>
          )}
        </div>

        {/* View / Manage Inquiry Modal */}
        {selectedInquiry && (
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={`Lead Review: ${getCompanyName(selectedInquiry)} (${selectedInquiry.inquiry_number})`}
            size="lg"
          >
            <div className="space-y-5 p-2">
              {/* Header Overview Card */}
              <div className="p-4 rounded-2xl bg-surface-elevated border border-border-default space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-amber-500 uppercase">{selectedInquiry.inquiry_number}</span>
                    <h3 className="text-base font-black text-content-primary flex items-center gap-2 mt-0.5">
                      <Building2 className="h-4 w-4 text-amber-500" />
                      {getCompanyName(selectedInquiry)}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {getPriorityBadge(selectedInquiry.priority)}
                    {getStatusBadge(selectedInquiry.status)}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border-subtle">
                  {getEstimatedBudget(selectedInquiry) && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/35">
                      <Banknote className="h-3.5 w-3.5" />
                      <span>₱{formatCurrency(getEstimatedBudget(selectedInquiry)!)}</span>
                      <span className="text-[10px] font-normal uppercase text-emerald-300/70">Estimated Contract</span>
                    </div>
                  )}

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    <Truck className="h-3.5 w-3.5 text-amber-400" />
                    <span>{getEquipmentType(selectedInquiry)}</span>
                  </span>
                </div>
              </div>

              {/* Contact Information & Logistics Grid */}
              <div className="grid grid-cols-2 gap-4 border-b border-border-subtle pb-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold uppercase text-content-secondary flex items-center gap-1">
                    <User className="h-3 w-3 text-amber-400" /> Contact Representative
                  </label>
                  <p className="text-sm font-bold text-content-primary mt-0.5">{getContactPerson(selectedInquiry)}</p>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-content-secondary flex items-center gap-1">
                    <Phone className="h-3 w-3 text-emerald-400" /> Direct Phone
                  </label>
                  <p className="text-sm font-semibold text-content-primary mt-0.5">
                    {getDirectPhone(selectedInquiry) ? (
                      <a href={`tel:${getDirectPhone(selectedInquiry)}`} className="text-emerald-400 hover:underline">
                        {getDirectPhone(selectedInquiry)}
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-content-secondary flex items-center gap-1">
                    <Mail className="h-3 w-3 text-blue-400" /> Email Address
                  </label>
                  <p className="text-xs text-content-primary mt-0.5">
                    {getDirectEmail(selectedInquiry) ? (
                      <a href={`mailto:${getDirectEmail(selectedInquiry)}`} className="text-blue-400 hover:underline">
                        {getDirectEmail(selectedInquiry)}
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-content-secondary flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-amber-400" /> Location / Site
                  </label>
                  <p className="text-xs text-content-primary mt-0.5">
                    {selectedInquiry.project_location || selectedInquiry.customer?.project_location || selectedInquiry.customer?.city || 'Project Site'}
                  </p>
                </div>

                {selectedInquiry.details && (
                  <div className="col-span-2 rounded-xl bg-surface-app/60 border border-border-subtle p-3">
                    <label className="text-[10px] font-bold uppercase text-amber-500 mb-1 block">Scope of Work & Notes</label>
                    <p className="text-xs text-content-primary whitespace-pre-wrap">{selectedInquiry.details}</p>
                  </div>
                )}
              </div>

              {/* Status workflow updater */}
              <div>
                <label className="text-xs font-bold text-content-primary mb-2 block">Update Workflow Stage</label>
                <div className="flex flex-wrap gap-2">
                  {['new', 'contacted', 'qualified', 'proposal_sent', 'converted', 'closed_lost'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusUpdate(selectedInquiry.id, st)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-all cursor-pointer ${
                        selectedInquiry.status === st
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'border border-border-default bg-surface-input hover:border-amber-500/40 text-content-secondary'
                      }`}
                    >
                      {display(st)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-border-subtle">
                <Link href="/crm/follow-ups" className="text-xs font-semibold text-amber-400 hover:underline flex items-center gap-1">
                  <CalendarPlus className="h-3.5 w-3.5" /> Schedule Follow-Up
                </Link>

                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Close</Button>
                  <Link
                    href={`/quotations?customer_id=${selectedInquiry.customer_id || ''}&description=${encodeURIComponent(getCompanyName(selectedInquiry) + ' - ' + getEquipmentType(selectedInquiry))}`}
                  >
                    <Button variant="primary">Create Sales Quotation</Button>
                  </Link>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* Create Inquiry Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Register New Heavy Equipment Customer Inquiry"
          size="lg"
        >
          <form onSubmit={handleCreateInquiry} className="space-y-4 p-2">
            {createError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-semibold text-rose-400">
                {createError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-amber-400 mb-1 flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" /> Company / Contractor Name *
                </label>
                <input
                  required
                  value={newInquiry.company_name}
                  onChange={(e) => setNewInquiry({ ...newInquiry, company_name: e.target.value })}
                  placeholder="e.g. Megaworld Prime Builders Corp."
                  className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-content-secondary mb-1 flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-zinc-400" /> Contact Representative *
                </label>
                <input
                  required
                  value={newInquiry.contact_name}
                  onChange={(e) => setNewInquiry({ ...newInquiry, contact_name: e.target.value })}
                  placeholder="e.g. Engr. Alvarez"
                  className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-content-secondary mb-1 flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-emerald-400" /> Phone Number
                </label>
                <input
                  value={newInquiry.phone}
                  onChange={(e) => setNewInquiry({ ...newInquiry, phone: e.target.value })}
                  placeholder="+63 917 123 4567"
                  className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-content-secondary mb-1 flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-blue-400" /> Work Email
                </label>
                <input
                  type="email"
                  value={newInquiry.email}
                  onChange={(e) => setNewInquiry({ ...newInquiry, email: e.target.value })}
                  placeholder="procurement@megaworld.com"
                  className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Equipment Type & Estimated Value */}
              <div>
                <label className="block text-xs font-bold text-amber-300 mb-1 flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5" /> Required Equipment Type *
                </label>
                <select
                  value={newInquiry.equipment_type}
                  onChange={(e) => setNewInquiry({ ...newInquiry, equipment_type: e.target.value })}
                  className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                >
                  <option value="Tower Crane">Tower Crane (Flat-Top / Topless)</option>
                  <option value="Luffing Jib Crane">Luffing Jib Tower Crane</option>
                  <option value="Hammerhead Crane">Hammerhead Tower Crane</option>
                  <option value="Mobile Crane">Mobile / All-Terrain Crane (100T - 250T)</option>
                  <option value="Crawler Crane">Crawler Heavy Lift Crane</option>
                  <option value="Boom Truck">Boom Truck & Transport</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-400 mb-1 flex items-center gap-1">
                  <Banknote className="h-3.5 w-3.5" /> Estimated Contract Budget (₱)
                </label>
                <input
                  type="number"
                  step="any"
                  value={newInquiry.estimated_budget}
                  onChange={(e) => setNewInquiry({ ...newInquiry, estimated_budget: e.target.value })}
                  placeholder="e.g. 8500000"
                  className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-content-secondary mb-1">Project Name</label>
                <input
                  value={newInquiry.project_name}
                  onChange={(e) => setNewInquiry({ ...newInquiry, project_name: e.target.value })}
                  placeholder="e.g. Uptown Tower 3 Rigging"
                  className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-content-secondary mb-1 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-amber-500" /> Project Site Location
                </label>
                <input
                  value={newInquiry.project_location}
                  onChange={(e) => setNewInquiry({ ...newInquiry, project_location: e.target.value })}
                  placeholder="e.g. BGC, Taguig City"
                  className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-content-secondary mb-1">Technical Requirements & Scope</label>
              <textarea
                rows={3}
                value={newInquiry.notes}
                onChange={(e) => setNewInquiry({ ...newInquiry, notes: e.target.value })}
                placeholder="Hook height, maximum radius, tip load, trailer access restrictions, target delivery date..."
                className="w-full rounded-xl border border-border-default bg-surface-input p-3 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
              <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={createLoading}>
                {createLoading ? 'Submitting...' : 'Register Inquiry'}
              </Button>
            </div>
          </form>
        </Modal>

      </AppLayout>
    </>
  );
};

export default CRM;