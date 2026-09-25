import React, { useEffect, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
  ClipboardCheck,
  RefreshCw,
  MapPin,
  Plus,
  Search,
  Filter,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Wrench,
  Truck,
  FileText,
} from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';
import { Card, CardBody } from '../../Components/Card';
import Button from '../../Components/Button';
import FleetNavTabs from '../../Components/FleetNavTabs';
import Modal from '../../Components/Modal';

interface Requirement {
  id: number;
  requirement_number: string;
  crane_category: string;
  status: string;
  customer_id?: number;
  customer_inquiry_id?: number;
  equipment_id?: number;
  site_location?: string;
  required_load?: number;
  required_load_unit?: string;
  required_height?: number;
  required_height_unit?: string;
  required_radius?: number;
  required_radius_unit?: string;
  required_from?: string;
  required_until?: string;
  inquiry?: { inquiry_number: string; subject?: string };
  customer?: { id: number; customer_code?: string; company_name: string; name: string };
  equipment?: { id: number; name: string; crane_model?: string; code?: string; maximum_load?: number };
  services?: string[];
  notes?: string;
  assessed_at?: string;
}

interface ClientOption {
  id: number;
  customer_code?: string;
  company_name?: string;
  name?: string;
}

interface EquipmentOption {
  id: number;
  name: string;
  crane_model?: string;
  code?: string;
  crane_category?: string;
  maximum_load?: number;
}

const CATEGORIES = [
  { value: 'hammerhead', label: 'Hammerhead Crane' },
  { value: 'topless', label: 'Topless / Flat Top Crane' },
  { value: 'luffing', label: 'Luffing Jib Crane' },
];

const AVAILABLE_SERVICES = [
  { key: 'erection_and_dismantle', label: 'Erection & Dismantling' },
  { key: 'operator_and_riggers', label: 'Certified Operator & Riggers' },
  { key: 'maintenance_and_repair', label: 'Preventive Maintenance & Repair' },
  { key: 'telescoping_and_climbing', label: 'Telescoping & Mast Climbing' },
  { key: 'logistic', label: 'Heavy Transport Logistics' },
];

const text = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());

