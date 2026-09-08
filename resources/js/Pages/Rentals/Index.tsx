import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import Button from '../../Components/Button';
import Modal from '../../Components/Modal';
import { 
  Plus, Eye, Trash2, Search, CalendarCheck, CheckCircle2, 
  ArrowDownLeft, ExternalLink, RefreshCw, Truck, FileText, AlertCircle 
} from 'lucide-react';
import { formatPeso } from '../../Utils/currency';
import FleetNavTabs from '../../Components/FleetNavTabs';

interface Rental {
  id: number;
  rental_number: string;
  customer_id: number;
  customer_name: string;
  equipment_id: number;
  equipment_name: string;
  equipment_code?: string;
  job_order_id?: number;
  job_order_number?: string;
  status: string;
  daily_rate: number;
  rental_days?: number;
  total_amount?: number;
  rental_start_date: string;
  rental_end_date: string;
  actual_return_date?: string;
  notes?: string;
}

export default function RentalsList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [records, setRecords] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [returnRental, setReturnRental] = useState<Rental | null>(null);

  // Dropdowns
  const [customers, setCustomers] = useState<any[]>([]);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [jobOrders, setJobOrders] = useState<any[]>([]);

  // Forms
  const [newRental, setNewRental] = useState<any>({
    customer_id: '',
    equipment_id: '',
    job_order_id: '',
    quantity: 1,
    rental_start_date: new Date().toISOString().slice(0, 10),
    rental_end_date: '',
    daily_rate: 0,
    deposit_amount: 0,
    notes: '',
  });

  const [returnForm, setReturnForm] = useState({
    actual_return_date: new Date().toISOString().slice(0, 10),
    damage_notes: '',
    additional_charges: 0,
  });

  const loadRentals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rentals?per_page=100', {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        const mapped = (json.data ?? []).map((r: any) => ({
          ...r,
          customer_name: r.customer?.company_name || r.customer?.name || '-',
          equipment_name: r.equipment?.crane_model || r.equipment?.name || '-',
          equipment_code: r.equipment?.code,
          job_order_number: r.job_order?.job_order_number || (r.job_order_id ? `JO-${r.job_order_id}` : null),
          daily_rate: Number(r.daily_rate ?? 0),
        }));
        setRecords(mapped);
      }
    } catch (err) {
      console.error('Failed to load rentals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRentals();

    fetch('/api/customers?per_page=100', { headers: { Accept: 'application/json' } })
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => setCustomers(data.data ?? []))
      .catch(() => {});

    fetch('/api/equipment?per_page=100', { headers: { Accept: 'application/json' } })
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => setEquipmentList(data.data ?? []))
      .catch(() => {});

    fetch('/api/job-orders?per_page=100', { headers: { Accept: 'application/json' } })
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => setJobOrders(data.data ?? []))
      .catch(() => {});
  }, []);

  const filtered = records
    .filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.rental_number.toLowerCase().includes(q) ||
        item.customer_name.toLowerCase().includes(q) ||
        item.equipment_name.toLowerCase().includes(q) ||
        (item.job_order_number && item.job_order_number.toLowerCase().includes(q));

      const matchesStatus = !statusFilter || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.rental_start_date).getTime() - new Date(a.rental_start_date).getTime());

  // Create Rental
  const createRental = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

    try {
      const res = await fetch('/api/rentals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrf,
        },
        body: JSON.stringify({
          ...newRental,
          customer_id: Number(newRental.customer_id),
          equipment_id: Number(newRental.equipment_id),
          job_order_id: newRental.job_order_id ? Number(newRental.job_order_id) : null,
        }),
      });

      if (res.ok) {
        setIsCreateModalOpen(false);
        setMessage({ type: 'success', text: 'New rental recorded. Equipment marked as Rented.' });
        setNewRental({
          customer_id: '',
          equipment_id: '',
          job_order_id: '',
          quantity: 1,
          rental_start_date: new Date().toISOString().slice(0, 10),
          rental_end_date: '',
          daily_rate: 0,
          deposit_amount: 0,
          notes: '',
        });
        await loadRentals();
      } else {
        setMessage({ type: 'error', text: 'Failed to create rental. Please check inputs.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error creating rental.' });
    } finally {
      setSaving(false);
    }
  };

  // Return Rental
  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnRental) return;
    setSaving(true);
    setMessage(null);
    const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

    try {
      const res = await fetch(`/api/rentals/${returnRental.id}/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrf,
        },
        body: JSON.stringify(returnForm),
      });

      if (res.ok) {
        setMessage({
          type: 'success',
          text: `Rental ${returnRental.rental_number} marked as COMPLETED. Crane is returned to Available yard inventory.`,
        });
        setReturnRental(null);
        await loadRentals();
      } else {
        setMessage({ type: 'error', text: 'Failed to process equipment return.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error processing return.' });
    } finally {
      setSaving(false);
    }
  };

  // Delete Rental
  const deleteRental = async (id: number) => {
    if (!confirm('Are you sure you want to delete this rental record?')) return;
    setSaving(true);
    const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
    try {
      const res = await fetch(`/api/rentals/${id}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-TOKEN': csrf },
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Rental record deleted.' });
        await loadRentals();
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete rental.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Head title="Active Rentals & Deployments | IntelliTrack" />
      <AppLayout dark={true} title="Fleet & Rentals">
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
          {/* Nav Tabs */}
          <FleetNavTabs
            actionButton={
              <div className="flex items-center gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadRentals}
                  disabled={loading}
                  className="border-neutral-700 text-neutral-300"
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
                  New Rental
                </Button>
              </div>
            }
          />

          {/* Flash Alert */}
          {message && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between text-sm shadow-md ${
                message.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
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

          {/* Filter & Search Bar */}
          <div className="p-4 rounded-2xl bg-surface-card border border-border-default/80 backdrop-blur-xl shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-content-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search rental #, customer, crane, Job Order..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-surface-input border border-border-default text-content-primary rounded-xl text-xs focus:outline-none focus:border-amber-500 placeholder:text-content-secondary"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-surface-input border border-border-default text-content-primary rounded-xl text-xs focus:outline-none focus:border-amber-500 font-semibold"
              >
                <option value="">All Rental Statuses</option>
                <option value="active">Active Deployments</option>
                <option value="pending">Pending Mobilization</option>
                <option value="completed">Completed / Returned</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Rentals Table */}
          <div className="rounded-2xl border border-border-default/80 bg-surface-card overflow-hidden shadow-xs backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle bg-surface-app/70 text-[11px] font-bold uppercase tracking-wider text-content-secondary">
                    <th className="py-3.5 px-4">Rental & Customer</th>
                    <th className="py-3.5 px-4">Allocated Crane Asset</th>
                    <th className="py-3.5 px-4">Connected Job Order</th>
                    <th className="py-3.5 px-4">Rental Period</th>
                    <th className="py-3.5 px-4">Status & Billing</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle text-sm">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-content-secondary">
                        <CalendarCheck className="w-8 h-8 text-content-muted mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-medium">No rentals found matching criteria.</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => {
                      const isActive = r.status === 'active';
                      const isCompleted = r.status === 'completed';

                      return (
                        <tr key={r.id} className="hover:bg-amber-500/5 dark:hover:bg-neutral-800/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-amber-700 dark:text-amber-400 text-xs">{r.rental_number}</div>
                            <div className="font-bold text-content-primary text-sm mt-0.5">{r.customer_name}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <Truck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                              <div>
                                <div className="font-semibold text-content-primary">{r.equipment_name}</div>
                                {r.equipment_code && (
                                  <span className="font-mono text-[11px] text-content-secondary">{r.equipment_code}</span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {r.job_order_number ? (
                              <button
                                onClick={() => router.visit(`/job-orders?search=${r.job_order_number}`)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-app border border-border-default hover:border-amber-500/50 text-xs font-mono font-bold text-amber-700 dark:text-amber-400 transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                {r.job_order_number}
                                <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
                              </button>
                            ) : (
                              <span className="text-xs text-content-secondary italic">Direct Rental (No JO)</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-xs text-content-primary">
                            <div className="font-medium">Start: {new Date(r.rental_start_date).toLocaleDateString()}</div>
                            <div className="text-content-secondary mt-0.5">End: {new Date(r.rental_end_date).toLocaleDateString()}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                                isActive
                                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                                  : isCompleted
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                  : 'bg-surface-app text-content-secondary border border-border-default'
                              }`}>
                                {r.status}
                              </span>
                              <span className="font-mono text-xs font-bold text-content-primary">
                                {formatPeso(r.daily_rate)}/day
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isActive && (
                                <button
                                  onClick={() => {
                                    setReturnRental(r);
                                    setReturnForm({
                                      actual_return_date: new Date().toISOString().slice(0, 10),
                                      damage_notes: '',
                                      additional_charges: 0,
                                    });
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 transition-all cursor-pointer shadow-xs"
                                  title="Check In / Return Equipment"
                                >
                                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  Return
                                </button>
                              )}

                              <button
                                onClick={() => setSelectedRental(r)}
                                className="p-1.5 rounded-lg text-content-secondary hover:text-content-primary hover:bg-surface-app transition-all cursor-pointer"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteRental(r.id)}
                                className="p-1.5 rounded-lg text-content-secondary hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                                title="Delete Rental"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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

          {/* RETURN EQUIPMENT MODAL */}
          <Modal
            isOpen={!!returnRental}
            onClose={() => !saving && setReturnRental(null)}
            title={`Check-In / Return Equipment: ${returnRental?.equipment_name || ''}`}
            size="md"
            footer={
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setReturnRental(null)} disabled={saving} className="border-neutral-700 text-neutral-300">
                  Cancel
                </Button>
                <Button type="submit" form="return-rental-form" loading={saving} className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold">
                  Confirm Return & Complete Rental
                </Button>
              </div>
            }
          >
            {returnRental && (
              <form id="return-rental-form" onSubmit={handleReturnSubmit} className="space-y-4 text-content-primary text-sm">
                <div className="p-3 rounded-xl bg-surface-app border border-border-default">
                  <div className="text-xs text-content-secondary uppercase font-semibold">Rental Reference</div>
                  <div className="font-bold text-content-primary mt-0.5">{returnRental.rental_number} — {returnRental.customer_name}</div>
                  <div className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-0.5">Asset: {returnRental.equipment_name}</div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-content-primary tracking-wider mb-1">
                    Actual Return Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={returnForm.actual_return_date}
                    onChange={(e) => setReturnForm({ ...returnForm, actual_return_date: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-input border border-border-default text-content-primary rounded-xl text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-content-primary tracking-wider mb-1">
                    Additional Charges / Fuel / Damage (₱)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={returnForm.additional_charges}
                    onChange={(e) => setReturnForm({ ...returnForm, additional_charges: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-surface-input border border-border-default text-content-primary rounded-xl text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-content-primary tracking-wider mb-1">
                    Inspection / Damage Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Crane returned in excellent operating condition. All hooks and wire ropes checked."
                    value={returnForm.damage_notes}
                    onChange={(e) => setReturnForm({ ...returnForm, damage_notes: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-input border border-border-default text-content-primary rounded-xl text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </form>
            )}
          </Modal>

          {/* CREATE RENTAL MODAL */}
          <Modal
            isOpen={isCreateModalOpen}
            onClose={() => !saving && setIsCreateModalOpen(false)}
            title="Create New Heavy Crane Rental Dispatch"
            size="xl"
            footer={
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={saving} className="border-neutral-700 text-neutral-300">
                  Cancel
                </Button>
                <Button type="submit" form="create-rental-form" loading={saving} className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold">
                  Create Rental Dispatch
                </Button>
              </div>
            }
          >
            <form id="create-rental-form" onSubmit={createRental} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-neutral-200 text-sm">
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-300 tracking-wider mb-1">Customer / Client *</label>
                <select
                  required
                  value={newRental.customer_id}
                  onChange={(e) => setNewRental({ ...newRental, customer_id: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="">Select Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.company_name || c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-300 tracking-wider mb-1">Available Equipment *</label>
                <select
                  required
                  value={newRental.equipment_id}
                  onChange={(e) => {
                    const eqId = e.target.value;
                    const selected = equipmentList.find((item) => String(item.id) === eqId);
                    setNewRental({
                      ...newRental,
                      equipment_id: eqId,
                      daily_rate: selected ? Number(selected.rental_rate) : newRental.daily_rate,
                    });
                  }}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="">Select Equipment</option>
                  {equipmentList.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.crane_model || eq.name} ({eq.status.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-300 tracking-wider mb-1">Optional Linked Job Order</label>
                <select
                  value={newRental.job_order_id}
                  onChange={(e) => setNewRental({ ...newRental, job_order_id: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="">None (Independent Rental)</option>
                  {jobOrders.map((jo) => (
                    <option key={jo.id} value={jo.id}>
                      {jo.job_order_number} ({jo.customer?.company_name || jo.customer?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-300 tracking-wider mb-1">Agreed Daily Rate (₱) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={newRental.daily_rate}
                  onChange={(e) => setNewRental({ ...newRental, daily_rate: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-300 tracking-wider mb-1">Rental Start Date *</label>
                <input
                  type="date"
                  required
                  value={newRental.rental_start_date}
                  onChange={(e) => setNewRental({ ...newRental, rental_start_date: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-300 tracking-wider mb-1">Rental End Date *</label>
                <input
                  type="date"
                  required
                  value={newRental.rental_end_date}
                  onChange={(e) => setNewRental({ ...newRental, rental_end_date: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase text-neutral-300 tracking-wider mb-1">Mobilization & Delivery Notes</label>
                <textarea
                  rows={2}
                  placeholder="Delivery address, site safety coordinator, special heavy lift rigging..."
                  value={newRental.notes}
                  onChange={(e) => setNewRental({ ...newRental, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </form>
          </Modal>

          {/* VIEW DETAILS MODAL */}
          <Modal
            isOpen={!!selectedRental}
            onClose={() => setSelectedRental(null)}
            title={`Rental Details: ${selectedRental?.rental_number || ''}`}
            size="md"
            footer={
              <div className="flex justify-end">
                <Button onClick={() => setSelectedRental(null)}>Close</Button>
              </div>
            }
          >
            {selectedRental && (
              <div className="space-y-4 text-content-primary text-sm">
                <div className="grid grid-cols-2 gap-4 p-4 bg-surface-app rounded-xl border border-border-default">
                  <div>
                    <span className="text-xs text-content-secondary">Customer:</span>
                    <p className="font-bold text-content-primary mt-0.5">{selectedRental.customer_name}</p>
                  </div>
                  <div>
                    <span className="text-xs text-content-secondary">Equipment:</span>
                    <p className="font-bold text-amber-700 dark:text-amber-400 mt-0.5">{selectedRental.equipment_name}</p>
                  </div>
                  <div>
                    <span className="text-xs text-content-secondary">Status:</span>
                    <p className="font-bold uppercase mt-0.5">{selectedRental.status}</p>
                  </div>
                  <div>
                    <span className="text-xs text-content-secondary">Daily Rate:</span>
                    <p className="font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">{formatPeso(selectedRental.daily_rate)}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-content-secondary">Dates:</span>
                    <p className="mt-0.5 font-mono text-xs font-semibold">
                       {new Date(selectedRental.rental_start_date).toLocaleDateString()} — {new Date(selectedRental.rental_end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {selectedRental.job_order_number && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-content-secondary">Linked Job Order</span>
                      <p className="font-mono font-bold text-amber-700 dark:text-amber-400">{selectedRental.job_order_number}</p>
                    </div>
                    <button
                      onClick={() => router.visit(`/job-orders?search=${selectedRental.job_order_number}`)}
                      className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      View JO <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {selectedRental.notes && (
                  <div>
                    <span className="text-xs text-content-secondary">Notes & Instructions:</span>
                    <p className="mt-1 text-xs text-content-primary p-3 bg-surface-app rounded-lg border border-border-default">
                      {selectedRental.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Modal>

        </div>
      </AppLayout>
    </>
  );
}
