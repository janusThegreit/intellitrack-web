import { useEffect, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { ClipboardList, Plus, Send, Trash2, CheckCircle2, XCircle, Rocket, ExternalLink, AlertTriangle, ShieldAlert } from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';
import { formatPeso } from '../../Utils/currency';
import CrmNavTabs from '../../Components/CrmNavTabs';
import Modal from '../../Components/Modal';
import Button from '../../Components/Button';

interface Customer { id: number; name: string; company_name?: string; city?: string; project_location?: string; }
interface Line { description: string; quantity: number; rental_duration: number; rental_duration_unit: string; unit_rate: number; additional_charges: number; }
interface Quote {
  id: number;
  quotation_number: string;
  status: string;
  total_amount: number;
  created_by?: number;
  job_order_id?: number | null;
  customer?: Customer;
  job_order?: { id: number; job_order_number: string };
  revision_notes?: string | null;
  approval_notes?: string | null;
  notes?: string | null;
  description?: string;
  history?: Array<{ id: number; action: string; notes?: string; created_at: string }>;
}

const blankLine = (): Line => ({ description: '', quantity: 1, rental_duration: 1, rental_duration_unit: 'day', unit_rate: 0, additional_charges: 0 });
const label = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, (letter: string) => letter.toUpperCase());

