import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { Building2, ClipboardList, Plus, Send, Trash2 } from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';
import { Card, CardBody, CardHeader } from '../../Components/Card';
import Button from '../../Components/Button';
import { formatPeso } from '../../Utils/currency';

interface Customer { id: number; name: string; company_name?: string; city?: string; project_location?: string; }
interface Line { description: string; quantity: number; rental_duration: number; rental_duration_unit: string; unit_rate: number; additional_charges: number; }
interface Quote { id: number; quotation_number: string; status: string; total_amount: number; customer?: Customer; history?: Array<{ id: number; action: string; notes?: string; created_at: string }>; }
const blankLine = (): Line => ({ description: '', quantity: 1, rental_duration: 1, rental_duration_unit: 'day', unit_rate: 0, additional_charges: 0 });
const label = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());

const QuotationWorkspace = () => {
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
  const selectedCustomer = customers.find(customer => String(customer.id) === customerId);
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
    } catch { setMessage('Unable to save draft. Select a client and complete each line item.'); } finally { setSaving(false); }
  };

  const action = async (quote: Quote, endpoint: string, body: Record<string, unknown> = {}) => {
    const response = await fetch(`/api/quotations/${quote.id}/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) });
    if (!response.ok) { setMessage('This action is not allowed for your role or the quotation status.'); return; }
    await load();
    setMessage(`${quote.quotation_number} updated.`);
  };

  return <><Head title="Sales & Quotation Management" /><AppLayout title="Sales & Quotation Management"><div className="space-y-5">
    {message && <p className="border border-neutral-300 bg-neutral-50 p-3 text-sm text-neutral-700 dark:border-white/10 dark:bg-white/5 dark:text-neutral-200">{message}</p>}
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card><CardHeader title="New construction quotation" subtitle="Build a commercial proposal from services, equipment rental, and site requirements." /><CardBody><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Client<select value={customerId} onChange={event => setCustomerId(event.target.value)} className="mt-1 w-full border border-neutral-300 bg-white p-2.5 text-sm"><option value="">Select client</option>{customers.map(customer => <option key={customer.id} value={customer.id}>{customer.company_name || customer.name}</option>)}</select></label><label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Valid until<input type="date" value={validUntil} onChange={event => setValidUntil(event.target.value)} className="mt-1 w-full border border-neutral-300 p-2.5 text-sm" /></label><label className="text-sm font-medium text-neutral-700 dark:text-neutral-200 md:col-span-2">Proposal scope<input value={description} onChange={event => setDescription(event.target.value)} placeholder="e.g. Tower crane rental, erection, operator, and rigging support" className="mt-1 w-full border border-neutral-300 p-2.5 text-sm" /></label></div>
      {selectedCustomer && <div className="mt-4 flex items-center gap-3 border border-neutral-200 bg-neutral-50 p-3 text-sm dark:border-white/10 dark:bg-white/5"><Building2 className="h-5 w-5 text-[#246bdb] dark:text-[#ffd000]" /><div><p className="font-medium text-neutral-900 dark:text-white">{selectedCustomer.company_name || selectedCustomer.name}</p><p className="text-neutral-500 dark:text-neutral-400">{selectedCustomer.project_location || selectedCustomer.city || 'Project location not recorded'}</p></div></div>}
      <div className="mt-6 overflow-x-auto border border-neutral-200 dark:border-white/10"><div className="min-w-[880px]"><div className="grid grid-cols-[minmax(260px,1fr)_75px_120px_95px_130px_130px_44px] gap-2 border-b border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-neutral-400"><span>Description</span><span>Qty</span><span>Duration</span><span>Unit</span><span>Rate (PHP)</span><span>Charges</span><span /></div>{items.map((item, index) => <div className="grid grid-cols-[minmax(260px,1fr)_75px_120px_95px_130px_130px_44px] gap-2 border-b border-neutral-100 px-3 py-2 last:border-0 dark:border-white/8" key={index}><input value={item.description} onChange={event => updateItem(index, 'description', event.target.value)} placeholder="Crane rental, logistics, riggers, etc." className="border border-neutral-300 p-2 text-sm" /><input type="number" min="1" value={item.quantity} onChange={event => updateItem(index, 'quantity', Number(event.target.value))} className="border border-neutral-300 p-2 text-sm" /><input type="number" min="1" value={item.rental_duration} onChange={event => updateItem(index, 'rental_duration', Number(event.target.value))} className="border border-neutral-300 p-2 text-sm" /><select value={item.rental_duration_unit} onChange={event => updateItem(index, 'rental_duration_unit', event.target.value)} className="border border-neutral-300 bg-white p-2 text-sm"><option value="day">Day(s)</option><option value="week">Week(s)</option><option value="month">Month(s)</option></select><input type="number" min="0" value={item.unit_rate} onChange={event => updateItem(index, 'unit_rate', Number(event.target.value))} className="border border-neutral-300 p-2 text-sm" /><input type="number" min="0" value={item.additional_charges} onChange={event => updateItem(index, 'additional_charges', Number(event.target.value))} className="border border-neutral-300 p-2 text-sm" /><button type="button" disabled={items.length === 1} onClick={() => setItems(items.filter((_, itemIndex) => itemIndex !== index))} className="text-error-600 disabled:opacity-30 dark:text-red-300"><Trash2 className="h-4 w-4" /></button></div>)}</div></div><Button variant="outline" size="sm" className="mt-3" onClick={() => setItems([...items, blankLine()])}><Plus className="h-4 w-4" />Add line item</Button></CardBody></Card>
      <div className="space-y-5"><Card><CardHeader title="Quotation summary" /><CardBody><div className="space-y-3 text-sm"><div className="flex justify-between text-neutral-600 dark:text-neutral-300"><span>Subtotal</span><strong>{formatPeso(subtotal)}</strong></div><label className="flex items-center justify-between gap-3 text-neutral-600 dark:text-neutral-300"><span>Tax rate</span><input type="number" min="0" max="100" value={taxRate} onChange={event => setTaxRate(Number(event.target.value))} className="w-20 border border-neutral-300 p-2 text-right text-sm" />%</label><div className="flex justify-between text-neutral-600 dark:text-neutral-300"><span>Tax</span><strong>{formatPeso(taxAmount)}</strong></div><label className="flex items-center justify-between gap-3 text-neutral-600 dark:text-neutral-300"><span>Discount</span><input type="number" min="0" value={discount} onChange={event => setDiscount(Number(event.target.value))} className="w-32 border border-neutral-300 p-2 text-right text-sm" /></label><div className="border-t border-neutral-200 pt-3 dark:border-white/10"><div className="flex justify-between text-base font-semibold text-neutral-900 dark:text-white"><span>Proposal total</span><span>{formatPeso(total)}</span></div></div></div><Button className="mt-5 w-full" onClick={saveDraft} loading={saving}><ClipboardList className="h-4 w-4" />Save draft quotation</Button></CardBody></Card><Card><CardHeader title="Commercial guidance" /><CardBody><ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-300"><li>Include erection, dismantle, logistics, operator, and rigger charges where required.</li><li>Rates are calculated as quantity × duration × unit rate, plus charges.</li><li>Submit drafts for Sales Manager approval before sending to the client.</li></ul></CardBody></Card></div>
    </div>
    <Card><CardHeader title="Quotation review queue" subtitle="Track commercial proposals from draft through client response." /><CardBody><div className="space-y-3">{quotes.map(quote => <div className="flex flex-col gap-3 border border-neutral-200 p-4 dark:border-white/10 lg:flex-row lg:items-center lg:justify-between" key={quote.id}><div><div className="flex items-center gap-2"><p className="font-semibold text-neutral-900 dark:text-white">{quote.quotation_number}</p><span className="border border-neutral-200 px-2 py-0.5 text-xs dark:border-white/15">{label(quote.status)}</span></div><p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{quote.customer?.company_name || quote.customer?.name} · {formatPeso(Number(quote.total_amount))}</p><p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{quote.history?.at(-1)?.action ? `Latest: ${label(quote.history.at(-1)!.action)}` : 'No workflow history yet'}</p></div><div className="flex flex-wrap gap-2">{['draft', 'revision_requested'].includes(quote.status) && <Button size="sm" onClick={() => void action(quote, 'submit')}><Send className="h-4 w-4" />Submit</Button>}{quote.status === 'under_review' && <><Button size="sm" onClick={() => void action(quote, 'approve')}>Approve</Button><Button size="sm" variant="outline" onClick={() => void action(quote, 'revise', { revision_notes: 'Revision requested by manager.' })}>Request revision</Button></>}{quote.status === 'approved' && <Button size="sm" onClick={() => void action(quote, 'send')}>Send to client</Button>}{quote.status === 'sent' && <><Button size="sm" onClick={() => void action(quote, 'customer-response', { response: 'accepted' })}>Record accepted</Button><Button size="sm" variant="outline" onClick={() => void action(quote, 'customer-response', { response: 'rejected' })}>Record rejected</Button></>}</div></div>)}{!quotes.length && <p className="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">No quotations prepared yet.</p>}</div></CardBody></Card>
  </div></AppLayout></>;
};

export default QuotationWorkspace;