import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { Plus, Search } from 'lucide-react';
import Modal from '../../Components/Modal';
import Button from '../../Components/Button';
import { formatPeso } from '../../Utils/currency';

interface Quotation {
  id: number;
  quote_number: string;
  customer_name: string;
  project_name: string;
  amount: number;
  status: string;
  created_date: string;
}

const statusTabs = [
  { label: 'All', value: '' },
  { label: 'Draft', value: 'draft' },
  { label: 'For Approval', value: 'for approval' },
  { label: 'Approved', value: 'approved' },
  { label: 'Sent', value: 'sent' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Expired', value: 'expired' },
];

const QuotationsList = ({ quotations = [] }: { quotations?: Array<Quotation> }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [records, setRecords] = useState<Quotation[]>(quotations);
  const [filtered, setFiltered] = useState<Quotation[]>(records);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [newQuotation, setNewQuotation] = useState<any>({
    customer_id: '', quotation_date: new Date().toISOString().slice(0, 10), valid_until: '', status: 'draft', description: '', total_amount: 0
  });

  useEffect(() => {
    let result = [...records];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.quote_number.toLowerCase().includes(query) ||
          item.customer_name.toLowerCase().includes(query)
      );
    }
    if (statusFilter) {
      result = result.filter((item) => item.status === statusFilter);
    }
    setFiltered(result);
  }, [searchQuery, statusFilter, records]);

  useEffect(() => {
    fetch('/api/quotations?per_page=100', { headers: { Accept: 'application/json' } })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(data => setRecords((data.data ?? []).map((quote: any) => ({ id: quote.id, quote_number: quote.quotation_number, customer_name: quote.customer?.company_name || quote.customer?.name || '-', project_name: quote.project?.name || quote.project_name || '-', amount: Number(quote.total_amount ?? 0), status: String(quote.status ?? '').toLowerCase(), created_date: quote.quotation_date }))))
      .catch(() => setRecords([]));
      
    fetch('/api/customers?per_page=100', { headers: { Accept: 'application/json' } })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setCustomers(data.data ?? []))
      .catch(() => {});
  }, []);

  const createQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
    const res = await fetch('/api/quotations', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrf }, body: JSON.stringify(newQuotation) });
    if (res.ok) {
      setIsCreateModalOpen(false);
      setMessage('Quotation created successfully. Refresh the page to view.');
      setNewQuotation({ customer_id: '', quotation_date: new Date().toISOString().slice(0, 10), valid_until: '', status: 'draft', description: '', total_amount: 0 });
    } else {
      setMessage('Failed to create quotation. Please check the fields.');
    }
    setSaving(false);
  };

  const totalPipeline = filtered.reduce((total, quotation) => total + quotation.amount, 0);

  return (
    <>
      <Head title="Quotations" />
      <AppLayout title="Quotations">
        <div className="space-y-4">
          {message && <p className="border border-neutral-300 bg-white p-3 text-sm rounded-md">{message}</p>}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div><h1 className="text-2xl font-bold text-content-primary">Quotations</h1><p className="mt-1 text-base text-content-secondary">Total pipeline: <span className="font-medium text-content-secondary">{formatPeso(totalPipeline)}</span></p></div>
            <button type="button" onClick={() => setIsCreateModalOpen(true)} className="flex items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8]"><Plus className="h-4 w-4" />Create Quotation</button>
          </div>
          <div className="relative max-w-md"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-content-secondary" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search quotations..." className="h-12 w-full rounded-lg border border-border-default bg-surface-card pl-11 pr-4 text-base text-content-primary outline-none placeholder:text-slate-400 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15" /></div>
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border-default bg-surface-card p-1">{statusTabs.map((tab) => <button key={tab.value} type="button" onClick={() => setStatusFilter(tab.value)} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${statusFilter === tab.value ? 'bg-slate-900 text-white shadow-sm' : 'text-content-secondary hover:bg-surface-input hover:text-slate-700'}`}>{tab.label}</button>)}</div>
          <div className="overflow-hidden rounded-xl border border-border-default bg-surface-card"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="border-b border-border-subtle text-xs font-semibold uppercase tracking-wide text-content-secondary"><tr><th className="px-5 py-4">Quotation #</th><th className="px-5 py-4">Client</th><th className="px-5 py-4">Project</th><th className="px-5 py-4 text-right">Amount</th><th className="px-5 py-4">Created Date</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.length ? filtered.map((quotation) => <tr key={quotation.id} className="transition hover:bg-surface-input"><td className="px-5 py-5"><a href={`/quotations/${quotation.id}`} className="font-mono text-sm font-medium text-brand hover:underline">{quotation.quote_number}</a></td><td className="px-5 py-5 text-base font-medium text-content-primary">{quotation.customer_name}</td><td className="px-5 py-5 text-sm text-content-secondary">{quotation.project_name}</td><td className="px-5 py-5 text-right text-base font-semibold text-content-primary">{formatPeso(quotation.amount)}</td><td className="px-5 py-5 text-sm text-content-secondary">{quotation.created_date ? new Date(quotation.created_date).toLocaleDateString('en-CA') : '-'}</td></tr>) : <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-content-secondary">No quotations found.</td></tr>}</tbody></table></div></div>
          
          <Modal isOpen={isCreateModalOpen} onClose={() => !saving && setIsCreateModalOpen(false)} title="Create Quotation" size="lg" footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={saving}>Cancel</Button><Button type="submit" form="create-quotation-form" loading={saving}>Create</Button></div>}>
            <form id="create-quotation-form" onSubmit={createQuotation} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-neutral-700 md:col-span-2">Customer<select required value={newQuotation.customer_id} onChange={e => setNewQuotation({ ...newQuotation, customer_id: Number(e.target.value) })} className="mt-1 w-full border border-neutral-300 p-2.5 rounded-md"><option value="">Select Customer</option>{customers.map(c => <option key={c.id} value={c.id}>{c.company_name || c.name}</option>)}</select></label>
              <label className="text-sm font-medium text-neutral-700">Quotation Date<input type="date" required value={newQuotation.quotation_date} onChange={e => setNewQuotation({ ...newQuotation, quotation_date: e.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 rounded-md" /></label>
              <label className="text-sm font-medium text-neutral-700">Valid Until<input type="date" required value={newQuotation.valid_until} onChange={e => setNewQuotation({ ...newQuotation, valid_until: e.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 rounded-md" /></label>
              <label className="text-sm font-medium text-neutral-700">Status<select value={newQuotation.status} onChange={e => setNewQuotation({ ...newQuotation, status: e.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 rounded-md"><option value="draft">Draft</option><option value="for approval">For Approval</option><option value="approved">Approved</option><option value="sent">Sent</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option></select></label>
              <label className="text-sm font-medium text-neutral-700">Total Amount<input type="number" required min="0" value={newQuotation.total_amount} onChange={e => setNewQuotation({ ...newQuotation, total_amount: Number(e.target.value) })} className="mt-1 w-full border border-neutral-300 p-2.5 rounded-md" /></label>
              <label className="text-sm font-medium text-neutral-700 md:col-span-2">Description / Notes<textarea value={newQuotation.description} onChange={e => setNewQuotation({ ...newQuotation, description: e.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 rounded-md" rows={3} /></label>
            </form>
          </Modal>
        </div>
      </AppLayout>
    </>
  );
};

export default QuotationsList;