const QuotationWorkspace = () => {
  const { auth } = usePage<any>().props;
  const currentUserId = auth?.user?.id;
  const currentUserRole = auth?.user?.role;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [description, setDescription] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [items, setItems] = useState<Line[]>([blankLine()]);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'under_review' | 'approved' | 'sent' | 'accepted' | 'with_jo'>('all');

  // Manager Revision Modal
  const [revisionQuote, setRevisionQuote] = useState<Quote | null>(null);
  const [revisionCategory, setRevisionCategory] = useState('pricing');
  const [revisionNotes, setRevisionNotes] = useState('');
  const [revisionLoading, setRevisionLoading] = useState(false);

  // Manager Approval Modal
  const [approvalQuote, setApprovalQuote] = useState<Quote | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approvalLoading, setApprovalLoading] = useState(false);

  // Manager Rejection Modal
  const [rejectionQuote, setRejectionQuote] = useState<Quote | null>(null);
  const [rejectionReason, setRejectionReason] = useState('rate_too_low');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [rejectionLoading, setRejectionLoading] = useState(false);

  // Customer Response Modal
  const [customerFeedbackQuote, setCustomerFeedbackQuote] = useState<Quote | null>(null);
  const [customerFeedbackStatus, setCustomerFeedbackStatus] = useState<'accepted' | 'rejected'>('rejected');
  const [customerFeedbackNotes, setCustomerFeedbackNotes] = useState('');
  const [customerFeedbackLoading, setCustomerFeedbackLoading] = useState(false);

  const load = async () => {
    const [clientResponse, quoteResponse] = await Promise.all([
      fetch('/api/customers?per_page=100', { headers: { Accept: 'application/json' } }),
      fetch('/api/quotations?per_page=100', { headers: { Accept: 'application/json' } }),
    ]);
    if (!clientResponse.ok || !quoteResponse.ok) throw new Error();
    setCustomers((await clientResponse.json()).data ?? []);
    setQuotes((await quoteResponse.json()).data ?? []);
  };

  useEffect(() => { load().catch(() => setMessage('Quotation data could not be loaded.')); }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const cId = params.get('customer_id');
      const desc = params.get('description') || params.get('subject');
      if (cId) setCustomerId(cId);
      if (desc) setDescription(desc);
    }
  }, []);
  
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rental_duration * item.unit_rate + item.additional_charges, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = Math.max(0, subtotal + taxAmount - discount);
  
  const updateItem = (index: number, field: keyof Line, value: string | number) => setItems(items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));

  const saveDraft = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/quotations', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ customer_id: Number(customerId), description, valid_until: validUntil || null, tax_rate: taxRate, discount_amount: discount, items }) });
      if (!response.ok) throw new Error();
      await load();
      setMessage('Draft quotation created. Submit it for manager approval when ready.');
      setDescription(''); setItems([blankLine()]); setTaxRate(0); setDiscount(0); setValidUntil('');
      setTimeout(() => setMessage(''), 4000);
    } catch { 
      setMessage('Unable to save draft. Select a client and complete each line item.'); 
    } finally { 
      setSaving(false); 
    }
  };

  const action = async (quote: Quote, endpoint: string, body: Record<string, unknown> = {}) => {
    const response = await fetch(`/api/quotations/${quote.id}/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) });
    if (!response.ok) { 
      const err = await response.json().catch(() => ({}));
      setMessage(err.message || 'This action is not allowed for your role or the quotation status.'); 
      return; 
    }
    await load();
    setMessage(`${quote.quotation_number} updated.`);
    setTimeout(() => setMessage(''), 4000);
  };

  const submitRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionQuote) return;
    setRevisionLoading(true);
    try {
      const categoryLabels: Record<string, string> = {
        pricing: 'Pricing Adjustment Required',
        equipment: 'Crane Specification Mismatch',
        duration: 'Rental Duration / Dates Conflict',
        discount: 'Discount Exceeds Policy',
        logistics: 'Logistics & Mobilization Terms Incomplete',
        other: 'General Revision Required',
      };
      const fullNote = `[${categoryLabels[revisionCategory] || revisionCategory.toUpperCase()}] ${revisionNotes}`;
      const res = await fetch(`/api/quotations/${revisionQuote.id}/revise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ revision_notes: fullNote }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Failed to request revision');
      }
      await load();
      setMessage(`Correction instructions sent to rep for ${revisionQuote.quotation_number}.`);
      setRevisionQuote(null);
      setRevisionNotes('');
      setTimeout(() => setMessage(''), 5000);
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setRevisionLoading(false);
    }
  };

  const submitApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvalQuote) return;
    setApprovalLoading(true);
    try {
      const res = await fetch(`/api/quotations/${approvalQuote.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ approval_notes: approvalNotes || null }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Failed to approve quotation');
      }
      await load();
      setMessage(`${approvalQuote.quotation_number} has been approved and is ready to send.`);
      setApprovalQuote(null);
      setApprovalNotes('');
      setTimeout(() => setMessage(''), 4000);
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setApprovalLoading(false);
    }
  };

  const submitRejection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionQuote) return;
    setRejectionLoading(true);
    try {
      const res = await fetch(`/api/quotations/${rejectionQuote.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ notes: `[${rejectionReason.toUpperCase()}] ${rejectionNotes}` }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Failed to reject quotation');
      }
      await load();
      setMessage(`${rejectionQuote.quotation_number} has been marked as rejected.`);
      setRejectionQuote(null);
      setRejectionNotes('');
      setTimeout(() => setMessage(''), 4000);
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setRejectionLoading(false);
    }
  };

  const submitCustomerResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerFeedbackQuote) return;
    setCustomerFeedbackLoading(true);
    try {
      const res = await fetch(`/api/quotations/${customerFeedbackQuote.id}/customer-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ response: customerFeedbackStatus, notes: customerFeedbackNotes || null }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Failed to record customer response');
      }
      await load();
      setMessage(`Customer response recorded for ${customerFeedbackQuote.quotation_number}.`);
      setCustomerFeedbackQuote(null);
      setCustomerFeedbackNotes('');
      setTimeout(() => setMessage(''), 4000);
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setCustomerFeedbackLoading(false);
    }
  };

  const generateJobOrder = async (quote: Quote) => {
    try {
      const response = await fetch(`/api/quotations/${quote.id}/convert-to-job-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
        },
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Conversion failed');
      }
      const job = await response.json();
      await load();
      setMessage(`Job Order ${job.job_order_number} successfully generated! View it in Job Orders to assign staff and schedule crane dispatch.`);
      setTimeout(() => setMessage(''), 6000);
    } catch (e: any) {
      setMessage(e.message || 'Unable to generate Job Order.');
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const inputClass = "w-full rounded-md border border-zinc-700 bg-surface-input px-3 py-1.5 text-sm text-white focus:border-brand focus:ring-1 focus:ring-brand outline-none transition";

  return (
    <>
      <Head title="Sales & Quotation Management" />
      <AppLayout dark={true} title="CRM & Client Management">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <CrmNavTabs />
          
          <div className="mb-6 pb-2 border-b border-border-subtle flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white">Quotations</h1>
              <p className="text-sm text-content-secondary mt-1">Manage, approve, and convert commercial proposals into active Job Orders.</p>
            </div>
          </div>

          {message && (
            <div className="mb-6 rounded-md border border-blue-500/30 bg-blue-500/10 p-4">
              <p className="text-sm font-medium text-blue-400">{message}</p>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            
            <div className="flex-1 min-w-0 space-y-8">
              
              <div>
                <h2 className="text-lg font-medium text-white mb-4">New construction quotation</h2>
                
                <div className="space-y-4 rounded-md border border-border-subtle bg-surface-card p-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-content-secondary mb-1">Select Client</label>
                      <select 
                        value={customerId} 
                        onChange={event => setCustomerId(event.target.value)} 
                        className={inputClass}
                      >
                        <option value="">Choose an account...</option>
                        {customers.map(customer => (
                          <option key={customer.id} value={customer.id}>
                            {customer.company_name || customer.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-content-secondary mb-1">Proposal Subject</label>
                      <input 
                        type="text" 
                        placeholder="Tower crane lease / project reference..." 
                        value={description} 
                        onChange={event => setDescription(event.target.value)} 
                        className={inputClass} 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-content-secondary mb-1">Offer Valid Until</label>
                      <input 
                        type="date" 
                        value={validUntil} 
                        onChange={event => setValidUntil(event.target.value)} 
                        className={inputClass} 
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border-subtle">
                    <h3 className="text-sm font-medium text-white mb-3">Line items & operational charges</h3>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-content-secondary">
                        <thead className="bg-surface-app text-content-secondary uppercase font-semibold border-b border-border-subtle">
                          <tr>
                            <th className="py-2 px-3">Equipment / Service</th>
                            <th className="py-2 px-2 w-16 text-center">Qty</th>
                            <th className="py-2 px-2 w-20 text-center">Duration</th>
                            <th className="py-2 px-2 w-24 text-center">Unit</th>
                            <th className="py-2 px-2 w-28 text-right">Rate (₱)</th>
                            <th className="py-2 px-2 w-28 text-right">Charges (₱)</th>
                            <th className="py-2 px-3 w-32 text-right">Line total</th>
                            <th className="py-2 px-2 w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle/40">
                          {items.map((item, index) => {
                            const lineTotal = item.quantity * item.rental_duration * item.unit_rate + item.additional_charges;
                            return (
                              <tr key={index} className="hover:bg-surface-app/40">
                                <td className="py-2 px-3">
                                  <input 
                                    type="text" 
                                    placeholder="Description / Crane Model..." 
                                    value={item.description} 
                                    onChange={event => updateItem(index, 'description', event.target.value)} 
                                    className={inputClass} 
                                  />
                                </td>
                                <td className="py-2 px-2">
                                  <input 
                                    type="number" 
                                    min="1" 
                                    value={item.quantity} 
                                    onChange={event => updateItem(index, 'quantity', Number(event.target.value))} 
                                    className={`${inputClass} text-center`} 
                                  />
                                </td>
                                <td className="py-2 px-2">
                                  <input 
                                    type="number" 
                                    min="1" 
                                    value={item.rental_duration} 
                                    onChange={event => updateItem(index, 'rental_duration', Number(event.target.value))} 
                                    className={`${inputClass} text-center`} 
                                  />
                                </td>
                                <td className="py-2 px-2">
                                  <select 
                                    value={item.rental_duration_unit} 
                                    onChange={event => updateItem(index, 'rental_duration_unit', event.target.value)} 
                                    className={inputClass}
                                  >
                                    <option value="day">Day</option>
                                    <option value="week">Week</option>
                                    <option value="month">Month</option>
                                  </select>
                                </td>
                                <td className="py-2 px-2">
                                  <input 
                                    type="number" 
                                    min="0" 
                                    value={item.unit_rate} 
                                    onChange={event => updateItem(index, 'unit_rate', Number(event.target.value))} 
                                    className={`${inputClass} text-right`} 
                                  />
                                </td>
                                <td className="py-2 px-2">
                                  <input 
                                    type="number" 
                                    min="0" 
                                    value={item.additional_charges} 
                                    onChange={event => updateItem(index, 'additional_charges', Number(event.target.value))} 
                                    className={`${inputClass} text-right`} 
                                  />
                                </td>
                                <td className="py-2 px-3 text-right font-medium text-white">
                                  {formatPeso(lineTotal)}
                                </td>
                                <td className="py-2 px-2 text-center">
                                  {items.length > 1 && (
                                    <button 
                                      type="button" 
                                      onClick={() => setItems(items.filter((_, i) => i !== index))} 
                                      className="text-zinc-500 hover:text-red-400 p-1"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <button 
                      type="button"
                      onClick={() => setItems([...items, blankLine()])}
                      className="mt-3 flex items-center gap-1.5 text-sm font-medium text-brand hover:text-[#ffdd44] transition"
                    >
                      <Plus className="h-4 w-4" /> Add line item
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <h2 className="text-lg font-medium text-white">Quotation review queue</h2>
                  
                  <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-surface-card border border-border-subtle text-xs">
                    <button
                      type="button"
                      onClick={() => setFilterStatus('all')}
                      className={`px-2.5 py-1 rounded-md font-medium transition ${filterStatus === 'all' ? 'bg-zinc-700 text-white font-bold' : 'text-content-secondary hover:text-white'}`}
                    >
                      All ({quotes.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterStatus('under_review')}
                      className={`px-2.5 py-1 rounded-md font-medium transition ${filterStatus === 'under_review' ? 'bg-amber-500/20 text-amber-400 font-bold border border-amber-500/40' : 'text-content-secondary hover:text-white'}`}
                    >
                      Awaiting Review ({quotes.filter(q => q.status === 'under_review').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterStatus('approved')}
                      className={`px-2.5 py-1 rounded-md font-medium transition ${filterStatus === 'approved' ? 'bg-green-500/20 text-green-400 font-bold border border-green-500/40' : 'text-content-secondary hover:text-white'}`}
                    >
                      Approved ({quotes.filter(q => q.status === 'approved').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterStatus('sent')}
                      className={`px-2.5 py-1 rounded-md font-medium transition ${filterStatus === 'sent' ? 'bg-blue-500/20 text-blue-400 font-bold border border-blue-500/40' : 'text-content-secondary hover:text-white'}`}
                    >
                      Sent ({quotes.filter(q => q.status === 'sent').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterStatus('accepted')}
                      className={`px-2.5 py-1 rounded-md font-medium transition ${filterStatus === 'accepted' ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40' : 'text-content-secondary hover:text-white'}`}
                    >
                      Accepted ({quotes.filter(q => q.status === 'accepted').length})
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {quotes
                    .filter(q => {
                      if (filterStatus === 'all') return true;
                      if (filterStatus === 'under_review') return q.status === 'under_review';
                      if (filterStatus === 'approved') return q.status === 'approved';
                      if (filterStatus === 'sent') return q.status === 'sent';
                      if (filterStatus === 'accepted') return q.status === 'accepted';
                      if (filterStatus === 'with_jo') return !!q.job_order_id;
                      return true;
                    })
                    .map(quote => {
                      const isSelfCreated = quote.created_by && quote.created_by === currentUserId && currentUserRole !== 'administrator';
                      return (
                      <div key={quote.id} className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface-card p-5 transition hover:border-zinc-600 shadow-sm">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-3">
                              <p className="font-bold text-white text-base tracking-tight">{quote.quotation_number}</p>
                              <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-semibold text-slate-300 border border-zinc-700">
                                {label(quote.status)}
                              </span>
                              {quote.job_order_id && (
                                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                                  Converted to JO #{quote.job_order?.job_order_number || quote.job_order_id}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-content-secondary">
                              <span className="text-slate-200 font-bold">{quote.customer?.company_name || quote.customer?.name}</span> · <span className="text-amber-400 font-mono font-bold">{formatPeso(Number(quote.total_amount))}</span>
                              {quote.description ? ` · ${quote.description}` : ''}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              {quote.history?.at(-1)?.action ? `Latest activity: ${label(quote.history.at(-1)!.action)}` : 'No workflow history yet'}
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2">
                            {['draft'].includes(quote.status) && (
                              <button onClick={() => void action(quote, 'submit')} className="flex items-center gap-1.5 rounded-lg bg-blue-600/10 border border-blue-500/50 px-3 py-1.5 text-xs font-bold text-blue-400 transition hover:bg-blue-600 hover:text-white">
                                <Send className="h-3.5 w-3.5" /> Submit for review
                              </button>
                            )}

                            {quote.status === 'revision_requested' && (
                              <button onClick={() => void action(quote, 'submit')} className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/50 px-3 py-1.5 text-xs font-bold text-amber-400 transition hover:bg-amber-500 hover:text-black">
                                <Send className="h-3.5 w-3.5" /> Resubmit for review
                              </button>
                            )}

                            {quote.status === 'under_review' && (
                              <>
                                {isSelfCreated ? (
                                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-xs font-medium text-amber-400" title="Separation of Duties requires secondary sign-off">
                                    <ShieldAlert className="h-3.5 w-3.5" /> Self-Prepared (Needs Reviewer)
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => setApprovalQuote(quote)}
                                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500 active:scale-95"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve Quote
                                  </button>
                                )}

                                <button
                                  onClick={() => {
                                    setRevisionQuote(quote);
                                    setRevisionNotes('');
                                    setRevisionCategory('pricing');
                                  }}
                                  className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400 transition hover:bg-amber-500/20 active:scale-95"
                                >
                                  <AlertTriangle className="h-3.5 w-3.5" /> Request revision
                                </button>

                                <button
                                  onClick={() => {
                                    setRejectionQuote(quote);
                                    setRejectionNotes('');
                                  }}
                                  className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-500 hover:text-white active:scale-95"
                                >
                                  <XCircle className="h-3.5 w-3.5" /> Reject
                                </button>
                              </>
                            )}

                            {quote.status === 'approved' && (
                              <button onClick={() => void action(quote, 'send')} className="flex items-center gap-1.5 rounded-lg bg-brand text-black px-3.5 py-1.5 text-xs font-bold transition hover:bg-yellow-400 shadow-sm active:scale-95">
                                <Send className="h-3.5 w-3.5" /> Send to client
                              </button>
                            )}

                            {quote.status === 'sent' && (
                              <>
                                <button onClick={() => void action(quote, 'customer-response', { response: 'accepted' })} className="flex items-center gap-1.5 rounded-lg bg-emerald-600/10 border border-emerald-500/50 px-3 py-1.5 text-xs font-bold text-emerald-400 transition hover:bg-emerald-600 hover:text-white active:scale-95">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Client Accepted
                                </button>
                                <button
                                  onClick={() => {
                                    setCustomerFeedbackQuote(quote);
                                    setCustomerFeedbackStatus('rejected');
                                    setCustomerFeedbackNotes('');
                                  }}
                                  className="flex items-center gap-1.5 rounded-lg border border-rose-500/50 bg-rose-600/10 px-3 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-600 hover:text-white active:scale-95"
                                >
                                  <XCircle className="h-3.5 w-3.5" /> Client Rejected
                                </button>
                              </>
                            )}

                            {quote.status === 'accepted' && (
                              <div className="flex items-center gap-2">
                                {!quote.job_order_id ? (
                                  <button
                                    onClick={() => void generateJobOrder(quote)}
                                    className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition hover:from-amber-400 hover:to-amber-500 active:scale-95"
                                  >
                                    <Rocket className="h-4 w-4" /> Generate Job Order
                                  </button>
                                ) : (
                                  <a
                                    href="/job-orders"
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/40 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" /> View Linked Job Order <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Revision Required Advisory Callout Banner */}
                        {quote.status === 'revision_requested' && (
                          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-amber-200">
                            <div className="flex items-center gap-2 font-bold text-amber-400">
                              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                              <span>Manager Correction & Revision Guidance:</span>
                            </div>
                            <p className="mt-1.5 text-slate-200 font-medium pl-6 whitespace-pre-wrap">
                              {quote.revision_notes || quote.history?.find(h => h.action === 'revision_requested')?.notes || 'Please adjust proposal rates, duration, or specifications before resubmitting.'}
                            </p>
                          </div>
                        )}

                        {/* Approval Notes Display */}
                        {quote.approval_notes && quote.status === 'approved' && (
                          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                            <span className="font-bold text-emerald-400">Approval Terms: </span>
                            <span>{quote.approval_notes}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {!quotes.length && (
                    <div className="rounded-md border border-dashed border-zinc-700 p-8 text-center">
                      <p className="text-sm text-content-secondary">No quotations prepared yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-full lg:w-80 shrink-0">
              <div className="sticky top-20 space-y-6">
                
                {/* Summary Card */}
                <div className="rounded-md border border-border-subtle bg-surface-card p-5">
                  <h3 className="text-sm font-semibold text-white mb-4">Quotation summary</h3>
                  
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-center text-content-secondary">
                      <span>Subtotal</span>
                      <span className="font-medium text-slate-200">{formatPeso(subtotal)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-content-secondary">
                      <span>Tax rate</span>
                      <div className="flex items-center gap-1">
                        <input 
                          type="number" 
                          min="0" 
                          max="100" 
                          value={taxRate} 
                          onChange={event => setTaxRate(Number(event.target.value))} 
                          className={`${inputClass} w-20 text-right py-1`} 
                        />
                        <span>%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-content-secondary">
                      <span>Tax</span>
                      <span className="font-medium text-slate-200">{formatPeso(taxAmount)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-content-secondary">
                      <span>Discount</span>
                      <input 
                        type="number" 
                        min="0" 
                        value={discount} 
                        onChange={event => setDiscount(Number(event.target.value))} 
                        className={`${inputClass} w-28 text-right py-1`} 
                      />
                    </div>
                    
                    <div className="pt-4 mt-2 border-t border-border-subtle">
                      <div className="flex justify-between items-center text-base font-bold text-white">
                        <span>Total</span>
                        <span className="text-brand">{formatPeso(total)}</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={saveDraft} 
                    disabled={saving}
                    className="mt-6 w-full flex items-center justify-center gap-2 rounded-md bg-[#238636] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2ea043] disabled:opacity-50"
                  >
                    <ClipboardList className="h-4 w-4" /> {saving ? 'Saving...' : 'Save draft quotation'}
                  </button>
                </div>

                {/* Guidance Card */}
                <div className="rounded-md border border-border-subtle bg-surface-card p-5">
                  <h3 className="text-sm font-semibold text-white mb-3">Commercial guidance</h3>
                  <ul className="space-y-2 text-sm text-content-secondary list-disc pl-4 marker:text-zinc-600">
                    <li>Include erection, dismantle, logistics, operator, and rigger charges where required.</li>
                    <li>Rates are calculated as quantity × duration × unit rate, plus charges.</li>
                    <li>Submit drafts for Sales Manager approval before sending to the client.</li>
                  </ul>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* Manager Revision Modal */}
        <Modal
          isOpen={!!revisionQuote}
          onClose={() => setRevisionQuote(null)}
          title={`Request Revision: ${revisionQuote?.quotation_number}`}
          size="lg"
        >
          <form onSubmit={submitRevision} className="space-y-4 p-2">
            <div>
              <p className="text-xs text-content-secondary mb-3">
                Send this commercial proposal back to the sales representative with specific correctional instructions and pricing directives.
              </p>
              <label className="block text-xs font-bold text-content-secondary mb-1">Revision Category *</label>
              <select
                value={revisionCategory}
                onChange={(e) => setRevisionCategory(e.target.value)}
                className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
              >
                <option value="pricing">Pricing Adjustment Required</option>
                <option value="equipment">Crane Specification Mismatch</option>
                <option value="duration">Rental Duration / Schedule Conflict</option>
                <option value="discount">Discount Exceeds Policy Limits</option>
                <option value="logistics">Logistics & Mobilization Incomplete</option>
                <option value="other">General / Specification Updates</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-content-secondary mb-1">Manager Correction Guidance *</label>
              <textarea
                required
                rows={4}
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="Detail what needs correction (e.g., reduce discount to max 5%, add 1 rigger fee, re-check mobilization date with operations)..."
                className="w-full rounded-xl border border-border-default bg-surface-input p-3 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
              <Button variant="secondary" onClick={() => setRevisionQuote(null)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={revisionLoading}>
                {revisionLoading ? 'Sending...' : 'Send Revision Request'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Manager Approval Modal */}
        <Modal
          isOpen={!!approvalQuote}
          onClose={() => setApprovalQuote(null)}
          title={`Approve Commercial Proposal: ${approvalQuote?.quotation_number}`}
          size="md"
        >
          <form onSubmit={submitApproval} className="space-y-4 p-2">
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-300">
              <p className="font-bold">Total Proposal Value: {formatPeso(Number(approvalQuote?.total_amount ?? 0))}</p>
              <p className="text-[11px] text-emerald-400/80 mt-0.5">Client: {approvalQuote?.customer?.company_name || approvalQuote?.customer?.name}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-content-secondary mb-1">Approval Conditions / Remarks (Optional)</label>
              <textarea
                rows={3}
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="e.g. Approved subject to 30-day payment terms and mobilization advance deposit..."
                className="w-full rounded-xl border border-border-default bg-surface-input p-3 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
              <Button variant="secondary" onClick={() => setApprovalQuote(null)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={approvalLoading}>
                {approvalLoading ? 'Approving...' : 'Confirm & Approve'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Manager Rejection Modal */}
        <Modal
          isOpen={!!rejectionQuote}
          onClose={() => setRejectionQuote(null)}
          title={`Reject Quotation: ${rejectionQuote?.quotation_number}`}
          size="md"
        >
          <form onSubmit={submitRejection} className="space-y-4 p-2">
            <div>
              <label className="block text-xs font-bold text-content-secondary mb-1">Rejection Reason *</label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
              >
                <option value="rate_too_low">Margin / Unit Rate Too Low</option>
                <option value="equipment_unavailable">Equipment Allocation Conflict</option>
                <option value="client_credit_risk">Credit Risk / Unqualified Account</option>
                <option value="project_cancelled">Project Cancelled by Client</option>
                <option value="other">Other Commercial Reason</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-content-secondary mb-1">Detailed Explanation</label>
              <textarea
                rows={3}
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                placeholder="State why this proposal cannot proceed..."
                className="w-full rounded-xl border border-border-default bg-surface-input p-3 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
              <Button variant="secondary" onClick={() => setRejectionQuote(null)}>Cancel</Button>
              <Button variant="danger" type="submit" disabled={rejectionLoading}>
                {rejectionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Customer Response / Feedback Modal */}
        <Modal
          isOpen={!!customerFeedbackQuote}
          onClose={() => setCustomerFeedbackQuote(null)}
          title={`Record Client Feedback: ${customerFeedbackQuote?.quotation_number}`}
          size="md"
        >
          <form onSubmit={submitCustomerResponse} className="space-y-4 p-2">
            <div>
              <label className="block text-xs font-bold text-content-secondary mb-1">Customer Decision</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCustomerFeedbackStatus('accepted')}
                  className={`rounded-xl p-2.5 text-xs font-bold border transition ${customerFeedbackStatus === 'accepted' ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300' : 'border-border-default bg-surface-input text-content-secondary'}`}
                >
                  Accepted Deal
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerFeedbackStatus('rejected')}
                  className={`rounded-xl p-2.5 text-xs font-bold border transition ${customerFeedbackStatus === 'rejected' ? 'border-rose-500 bg-rose-500/20 text-rose-300' : 'border-border-default bg-surface-input text-content-secondary'}`}
                >
                  Lost / Declined
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-content-secondary mb-1">Client Feedback / Reason Notes</label>
              <textarea
                rows={3}
                value={customerFeedbackNotes}
                onChange={(e) => setCustomerFeedbackNotes(e.target.value)}
                placeholder={customerFeedbackStatus === 'accepted' ? "e.g. PO #12345 issued, target delivery next Monday..." : "e.g. Selected competitor with lower mobilization fee, delayed project..."}
                className="w-full rounded-xl border border-border-default bg-surface-input p-3 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
              <Button variant="secondary" onClick={() => setCustomerFeedbackQuote(null)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={customerFeedbackLoading}>
                {customerFeedbackLoading ? 'Saving...' : 'Save Feedback'}
              </Button>
            </div>
          </form>
        </Modal>

      </AppLayout>
    </>
  );
};

export default QuotationWorkspace;