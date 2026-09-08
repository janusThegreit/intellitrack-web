import { useEffect, useState, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
  Search,
  TrendingUp,
  DollarSign,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileEdit,
  AlertTriangle,
  Building,
} from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';
import CrmNavTabs from '../../Components/CrmNavTabs';
import { formatPeso } from '../../Utils/currency';
import { StatusBadge } from '../../Components/Badge';

interface QuoteDeal {
  id: number;
  quotation_number: string;
  status: string;
  total_amount: number;
  customer?: { id: number; name: string; company_name?: string };
  job_order_id?: number | null;
  description?: string;
  created_at: string;
  valid_until?: string;
}

interface InquiryDeal {
  id: number;
  inquiry_number: string;
  contact_name: string;
  company_name?: string;
  project_name?: string;
  priority: string;
  status: string;
  created_at: string;
}

const Opportunities = () => {
  const [quotes, setQuotes] = useState<QuoteDeal[]>([]);
  const [inquiries, setInquiries] = useState<InquiryDeal[]>([]);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      const [quotesRes, inquiriesRes] = await Promise.all([
        fetch('/api/quotations?per_page=100', { headers: { Accept: 'application/json' } }),
        fetch('/api/customer-inquiries?per_page=100', { headers: { Accept: 'application/json' } }),
      ]);
      if (quotesRes.ok) {
        const qData = await quotesRes.json();
        setQuotes(qData.data ?? []);
      }
      if (inquiriesRes.ok) {
        const inqData = await inquiriesRes.json();
        setInquiries(inqData.data ?? []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered lists
  const filteredQuotes = useMemo(() => {
    if (!search.trim()) return quotes;
    const q = search.toLowerCase();
    return quotes.filter(
      item =>
        item.quotation_number.toLowerCase().includes(q) ||
        (item.customer?.company_name && item.customer.company_name.toLowerCase().includes(q)) ||
        (item.customer?.name && item.customer.name.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q))
    );
  }, [quotes, search]);

  // Funnel calculations
  const totalPipelineValue = quotes
    .filter(q => ['draft', 'under_review', 'revision_requested', 'approved', 'sent'].includes(q.status))
    .reduce((sum, q) => sum + Number(q.total_amount || 0), 0);

  const closedWonValue = quotes
    .filter(q => q.status === 'accepted')
    .reduce((sum, q) => sum + Number(q.total_amount || 0), 0);

  const awaitingReviewCount = quotes.filter(q => q.status === 'under_review').length;

  const winRate = useMemo(() => {
    const closedWon = quotes.filter(q => q.status === 'accepted').length;
    const closedLost = quotes.filter(q => q.status === 'rejected').length;
    const totalClosed = closedWon + closedLost;
    return totalClosed > 0 ? Math.round((closedWon / totalClosed) * 100) : 75;
  }, [quotes]);

  // Stage Buckets
  const columns = [
    {
      id: 'inquiries',
      title: 'Active Inquiries',
      count: inquiries.filter(i => ['new', 'contacted', 'qualified'].includes(i.status)).length,
      color: 'border-blue-500/30 bg-blue-500/5',
      badge: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
      items: inquiries.filter(i => ['new', 'contacted', 'qualified'].includes(i.status)),
      type: 'inquiry' as const,
    },
    {
      id: 'draft',
      title: 'Draft Proposals',
      count: filteredQuotes.filter(q => q.status === 'draft').length,
      total: filteredQuotes.filter(q => q.status === 'draft').reduce((s, q) => s + Number(q.total_amount || 0), 0),
      color: 'border-slate-700 bg-surface-card/60',
      badge: 'bg-slate-800 text-slate-300 border border-slate-700',
      items: filteredQuotes.filter(q => q.status === 'draft'),
      type: 'quote' as const,
    },
    {
      id: 'under_review',
      title: 'Manager Review & Revisions',
      count: filteredQuotes.filter(q => ['under_review', 'revision_requested'].includes(q.status)).length,
      total: filteredQuotes.filter(q => ['under_review', 'revision_requested'].includes(q.status)).reduce((s, q) => s + Number(q.total_amount || 0), 0),
      color: 'border-amber-500/30 bg-amber-500/5',
      badge: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
      items: filteredQuotes.filter(q => ['under_review', 'revision_requested'].includes(q.status)),
      type: 'quote' as const,
    },
    {
      id: 'negotiation',
      title: 'Client Sent / Tenders',
      count: filteredQuotes.filter(q => ['approved', 'sent'].includes(q.status)).length,
      total: filteredQuotes.filter(q => ['approved', 'sent'].includes(q.status)).reduce((s, q) => s + Number(q.total_amount || 0), 0),
      color: 'border-violet-500/30 bg-violet-500/5',
      badge: 'bg-violet-500/15 text-violet-400 border border-violet-500/30',
      items: filteredQuotes.filter(q => ['approved', 'sent'].includes(q.status)),
      type: 'quote' as const,
    },
    {
      id: 'closed',
      title: 'Closed Deals (Won & Lost)',
      count: filteredQuotes.filter(q => ['accepted', 'rejected'].includes(q.status)).length,
      total: filteredQuotes.filter(q => q.status === 'accepted').reduce((s, q) => s + Number(q.total_amount || 0), 0),
      color: 'border-emerald-500/30 bg-emerald-500/5',
      badge: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      items: filteredQuotes.filter(q => ['accepted', 'rejected'].includes(q.status)),
      type: 'quote' as const,
    },
  ];

  return (
    <>
      <Head title="Commercial Sales Pipeline & Opportunities" />
      <AppLayout dark={true} title="CRM & Client Management">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 space-y-6">
          <CrmNavTabs />

          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border-subtle pb-5">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Commercial Sales Pipeline</h1>
              <p className="text-sm text-content-secondary mt-0.5">
                End-to-end visibility from prospect inquiry to commercial proposal approval, customer acceptance, and job order dispatch.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/quotations"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 text-xs transition shadow-md shadow-amber-500/20"
              >
                <FileEdit className="h-4 w-4" />
                <span>New Quotation</span>
              </Link>
              <Link
                href="/inquiries?create=true"
                className="inline-flex items-center gap-2 rounded-xl border border-border-default bg-surface-card hover:border-amber-500/40 text-content-primary px-4 py-2 text-xs font-semibold transition"
              >
                <Users className="h-4 w-4 text-amber-500" />
                <span>Register Inquiry</span>
              </Link>
            </div>
          </div>

          {/* Metric KPIs Summary Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border-default/80 bg-surface-card/90 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">Active Pipeline Value</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-black text-amber-400 font-mono">
                {formatPeso(totalPipelineValue)}
              </p>
              <p className="mt-1 text-xs text-content-secondary">Across {quotes.length} active deals</p>
            </div>

            <div className="rounded-2xl border border-border-default/80 bg-surface-card/90 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">Awaiting Manager Sign-Off</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-black text-white font-mono">
                {awaitingReviewCount} <span className="text-xs text-amber-400 font-normal">proposals</span>
              </p>
              <p className="mt-1 text-xs text-content-secondary">Pending review or revision</p>
            </div>

            <div className="rounded-2xl border border-border-default/80 bg-surface-card/90 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">Closed Won Revenue</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-black text-emerald-400 font-mono">
                {formatPeso(closedWonValue)}
              </p>
              <p className="mt-1 text-xs text-content-secondary">Accepted & contracted</p>
            </div>

            <div className="rounded-2xl border border-border-default/80 bg-surface-card/90 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">Closing Win Rate</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-black text-violet-300 font-mono">
                {winRate}%
              </p>
              <p className="mt-1 text-xs text-content-secondary">Conversion benchmark</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by quote number, client, project, or description..."
              className="w-full rounded-xl border border-border-default bg-surface-card pl-10 pr-4 py-2.5 text-xs text-content-primary focus:border-amber-500 focus:outline-none placeholder:text-content-muted shadow-sm"
            />
          </div>

          {/* Pipeline Kanban Board */}
          <div className="overflow-x-auto pb-4">
            <div className="grid min-w-[1200px] grid-cols-5 gap-4">
              {columns.map((col) => (
                <div key={col.id} className="flex flex-col rounded-2xl border border-border-default/80 bg-surface-card/50 p-3.5 backdrop-blur-sm">
                  {/* Column Header */}
                  <div className="flex items-center justify-between border-b border-border-subtle/80 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xs font-bold text-white tracking-wide">{col.title}</h2>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${col.badge}`}>
                        {col.count}
                      </span>
                    </div>
                    {col.total !== undefined && (
                      <span className="text-[11px] font-mono font-semibold text-content-secondary">
                        {formatPeso(col.total)}
                      </span>
                    )}
                  </div>

                  {/* Cards Container */}
                  <div className="flex-1 space-y-3 min-h-[350px]">
                    {col.items.length > 0 ? (
                      col.items.map((item: any) => {
                        if (col.type === 'inquiry') {
                          return (
                            <Link
                              key={`inq-${item.id}`}
                              href="/inquiries"
                              className="group block rounded-xl border border-border-default/70 bg-surface-card p-3.5 shadow-sm transition hover:border-blue-500/50 hover:shadow-md hover:-translate-y-0.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono font-bold text-blue-400">{item.inquiry_number}</span>
                                <span className="rounded px-1.5 py-0.5 text-[9px] uppercase font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                  {item.priority || 'Medium'}
                                </span>
                              </div>
                              <h3 className="text-xs font-bold text-content-primary mt-2 group-hover:text-blue-400 transition-colors">
                                {item.contact_name || 'Prospective Client'}
                              </h3>
                              <p className="text-[11px] text-content-secondary flex items-center gap-1 mt-0.5 truncate">
                                <Building className="h-3 w-3 shrink-0" />
                                <span>{item.company_name || 'Individual'}</span>
                              </p>
                              {item.project_name && (
                                <p className="mt-2 text-[11px] text-slate-300 font-medium line-clamp-1">
                                  {item.project_name}
                                </p>
                              )}
                              <div className="mt-3 pt-2 border-t border-border-subtle/50 flex items-center justify-between text-[10px] text-content-muted">
                                <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                <span className="text-blue-400 font-semibold group-hover:underline flex items-center gap-0.5">
                                  Open <ArrowRight className="h-3 w-3" />
                                </span>
                              </div>
                            </Link>
                          );
                        }

                        return (
                          <Link
                            key={`quote-${item.id}`}
                            href="/quotations"
                            className="group block rounded-xl border border-border-default/70 bg-surface-card p-3.5 shadow-sm transition hover:border-amber-500/50 hover:shadow-md hover:-translate-y-0.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold text-amber-500">{item.quotation_number}</span>
                              <StatusBadge status={item.status} />
                            </div>

                            <h3 className="text-xs font-bold text-content-primary mt-2 group-hover:text-amber-500 transition-colors">
                              {item.customer?.company_name || item.customer?.name || 'Customer'}
                            </h3>

                            <p className="mt-2 text-sm font-black font-mono text-white">
                              {formatPeso(Number(item.total_amount || 0))}
                            </p>

                            {item.description && (
                              <p className="mt-1 text-[11px] text-content-secondary line-clamp-1">
                                {item.description}
                              </p>
                            )}

                            {item.status === 'revision_requested' && (
                              <div className="mt-2 flex items-center gap-1 rounded bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
                                <AlertTriangle className="h-3 w-3 shrink-0" /> Revision Requested
                              </div>
                            )}

                            {item.job_order_id && (
                              <div className="mt-2 flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="h-3 w-3 shrink-0" /> Converted to Job Order
                              </div>
                            )}

                            <div className="mt-3 pt-2 border-t border-border-subtle/50 flex items-center justify-between text-[10px] text-content-muted">
                              <span>{new Date(item.created_at).toLocaleDateString()}</span>
                              <span className="text-amber-500 font-semibold group-hover:underline flex items-center gap-0.5">
                                Review <ArrowRight className="h-3 w-3" />
                              </span>
                            </div>
                          </Link>
                        );
                      })
                    ) : (
                      <div className="rounded-xl border border-dashed border-border-subtle p-6 text-center text-xs text-content-muted">
                        No deals in this stage
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
};

export default Opportunities;
