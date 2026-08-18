import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { Card, CardHeader, CardBody } from '../../Components/Card';
import Table, { TableColumn } from '../../Components/Table';
import Button from '../../Components/Button';
import { Input } from '../../Components/Form';
import { StatusBadge } from '../../Components/Badge';
import Modal from '../../Components/Modal';
import { Plus, Edit2, Trash2, Search, Filter, Eye, Building2, MapPin, Archive, ArchiveRestore } from 'lucide-react';
import { formatPeso } from '../../Utils/currency';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  company_name?: string;
  contact_person?: string;
  address?: string;
  city?: string;
  province?: string;
  project_location?: string;
  technical_requirements?: string;
  site_condition?: string;
  estimated_budget?: number;
  customer_type?: string;
  notes?: string;
  status: string;
  total_spending: number;
  total_job_orders: number;
  last_order_date?: string;
}

interface CustomersListProps {
  customers?: Array<Customer>;
  pagination?: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

const emptyCustomer = {
  name: '', email: '', phone: '', company_name: '', contact_person: '', address: '', project_location: '', technical_requirements: '', site_condition: '', estimated_budget: '', city: '', province: '', postal_code: '', customer_type: 'business', status: 'active', notes: '',
};

const CustomersList = ({ customers = [] }: CustomersListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [records, setRecords] = useState<Customer[]>(customers);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>(records);
  const [loadError, setLoadError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyCustomer);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [sortBy, setSortBy] = useState<keyof Customer>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    let result = [...records];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (customer) =>
          customer.name.toLowerCase().includes(query) ||
          customer.email.toLowerCase().includes(query) ||
          customer.phone.includes(query) ||
          customer.company_name?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter) {
      result = result.filter((customer) => customer.status === statusFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (typeof aVal === 'string') {
        aVal = (aVal as string).toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredCustomers(result);
  }, [searchQuery, statusFilter, sortBy, sortOrder, records]);

  const loadCustomers = () => {
    fetch(`/api/customers?per_page=100${showArchived ? '&archived=1' : ''}`, { headers: { Accept: 'application/json' } })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(data => { setRecords(data.data ?? []); setLoadError(''); })
      .catch(() => setLoadError('Client records could not be loaded.'));
  };

  useEffect(() => { loadCustomers(); }, [showArchived]);

  const createCustomer = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error();
      setCreateOpen(false);
      setForm(emptyCustomer);
      loadCustomers();
    } catch {
      setLoadError('Client could not be saved. Check the required fields and try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateCustomer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingCustomer) return;
    setSaving(true);
    const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

    try {
      const response = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error();
      setEditingCustomer(null);
      setForm(emptyCustomer);
      loadCustomers();
    } catch {
      setLoadError('Client could not be updated. Check the client details and try again.');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setForm({
      name: customer.name, email: customer.email, phone: customer.phone || '', company_name: customer.company_name || '', contact_person: customer.contact_person || '', address: customer.address || '', project_location: customer.project_location || '', technical_requirements: customer.technical_requirements || '', site_condition: customer.site_condition || '', estimated_budget: String(customer.estimated_budget ?? ''), city: customer.city || '', province: customer.province || '', postal_code: '', customer_type: customer.customer_type || 'business', status: customer.status, notes: customer.notes || '',
    });
  };

  const deleteCustomer = async (customer: Customer) => {
    if (!window.confirm(`Remove ${customer.company_name || customer.name} from Client Management?`)) return;
    const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
    const response = await fetch(`/api/customers/${customer.id}`, { method: 'DELETE', headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken } });
    if (response.ok) {
      setSelectedCustomer(null);
      loadCustomers();
    } else {
      setLoadError('Client could not be removed.');
    }
  };

  const archiveCustomer = async (customer: Customer) => {
    if (!window.confirm(`Archive ${customer.company_name || customer.name}? It can be restored later.`)) return;
    const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
    const response = await fetch(`/api/customers/${customer.id}/archive`, { method: 'POST', headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken } });
    if (response.ok) {
      setSelectedCustomer(null);
      loadCustomers();
    } else {
      setLoadError('Client could not be archived.');
    }
  };

