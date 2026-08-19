import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { Plus, Search } from 'lucide-react';
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
  }, []);

  const totalPipeline = filtered.reduce((total, quotation) => total + quotation.amount, 0);

  return (
    <>
      <Head title="Quotations" />
      <AppLayout title="Quotations">
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div><h1 className="text-2xl font-bold text-slate-900">Quotations</h1><p className="mt-1 text-base text-slate-500">Total pipeline: <span className="font-medium text-slate-600">{formatPeso(totalPipeline)}</span></p></div>
            <button type="button" onClick={() => { window.location.href = '/quotations/create'; }} className="flex items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8]"><Plus className="h-4 w-4" />Create Quotation</button>
          </div>
          <div className="relative max-w-md"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search quotations..." className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-base text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15" /></div>
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">{statusTabs.map((tab) => <button key={tab.value} type="button" onClick={() => setStatusFilter(tab.value)} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${statusFilter === tab.value ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>{tab.label}</button>)}</div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-4">Quotation #</th><th className="px-5 py-4">Client</th><th className="px-5 py-4">Project</th><th className="px-5 py-4 text-right">Amount</th><th className="px-5 py-4">Created Date</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.length ? filtered.map((quotation) => <tr key={quotation.id} className="transition hover:bg-slate-50"><td className="px-5 py-5"><a href={`/quotations/${quotation.id}`} className="font-mono text-sm font-medium text-[#2563eb] hover:underline">{quotation.quote_number}</a></td><td className="px-5 py-5 text-base font-medium text-slate-800">{quotation.customer_name}</td><td className="px-5 py-5 text-sm text-slate-500">{quotation.project_name}</td><td className="px-5 py-5 text-right text-base font-semibold text-slate-800">{formatPeso(quotation.amount)}</td><td className="px-5 py-5 text-sm text-slate-500">{quotation.created_date ? new Date(quotation.created_date).toLocaleDateString('en-CA') : '-'}</td></tr>) : <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-400">No quotations found.</td></tr>}</tbody></table></div></div>
        </div>
      </AppLayout>
    </>
  );
};

export default QuotationsList;
