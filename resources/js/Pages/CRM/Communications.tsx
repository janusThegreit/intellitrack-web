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
  Phone,
  Mail,
  Users,
  MapPin,
  MessageCircle,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import clsx from 'clsx';

interface Communication {
  id: number;
  customer_id: number;
  type: 'call' | 'email' | 'meeting' | 'site_visit' | 'sms';
  direction: 'inbound' | 'outbound';
  subject: string;
  content: string;
  outcome?: string;
  communicated_at: string;
  customer?: { id: number; name: string; company_name?: string; phone?: string };
  inquiry?: { id: number; inquiry_number: string; subject: string };
  creator?: { id: number; name: string };
}

const CommunicationsPage = () => {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [customers, setCustomers] = useState<Array<{ id: number; name: string; company_name?: string }>>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [newComm, setNewComm] = useState({
    customer_id: '',
    type: 'call',
    direction: 'outbound',
    subject: '',
    content: '',
    outcome: '',
  });

  const loadCommunications = () => {
    setLoading(true);
    const query = new URLSearchParams({
      per_page: '100',
      ...(search ? { search } : {}),
      ...(typeFilter !== 'all' ? { type: typeFilter } : {}),
    });

    fetch(`/api/crm/communications?${query}`, { headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setCommunications(data.data ?? []))
      .catch(() => setCommunications([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCommunications();
  }, [search, typeFilter]);

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
      const res = await fetch('/api/crm/communications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify(newComm),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setMessage('Communication record logged successfully.');
        setNewComm({
          customer_id: '',
          type: 'call',
          direction: 'outbound',
          subject: '',
          content: '',
          outcome: '',
        });
        loadCommunications();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch {
      setMessage('Failed to record communication.');
    } finally {
      setSaving(false);
    }
  };

  // Metrics
  const callsCount = communications.filter((c) => c.type === 'call').length;
  const meetingsCount = communications.filter((c) => c.type === 'meeting' || c.type === 'site_visit').length;
  const emailsCount = communications.filter((c) => c.type === 'email' || c.type === 'sms').length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="h-3.5 w-3.5" />;
      case 'email':
        return <Mail className="h-3.5 w-3.5" />;
      case 'site_visit':
        return <MapPin className="h-3.5 w-3.5" />;
      case 'meeting':
        return <Users className="h-3.5 w-3.5" />;
      default:
        return <MessageCircle className="h-3.5 w-3.5" />;
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
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={clsx(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase',
                row.type === 'call' && 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
                row.type === 'meeting' && 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
                row.type === 'site_visit' && 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
                row.type === 'email' && 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              )}
            >
              {getTypeIcon(row.type)}
              {row.type.replace('_', ' ')}
            </span>
            <span
              className={clsx(
                'inline-flex items-center text-[10px] font-bold',
                row.direction === 'inbound' ? 'text-cyan-400' : 'text-amber-400'
              )}
            >
              {row.direction === 'inbound' ? (
                <>
                  <ArrowDownLeft className="h-3 w-3" /> In
                </>
              ) : (
                <>
                  <ArrowUpRight className="h-3 w-3" /> Out
                </>
              )}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'customer_id',
      label: 'Client Account',
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
      key: 'subject',
      label: 'Discussion Subject & Summary',
      width: '42%',
      render: (_, row) => (
        <div>
          <p className="font-bold text-sm text-content-primary">{row.subject}</p>
          <p className="text-xs text-content-secondary mt-1 whitespace-pre-line">{row.content}</p>
          {row.outcome && (
            <div className="mt-2 p-1.5 rounded-lg bg-surface-elevated/70 border border-border-default text-xs text-amber-300">
              <strong>Outcome / Next Step:</strong> {row.outcome}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'id',
      label: 'Staff Log',
      width: '18%',
      render: (_, row) => (
        <div className="text-xs text-content-muted">
          <span>Logged by:</span>
          <p className="font-semibold text-content-primary mt-0.5">
            {row.creator?.name || 'Account Exec'}
          </p>
        </div>
      ),
    },
  ];

  return (
    <>
      <Head title="Client Communications & Interaction History - CRM" />
      <AppLayout dark={true} title="CRM & Client Management">
        <div className="space-y-5">
          <CrmNavTabs
            actionButton={
              <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Log Communication
              </Button>
            }
          />

          {message && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl text-sm">
              {message}
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-surface-card border border-border-default flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-content-secondary uppercase">Phone Calls Logged</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">{callsCount}</p>
              </div>
              <Phone className="h-8 w-8 text-emerald-500/40" />
            </div>
            <div className="p-4 rounded-2xl bg-surface-card border border-border-default flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-content-secondary uppercase">Meetings & Site Visits</p>
                <p className="text-2xl font-black text-amber-400 mt-1">{meetingsCount}</p>
              </div>
              <Users className="h-8 w-8 text-amber-500/40" />
            </div>
            <div className="p-4 rounded-2xl bg-surface-card border border-border-default flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-content-secondary uppercase">Emails & Messages</p>
                <p className="text-2xl font-black text-blue-400 mt-1">{emailsCount}</p>
              </div>
              <Mail className="h-8 w-8 text-blue-500/40" />
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  placeholder="Search subject, discussion notes, client..."
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
                  <option value="meeting">In-Person Meetings</option>
                  <option value="site_visit">Site Ocular Visits</option>
                  <option value="email">Emails</option>
                  <option value="sms">SMS / Chat</option>
                </select>
              </div>
            </CardBody>
          </Card>

          {/* Table */}
          <Card noPadding>
            <Table
              columns={columns}
              data={communications}
              loading={loading}
              emptyMessage="No communications logged yet. Click 'Log Communication' to record interactions."
            />
          </Card>

          {/* Modal */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => !saving && setIsModalOpen(false)}
            title="Log Client Interaction / Communication"
            size="lg"
            footer={
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" form="comm-form" loading={saving}>
                  Save Log
                </Button>
              </div>
            }
          >
            <form id="comm-form" onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">
                  Client / Account *
                </label>
                <select
                  required
                  value={newComm.customer_id}
                  onChange={(e) => setNewComm({ ...newComm, customer_id: e.target.value })}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">
                    Channel Type *
                  </label>
                  <select
                    value={newComm.type}
                    onChange={(e) => setNewComm({ ...newComm, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                  >
                    <option value="call">Phone Call</option>
                    <option value="meeting">Office / Site Meeting</option>
                    <option value="site_visit">Site Ocular Inspection</option>
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

              <div>
                <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">
                  Subject / Topic *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ocular site visit for 60m crane foundation tie-in"
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
                  rows={4}
                  placeholder="Key discussion points, crane specs discussed, client constraints..."
                  value={newComm.content}
                  onChange={(e) => setNewComm({ ...newComm, content: e.target.value })}
                  className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">
                  Outcome & Next Steps
                </label>
                <input
                  type="text"
                  placeholder="e.g. Client agreed on rate; prepare quotation by tomorrow 3 PM"
                  value={newComm.outcome}
                  onChange={(e) => setNewComm({ ...newComm, outcome: e.target.value })}
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

export default CommunicationsPage;
