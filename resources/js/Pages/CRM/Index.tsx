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
  Building,
  MapPin,
} from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';
import Button from '../../Components/Button';
import { StatusBadge } from '../../Components/Badge';
import Modal from '../../Components/Modal';
import CrmNavTabs from '../../Components/CrmNavTabs';

interface Inquiry {
  id: number;
  inquiry_number: string;
  customer_id?: number | null;
  contact_name: string;
  email: string;
  phone?: string;
  company_name?: string;
  project_name?: string;
  project_location?: string;
  status: string;
  priority: string;
  source?: string;
  notes?: string;
  created_at: string;
  customer?: { id?: number; name: string; company_name?: string };
  histories?: Array<{ id: number; action: string; notes?: string; created_at: string }>;
}

const display = (value?: string) =>
  value ? value.replace(/_/g, ' ').replace(/\b\w/g, (letter: string) => letter.toUpperCase()) : '-';

const CRM = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Inquiry State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [newInquiry, setNewInquiry] = useState({
    contact_name: '',
    email: '',
    phone: '',
    company_name: '',
    project_name: '',
    project_location: '',
    source: 'direct_call',
    subject: '',
    priority: 'medium',
    notes: '',
  });

  const loadInquiries = () => {
    setLoading(true);
    const query = new URLSearchParams({
      per_page: '50',
      ...(search ? { search } : {}),
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
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
  }, [search, statusFilter]);

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
        subject: newInquiry.subject || (newInquiry.project_name ? `Crane Requirement: ${newInquiry.project_name}` : `Inquiry from ${newInquiry.contact_name || newInquiry.company_name}`),
        details: newInquiry.notes || `Requirement at ${newInquiry.project_location || 'Site'}. Project: ${newInquiry.project_name || 'Commercial Service'}.`,
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
          contact_name: '',
          email: '',
          phone: '',
          company_name: '',
          project_name: '',
          project_location: '',
          source: 'direct_call',
          subject: '',
          priority: 'medium',
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

  return (
    <>
      <Head title="CRM & Customer Inquiries - IntelliTrack" />
      <AppLayout
        dark={true}
        title="CRM & Customer Inquiries"
      >
        <div className="space-y-6">
          <CrmNavTabs
            actionButton={
              <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4" />
                <span>New Inquiry</span>
              </Button>
            }
          />
          
          {/* Top Filter and Search Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by contact name, company, or project..."
                className="w-full rounded-2xl border border-border-default/80 bg-surface-card/80 py-2.5 pl-10 pr-4 text-xs font-medium text-content-primary placeholder:text-content-muted focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-sm transition-all"
              />
            </div>

            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {['all', 'new', 'contacted', 'qualified', 'proposal_sent', 'converted'].map((status) => (
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

          {error && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-medium text-rose-500">
              {error}
            </div>
          )}

          {/* Inquiries Cards Grid */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {inquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                onClick={() => {
                  setSelectedInquiry(inquiry);
                  setIsModalOpen(true);
                }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border-default/80 bg-surface-card/90 p-6 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/5 cursor-pointer"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-border-subtle/80 pb-4">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-amber-500">{inquiry.inquiry_number}</span>
                      <h3 className="text-sm font-bold text-content-primary group-hover:text-amber-500 transition-colors">
                        {inquiry.contact_name || 'Anonymous Client'}
                      </h3>
                      <p className="text-[11px] text-content-secondary flex items-center gap-1 mt-0.5">
                        <Building className="h-3 w-3" />
                        <span>{inquiry.company_name || inquiry.customer?.company_name || 'Individual Prospect'}</span>
                      </p>
                    </div>
                    <StatusBadge status={inquiry.status} />
                  </div>

                  {/* Project Details */}
                  <div className="mt-4 space-y-2">
                    {inquiry.project_name && (
                      <div className="rounded-xl border border-border-subtle bg-surface-app/50 p-2.5 text-xs">
                        <p className="font-semibold text-content-primary">{inquiry.project_name}</p>
                        {inquiry.project_location && (
                          <p className="text-[11px] text-content-secondary flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 text-amber-500" /> {inquiry.project_location}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-content-secondary pt-1">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-content-muted" />
                        <span className="truncate">{inquiry.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-content-muted" />
                        <span>{inquiry.phone || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="mt-5 pt-3 border-t border-border-subtle flex items-center justify-between text-[11px] text-content-muted">
                  <span className="capitalize">Priority: <strong className="text-content-primary">{inquiry.priority || 'Normal'}</strong></span>
                  <div className="flex items-center gap-2">
                    <Link
                      href={inquiry.customer_id 
                        ? `/quotations?customer_id=${inquiry.customer_id}&description=${encodeURIComponent(inquiry.project_name || inquiry.contact_name)}` 
                        : `/quotations?description=${encodeURIComponent(inquiry.project_name || inquiry.contact_name)}`}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/25 text-amber-500 font-semibold text-[10px] flex items-center gap-1 transition-all border border-amber-500/20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FileEdit className="h-3 w-3" /> Quote
                    </Link>
                    <span className="text-amber-500 font-semibold group-hover:underline flex items-center gap-1">
                      Details <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
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
            title={`Inquiry Details - ${selectedInquiry.inquiry_number}`}
            size="lg"
          >
            <div className="space-y-6 p-2">
              <div className="grid grid-cols-2 gap-4 border-b border-border-subtle pb-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-content-secondary">Contact Name</label>
                  <p className="text-sm font-bold text-content-primary">{selectedInquiry.contact_name}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-content-secondary">Company</label>
                  <p className="text-sm font-bold text-content-primary">{selectedInquiry.company_name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-content-secondary">Email</label>
                  <p className="text-xs text-content-primary">{selectedInquiry.email}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-content-secondary">Phone</label>
                  <p className="text-xs text-content-primary">{selectedInquiry.phone || 'N/A'}</p>
                </div>
                {selectedInquiry.project_name && (
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold uppercase text-content-secondary">Project & Location</label>
                    <p className="text-xs font-semibold text-content-primary">
                      {selectedInquiry.project_name} {selectedInquiry.project_location ? `· ${selectedInquiry.project_location}` : ''}
                    </p>
                  </div>
                )}
                {selectedInquiry.notes && (
                  <div className="col-span-2 rounded-xl bg-surface-app/60 border border-border-subtle p-3">
                    <label className="text-[10px] font-bold uppercase text-amber-500 mb-1 block">Specifications / Notes</label>
                    <p className="text-xs text-content-primary whitespace-pre-wrap">{selectedInquiry.notes}</p>
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
                      className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
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
              <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Close</Button>
                <Link 
                  href={selectedInquiry.customer_id 
                    ? `/quotations?customer_id=${selectedInquiry.customer_id}&description=${encodeURIComponent(selectedInquiry.project_name || selectedInquiry.contact_name)}` 
                    : `/quotations?description=${encodeURIComponent(selectedInquiry.project_name || selectedInquiry.contact_name)}`}
                >
                  <Button variant="primary">Create Sales Quotation</Button>
                </Link>
              </div>
            </div>
          </Modal>
        )}

        {/* Create Inquiry Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Register New Customer Inquiry"
          size="lg"
        >
          <form onSubmit={handleCreateInquiry} className="space-y-4 p-2">
            {createError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-semibold text-rose-400">
                {createError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-content-secondary mb-1">Contact Name *</label>
                <input
                  required
                  value={newInquiry.contact_name}
                  onChange={(e) => setNewInquiry({ ...newInquiry, contact_name: e.target.value })}
                  placeholder="e.g. Engr. Juan Dela Cruz"
                  className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-content-secondary mb-1">Company Name</label>
                <input
                  value={newInquiry.company_name}
                  onChange={(e) => setNewInquiry({ ...newInquiry, company_name: e.target.value })}
                  placeholder="e.g. Megawide Construction Corp"
                  className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-content-secondary mb-1">Work Email *</label>
                <input
                  required
                  type="email"
                  value={newInquiry.email}
                  onChange={(e) => setNewInquiry({ ...newInquiry, email: e.target.value })}
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-content-secondary mb-1">Phone Number</label>
                <input
                  value={newInquiry.phone}
                  onChange={(e) => setNewInquiry({ ...newInquiry, phone: e.target.value })}
                  placeholder="+63 917 123 4567"
                  className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-content-secondary mb-1">Inquiry Source</label>
                <select
                  value={newInquiry.source}
                  onChange={(e) => setNewInquiry({ ...newInquiry, source: e.target.value })}
                  className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                >
                  <option value="direct_call">Direct Phone Call</option>
                  <option value="email">Email Inquiry</option>
                  <option value="website">Website Portal</option>
                  <option value="referral">Client Referral</option>
                  <option value="site_visit">Site Visit / Walk-In</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-content-secondary mb-1">Priority Level</label>
                <select
                  value={newInquiry.priority}
                  onChange={(e) => setNewInquiry({ ...newInquiry, priority: e.target.value })}
                  className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                >
                  <option value="low">Low (Standard Information)</option>
                  <option value="medium">Medium (Active Tender)</option>
                  <option value="high">High (Immediate Requirement)</option>
                  <option value="urgent">Urgent (Breakdown / Quick Mobilization)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-content-secondary mb-1">Project Name</label>
                <input
                  value={newInquiry.project_name}
                  onChange={(e) => setNewInquiry({ ...newInquiry, project_name: e.target.value })}
                  placeholder="e.g. High-Rise Tower Phase 2"
                  className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-content-secondary mb-1">Project Location</label>
                <input
                  value={newInquiry.project_location}
                  onChange={(e) => setNewInquiry({ ...newInquiry, project_location: e.target.value })}
                  placeholder="e.g. BGC, Taguig City"
                  className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-content-secondary mb-1">Technical Notes / Requirements</label>
              <textarea
                rows={3}
                value={newInquiry.notes}
                onChange={(e) => setNewInquiry({ ...newInquiry, notes: e.target.value })}
                placeholder="Tower crane radius, height under hook, tip load capacity, power supply specs, target mobilization date..."
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