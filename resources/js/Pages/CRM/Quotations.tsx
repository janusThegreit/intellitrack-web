import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { Building2, ClipboardList, Plus, Send, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';
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
      setTimeout(() => setMessage(''), 4000);
    } catch { 
      setMessage('Unable to save draft. Select a client and complete each line item.'); 
    } finally { 
      setSaving(false); 
    }
  };

  const action = async (quote: Quote, endpoint: string, body: Record<string, unknown> = {}) => {
    const response = await fetch(`/api/quotations/${quote.id}/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) });
    if (!response.ok) { setMessage('This action is not allowed for your role or the quotation status.'); return; }
    await load();
    setMessage(`${quote.quotation_number} updated.`);
    setTimeout(() => setMessage(''), 4000);
  };

  const inputClass = "w-full rounded-md border border-zinc-700 bg-surface-input px-3 py-1.5 text-sm text-white focus:border-brand focus:ring-1 focus:ring-brand outline-none transition";

  return (
    <>
      <Head title="Sales & Quotation Management" />
      <AppLayout dark={true} title="Sales & Quotation Management">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          
          <div className="mb-6 pb-2 border-b border-border-subtle flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white">Quotations</h1>
              <p className="text-sm text-content-secondary mt-1">Manage and build commercial proposals.</p>
            </div>
          </div>

          {message && (
            <div className="mb-6 rounded-md border border-blue-500/30 bg-blue-500/10 p-4">
              <p className="text-sm font-medium text-blue-400">{message}</p>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Left Main Content */}
            <div className="flex-1 min-w-0 space-y-8">
              
              {/* New Quotation Builder */}
              <div>
                <h2 className="text-lg font-medium text-white mb-4">New construction quotation</h2>
                
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-200 mb-1">Client</label>
                      <select 
                        value={customerId} 
                        onChange={event => setCustomerId(event.target.value)} 
                        className={inputClass}
                      >
                        <option value="">Select client</option>
                        {customers.map(customer => (
                          <option key={customer.id} value={customer.id}>{customer.company_name || customer.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-200 mb-1">Valid until</label>
                      <input 
                        type="date" 
                        value={validUntil} 
                        onChange={event => setValidUntil(event.target.value)} 
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-1">Proposal scope</label>
                    <input 
                      value={description} 
                      onChange={event => setDescription(event.target.value)} 
                      placeholder="e.g. Tower crane rental, erection, operator, and rigging support" 
                      className={inputClass}
                    />
                  </div>

                  {selectedCustomer && (
                    <div className="flex items-center gap-3 rounded-md border border-zinc-800 bg-zinc-900/50 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10">
                        <Building2 className="h-5 w-5 text-brand" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{selectedCustomer.company_name || selectedCustomer.name}</p>
                        <p className="text-xs text-content-secondary">{selectedCustomer.project_location || selectedCustomer.city || 'Project location not recorded'}</p>
                      </div>
                    </div>
                  )}

                  {/* Line Items Table */}
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-slate-200 mb-2">Line Items</label>
                    <div className="rounded-md border border-border-subtle bg-surface-card overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-zinc-800/30 text-content-secondary">
                          <tr>
                            <th className="px-3 py-2 font-semibold">Description</th>
                            <th className="px-3 py-2 font-semibold w-24">Qty</th>
                            <th className="px-3 py-2 font-semibold w-24">Duration</th>
                            <th className="px-3 py-2 font-semibold w-32">Unit</th>
                            <th className="px-3 py-2 font-semibold w-32">Rate (PHP)</th>
                            <th className="px-3 py-2 font-semibold w-32">Charges</th>
                            <th className="px-3 py-2 font-semibold w-12"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                          {items.map((item, index) => (
                            <tr key={index} className="hover:bg-zinc-800/10 transition-colors">
                              <td className="px-2 py-2">
                                <input value={item.description} onChange={event => updateItem(index, 'description', event.target.value)} placeholder="Crane rental, logistics..." className={`${inputClass} border-transparent bg-transparent hover:bg-surface-input hover:border-zinc-700 focus:bg-surface-input focus:border-brand`} />
                              </td>
                              <td className="px-2 py-2">
                                <input type="number" min="1" value={item.quantity} onChange={event => updateItem(index, 'quantity', Number(event.target.value))} className={`${inputClass} border-transparent bg-transparent hover:bg-surface-input hover:border-zinc-700 focus:bg-surface-input focus:border-brand`} />
                              </td>
                              <td className="px-2 py-2">
                                <input type="number" min="1" value={item.rental_duration} onChange={event => updateItem(index, 'rental_duration', Number(event.target.value))} className={`${inputClass} border-transparent bg-transparent hover:bg-surface-input hover:border-zinc-700 focus:bg-surface-input focus:border-brand`} />
                              </td>
                              <td className="px-2 py-2">
                                <select value={item.rental_duration_unit} onChange={event => updateItem(index, 'rental_duration_unit', event.target.value)} className={`${inputClass} border-transparent bg-transparent hover:bg-surface-input hover:border-zinc-700 focus:bg-surface-input focus:border-brand`}>
                                  <option value="day">Day(s)</option>
                                  <option value="week">Week(s)</option>
                                  <option value="month">Month(s)</option>
                                </select>
                              </td>
                              <td className="px-2 py-2">
                                <input type="number" min="0" value={item.unit_rate} onChange={event => updateItem(index, 'unit_rate', Number(event.target.value))} className={`${inputClass} border-transparent bg-transparent hover:bg-surface-input hover:border-zinc-700 focus:bg-surface-input focus:border-brand`} />
                              </td>
                              <td className="px-2 py-2">
                                <input type="number" min="0" value={item.additional_charges} onChange={event => updateItem(index, 'additional_charges', Number(event.target.value))} className={`${inputClass} border-transparent bg-transparent hover:bg-surface-input hover:border-zinc-700 focus:bg-surface-input focus:border-brand`} />
                              </td>
                              <td className="px-2 py-2 text-center">
                                <button type="button" disabled={items.length === 1} onClick={() => setItems(items.filter((_, itemIndex) => itemIndex !== index))} className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-md disabled:opacity-30 transition">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
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

              {/* Quotation Queue */}
              <div className="pt-8">
                <h2 className="text-lg font-medium text-white mb-4">Quotation review queue</h2>
                <div className="space-y-3">
                  {quotes.map(quote => (
                    <div key={quote.id} className="flex flex-col gap-4 rounded-md border border-border-subtle bg-surface-card p-4 lg:flex-row lg:items-center lg:justify-between transition hover:border-zinc-600">
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="font-semibold text-white">{quote.quotation_number}</p>
                          <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-slate-300 border border-zinc-700">
                            {label(quote.status)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-content-secondary">
                          <span className="text-slate-300 font-medium">{quote.customer?.company_name || quote.customer?.name}</span> · {formatPeso(Number(quote.total_amount))}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {quote.history?.at(-1)?.action ? `Latest activity: ${label(quote.history.at(-1)!.action)}` : 'No workflow history yet'}
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        {['draft', 'revision_requested'].includes(quote.status) && (
                          <button onClick={() => void action(quote, 'submit')} className="flex items-center gap-1.5 rounded-md bg-blue-600/10 border border-blue-500/50 px-3 py-1.5 text-sm font-semibold text-blue-400 transition hover:bg-blue-600 hover:text-white">
                            <Send className="h-3.5 w-3.5" /> Submit for review
                          </button>
                        )}
                        {quote.status === 'under_review' && (
                          <>
                            <button onClick={() => void action(quote, 'approve')} className="flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-green-700">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                            </button>
                            <button onClick={() => void action(quote, 'revise', { revision_notes: 'Revision requested.' })} className="flex items-center gap-1.5 rounded-md border border-zinc-600 bg-transparent px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-zinc-800">
                              Request revision
                            </button>
                          </>
                        )}
                        {quote.status === 'approved' && (
                          <button onClick={() => void action(quote, 'send')} className="flex items-center gap-1.5 rounded-md bg-brand text-black px-3 py-1.5 text-sm font-semibold transition hover:bg-yellow-400">
                            <Send className="h-3.5 w-3.5" /> Send to client
                          </button>
                        )}
                        {quote.status === 'sent' && (
                          <>
                            <button onClick={() => void action(quote, 'customer-response', { response: 'accepted' })} className="flex items-center gap-1.5 rounded-md bg-green-600/10 border border-green-500/50 px-3 py-1.5 text-sm font-semibold text-green-500 transition hover:bg-green-600 hover:text-white">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Accepted
                            </button>
                            <button onClick={() => void action(quote, 'customer-response', { response: 'rejected' })} className="flex items-center gap-1.5 rounded-md border border-red-500/50 bg-red-600/10 px-3 py-1.5 text-sm font-semibold text-red-500 transition hover:bg-red-600 hover:text-white">
                              <XCircle className="h-3.5 w-3.5" /> Rejected
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
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
      </AppLayout>
    </>
  );
};

export default QuotationWorkspace;