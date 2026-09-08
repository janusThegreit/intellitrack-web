import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import Button from '../../Components/Button';
import Modal from '../../Components/Modal';
import { 
  Plus, Edit2, Eye, Trash2, Search, Truck, CheckCircle2, 
  AlertTriangle, Wrench, MapPin, 
  ArrowUpRight, ArrowDownLeft, RefreshCw,
  ExternalLink, Check, Building2
} from 'lucide-react';
import { formatPeso } from '../../Utils/currency';
import FleetNavTabs from '../../Components/FleetNavTabs';

interface ActiveDeployment {
  job_order_id?: number;
  job_order_number?: string;
  status?: string;
  customer_id?: number;
  customer_name?: string;
  location?: string;
  scheduled_date?: string;
  due_date?: string;
}

interface ActiveRental {
  rental_id?: number;
  rental_number?: string;
  customer_id?: number;
  customer_name?: string;
  job_order_id?: number;
  job_order_number?: string;
  rental_start_date?: string;
  rental_end_date?: string;
  daily_rate?: number;
  status?: string;
}

interface Equipment {
  id: number;
  code?: string;
  name: string;
  category: string;
  crane_model?: string;
  crane_category?: string;
  serial_number: string;
  status: 'available' | 'rented' | 'maintenance' | 'retired' | string;
  purchase_price: number;
  rental_rate: number;
  rental_unit?: string;
  location: string;
  description?: string;
  specifications?: string;
  maximum_load?: number;
  maximum_load_unit?: string;
  maximum_radius?: number;
  maximum_radius_unit?: string;
  final_height?: number;
  final_height_unit?: string;
  last_maintenance?: string;
  active_job_order?: ActiveDeployment | null;
  active_rental?: ActiveRental | null;
  latest_maintenance?: any;
}

interface Telemetry {
  total_units: number;
  available_units: number;
  rented_units: number;
  maintenance_units: number;
  retired_units: number;
  total_valuation: number;
  utilization_rate: number;
}

interface EquipmentPageProps {
  defaultStatus?: string;
  view?: string;
}

