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
} from 'lucide-react';
import clsx from 'clsx';

interface FollowUp {
  id: number;
  customer_id: number;
  title: string;
  notes?: string;
  scheduled_date: string;
  due_time?: string;
  status: 'pending' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customer?: { id: number; name: string; company_name?: string; phone?: string };
  inquiry?: { id: number; inquiry_number: string; subject: string };
  assignee?: { id: number; name: string };
  completed_at?: string;
}

const FollowUpsPage = () => {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [customers, setCustomers] = useState<Array<{ id: number; name: string; company_name?: string }>>([]);

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [newFollowUp, setNewFollowUp] = useState({
    customer_id: '',
    title: '',
    scheduled_date: new Date().toISOString().slice(0, 10),
    due_time: '10:00 AM',
    priority: 'high',
    notes: '',
  });

  const loadFollowUps = () => {
    setLoading(true);
    const query = new URLSearchParams({
      per_page: '100',
      ...(search ? { search } : {}),
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
      ...(priorityFilter !== 'all' ? { priority: priorityFilter } : {}),
    });

    fetch(`/api/crm/follow-ups?${query}`, { headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setFollowUps(data.data ?? []))
      .catch(() => setFollowUps([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadFollowUps();
  }, [search, statusFilter, priorityFilter]);

  useEffect(() => {
    fetch('/api/customers?per_page=100', { headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setCustomers(data.data ?? []))
      .catch(() => {});
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

    try {
      const res = await fetch('/api/crm/follow-ups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify(newFollowUp),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setMessage('Follow-up scheduled successfully.');
        setNewFollowUp({
          customer_id: '',
          title: '',
          scheduled_date: new Date().toISOString().slice(0, 10),
          due_time: '10:00 AM',
          priority: 'high',
          notes: '',
        });
        loadFollowUps();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch {
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
        setMessage('Task marked as completed.');
        loadFollowUps();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch {}
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
        setMessage('Follow-up deleted.');
        loadFollowUps();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch {}
  };

  // Metrics
  const pendingCount = followUps.filter((f) => f.status === 'pending').length;
  const completedCount = followUps.filter((f) => f.status === 'completed').length;
  const urgentCount = followUps.filter((f) => f.priority === 'urgent' && f.status === 'pending').length;

  const columns: TableColumn<FollowUp>[] = [
    {
      key: 'scheduled_date',
      label: 'Scheduled Date',
      width: '15%',
      render: (_, row) => (
        <div>
          <div className="flex items-center gap-1.5 font-semibold text-content-primary">
            <Calendar className="h-3.5 w-3.5 text-amber-500" />
            <span>{new Date(row.scheduled_date).toLocaleDateString()}</span>
          </div>
          {row.due_time && (
            <span className="text-xs text-content-muted">{row.due_time}</span>
          )}
        </div>
      ),
    },
    {
      key: 'customer_id',
      label: 'Client / Account',
      width: '22%',
      render: (_, row) => (
        <div>
          <p className="font-semibold text-content-primary">
            {row.customer?.company_name || row.customer?.name || 'Unassigned'}
          </p>
          {row.customer?.phone && (
            <p className="text-xs text-content-muted">{row.customer.phone}</p>
          )}
        </div>
      ),
    },
    {
      key: 'title',
      label: 'Follow-Up Action & Notes',
      width: '35%',
      render: (_, row) => (
        <div>
          <p className="font-medium text-content-primary">{row.title}</p>
          {row.notes && (
            <p className="text-xs text-content-secondary mt-0.5 line-clamp-1">{row.notes}</p>
          )}
          {row.inquiry && (
            <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
              Inquiry: {row.inquiry.inquiry_number}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      width: '10%',
      render: (priority) => (
        <span
          className={clsx(
            'px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider',
            priority === 'urgent' && 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
            priority === 'high' && 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
            priority === 'medium' && 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
            priority === 'low' && 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
          )}
        >
          {priority}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: '10%',
      render: (status) => (
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
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      width: '8%',
      render: (_id, row) => (
        <div className="flex items-center gap-1">
          {row.status === 'pending' && (
            <button
              onClick={() => handleComplete(row.id)}
              className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
              title="Mark as Completed"
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
      <Head title="Client Follow-Ups & Reminders - CRM" />
      <AppLayout dark={true} title="CRM & Client Management">
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
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl text-sm">
              {message}
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-surface-card border border-border-default flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-content-secondary uppercase">Pending Follow-Ups</p>
                <p className="text-2xl font-black text-amber-400 mt-1">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500/40" />
            </div>
            <div className="p-4 rounded-2xl bg-surface-card border border-border-default flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-content-secondary uppercase">Urgent Callbacks</p>
                <p className="text-2xl font-black text-rose-400 mt-1">{urgentCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-rose-500/40" />
            </div>
            <div className="p-4 rounded-2xl bg-surface-card border border-border-default flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-content-secondary uppercase">Completed Actions</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">{completedCount}</p>
              </div>
              <CalendarCheck className="h-8 w-8 text-emerald-500/40" />
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  placeholder="Search client, title, notes..."
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
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </CardBody>
          </Card>

          {/* Table */}
          <Card noPadding>
            <Table
              columns={columns}
              data={followUps}
              loading={loading}
              emptyMessage="No follow-up reminders found. Click 'Schedule Follow-up' to create one."
            />
          </Card>

          {/* Modal */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => !saving && setIsModalOpen(false)}
            title="Schedule Client Follow-Up"
            size="lg"
            footer={
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" form="follow-up-form" loading={saving}>
                  Schedule Follow-Up
                </Button>
              </div>
            }
          >
            <form id="follow-up-form" onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">
                  Client / Company *
                </label>
                <select
                  required
                  value={newFollowUp.customer_id}
                  onChange={(e) => setNewFollowUp({ ...newFollowUp, customer_id: e.target.value })}
                  className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                >
                  <option value="">Select Client Account</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name || c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">
                  Follow-Up Action Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Call Engr. Santos re: Tower crane rental mobilization schedule"
                  value={newFollowUp.title}
                  onChange={(e) => setNewFollowUp({ ...newFollowUp, title: e.target.value })}
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
                    value={newFollowUp.scheduled_date}
                    onChange={(e) => setNewFollowUp({ ...newFollowUp, scheduled_date: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">
                    Time
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
                    Priority
                  </label>
                  <select
                    value={newFollowUp.priority}
                    onChange={(e) => setNewFollowUp({ ...newFollowUp, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">
                  Internal Notes & Agenda
                </label>
                <textarea
                  rows={3}
                  placeholder="Notes on client requirements, past concerns, or agreed points..."
                  value={newFollowUp.notes}
                  onChange={(e) => setNewFollowUp({ ...newFollowUp, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>
            </form>
          </Modal>
        </div>
      </AppLayout>
    </>
  );
};

export default FollowUpsPage;
