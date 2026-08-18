import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { Card, CardHeader, CardBody } from '../../Components/Card';
import Table, { TableColumn } from '../../Components/Table';
import Button from '../../Components/Button';
import { Input } from '../../Components/Form';
import { StatusBadge } from '../../Components/Badge';
import Modal from '../../Components/Modal';
import { Plus, Edit2, Eye, Trash2, Search } from 'lucide-react';
import { formatPeso } from '../../Utils/currency';

interface JobOrder {
  id: number;
  job_number: string;
  customer_name: string;
  description: string;
  status: string;
  total_amount: number;
  start_date: string;
  end_date?: string;
  due_date?: string;
  priority?: string;
  location?: string;
  notes?: string;
}

interface JobOrderListProps {
  jobOrders?: Array<JobOrder>;
}

const JobOrdersList = ({ jobOrders = [] }: JobOrderListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [records, setRecords] = useState<JobOrder[]>(jobOrders);
  const [filtered, setFiltered] = useState<JobOrder[]>(records);
  const [sortBy, setSortBy] = useState<keyof JobOrder>('job_number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [customers, setCustomers] = useState<Array<{ id: number; name: string; company_name?: string }>>([]);
  const [selectedJob, setSelectedJob] = useState<JobOrder | null>(null);
  const [editingJob, setEditingJob] = useState<JobOrder | null>(null);
  const [creatingJob, setCreatingJob] = useState(false);
  const [newJob, setNewJob] = useState({ customer_id: '', description: '', priority: 'medium', scheduled_date: '', due_date: '', estimated_cost: '', location: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let result = [...records];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.job_number.toLowerCase().includes(query) ||
          item.customer_name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      );
    }

    if (statusFilter) {
      result = result.filter((item) => item.status === statusFilter);
    }

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

    setFiltered(result);
  }, [searchQuery, statusFilter, sortBy, sortOrder, records]);

  useEffect(() => {
    fetch('/api/job-orders?per_page=100', { headers: { Accept: 'application/json' } })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(data => setRecords((data.data ?? []).map((job: any) => ({ id: job.id, job_number: job.job_order_number, customer_name: job.customer?.company_name || job.customer?.name || '-', description: job.description, status: job.status, total_amount: Number(job.total_amount ?? job.estimated_cost ?? 0), start_date: job.start_date || job.scheduled_date, end_date: job.completion_date || job.due_date }))))
      .catch(() => setRecords([]));
  }, []);

  useEffect(() => {
    fetch('/api/customers?per_page=100', { headers: { Accept: 'application/json' } })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(data => setCustomers(data.data ?? []))
      .catch(() => setCustomers([]));
  }, []);

  const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
  const reload = () => fetch('/api/job-orders?per_page=100', { headers: { Accept: 'application/json' } }).then(response => response.ok ? response.json() : Promise.reject()).then(data => setRecords((data.data ?? []).map((job: any) => ({ id: job.id, job_number: job.job_order_number, customer_name: job.customer?.company_name || job.customer?.name || '-', description: job.description, status: job.status, total_amount: Number(job.total_amount ?? job.estimated_cost ?? 0), start_date: job.start_date || job.scheduled_date, end_date: job.completion_date || job.due_date, due_date: job.due_date, priority: job.priority, location: job.location, notes: job.notes }))));

  const createJob = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    const response = await fetch('/api/job-orders', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrf }, body: JSON.stringify({ ...newJob, customer_id: Number(newJob.customer_id), estimated_cost: Number(newJob.estimated_cost || 0), status: 'pending' }) });
    if (response.ok) { setCreatingJob(false); setNewJob({ customer_id: '', description: '', priority: 'medium', scheduled_date: '', due_date: '', estimated_cost: '', location: '', notes: '' }); await reload(); setMessage('Job Order created.'); } else setMessage('Job Order could not be created.');
    setSaving(false);
  };

  const updateJob = async (event: React.FormEvent) => {
    event.preventDefault(); if (!editingJob) return; setSaving(true);
    const response = await fetch(`/api/job-orders/${editingJob.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrf }, body: JSON.stringify({ description: editingJob.description, status: editingJob.status, priority: editingJob.priority, scheduled_date: editingJob.start_date || null, due_date: editingJob.due_date || null, estimated_cost: editingJob.total_amount, location: editingJob.location, notes: editingJob.notes }) });
    if (response.ok) { setEditingJob(null); await reload(); setMessage('Job Order updated.'); } else setMessage('Job Order could not be updated.');
    setSaving(false);
  };

  const deleteJob = async (job: JobOrder) => {
    if (!window.confirm(`Remove ${job.job_number}?`)) return;
    const response = await fetch(`/api/job-orders/${job.id}`, { method: 'DELETE', headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrf } });
    if (response.ok) { setSelectedJob(null); await reload(); setMessage('Job Order removed.'); } else setMessage('Job Order could not be removed.');
  };

  const columns: TableColumn<JobOrder>[] = [
    {
      key: 'job_number',
      label: 'Job #',
      sortable: true,
      width: '12%',
      render: (value) => <span className="font-semibold text-primary-600 dark:text-[#8cb9ff]">{value}</span>,
    },
    {
      key: 'customer_name',
      label: 'Customer',
      sortable: true,
      width: '20%',
    },
    {
      key: 'description',
      label: 'Description',
      width: '25%',
      render: (value) => <p className="truncate text-neutral-700 dark:text-neutral-300">{value}</p>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (status) => <StatusBadge status={status} />,
    },
    {
      key: 'total_amount',
      label: 'Amount',
      sortable: true,
      render: (amount) => (
        <span className="font-semibold text-success-600 dark:text-[#9be6b8]">
          {formatPeso(amount)}
        </span>
      ),
    },
    {
      key: 'start_date',
      label: 'Start Date',
      sortable: true,
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedJob(row)}
            className="p-1.5 hover:bg-primary-50 rounded-lg text-primary-600 transition-colors dark:text-[#8cb9ff] dark:hover:bg-white/10"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => setEditingJob({ ...row })}
            className="p-1.5 hover:bg-primary-50 rounded-lg text-primary-600 transition-colors dark:text-[#8cb9ff] dark:hover:bg-white/10"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => void deleteJob(row)}
            className="p-1.5 hover:bg-error-50 rounded-lg text-error-600 transition-colors dark:text-red-300 dark:hover:bg-white/10"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Head title="Job Orders" />
      <AppLayout
        title="Job Orders"
        headerAction={
          <Button variant="primary" onClick={() => setCreatingJob(true)}>
            <Plus className="w-4 h-4" />
            New Job Order
          </Button>
        }
      >
        <div className="space-y-4">
          {message && <p className="border border-neutral-300 bg-neutral-50 p-3 text-sm dark:border-white/10 dark:bg-white/5 dark:text-neutral-200">{message}</p>}
          <Card>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Search by job #, customer..."
                  startIcon={<Search className="w-4 h-4" />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg text-sm dark:bg-[#1d1d1d] dark:text-neutral-100"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="on-hold">On Hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </CardBody>
          </Card>

          <Card noPadding>
            <Table
              columns={columns}
              data={filtered}
              emptyMessage="No sales-side Job Orders yet. Create one from an accepted quotation or confirmed client agreement."
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={(column, order) => {
                setSortBy(column);
                setSortOrder(order);
              }}
            />
          </Card>
          <Modal isOpen={!!selectedJob} onClose={() => setSelectedJob(null)} title={selectedJob?.job_number || 'Job Order details'} size="lg" footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => selectedJob && setEditingJob({ ...selectedJob })}>Edit</Button><Button onClick={() => setSelectedJob(null)}>Close</Button></div>}>
            {selectedJob && <div className="space-y-5 text-sm"><div className="grid grid-cols-2 gap-4 border-b border-neutral-200 pb-4 dark:border-white/10"><div><p className="text-xs text-neutral-500">Customer</p><p className="mt-1 font-medium dark:text-white">{selectedJob.customer_name}</p></div><div><p className="text-xs text-neutral-500">Status</p><p className="mt-1"><StatusBadge status={selectedJob.status} /></p></div><div><p className="text-xs text-neutral-500">Amount</p><p className="mt-1 font-semibold dark:text-white">{formatPeso(selectedJob.total_amount)}</p></div><div><p className="text-xs text-neutral-500">Priority</p><p className="mt-1 font-semibold dark:text-white">{selectedJob.priority || '-'}</p></div></div><div><p className="text-xs text-neutral-500">Description</p><p className="mt-1 dark:text-neutral-200">{selectedJob.description}</p></div><div><p className="text-xs text-neutral-500">Location</p><p className="mt-1 dark:text-neutral-200">{selectedJob.location || '-'}</p></div><div><p className="text-xs text-neutral-500">Notes</p><p className="mt-1 dark:text-neutral-200">{selectedJob.notes || '-'}</p></div></div>}
          </Modal>
          <Modal isOpen={creatingJob} onClose={() => !saving && setCreatingJob(false)} title="New Job Order" size="xl" footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setCreatingJob(false)} disabled={saving}>Cancel</Button><Button type="submit" form="create-job-form" loading={saving}>Create Job Order</Button></div>}>
            <form id="create-job-form" onSubmit={createJob} className="grid grid-cols-1 gap-4 md:grid-cols-2"><label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Client<select required value={newJob.customer_id} onChange={event => setNewJob({ ...newJob, customer_id: event.target.value })} className="mt-1 w-full border border-neutral-300 bg-white p-2.5"><option value="">Select client</option>{customers.map(customer => <option key={customer.id} value={customer.id}>{customer.company_name || customer.name}</option>)}</select></label><label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Priority<select value={newJob.priority} onChange={event => setNewJob({ ...newJob, priority: event.target.value })} className="mt-1 w-full border border-neutral-300 bg-white p-2.5"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label><label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Scheduled date<input type="date" value={newJob.scheduled_date} onChange={event => setNewJob({ ...newJob, scheduled_date: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5" /></label><label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Due date<input type="date" value={newJob.due_date} onChange={event => setNewJob({ ...newJob, due_date: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5" /></label><label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Estimated amount (PHP)<input type="number" min="0" value={newJob.estimated_cost} onChange={event => setNewJob({ ...newJob, estimated_cost: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5" /></label><label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Location<input value={newJob.location} onChange={event => setNewJob({ ...newJob, location: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5" /></label><label className="text-sm font-medium text-neutral-700 dark:text-neutral-200 md:col-span-2">Job description<textarea required value={newJob.description} onChange={event => setNewJob({ ...newJob, description: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5" rows={3} /></label><label className="text-sm font-medium text-neutral-700 dark:text-neutral-200 md:col-span-2">Sales notes<textarea value={newJob.notes} onChange={event => setNewJob({ ...newJob, notes: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5" rows={3} /></label></form>
          </Modal>
          <Modal isOpen={!!editingJob} onClose={() => !saving && setEditingJob(null)} title="Edit Job Order" size="xl" footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEditingJob(null)} disabled={saving}>Cancel</Button><Button type="submit" form="edit-job-form" loading={saving}>Save changes</Button></div>}>
            {editingJob && <form id="edit-job-form" onSubmit={updateJob} className="grid grid-cols-1 gap-4 md:grid-cols-2"><label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Status<select value={editingJob.status} onChange={event => setEditingJob({ ...editingJob, status: event.target.value })} className="mt-1 w-full border border-neutral-300 bg-white p-2.5"><option value="draft">Draft</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="in-progress">In Progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label><label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Priority<select value={editingJob.priority || 'medium'} onChange={event => setEditingJob({ ...editingJob, priority: event.target.value })} className="mt-1 w-full border border-neutral-300 bg-white p-2.5"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label><label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Due date<input type="date" value={editingJob.due_date ? editingJob.due_date.slice(0, 10) : ''} onChange={event => setEditingJob({ ...editingJob, due_date: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5" /></label><label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Amount (PHP)<input type="number" min="0" value={editingJob.total_amount} onChange={event => setEditingJob({ ...editingJob, total_amount: Number(event.target.value) })} className="mt-1 w-full border border-neutral-300 p-2.5" /></label><label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Location<input value={editingJob.location || ''} onChange={event => setEditingJob({ ...editingJob, location: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5" /></label><label className="text-sm font-medium text-neutral-700 dark:text-neutral-200 md:col-span-2">Description<textarea value={editingJob.description} onChange={event => setEditingJob({ ...editingJob, description: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5" rows={3} /></label><label className="text-sm font-medium text-neutral-700 dark:text-neutral-200 md:col-span-2">Notes<textarea value={editingJob.notes || ''} onChange={event => setEditingJob({ ...editingJob, notes: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5" rows={3} /></label></form>}
          </Modal>
        </div>
      </AppLayout>
    </>
  );
};

export default JobOrdersList;