export default function EquipmentIndex({ defaultStatus }: EquipmentPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(defaultStatus || 'all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [records, setRecords] = useState<Equipment[]>([]);
  const [telemetry, setTelemetry] = useState<Telemetry>({
    total_units: 0,
    available_units: 0,
    rented_units: 0,
    maintenance_units: 0,
    retired_units: 0,
    total_valuation: 0,
    utilization_rate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals state
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deployEquipment, setDeployEquipment] = useState<Equipment | null>(null);
  const [demobilizeEquipment, setDemobilizeEquipment] = useState<Equipment | null>(null);

  // Deploy Form state
  const [approvedJobOrders, setApprovedJobOrders] = useState<any[]>([]);
  const [deployForm, setDeployForm] = useState({
    job_order_id: '',
    rental_start_date: new Date().toISOString().slice(0, 10),
    rental_end_date: '',
    daily_rate: 0,
    destination_site: '',
    notes: '',
    mobilize_job_order: true,
  });

  // Demobilize Form state
  const [demobilizeForm, setDemobilizeForm] = useState({
    return_location: 'Main Staging Yard, Meycauayan',
    condition: 'ready',
    damage_notes: '',
  });

  // Create form state
  const [newEquipment, setNewEquipment] = useState<any>({
    name: '',
    category: 'Tower Crane',
    crane_model: '',
    crane_category: 'topless',
    serial_number: '',
    status: 'available',
    purchase_price: 0,
    rental_rate: 0,
    rental_unit: 'day',
    maximum_load: 0,
    maximum_load_unit: 'Tons',
    maximum_radius: 0,
    maximum_radius_unit: 'm',
    final_height: 0,
    final_height_unit: 'm',
    location: 'Main Staging Yard, Meycauayan',
    description: '',
  });

  const loadEquipment = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/equipment?per_page=100', {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        setRecords(json.data || []);
        if (json.telemetry) {
          setTelemetry(json.telemetry);
        }
      }
    } catch (err) {
      console.error('Failed to load fleet equipment', err);
    } finally {
      setLoading(false);
    }
  };

  const loadJobOrders = async () => {
    try {
      const res = await fetch('/api/job-orders?per_page=100', {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        // Allow selection of pending or approved job orders
        const orders = (json.data || []).filter((jo: any) =>
          ['pending', 'approved', 'in-progress'].includes(jo.status)
        );
        setApprovedJobOrders(orders);
      }
    } catch (err) {
      console.error('Failed to load job orders', err);
    }
  };

  useEffect(() => {
    loadEquipment();
    loadJobOrders();
  }, []);

  // Update default filter if props change
  useEffect(() => {
    if (defaultStatus) {
      setStatusFilter(defaultStatus);
    }
  }, [defaultStatus]);

  // Filtered records
  const filteredEquipment = records.filter((eq) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      eq.name.toLowerCase().includes(q) ||
      (eq.code && eq.code.toLowerCase().includes(q)) ||
      eq.serial_number.toLowerCase().includes(q) ||
      (eq.crane_model && eq.crane_model.toLowerCase().includes(q)) ||
      eq.location.toLowerCase().includes(q) ||
      (eq.active_job_order?.job_order_number &&
        eq.active_job_order.job_order_number.toLowerCase().includes(q)) ||
      (eq.active_job_order?.customer_name &&
        eq.active_job_order.customer_name.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === 'all' || eq.status === statusFilter;

    const matchesCategory =
      categoryFilter === 'all' || eq.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Handle Deploy
  const handleOpenDeploy = (eq: Equipment) => {
    setDeployEquipment(eq);
    setDeployForm({
      job_order_id: approvedJobOrders[0]?.id ? String(approvedJobOrders[0].id) : '',
      rental_start_date: new Date().toISOString().slice(0, 10),
      rental_end_date: '',
      daily_rate: Number(eq.rental_rate) || 0,
      destination_site: approvedJobOrders[0]?.location || '',
      notes: `Deployment of ${eq.crane_model || eq.name} to site.`,
      mobilize_job_order: true,
    });
  };

  const submitDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deployEquipment) return;
    setSaving(true);
    setMessage(null);

    const csrf =
      document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

    try {
      const res = await fetch(`/api/equipment/${deployEquipment.id}/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrf,
        },
        body: JSON.stringify({
          job_order_id: deployForm.job_order_id ? Number(deployForm.job_order_id) : null,
          rental_start_date: deployForm.rental_start_date,
          rental_end_date: deployForm.rental_end_date || null,
          daily_rate: Number(deployForm.daily_rate),
          destination_site: deployForm.destination_site,
          notes: deployForm.notes,
          mobilize_job_order: deployForm.mobilize_job_order,
        }),
      });

      if (res.ok) {
        setMessage({
          type: 'success',
          text: `Crane ${deployEquipment.name} successfully deployed to Job Order! Status is now RENTED on-site.`,
        });
        setDeployEquipment(null);
        await loadEquipment();
        await loadJobOrders();
      } else {
        const err = await res.json();
        setMessage({
          type: 'error',
          text: err.error || 'Failed to deploy equipment. Please review fields.',
        });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error occurred during deployment.' });
    } finally {
      setSaving(false);
    }
  };

  // Handle Demobilize
  const handleOpenDemobilize = (eq: Equipment) => {
    setDemobilizeEquipment(eq);
    setDemobilizeForm({
      return_location: 'Main Staging Yard, Meycauayan',
      condition: 'ready',
      damage_notes: '',
    });
  };

  const submitDemobilize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demobilizeEquipment) return;
    setSaving(true);
    setMessage(null);

    const csrf =
      document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

    try {
      const res = await fetch(`/api/equipment/${demobilizeEquipment.id}/demobilize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrf,
        },
        body: JSON.stringify(demobilizeForm),
      });

      if (res.ok) {
        setMessage({
          type: 'success',
          text: `Crane ${demobilizeEquipment.name} demobilized and safely returned to yard. Status is now Available.`,
        });
        setDemobilizeEquipment(null);
        await loadEquipment();
      } else {
        setMessage({ type: 'error', text: 'Failed to return equipment to yard.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error occurred during demobilization.' });
    } finally {
      setSaving(false);
    }
  };

  // Handle Return From Maintenance
  const handleCompleteMaintenance = async (eq: Equipment) => {
    if (!confirm(`Mark maintenance complete for ${eq.name}? This will return the crane to Available status.`)) return;
    setSaving(true);
    const csrf =
      document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

    try {
      const res = await fetch(`/api/equipment/${eq.id}/complete-maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrf,
        },
      });
      if (res.ok) {
        setMessage({
          type: 'success',
          text: `Inspection completed for ${eq.name}. Crane is now Available for dispatch.`,
        });
        await loadEquipment();
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to update maintenance status.' });
    } finally {
      setSaving(false);
    }
  };

  // Create Equipment
  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const csrf =
      document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

    try {
      const res = await fetch('/api/equipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrf,
        },
        body: JSON.stringify(newEquipment),
      });

      if (res.ok) {
        setIsCreateModalOpen(false);
        setMessage({ type: 'success', text: 'New heavy crane/asset registered into fleet inventory.' });
        setNewEquipment({
          name: '',
          category: 'Tower Crane',
          crane_model: '',
          crane_category: 'topless',
          serial_number: '',
          status: 'available',
          purchase_price: 0,
          rental_rate: 0,
          rental_unit: 'day',
          maximum_load: 0,
          maximum_load_unit: 'Tons',
          maximum_radius: 0,
          maximum_radius_unit: 'm',
          final_height: 0,
          final_height_unit: 'm',
          location: 'Main Staging Yard, Meycauayan',
          description: '',
        });
        await loadEquipment();
      } else {
        setMessage({ type: 'error', text: 'Failed to create asset. Please check required fields.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error submitting new asset.' });
    } finally {
      setSaving(false);
    }
  };

  // Update Equipment
  const submitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEquipment) return;
    setSaving(true);
    setMessage(null);
    const csrf =
      document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

    try {
      const res = await fetch(`/api/equipment/${editingEquipment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrf,
        },
        body: JSON.stringify({
          name: editingEquipment.name,
          category: editingEquipment.category,
          crane_model: editingEquipment.crane_model,
          crane_category: editingEquipment.crane_category,
          serial_number: editingEquipment.serial_number,
          status: editingEquipment.status,
          location: editingEquipment.location,
          purchase_price: editingEquipment.purchase_price,
          rental_rate: editingEquipment.rental_rate,
          maximum_load: editingEquipment.maximum_load,
          maximum_radius: editingEquipment.maximum_radius,
          final_height: editingEquipment.final_height,
          description: editingEquipment.description,
        }),
      });

      if (res.ok) {
        setEditingEquipment(null);
        setMessage({ type: 'success', text: 'Asset specifications updated successfully.' });
        await loadEquipment();
      } else {
        setMessage({ type: 'error', text: 'Failed to update asset specifications.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error updating asset.' });
    } finally {
      setSaving(false);
    }
  };

  // Delete Equipment
  const deleteEquipment = async (id: number) => {
    if (!confirm('Are you sure you want to retire and remove this asset from the fleet directory?')) return;
    setSaving(true);
    const csrf =
      document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
    try {
      const res = await fetch(`/api/equipment/${id}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-TOKEN': csrf },
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Asset removed from active fleet.' });
        await loadEquipment();
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete asset.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Head title="Fleet & Rental Management | IntelliTrack" />
      <AppLayout dark={true} title="Fleet & Rentals">
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
          
          {/* Top Fleet Navigation Tabs */}
          <FleetNavTabs
            actionButton={
              <div className="flex items-center gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadEquipment}
                  disabled={loading}
                  className="border-neutral-700 hover:border-amber-500/60 text-neutral-300"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
                  Refresh
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold shadow-lg shadow-amber-500/20"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Equipment
                </Button>
              </div>
            }
          />

          {/* Flash Notification */}
          {message && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between text-sm transition-all duration-300 shadow-md ${
                message.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <span className="font-medium">{message.text}</span>
              </div>
              <button
                onClick={() => setMessage(null)}
                className="text-xs opacity-70 hover:opacity-100 uppercase tracking-wider font-semibold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Live Fleet Telemetry Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* Total Fleet */}
            <div className="p-3.5 rounded-2xl bg-surface-card border border-border-default dark:bg-neutral-900/80 dark:border-neutral-800 hover:border-amber-500/30 transition-all duration-200 shadow-xs">
              <div className="flex items-center justify-between text-neutral-400 mb-1">
                <span className="text-xs font-medium uppercase tracking-wider">Total Fleet</span>
                <Truck className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white">{telemetry.total_units}</div>
              <div className="text-[11px] text-neutral-400 mt-1 truncate">
                Asset Value: {formatPeso(telemetry.total_valuation)}
              </div>
            </div>

            {/* Available For Dispatch */}
            <div className="p-3.5 rounded-2xl bg-surface-card border border-emerald-500/25 dark:bg-neutral-900/80 dark:border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-200 shadow-xs">
              <div className="flex items-center justify-between text-emerald-400 mb-1">
                <span className="text-xs font-medium uppercase tracking-wider">Ready / Yard</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-300">{telemetry.available_units}</div>
              <div className="text-[11px] text-emerald-500/80 mt-1">Available for dispatch</div>
            </div>

            {/* Active on Site / Rented */}
            <div className="p-3.5 rounded-2xl bg-surface-card border border-amber-500/25 dark:bg-neutral-900/80 dark:border-amber-500/20 hover:border-amber-500/40 transition-all duration-200 shadow-xs">
              <div className="flex items-center justify-between text-amber-400 mb-1">
                <span className="text-xs font-medium uppercase tracking-wider">On-Site / Rented</span>
                <Building2 className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-300">{telemetry.rented_units}</div>
              <div className="text-[11px] text-amber-500/80 mt-1">Mobilized on projects</div>
            </div>

            {/* Maintenance */}
            <div className="p-3.5 rounded-2xl bg-surface-card border border-rose-500/25 dark:bg-neutral-900/80 dark:border-rose-500/20 hover:border-rose-500/40 transition-all duration-200 shadow-xs">
              <div className="flex items-center justify-between text-rose-400 mb-1">
                <span className="text-xs font-medium uppercase tracking-wider">Maintenance</span>
                <Wrench className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-rose-300">{telemetry.maintenance_units}</div>
              <div className="text-[11px] text-rose-500/80 mt-1">Inspection & Repair</div>
            </div>

            {/* Fleet Utilization Rate */}
            <div className="p-3.5 rounded-2xl bg-surface-card border border-border-default dark:bg-neutral-900/80 dark:border-neutral-800 hover:border-amber-500/30 transition-all duration-200 shadow-xs col-span-2 lg:col-span-2">
              <div className="flex items-center justify-between text-neutral-400 mb-1">
                <span className="text-xs font-medium uppercase tracking-wider">Utilization Rate</span>
                <span className="text-xs font-bold text-amber-400">{telemetry.utilization_rate}%</span>
              </div>
              <div className="w-full bg-neutral-800 rounded-full h-2.5 mt-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-emerald-400 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, telemetry.utilization_rate)}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-2">
                <span>{telemetry.rented_units} deployed</span>
                <span>{telemetry.available_units} idle in yard</span>
              </div>
            </div>
          </div>

          {/* Smart View Bar & Search Filter */}
          <div className="p-4 rounded-2xl bg-surface-card border border-border-default dark:bg-neutral-900/90 dark:border-neutral-800/80 backdrop-blur-xl shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-surface-app/80 border border-border-default dark:bg-neutral-950/70 dark:border-neutral-800">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                }`}
              >
                All Assets ({records.length})
              </button>
              <button
                onClick={() => setStatusFilter('available')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'available'
                    ? 'bg-emerald-500 text-neutral-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Ready for Dispatch ({telemetry.available_units})
              </button>
              <button
                onClick={() => setStatusFilter('rented')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'rented'
                    ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                On-Site / Rented ({telemetry.rented_units})
              </button>
              <button
                onClick={() => setStatusFilter('maintenance')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'maintenance'
                    ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                In Maintenance ({telemetry.maintenance_units})
              </button>
            </div>

            {/* Search & Category Filter */}
            <div className="flex items-center gap-3">
              <div className="relative min-w-[260px]">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search crane model, JO #, client, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-surface-input border border-border-default text-content-primary rounded-xl text-xs focus:outline-none focus:border-amber-500 placeholder:text-content-secondary/60"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-surface-input border border-border-default text-content-primary rounded-xl text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Categories</option>
                <option value="Tower Crane">Tower Cranes</option>
                <option value="Mobile Crane">Mobile Cranes</option>
                <option value="Crawler Crane">Crawler Cranes</option>
                <option value="Transportation">Boom Trucks & Hauling</option>
                <option value="Heavy Equipment">Heavy Equipment</option>
              </select>
            </div>
          </div>

          {/* Fleet Inventory Table */}
          <div className="rounded-2xl border border-border-default bg-surface-card dark:border-neutral-800/80 dark:bg-neutral-900/60 overflow-hidden shadow-xs backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-default bg-surface-app/70 dark:bg-neutral-950/80 dark:border-neutral-800 text-[11px] font-bold uppercase tracking-wider text-content-secondary">
                    <th className="py-3.5 px-4">Crane / Asset Details</th>
                    <th className="py-3.5 px-4">Technical Specs</th>
                    <th className="py-3.5 px-4">Current Operational Status</th>
                    <th className="py-3.5 px-4">Job Order & Deployment Flow</th>
                    <th className="py-3.5 px-4">Daily Rate</th>
                    <th className="py-3.5 px-4 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle text-sm">
                  {filteredEquipment.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-neutral-400">
                        <Truck className="w-8 h-8 text-neutral-600 mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-medium">No equipment found matching current filter.</p>
                        <p className="text-xs text-neutral-400 mt-1">Try resetting the status filter or search query.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredEquipment.map((eq) => {
                      const isAvailable = eq.status === 'available';
                      const isRented = eq.status === 'rented';
                      const isMaintenance = eq.status === 'maintenance';

                      return (
                        <tr
                          key={eq.id}
                          className="hover:bg-surface-app/40 dark:hover:bg-neutral-800/40 transition-colors duration-150 group"
                        >
                          {/* Asset Name & Code */}
                          <td className="py-4 px-4 align-top">
                            <div className="flex items-start gap-3">
                              <div className={`p-2.5 rounded-xl mt-0.5 border shrink-0 ${
                                isAvailable
                                  ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-400'
                                  : isRented
                                  ? 'bg-amber-950/50 border-amber-500/30 text-amber-400'
                                  : 'bg-rose-950/50 border-rose-500/30 text-rose-400'
                              }`}>
                                <Truck className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="font-bold text-content-primary group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                                  {eq.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-1 text-xs text-neutral-400">
                                  <span className="font-mono bg-surface-input px-1.5 py-0.5 rounded text-content-secondary border border-border-default">
                                    {eq.code || `EQ-${eq.id}`}
                                  </span>
                                  <span>•</span>
                                  <span>{eq.category}</span>
                                  {eq.crane_model && (
                                    <>
                                      <span>•</span>
                                      <span className="text-amber-300 font-semibold">{eq.crane_model}</span>
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-neutral-400">
                                  <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                                  <span className="truncate max-w-xs">{eq.location || 'Main Yard'}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Technical Specs */}
                          <td className="py-4 px-4 align-top">
                            <div className="space-y-1 text-xs">
                              {Number(eq.maximum_load) > 0 ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-neutral-400">Max Capacity:</span>
                                  <span className="font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                    {eq.maximum_load} {eq.maximum_load_unit || 'Tons'}
                                  </span>
                                </div>
                              ) : null}

                              {Number(eq.maximum_radius) > 0 ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-neutral-400">Jib Radius:</span>
                                  <span className="font-medium text-neutral-200">
                                    {eq.maximum_radius} {eq.maximum_radius_unit || 'm'}
                                  </span>
                                </div>
                              ) : null}

                              {Number(eq.final_height) > 0 ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-neutral-400">Hook Height:</span>
                                  <span className="font-medium text-neutral-200">
                                    {eq.final_height} {eq.final_height_unit || 'm'}
                                  </span>
                                </div>
                              ) : null}

                              {eq.crane_category && (
                                <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                                  Type: {eq.crane_category}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Operational Status */}
                          <td className="py-4 px-4 align-top">
                            {isAvailable && (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                Available / Yard Ready
                              </div>
                            )}

                            {isRented && (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                Deployed On-Site
                              </div>
                            )}

                            {isMaintenance && (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                <Wrench className="w-3 h-3 text-rose-400" />
                                Maintenance / Inspection
                              </div>
                            )}

                            {eq.status === 'retired' && (
                              <span className="px-2 py-0.5 rounded text-xs bg-neutral-800 text-neutral-400 border border-neutral-700">
                                Retired
                              </span>
                            )}

                            <div className="text-[11px] text-neutral-400 mt-1.5">
                              {isAvailable && 'Ready for immediate dispatch'}
                              {isRented && 'Active on client construction site'}
                              {isMaintenance && 'Under scheduled calibration'}
                            </div>
                          </td>

                          {/* Job Order & Deployment Flow */}
                          <td className="py-4 px-4 align-top">
                            {eq.active_job_order ? (
                              <div className="p-2.5 rounded-xl bg-surface-app/80 border border-border-default dark:bg-neutral-950/70 dark:border-neutral-800 space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-mono text-xs font-bold text-amber-400">
                                    {eq.active_job_order.job_order_number}
                                  </span>
                                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                    eq.active_job_order.status === 'in-progress'
                                      ? 'bg-amber-500/20 text-amber-400'
                                      : 'bg-blue-500/20 text-blue-400'
                                  }`}>
                                    {eq.active_job_order.status}
                                  </span>
                                </div>
                                <div className="text-xs font-medium text-neutral-200 truncate">
                                  {eq.active_job_order.customer_name}
                                </div>
                                <div className="text-[11px] text-neutral-400 truncate flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                                  <span>{eq.active_job_order.location}</span>
                                </div>
                                <button
                                  onClick={() => router.visit(`/job-orders?search=${eq.active_job_order?.job_order_number}`)}
                                  className="w-full mt-1 flex items-center justify-center gap-1 py-1 rounded bg-neutral-800/80 hover:bg-neutral-800 text-[11px] font-semibold text-neutral-300 hover:text-amber-400 transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  View Job Order Dossier
                                </button>
                              </div>
                            ) : eq.active_rental ? (
                              <div className="p-2.5 rounded-xl bg-surface-app/80 border border-border-default dark:bg-neutral-950/70 dark:border-neutral-800 space-y-1 text-xs">
                                <div className="font-mono font-bold text-amber-400">
                                  {eq.active_rental.rental_number}
                                </div>
                                <div className="text-neutral-200 truncate">{eq.active_rental.customer_name}</div>
                                <div className="text-[11px] text-neutral-400">
                                  {eq.active_rental.rental_start_date ? new Date(eq.active_rental.rental_start_date).toLocaleDateString() : ''} - {eq.active_rental.rental_end_date ? new Date(eq.active_rental.rental_end_date).toLocaleDateString() : ''}
                                </div>
                              </div>
                            ) : (
                              <div className="py-2 text-xs text-neutral-400 italic">
                                No active deployment. Crane is available in yard for new Job Orders.
                              </div>
                            )}
                          </td>

                          {/* Daily Rate */}
                          <td className="py-4 px-4 align-top">
                            <div className="text-sm font-bold text-amber-400 font-mono">
                              {formatPeso(eq.rental_rate)}
                            </div>
                            <div className="text-[11px] text-neutral-400">per {eq.rental_unit || 'day'}</div>
                            {Number(eq.purchase_price) > 0 && (
                              <div className="text-[10px] text-neutral-400 mt-1">
                                Val: {formatPeso(eq.purchase_price)}
                              </div>
                            )}
                          </td>

                          {/* Quick Actions */}
                          <td className="py-4 px-4 align-top text-right">
                            <div className="flex flex-col items-end gap-1.5">
                              {isAvailable && (
                                <button
                                  onClick={() => handleOpenDeploy(eq)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md shadow-amber-500/20 transition-all"
                                  title="Deploy Crane to Job Order"
                                >
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                  Deploy / Rent Out
                                </button>
                              )}

                              {isRented && (
                                <button
                                  onClick={() => handleOpenDemobilize(eq)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-neutral-800 hover:bg-emerald-950 border border-neutral-700 hover:border-emerald-500/50 text-neutral-200 hover:text-emerald-300 transition-all"
                                  title="Return Crane to Yard"
                                >
                                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                                  Demobilize / Return
                                </button>
                              )}

                              {isMaintenance && (
                                <button
                                  onClick={() => handleCompleteMaintenance(eq)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-neutral-800 hover:bg-emerald-950 border border-neutral-700 hover:border-emerald-500/50 text-emerald-400 transition-all"
                                  title="Complete Maintenance and Return to Available"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Complete Inspection
                                </button>
                              )}

                              {/* Secondary action icons */}
                              <div className="flex items-center gap-1 mt-1">
                                <button
                                  onClick={() => setSelectedEquipment(eq)}
                                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
                                  title="View Specifications Dossier"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setEditingEquipment({ ...eq })}
                                  className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 transition-colors"
                                  title="Edit Asset Details"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteEquipment(eq.id)}
                                  className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
                                  title="Remove Asset"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* DEPLOY / RENT OUT MODAL */}
          <Modal
            isOpen={!!deployEquipment}
            onClose={() => !saving && setDeployEquipment(null)}
            title={`Deploy & Mobilize Crane: ${deployEquipment?.crane_model || deployEquipment?.name || ''}`}
            size="xl"
            footer={
              <div className="flex items-center justify-between w-full">
                <div className="text-xs text-neutral-400">
                  Daily Billing Rate: <span className="font-bold text-amber-400">{formatPeso(deployForm.daily_rate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setDeployEquipment(null)}
                    disabled={saving}
                    className="border-neutral-700 text-neutral-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    form="deploy-equipment-form"
                    loading={saving}
                    className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold"
                  >
                    <ArrowUpRight className="w-4 h-4 mr-1.5" />
                    Confirm Deployment & Dispatch
                  </Button>
                </div>
              </div>
            }
          >
            {deployEquipment && (
              <form id="deploy-equipment-form" onSubmit={submitDeploy} className="space-y-4 text-neutral-200">
                {/* Crane Specs Header Banner */}
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-neutral-400 uppercase font-semibold">Selected Heavy Equipment</div>
                    <div className="text-base font-bold text-white mt-0.5">{deployEquipment.name}</div>
                    <div className="text-xs text-neutral-400 font-mono mt-0.5">{deployEquipment.code} • {deployEquipment.location}</div>
                  </div>
                  {Number(deployEquipment.maximum_load) > 0 && (
                    <div className="text-right">
                      <div className="text-xs text-neutral-400">Capacity</div>
                      <div className="text-lg font-black text-amber-400">
                        {deployEquipment.maximum_load} {deployEquipment.maximum_load_unit || 'Tons'}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Select Target Job Order */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase text-neutral-300 tracking-wider mb-1.5">
                      Assign to Approved Job Order *
                    </label>
                    <select
                      required
                      value={deployForm.job_order_id}
                      onChange={(e) => {
                        const joId = e.target.value;
                        const selectedJO = approvedJobOrders.find((j) => String(j.id) === joId);
                        setDeployForm({
                          ...deployForm,
                          job_order_id: joId,
                          destination_site: selectedJO?.location || deployForm.destination_site,
                          rental_end_date: selectedJO?.due_date ? selectedJO.due_date.slice(0, 10) : deployForm.rental_end_date,
                        });
                      }}
                      className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- Select Active / Approved Job Order --</option>
                      {approvedJobOrders.map((jo) => (
                        <option key={jo.id} value={jo.id}>
                          {jo.job_order_number} — {jo.customer?.company_name || jo.customer?.name} ({jo.status.toUpperCase()})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Attaching this crane will register it in the Job Order's equipment bill and mark the crane status as Rented.
                    </p>
                  </div>

                  {/* Mobilization Start Date */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-300 tracking-wider mb-1.5">
                      Mobilization / Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={deployForm.rental_start_date}
                      onChange={(e) => setDeployForm({ ...deployForm, rental_start_date: e.target.value })}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Expected Demobilization Date */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-300 tracking-wider mb-1.5">
                      Expected Return / Demob Date
                    </label>
                    <input
                      type="date"
                      value={deployForm.rental_end_date}
                      onChange={(e) => setDeployForm({ ...deployForm, rental_end_date: e.target.value })}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Daily Rate Override */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-300 tracking-wider mb-1.5">
                      Agreed Daily Rate (₱)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={deployForm.daily_rate}
                      onChange={(e) => setDeployForm({ ...deployForm, daily_rate: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Destination Project Site Location */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-300 tracking-wider mb-1.5">
                      Destination Project Site
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Uptown Tower 3, BGC, Taguig City"
                      value={deployForm.destination_site}
                      onChange={(e) => setDeployForm({ ...deployForm, destination_site: e.target.value })}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Dispatch Notes */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase text-neutral-300 tracking-wider mb-1.5">
                      Dispatch & Logistics Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Include mobile escort, foundation anchors, certified crane operator and rigger crew."
                      value={deployForm.notes}
                      onChange={(e) => setDeployForm({ ...deployForm, notes: e.target.value })}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Checkbox to mobilize job order */}
                  <div className="md:col-span-2 flex items-center gap-2.5 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                    <input
                      type="checkbox"
                      id="mobilize_check"
                      checked={deployForm.mobilize_job_order}
                      onChange={(e) => setDeployForm({ ...deployForm, mobilize_job_order: e.target.checked })}
                      className="w-4 h-4 rounded border-neutral-700 text-amber-500 focus:ring-amber-500 bg-neutral-900"
                    />
                    <label htmlFor="mobilize_check" className="text-xs text-neutral-300 cursor-pointer font-medium">
                      Mark Job Order as <strong className="text-amber-400">IN-PROGRESS (Mobilized On-Site)</strong> immediately upon dispatch.
                    </label>
                  </div>
                </div>
              </form>
            )}
          </Modal>

          {/* DEMOBILIZE / RETURN CRANE MODAL */}
          <Modal
            isOpen={!!demobilizeEquipment}
            onClose={() => !saving && setDemobilizeEquipment(null)}
            title={`Demobilize Crane: ${demobilizeEquipment?.name || ''}`}
            size="lg"
            footer={
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDemobilizeEquipment(null)}
                  disabled={saving}
                  className="border-neutral-700 text-neutral-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="demobilize-equipment-form"
                  loading={saving}
                  className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold"
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  Confirm Return to Yard
                </Button>
              </div>
            }
          >
            {demobilizeEquipment && (
              <form id="demobilize-equipment-form" onSubmit={submitDemobilize} className="space-y-4 text-neutral-200">
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="text-xs text-neutral-400 uppercase font-semibold">Returning Crane Asset</div>
                  <div className="text-base font-bold text-white mt-0.5">{demobilizeEquipment.name}</div>
                  <div className="text-xs text-amber-400 mt-1">
                    Current Site: {demobilizeEquipment.location}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-300 tracking-wider mb-1.5">
                    Return Staging Yard Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={demobilizeForm.return_location}
                    onChange={(e) => setDemobilizeForm({ ...demobilizeForm, return_location: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-300 tracking-wider mb-1.5">
                    Post-Demobilization Status *
                  </label>
                  <select
                    value={demobilizeForm.condition}
                    onChange={(e) => setDemobilizeForm({ ...demobilizeForm, condition: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="ready">Ready for Immediate Dispatch (Available)</option>
                    <option value="maintenance">Requires Maintenance / Recalibration (Set to Maintenance)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-300 tracking-wider mb-1.5">
                    Post-Rental Condition & Inspection Log
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Dismantling completed safely. Boom sections inspected, no wire rope fatigue. Ready for next job."
                    value={demobilizeForm.damage_notes}
                    onChange={(e) => setDemobilizeForm({ ...demobilizeForm, damage_notes: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </form>
            )}
          </Modal>

          {/* VIEW TECHNICAL DOSSIER MODAL */}
          <Modal
            isOpen={!!selectedEquipment}
            onClose={() => setSelectedEquipment(null)}
            title={selectedEquipment?.name || 'Asset Dossier'}
            size="lg"
            footer={
              <div className="flex items-center justify-between w-full">
                <div>
                  {selectedEquipment?.status === 'available' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        const eq = selectedEquipment;
                        setSelectedEquipment(null);
                        handleOpenDeploy(eq);
                      }}
                      className="bg-amber-500 text-neutral-950 font-bold"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                      Deploy This Crane
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const eq = selectedEquipment;
                      setSelectedEquipment(null);
                      setEditingEquipment(eq);
                    }}
                    className="border-neutral-700 text-neutral-300"
                  >
                    Edit Specifications
                  </Button>
                  <Button onClick={() => setSelectedEquipment(null)}>Close</Button>
                </div>
              </div>
            }
          >
            {selectedEquipment && (
              <div className="space-y-4 text-sm text-neutral-200">
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div>
                    <div className="text-[10px] text-neutral-400 uppercase font-semibold">Max Capacity</div>
                    <div className="text-base font-black text-amber-400 mt-0.5">
                      {selectedEquipment.maximum_load || '-'} {selectedEquipment.maximum_load_unit || 'Tons'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-400 uppercase font-semibold">Jib Radius</div>
                    <div className="text-base font-bold text-white mt-0.5">
                      {selectedEquipment.maximum_radius || '-'} {selectedEquipment.maximum_radius_unit || 'm'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-400 uppercase font-semibold">Hook Height</div>
                    <div className="text-base font-bold text-white mt-0.5">
                      {selectedEquipment.final_height || '-'} {selectedEquipment.final_height_unit || 'm'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-400 uppercase font-semibold">Daily Rate</div>
                    <div className="text-base font-bold text-emerald-400 mt-0.5">
                      {formatPeso(selectedEquipment.rental_rate)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-neutral-800 pt-3">
                  <div>
                    <span className="text-xs text-neutral-400">Asset Code:</span>
                    <p className="font-mono font-semibold text-neutral-200 mt-0.5">{selectedEquipment.code || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-neutral-400">Serial Number:</span>
                    <p className="font-mono font-semibold text-neutral-200 mt-0.5">{selectedEquipment.serial_number || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-neutral-400">Category / Model:</span>
                    <p className="font-semibold text-neutral-200 mt-0.5">{selectedEquipment.category} ({selectedEquipment.crane_model || 'Standard'})</p>
                  </div>
                  <div>
                    <span className="text-xs text-neutral-400">Staging Location:</span>
                    <p className="font-semibold text-neutral-200 mt-0.5">{selectedEquipment.location || '-'}</p>
                  </div>
                </div>

                {selectedEquipment.active_job_order && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                    <div className="text-xs uppercase font-bold text-amber-400 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      Active Job Order Deployment
                    </div>
                    <div className="text-sm font-bold text-white">
                      {selectedEquipment.active_job_order.job_order_number} — {selectedEquipment.active_job_order.customer_name}
                    </div>
                    <div className="text-xs text-neutral-300">
                      Site: {selectedEquipment.active_job_order.location}
                    </div>
                  </div>
                )}

                {selectedEquipment.description && (
                  <div className="border-t border-neutral-800 pt-3">
                    <span className="text-xs text-neutral-400">Technical Overview & Description:</span>
                    <p className="mt-1 text-xs text-neutral-300 leading-relaxed bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                      {selectedEquipment.description}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Modal>

          {/* EDIT SPECIFICATIONS MODAL */}
          <Modal
            isOpen={!!editingEquipment}
            onClose={() => !saving && setEditingEquipment(null)}
            title="Edit Asset Specifications"
            size="xl"
            footer={
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingEquipment(null)} disabled={saving} className="border-neutral-700 text-neutral-300">
                  Cancel
                </Button>
                <Button type="submit" form="edit-equipment-form" loading={saving} className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold">
                  Save Changes
                </Button>
              </div>
            }
          >
            {editingEquipment && (
              <form id="edit-equipment-form" onSubmit={submitUpdate} className="grid grid-cols-1 gap-4 md:grid-cols-2 text-neutral-200">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase text-neutral-300 tracking-wider mb-1">Equipment / Crane Name *</label>
                  <input required value={editingEquipment.name} onChange={e => setEditingEquipment({ ...editingEquipment, name: e.target.value })} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-300 tracking-wider mb-1">Category</label>
                  <select value={editingEquipment.category} onChange={e => setEditingEquipment({ ...editingEquipment, category: e.target.value })} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-amber-500">
                    <option value="Tower Crane">Tower Crane</option>
                    <option value="Mobile Crane">Mobile Crane</option>
                    <option value="Crawler Crane">Crawler Crane</option>
                    <option value="Transportation">Transportation / Boom Truck</option>
                    <option value="Heavy Equipment">Heavy Equipment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-300 tracking-wider mb-1">Specific Model</label>
                  <input value={editingEquipment.crane_model || ''} onChange={e => setEditingEquipment({ ...editingEquipment, crane_model: e.target.value })} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-amber-500" placeholder="e.g. Zoomlion TC6013A-6" />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-300 tracking-wider mb-1">Max Load Capacity (Tons)</label>
                  <input type="number" step="0.1" value={editingEquipment.maximum_load || 0} onChange={e => setEditingEquipment({ ...editingEquipment, maximum_load: Number(e.target.value) })} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-300 tracking-wider mb-1">Jib Radius (Meters)</label>
                  <input type="number" step="0.1" value={editingEquipment.maximum_radius || 0} onChange={e => setEditingEquipment({ ...editingEquipment, maximum_radius: Number(e.target.value) })} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-300 tracking-wider mb-1">Daily Rental Rate (₱) *</label>
                  <input type="number" required min="0" value={editingEquipment.rental_rate} onChange={e => setEditingEquipment({ ...editingEquipment, rental_rate: Number(e.target.value) })} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-300 tracking-wider mb-1">Current Staging Location</label>
                  <input value={editingEquipment.location || ''} onChange={e => setEditingEquipment({ ...editingEquipment, location: e.target.value })} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase text-neutral-300 tracking-wider mb-1">Technical Overview / Description</label>
                  <textarea rows={2} value={editingEquipment.description || ''} onChange={e => setEditingEquipment({ ...editingEquipment, description: e.target.value })} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
                </div>
              </form>
            )}
          </Modal>

          {/* CREATE NEW ASSET MODAL */}
          <Modal
            isOpen={isCreateModalOpen}
            onClose={() => !saving && setIsCreateModalOpen(false)}
            title="Register New Heavy Equipment / Crane Asset"
            size="xl"
            footer={
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={saving} className="border-neutral-700 text-neutral-300">
                  Cancel
                </Button>
                <Button type="submit" form="create-equipment-form" loading={saving} className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold">
                  Register Asset
                </Button>
              </div>
            }
          >
            <form id="create-equipment-form" onSubmit={submitCreate} className="grid grid-cols-1 gap-4 md:grid-cols-2 text-neutral-200">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase text-neutral-300 tracking-wider mb-1">Equipment Name *</label>
                <input required placeholder="e.g. Zoomlion TC6013A-6 Flat-Top Tower Crane" value={newEquipment.name} onChange={e => setNewEquipment({ ...newEquipment, name: e.target.value })} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-300 tracking-wider mb-1">Category</label>
                <select value={newEquipment.category} onChange={e => setNewEquipment({ ...newEquipment, category: e.target.value })} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-amber-500">
                  <option value="Tower Crane">Tower Crane</option>
                  <option value="Mobile Crane">Mobile Crane</option>
                  <option value="Crawler Crane">Crawler Crane</option>
                  <option value="Transportation">Transportation / Boom Truck</option>
                  <option value="Heavy Equipment">Heavy Equipment</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-300 tracking-wider mb-1">Model Name</label>
                <input placeholder="e.g. Zoomlion TC6013A-6" value={newEquipment.crane_model} onChange={e => setNewEquipment({ ...newEquipment, crane_model: e.target.value })} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-300 tracking-wider mb-1">Max Capacity (Tons)</label>
                <input type="number" step="0.1" value={newEquipment.maximum_load} onChange={e => setNewEquipment({ ...newEquipment, maximum_load: Number(e.target.value) })} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-300 tracking-wider mb-1">Jib Radius (Meters)</label>
                <input type="number" step="0.1" value={newEquipment.maximum_radius} onChange={e => setNewEquipment({ ...newEquipment, maximum_radius: Number(e.target.value) })} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-300 tracking-wider mb-1">Daily Rental Rate (₱) *</label>
                <input type="number" required min="0" value={newEquipment.rental_rate} onChange={e => setNewEquipment({ ...newEquipment, rental_rate: Number(e.target.value) })} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-300 tracking-wider mb-1">Asset Acquisition Valuation (₱)</label>
                <input type="number" min="0" value={newEquipment.purchase_price} onChange={e => setNewEquipment({ ...newEquipment, purchase_price: Number(e.target.value) })} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase text-neutral-300 tracking-wider mb-1">Staging Yard Location</label>
                <input value={newEquipment.location} onChange={e => setNewEquipment({ ...newEquipment, location: e.target.value })} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase text-neutral-300 tracking-wider mb-1">Description & Specs</label>
                <textarea rows={2} value={newEquipment.description} onChange={e => setNewEquipment({ ...newEquipment, description: e.target.value })} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
              </div>
            </form>
          </Modal>

        </div>
      </AppLayout>
    </>
  );
}
