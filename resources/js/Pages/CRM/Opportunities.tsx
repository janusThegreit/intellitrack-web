import { Head } from '@inertiajs/react';
import { Plus, Search, TrendingUp } from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';

interface Opportunity {
  title: string;
  customer: string;
  value: string;
  closeDate: string;
  owner: string;
  progress: number;
}

const stages: Array<{ label: string; value: string; accent: string; opportunities: Opportunity[] }> = [
  {
    label: 'New',
    value: '₱0.9M',
    accent: 'border-slate-200',
    opportunities: [{ title: 'Residential Equipment', customer: 'Greenfield Developers', value: '₱0.9M', closeDate: '2026-11-01', owner: 'Luis Garcia', progress: 30 }],
  },
  {
    label: 'Qualified',
    value: '₱1.2M',
    accent: 'border-blue-300 bg-blue-50/20',
    opportunities: [{ title: 'Maintenance Crane', customer: 'Pacific Industrial Services', value: '₱1.2M', closeDate: '2026-10-01', owner: 'Marcus Reyes', progress: 45 }],
  },
  {
    label: 'Proposal',
    value: '₱4.3M',
    accent: 'border-violet-300 bg-violet-50/20',
    opportunities: [{ title: 'Metro Tower Crane Fleet', customer: 'ABC Construction Inc.', value: '₱4.3M', closeDate: '2026-09-30', owner: 'Marcus Reyes', progress: 100 }],
  },
];

const summary = [
  { label: 'Negotiation', count: 1, value: '₱2.8M' },
  { label: 'Won', count: 2, value: '₱5.3M' },
  { label: 'Lost', count: 1, value: '₱0.6M' },
];

const Opportunities = () => (
  <>
    <Head title="Leads & Opportunities" />
    <AppLayout title="Leads & Opportunities">
      <div className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Leads & Opportunities</h1>
            <p className="mt-1 text-sm text-slate-500">Track sales opportunities from new lead to closed deal.</p>
          </div>
          <button type="button" className="flex items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1d4ed8]"><Plus className="h-4 w-4" />Add opportunity</button>
        </div>

        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input placeholder="Search opportunities..." className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15" />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {summary.map(item => <div key={item.label} className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm"><p className="text-sm text-slate-500">{item.label}</p><p className="mt-1 text-2xl font-bold text-slate-900">{item.count}</p><p className="mt-0.5 text-sm text-slate-400">{item.value}</p></div>)}
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-[900px] grid-cols-3 gap-4">
            {stages.map(stage => <section key={stage.label} className="min-w-0">
              <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">{stage.label}</h2><span className="text-sm text-slate-400">{stage.opportunities.length}</span></div><span className="text-xs font-medium text-slate-400">{stage.value}</span></div>
              <div className={`min-h-[240px] rounded-xl border bg-white p-3 ${stage.accent}`}>
                <div className="space-y-3">{stage.opportunities.map(opportunity => <article key={opportunity.title} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><h3 className="text-sm font-semibold text-slate-800">{opportunity.title}</h3><p className="mt-1 text-sm text-slate-500">{opportunity.customer}</p><p className="mt-3 text-lg font-bold text-slate-900">{opportunity.value}</p><div className="mt-2 flex items-center justify-between text-xs text-slate-400"><span>{opportunity.closeDate}</span><span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{opportunity.progress}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#3b82f6]" style={{ width: `${opportunity.progress}%` }} /></div><p className="mt-3 text-sm text-slate-400">{opportunity.owner}</p></article>)}</div>
                <button type="button" className="mt-3 flex w-full items-center justify-center rounded-lg border border-dashed border-slate-300 py-2.5 text-sm text-slate-400 hover:border-[#2563eb] hover:text-[#2563eb]"><Plus className="mr-1 h-4 w-4" />Add opportunity</button>
              </div>
            </section>)}
          </div>
        </div>
      </div>
    </AppLayout>
  </>
);

export default Opportunities;