  const restoreCustomer = async (customer: Customer) => {
    const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
    const response = await fetch(`/api/customers/${customer.id}/restore`, { method: 'POST', headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken } });
    if (response.ok) {
      setSelectedCustomer(null);
      loadCustomers();
    } else {
      setLoadError('Client could not be restored.');
    }
  };

  const columns: TableColumn<Customer>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      width: '20%',
      render: (value, row) => (
        <div>
          <p className="font-medium text-neutral-900 dark:text-white">{value}</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'company_name',
      label: 'Company',
      sortable: true,
      width: '20%',
    },
    {
      key: 'phone',
      label: 'Phone',
      width: '15%',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (status) => <StatusBadge status={status} />,
    },
    {
      key: 'total_spending',
      label: 'Total Spending',
      sortable: true,
      render: (amount) => (
        <span className="font-semibold text-success-600">
          {formatPeso(amount)}
        </span>
      ),
    },
    {
      key: 'total_job_orders',
      label: 'Jobs',
      sortable: true,
      render: (count) => (
        <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded text-sm font-medium">
          {count}
        </span>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (id, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(event) => { event.stopPropagation(); setSelectedCustomer(row); }}
            className="p-1.5 text-primary-600 transition-colors hover:bg-primary-50 dark:text-[#8cb9ff] dark:hover:bg-white/10"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(event) => { event.stopPropagation(); openEdit(row); }}
            className="p-1.5 text-[#9b7800] transition-colors hover:bg-warning-50 dark:text-[#ffd95a] dark:hover:bg-white/10"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(event) => { event.stopPropagation(); showArchived ? void restoreCustomer(row) : void archiveCustomer(row); }}
            className="p-1.5 text-error-600 transition-colors hover:bg-error-50 dark:text-red-300 dark:hover:bg-white/10"
            title={showArchived ? 'Restore client' : 'Archive client'}
          >
            {showArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
          </button>
          <button
            onClick={(event) => { event.stopPropagation(); void deleteCustomer(row); }}
            className="p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-white/10"
            title="Permanently remove"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Head title="Customers" />
      <AppLayout
        title="Customers"
        headerAction={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Customer
          </Button>
        }
      >
        <div className="space-y-4">
          {loadError && <p className="border border-error-200 bg-error-50 p-3 text-sm text-error-700">{loadError}</p>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card><CardBody><p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Total clients</p><p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">{records.length}</p></CardBody></Card>
            <Card><CardBody><p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Active clients</p><p className="mt-1 text-2xl font-bold text-success-600 dark:text-[#8be2af]">{records.filter(customer => customer.status === 'active').length}</p></CardBody></Card>
            <Card><CardBody><p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Client portfolio</p><p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">{formatPeso(records.reduce((total, customer) => total + Number(customer.total_spending ?? 0), 0))}</p></CardBody></Card>
          </div>
          {/* Filters */}
          <Card>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Search by name, email, phone..."
                  startIcon={<Search className="w-4 h-4" />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
                <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300"><input type="checkbox" checked={showArchived} onChange={event => setShowArchived(event.target.checked)} className="h-4 w-4" />Show archived</label>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-neutral-500" />
                  <span className="text-sm text-neutral-600 dark:text-neutral-300">
                    {filteredCustomers.length} {showArchived ? 'archived' : 'active'} clients
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Table */}
          <Card noPadding>
            <Table
              columns={columns}
              data={filteredCustomers}
              emptyMessage={showArchived ? 'No archived clients.' : 'No client records yet. Add a client to begin CRM, quotation, and project workflows.'}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={(column, order) => {
                setSortBy(column);
                setSortOrder(order);
              }}
              onRowClick={(customer) => {
                setSelectedCustomer(customer);
              }}
            />
          </Card>

          <Modal isOpen={createOpen} onClose={() => !saving && setCreateOpen(false)} title="Add Client" size="xl" footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>Cancel</Button><Button type="submit" form="create-customer-form" loading={saving}>Save Client</Button></div>}>
            <form id="create-customer-form" onSubmit={createCustomer} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Client name<input required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 text-sm" /></label>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Email<input required type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 text-sm" /></label>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Company name<input value={form.company_name} onChange={event => setForm({ ...form, company_name: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 text-sm" /></label>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Contact person<input value={form.contact_person} onChange={event => setForm({ ...form, contact_person: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 text-sm" /></label>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Mobile number<input value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} placeholder="09XXXXXXXXX" className="mt-1 w-full border border-neutral-300 p-2.5 text-sm" /></label>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Client type<select value={form.customer_type} onChange={event => setForm({ ...form, customer_type: event.target.value })} className="mt-1 w-full border border-neutral-300 bg-white p-2.5 text-sm"><option value="business">Business</option><option value="corporate">Corporate</option><option value="individual">Individual</option></select></label>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">City<input value={form.city} onChange={event => setForm({ ...form, city: event.target.value })} placeholder="e.g. Quezon City" className="mt-1 w-full border border-neutral-300 p-2.5 text-sm" /></label>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Province<input value={form.province} onChange={event => setForm({ ...form, province: event.target.value })} placeholder="e.g. Metro Manila" className="mt-1 w-full border border-neutral-300 p-2.5 text-sm" /></label>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200 md:col-span-2">Address<input value={form.address} onChange={event => setForm({ ...form, address: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 text-sm" /></label>
              <div className="md:col-span-2 border-t border-neutral-200 pt-4 dark:border-white/10"><p className="text-sm font-semibold text-neutral-900 dark:text-white">Project Requirement Profile</p><p className="mt-1 text-xs text-neutral-500">Sales-side information used for quotations, Job Orders, rental requests, and projects.</p></div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Project location<input value={form.project_location} onChange={event => setForm({ ...form, project_location: event.target.value })} placeholder="e.g. Bonifacio Global City, Taguig" className="mt-1 w-full border border-neutral-300 p-2.5 text-sm" /></label>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Estimated budget (PHP)<input type="number" min="0" value={form.estimated_budget} onChange={event => setForm({ ...form, estimated_budget: event.target.value })} placeholder="0.00" className="mt-1 w-full border border-neutral-300 p-2.5 text-sm" /></label>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200 md:col-span-2">Technical requirements<textarea value={form.technical_requirements} onChange={event => setForm({ ...form, technical_requirements: event.target.value })} placeholder="Equipment, capacity, service, or site access requirements" className="mt-1 w-full border border-neutral-300 p-2.5 text-sm" rows={3} /></label>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200 md:col-span-2">Site condition<textarea value={form.site_condition} onChange={event => setForm({ ...form, site_condition: event.target.value })} placeholder="Site constraints, access, ground condition, or coordination notes" className="mt-1 w-full border border-neutral-300 p-2.5 text-sm" rows={3} /></label>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200 md:col-span-2">Notes<textarea value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 text-sm" rows={3} /></label>
            </form>
          </Modal>

          <Modal isOpen={!!selectedCustomer} onClose={() => setSelectedCustomer(null)} title={selectedCustomer?.company_name || selectedCustomer?.name || 'Client details'} size="lg" footer={<div className="flex justify-end gap-2">{showArchived ? <Button variant="outline" onClick={() => selectedCustomer && void restoreCustomer(selectedCustomer)}>Restore client</Button> : <><Button variant="outline" onClick={() => selectedCustomer && openEdit(selectedCustomer)}>Edit client</Button><Button variant="outline" onClick={() => selectedCustomer && void archiveCustomer(selectedCustomer)}>Archive client</Button></>}<Button onClick={() => setSelectedCustomer(null)}>Close</Button></div>}>
            {selectedCustomer && <div className="space-y-5 text-sm"><div className="flex items-start gap-3"><div className="flex h-11 w-11 items-center justify-center bg-primary-50 text-primary-700 dark:bg-[#203354] dark:text-[#8cb9ff]"><Building2 className="h-5 w-5" /></div><div><p className="font-semibold text-neutral-900 dark:text-white">{selectedCustomer.name}</p><p className="text-neutral-500 dark:text-neutral-400">{selectedCustomer.contact_person || 'No contact person recorded'} · {selectedCustomer.email}</p></div></div><div className="grid grid-cols-1 gap-4 border-y border-neutral-200 py-4 dark:border-white/10 sm:grid-cols-2"><div><p className="text-xs text-neutral-500">Phone</p><p className="mt-1 font-medium">{selectedCustomer.phone || '-'}</p></div><div><p className="text-xs text-neutral-500">Client status</p><p className="mt-1"><StatusBadge status={selectedCustomer.status} /></p></div><div><p className="text-xs text-neutral-500">Total spending</p><p className="mt-1 font-semibold">{formatPeso(selectedCustomer.total_spending)}</p></div><div><p className="text-xs text-neutral-500">Job orders</p><p className="mt-1 font-semibold">{selectedCustomer.total_job_orders}</p></div></div><div className="flex gap-2 text-neutral-600 dark:text-neutral-300"><MapPin className="h-4 w-4 shrink-0" />{[selectedCustomer.address, selectedCustomer.city, selectedCustomer.province].filter(Boolean).join(', ') || 'No address recorded'}</div>{selectedCustomer.notes && <div><p className="text-xs text-neutral-500">Notes</p><p className="mt-1 text-neutral-700 dark:text-neutral-200">{selectedCustomer.notes}</p></div>}</div>}
          </Modal>

          <Modal isOpen={!!editingCustomer} onClose={() => !saving && setEditingCustomer(null)} title="Edit Client" size="xl" footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEditingCustomer(null)} disabled={saving}>Cancel</Button><Button type="submit" form="edit-customer-form" loading={saving} className="min-w-32">Save changes</Button></div>}>
            <form id="edit-customer-form" onSubmit={updateCustomer} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Client name<input required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 text-sm" /></label>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Email<input required type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 text-sm" /></label>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Company name<input value={form.company_name} onChange={event => setForm({ ...form, company_name: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 text-sm" /></label>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Contact person<input value={form.contact_person} onChange={event => setForm({ ...form, contact_person: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 text-sm" /></label>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Mobile number<input value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 text-sm" /></label>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Client type<select value={form.customer_type} onChange={event => setForm({ ...form, customer_type: event.target.value })} className="mt-1 w-full border border-neutral-300 bg-white p-2.5 text-sm"><option value="business">Business</option><option value="corporate">Corporate</option><option value="individual">Individual</option></select></label>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">City<input value={form.city} onChange={event => setForm({ ...form, city: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 text-sm" /></label>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Province<input value={form.province} onChange={event => setForm({ ...form, province: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 text-sm" /></label>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200 md:col-span-2">Address<input value={form.address} onChange={event => setForm({ ...form, address: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 text-sm" /></label>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Client status<select value={form.status} onChange={event => setForm({ ...form, status: event.target.value })} className="mt-1 w-full border border-neutral-300 bg-white p-2.5 text-sm"><option value="active">Active</option><option value="inactive">Inactive</option><option value="blacklisted">Blacklisted</option></select></label>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Estimated budget (PHP)<input type="number" min="0" value={form.estimated_budget} onChange={event => setForm({ ...form, estimated_budget: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 text-sm" /></label>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200 md:col-span-2">Project location<input value={form.project_location} onChange={event => setForm({ ...form, project_location: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 text-sm" /></label>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200 md:col-span-2">Technical requirements<textarea value={form.technical_requirements} onChange={event => setForm({ ...form, technical_requirements: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 text-sm" rows={3} /></label>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200 md:col-span-2">Site condition<textarea value={form.site_condition} onChange={event => setForm({ ...form, site_condition: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 text-sm" rows={3} /></label>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200 md:col-span-2">Notes<textarea value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 text-sm" rows={3} /></label>
            </form>
          </Modal>
        </div>
      </AppLayout>
    </>
  );
};

export default CustomersList;