const RentalRequirements: React.FC = () => {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [equipmentList, setEquipmentList] = useState<EquipmentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [assessModalOpen, setAssessModalOpen] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);

  // Form State
  const [form, setForm] = useState({
    customer_id: '',
    crane_category: 'hammerhead',
    required_load: '10',
    required_load_unit: 'Tons',
    required_height: '45',
    required_height_unit: 'Meters',
    required_radius: '50',
    required_radius_unit: 'Meters',
    site_location: '',
    required_from: '',
    required_until: '',
    services: ['erection_and_dismantle', 'operator_and_riggers'],
    notes: '',
  });

  // Assessment Form State
  const [assessForm, setAssessForm] = useState({
    equipment_id: '',
    notes: '',
  });

  const getCsrfToken = () =>
    document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqRes, cusRes, eqRes] = await Promise.all([
        fetch('/api/rental-requirements?per_page=100', { headers: { Accept: 'application/json' } }),
        fetch('/api/customers?per_page=100', { headers: { Accept: 'application/json' } }),
        fetch('/api/equipment?per_page=100', { headers: { Accept: 'application/json' } }),
      ]);

      if (reqRes.ok) {
        const data = await reqRes.json();
        setRequirements(data.data ?? []);
      }
      if (cusRes.ok) {
        const data = await cusRes.json();
        setClients(data.data ?? []);
      }
      if (eqRes.ok) {
        const data = await eqRes.json();
        setEquipmentList(data.data ?? []);
      }
      setError('');
    } catch {
      setError('Technical requirements could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Check query parameters for prefill
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const prefilledCustomer = params.get('customer_id');
      const autoOpen = params.get('create') === '1';

      if (prefilledCustomer) {
        setForm(prev => ({ ...prev, customer_id: prefilledCustomer }));
      }
      if (autoOpen) {
        setCreateModalOpen(true);
      }
    }
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/rental-requirements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify({
          customer_id: form.customer_id ? Number(form.customer_id) : null,
          crane_category: form.crane_category,
          required_load: form.required_load ? Number(form.required_load) : null,
          required_load_unit: form.required_load_unit,
          required_height: form.required_height ? Number(form.required_height) : null,
          required_height_unit: form.required_height_unit,
          required_radius: form.required_radius ? Number(form.required_radius) : null,
          required_radius_unit: form.required_radius_unit,
          site_location: form.site_location,
          required_from: form.required_from || null,
          required_until: form.required_until || null,
          services: form.services,
          notes: form.notes,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || 'Failed to save technical requirement.');
      }

      setCreateModalOpen(false);
      setForm({
        customer_id: '',
        crane_category: 'hammerhead',
        required_load: '10',
        required_load_unit: 'Tons',
        required_height: '45',
        required_height_unit: 'Meters',
        required_radius: '50',
        required_radius_unit: 'Meters',
        site_location: '',
        required_from: '',
        required_until: '',
        services: ['erection_and_dismantle', 'operator_and_riggers'],
        notes: '',
      });
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to save technical requirement.');
    } finally {
      setSaving(false);
    }
  };

  const handleAssess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequirement) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/rental-requirements/${selectedRequirement.id}/assess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify({
          equipment_id: assessForm.equipment_id ? Number(assessForm.equipment_id) : null,
          notes: assessForm.notes,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || 'Failed to assess requirement.');
      }

      setAssessModalOpen(false);
      setSelectedRequirement(null);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to complete assessment.');
    } finally {
      setSaving(false);
    }
  };

  const openAssess = (req: Requirement) => {
    setSelectedRequirement(req);
    setAssessForm({
      equipment_id: req.equipment_id ? String(req.equipment_id) : '',
      notes: req.notes || '',
    });
    setAssessModalOpen(true);
  };

  const toggleService = (key: string) => {
    setForm(prev => {
      const exists = prev.services.includes(key);
      return {
        ...prev,
        services: exists ? prev.services.filter(s => s !== key) : [...prev.services, key],
      };
    });
  };

  const filteredRequirements = useMemo(() => {
    return requirements.filter(req => {
      const q = searchQuery.toLowerCase().trim();
      const clientName = (req.customer?.company_name || req.customer?.name || '').toLowerCase();
      const code = (req.requirement_number || '').toLowerCase();
      const site = (req.site_location || '').toLowerCase();

      const matchesSearch = !q || clientName.includes(q) || code.includes(q) || site.includes(q);
      const matchesCategory = categoryFilter === 'all' || req.crane_category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || req.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [requirements, searchQuery, categoryFilter, statusFilter]);

  // Telemetry counts
  const totalCount = requirements.length;
  const assessedCount = requirements.filter(r => r.status === 'assessed' || r.status === 'equipment_selected').length;
  const quotedCount = requirements.filter(r => r.status === 'quoted' || r.status === 'job_order_requested').length;
  const pendingCount = requirements.filter(r => r.status === 'draft').length;

  return (
    <>
      <Head title="Rental Requirements & Equipment Specs | IntelliTrack" />
      <AppLayout title="Rental Management">
        <div className="space-y-4">
          <FleetNavTabs
            actionButton={
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={loadData} loading={loading}>
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
                <Button variant="primary" onClick={() => setCreateModalOpen(true)}>
                  <Plus className="h-4 w-4" />
                  + New Requirement
                </Button>
              </div>
            }
          />

          {/* TELEMETRY STRIP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-border-default/80 bg-surface-card p-5 shadow-xs transition-all hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">Total Scoped Specs</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <FileCheck2 className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-content-primary font-mono">
                {totalCount}
              </p>
              <p className="mt-1 text-xs text-content-secondary">Technical crane dossiers</p>
            </div>

            <div className="rounded-2xl border border-border-default/80 bg-surface-card p-5 shadow-xs transition-all hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">Pending Engineering</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400 font-mono">
                {pendingCount}
              </p>
              <p className="mt-1 text-xs text-content-secondary">Awaiting catalog asset match</p>
            </div>

            <div className="rounded-2xl border border-border-default/80 bg-surface-card p-5 shadow-xs transition-all hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">Asset Matched / Assessed</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
                {assessedCount}
              </p>
              <p className="mt-1 text-xs text-content-secondary">Certified for quotation</p>
            </div>

            <div className="rounded-2xl border border-border-default/80 bg-surface-card p-5 shadow-xs transition-all hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">Advanced to Quotes</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <FileText className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-purple-600 dark:text-purple-400 font-mono">
                {quotedCount}
              </p>
              <p className="mt-1 text-xs text-content-secondary">In CRM quotation pipeline</p>
            </div>
          </div>

          {/* FILTER TOOLBAR */}
          <Card>
            <CardBody>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-content-secondary" />
                    <input
                      type="text"
                      placeholder="Search by Requirement #, Client Name, Site Location..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-lg border border-border-default bg-surface-card text-sm text-content-primary placeholder:text-content-secondary focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="rounded-lg border border-border-default bg-surface-card px-3 py-2 text-sm font-semibold text-content-primary outline-none focus:border-amber-500"
                  >
                    <option value="all">All Crane Types</option>
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="rounded-lg border border-border-default bg-surface-card px-3 py-2 text-sm font-semibold text-content-primary outline-none focus:border-amber-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="assessed">Assessed</option>
                    <option value="equipment_selected">Equipment Selected</option>
                    <option value="quoted">Quoted</option>
                    <option value="job_order_requested">Job Order Requested</option>
                  </select>

                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setCategoryFilter('all');
                      setStatusFilter('all');
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-default bg-surface-card text-sm font-semibold text-content-secondary hover:text-content-primary transition-colors cursor-pointer"
                  >
                    <Filter className="h-4 w-4" />
                    Reset
                  </button>
                </div>
              </div>
            </CardBody>
          </Card>

          {error && (
            <div className="border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400 rounded-xl flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError('')} className="text-xs underline">Dismiss</button>
            </div>
          )}

          {/* REQUIREMENTS GRID */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filteredRequirements.map(requirement => {
              const client = requirement.customer;
              const clientName = client?.company_name || client?.name || 'Unassigned Client';
              const clientCode = client?.customer_code || (client ? `CUS-${String(client.id).padStart(4, '0')}` : null);
              const status = requirement.status || 'draft';

              const statusColor =
                status === 'equipment_selected' || status === 'assessed'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : status === 'quoted' || status === 'job_order_requested'
                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30';

              return (
                <Card key={requirement.id} className="transition-all hover:border-amber-500/40">
                  <CardBody>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                            {requirement.requirement_number}
                          </span>
                          {clientCode && (
                            <span className="text-[11px] font-mono text-content-secondary">
                              {clientCode}
                            </span>
                          )}
                        </div>

                        <h3 className="mt-2 font-bold text-base text-content-primary flex items-center gap-1.5">
                          <span>{text(requirement.crane_category)} Crane</span>
                        </h3>

                        {client && (
                          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                            <Building2 className="h-3.5 w-3.5 shrink-0" />
                            <span>{clientName}</span>
                          </div>
                        )}
                      </div>

                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize border ${statusColor}`}>
                        {text(status)}
                      </span>
                    </div>

                    {/* Spec Grid */}
                    <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-surface-elevated/50 border border-border-default/60 p-3 text-center">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-content-secondary block">Capacity</span>
                        <p className="mt-0.5 font-mono text-sm font-extrabold text-content-primary">
                          {requirement.required_load || '—'} {requirement.required_load_unit || 'T'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-content-secondary block">Hook Height</span>
                        <p className="mt-0.5 font-mono text-sm font-extrabold text-content-primary">
                          {requirement.required_height || '—'} {requirement.required_height_unit || 'M'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-content-secondary block">Working Radius</span>
                        <p className="mt-0.5 font-mono text-sm font-extrabold text-content-primary">
                          {requirement.required_radius || '—'} {requirement.required_radius_unit || 'M'}
                        </p>
                      </div>
                    </div>

                    {/* Asset & Location Info */}
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs border-y border-border-default/60 py-2.5">
                      <div>
                        <span className="text-content-secondary flex items-center gap-1">
                          <Truck className="h-3 w-3 text-amber-500" /> Matched Asset
                        </span>
                        <p className="mt-1 font-semibold text-content-primary truncate">
                          {requirement.equipment?.crane_model || requirement.equipment?.name || 'Pending engineering match'}
                        </p>
                      </div>
                      <div>
                        <span className="text-content-secondary flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-amber-500" /> Project Site
                        </span>
                        <p className="mt-1 font-medium text-content-primary truncate">
                          {requirement.site_location || 'Site not recorded'}
                        </p>
                      </div>
                    </div>

                    {/* Services Tags */}
                    {requirement.services && requirement.services.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {requirement.services.map(s => (
                          <span key={s} className="bg-surface-elevated border border-border-default/70 px-2 py-0.5 text-[11px] text-content-secondary rounded-md">
                            {text(s)}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Linear Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-border-default/60 flex items-center justify-between gap-2">
                      <button
                        onClick={() => openAssess(requirement)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-card hover:bg-surface-elevated text-content-primary border border-border-default text-xs font-semibold transition-all cursor-pointer shadow-xs"
                      >
                        <Wrench className="h-3.5 w-3.5 text-amber-500" />
                        <span>Assess Asset Match</span>
                      </button>

                      <button
                        onClick={() => {
                          const cusId = requirement.customer?.id || requirement.customer_id;
                          router.visit(`/quotations?action=create&customer_id=${cusId || ''}&requirement_id=${requirement.id}`);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                        title="Proceed to commercial quotation in CRM"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Convert to Quotation</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>

          {!loading && !error && filteredRequirements.length === 0 && (
            <div className="py-16 text-center text-sm text-content-secondary bg-surface-card rounded-2xl border border-border-default p-8">
              <ClipboardCheck className="mx-auto h-12 w-12 text-content-muted mb-3 opacity-40" />
              <h3 className="text-base font-bold text-content-primary">No Technical Requirements Found</h3>
              <p className="mt-1 text-xs text-content-secondary max-w-md mx-auto">
                No technical tower crane requirements match your active filters. Register a new requirement to define load, height, and radius specifications for an accredited client.
              </p>
              <Button variant="primary" onClick={() => setCreateModalOpen(true)} className="mt-4">
                <Plus className="h-4 w-4" />
                Register Technical Requirement
              </Button>
            </div>
          )}

          {/* CREATE TECHNICAL REQUIREMENT MODAL */}
          <Modal
            isOpen={createModalOpen}
            onClose={() => !saving && setCreateModalOpen(false)}
            title="Register Client Technical Requirement & Site Scoping"
            size="2xl"
            footer={
              <div className="flex justify-end gap-2 w-full">
                <Button variant="outline" onClick={() => setCreateModalOpen(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" form="create-requirement-form" loading={saving}>
                  Save Technical Specification
                </Button>
              </div>
            }
          >
            <form id="create-requirement-form" onSubmit={handleCreate} className="space-y-4">
              {/* Client Selection */}
              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Accredited Client <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={form.customer_id}
                  onChange={e => setForm({ ...form, customer_id: e.target.value })}
                  className="w-full rounded-md border border-border-default bg-surface-input p-2.5 text-sm text-content-primary focus:border-amber-500 outline-none"
                >
                  <option value="">-- Select Client Account --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.customer_code ? `[${c.customer_code}] ` : ''}{c.company_name || c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Crane Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-content-primary mb-1">
                    Crane Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={form.crane_category}
                    onChange={e => setForm({ ...form, crane_category: e.target.value })}
                    className="w-full rounded-md border border-border-default bg-surface-input p-2.5 text-sm text-content-primary focus:border-amber-500 outline-none"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-content-primary mb-1">
                    Project Site Location <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    placeholder="e.g. BGC Lot 12, Taguig City"
                    value={form.site_location}
                    onChange={e => setForm({ ...form, site_location: e.target.value })}
                    className="w-full rounded-md border border-border-default bg-surface-input p-2.5 text-sm text-content-primary focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Technical Lift Parameters */}
              <div className="grid grid-cols-3 gap-3 rounded-xl bg-surface-elevated/40 border border-border-default p-3">
                <div>
                  <label className="block text-xs font-semibold text-content-primary mb-1">
                    Required Load (Tons)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    placeholder="e.g. 10"
                    value={form.required_load}
                    onChange={e => setForm({ ...form, required_load: e.target.value })}
                    className="w-full rounded-md border border-border-default bg-surface-input p-2 text-sm text-content-primary font-mono focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-content-primary mb-1">
                    Hook Height (Meters)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="10"
                    placeholder="e.g. 45"
                    value={form.required_height}
                    onChange={e => setForm({ ...form, required_height: e.target.value })}
                    className="w-full rounded-md border border-border-default bg-surface-input p-2 text-sm text-content-primary font-mono focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-content-primary mb-1">
                    Working Radius (Meters)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="10"
                    placeholder="e.g. 50"
                    value={form.required_radius}
                    onChange={e => setForm({ ...form, required_radius: e.target.value })}
                    className="w-full rounded-md border border-border-default bg-surface-input p-2 text-sm text-content-primary font-mono focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-content-primary mb-1">
                    Required Mobilization Date
                  </label>
                  <input
                    type="date"
                    value={form.required_from}
                    onChange={e => setForm({ ...form, required_from: e.target.value })}
                    className="w-full rounded-md border border-border-default bg-surface-input p-2.5 text-sm text-content-primary focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-content-primary mb-1">
                    Target Demobilization Date
                  </label>
                  <input
                    type="date"
                    value={form.required_until}
                    onChange={e => setForm({ ...form, required_until: e.target.value })}
                    className="w-full rounded-md border border-border-default bg-surface-input p-2.5 text-sm text-content-primary focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Special Services */}
              <div>
                <label className="block text-xs font-semibold text-content-primary mb-2">
                  Ancillary Operational Services Needed
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {AVAILABLE_SERVICES.map(s => {
                    const checked = form.services.includes(s.key);
                    return (
                      <label
                        key={s.key}
                        onClick={() => toggleService(s.key)}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                          checked
                            ? 'border-amber-500/40 bg-amber-500/10 text-amber-400 font-semibold'
                            : 'border-border-default bg-surface-input text-content-secondary'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}}
                          className="h-3.5 w-3.5 rounded text-amber-500"
                        />
                        <span>{s.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Engineering Notes */}
              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Site Geotechnical & Rigging Engineering Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Soil bearing capacity, tie-in collar levels, anchor bolt specifications, or crane clearance limits..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full rounded-md border border-border-default bg-surface-input p-2.5 text-sm text-content-primary focus:border-amber-500 outline-none"
                />
              </div>
            </form>
          </Modal>

          {/* ASSESSMENT / ASSET MATCH MODAL */}
          <Modal
            isOpen={assessModalOpen}
            onClose={() => !saving && setAssessModalOpen(false)}
            title="Engineering Assessment & Fleet Asset Matching"
            size="lg"
            footer={
              <div className="flex justify-end gap-2 w-full">
                <Button variant="outline" onClick={() => setAssessModalOpen(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" form="assess-requirement-form" loading={saving}>
                  Complete Assessment
                </Button>
              </div>
            }
          >
            {selectedRequirement && (
              <form id="assess-requirement-form" onSubmit={handleAssess} className="space-y-4">
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span className="text-amber-400">{selectedRequirement.requirement_number}</span>
                    <span className="text-content-primary capitalize">{selectedRequirement.crane_category} Crane</span>
                  </div>
                  <p className="text-content-secondary">
                    Specs: {selectedRequirement.required_load || 0} Tons load · {selectedRequirement.required_height || 0}m height · {selectedRequirement.required_radius || 0}m radius
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-content-primary mb-1">
                    Select Compatible Fleet Crane Asset
                  </label>
                  <select
                    value={assessForm.equipment_id}
                    onChange={e => setAssessForm({ ...assessForm, equipment_id: e.target.value })}
                    className="w-full rounded-md border border-border-default bg-surface-input p-2.5 text-sm text-content-primary focus:border-amber-500 outline-none"
                  >
                    <option value="">-- Leave Pending Assessment --</option>
                    {equipmentList
                      .filter(eq => !eq.crane_category || eq.crane_category === selectedRequirement.crane_category)
                      .map(eq => (
                        <option key={eq.id} value={eq.id}>
                          {eq.code ? `[${eq.code}] ` : ''}{eq.crane_model || eq.name} ({eq.maximum_load || '—'} Tons)
                        </option>
                      ))}
                  </select>
                  <p className="mt-1 text-[11px] text-content-secondary">
                    Assets are filtered to match the {selectedRequirement.crane_category} crane category.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-content-primary mb-1">
                    Technical Assessment & Site Clearance Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Detail foundation inspection, wind speed limit certifications, boom clearance, or power supply confirmations..."
                    value={assessForm.notes}
                    onChange={e => setAssessForm({ ...assessForm, notes: e.target.value })}
                    className="w-full rounded-md border border-border-default bg-surface-input p-2.5 text-sm text-content-primary focus:border-amber-500 outline-none"
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

export default RentalRequirements;