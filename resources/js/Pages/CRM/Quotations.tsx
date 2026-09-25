import { useEffect, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { 
  ClipboardList, 
  Plus, 
  Send, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Rocket, 
  ExternalLink, 
  AlertTriangle, 
  ShieldAlert,
  Truck,
  Wrench,
  UserCheck,
  Clock,
  Sparkles,
  Layers
} from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';
import { formatPeso } from '../../Utils/currency';
import CrmNavTabs from '../../Components/CrmNavTabs';
import Modal from '../../Components/Modal';
import Button from '../../Components/Button';

interface Customer { id: number; name: string; company_name?: string; city?: string; project_location?: string; }

interface EquipmentItem {
  id: number;
  code: string;
  name: string;
  crane_model?: string | null;
  category?: string | null;
  crane_category?: string | null;
  rental_rate: number | string;
  rental_unit: string;
  status: string;
  maximum_load?: number | string | null;
  maximum_load_unit?: string | null;
}

interface Line {
  equipment_id?: number | string | null;
  description: string;
  quantity: number;
  rental_duration: number;
  rental_duration_unit: 'day' | 'week' | 'month';
  unit_rate: number;
  mobilization_fee: number;
  erection_dismantle_fee: number;
  operator_allowance: number;
  additional_charges: number;
}

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

const blankLine = (): Line => ({
  equipment_id: null,
  description: '',
  quantity: 1,
  rental_duration: 1,
  rental_duration_unit: 'day',
  unit_rate: 0,
  mobilization_fee: 0,
  erection_dismantle_fee: 0,
  operator_allowance: 0,
  additional_charges: 0,
});
const label = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, (letter: string) => letter.toUpperCase());

const QuotationWorkspace = () => {
  const { auth } = usePage<any>().props;
  const currentUserId = auth?.user?.id;
  const currentUserRole = auth?.user?.role;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([]);
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
    const [clientResponse, quoteResponse, equipResponse] = await Promise.all([
      fetch('/api/customers?per_page=100', { headers: { Accept: 'application/json' } }),
      fetch('/api/quotations?per_page=100', { headers: { Accept: 'application/json' } }),
      fetch('/api/equipment?per_page=100', { headers: { Accept: 'application/json' } }).catch(() => null),
    ]);
    if (!clientResponse.ok || !quoteResponse.ok) throw new Error();
    setCustomers((await clientResponse.json()).data ?? []);
    setQuotes((await quoteResponse.json()).data ?? []);
    if (equipResponse && equipResponse.ok) {
      const equipJson = await equipResponse.json();
      setEquipmentList(equipJson.data ?? []);
    }
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
  
  // Breakdown & Totals calculations
  const baseRentalSubtotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 1) * (Number(item.rental_duration) || 1) * (Number(item.unit_rate) || 0), 0);
  const totalMobilization = items.reduce((sum, item) => sum + (Number(item.mobilization_fee) || 0), 0);
  const totalErection = items.reduce((sum, item) => sum + (Number(item.erection_dismantle_fee) || 0), 0);
  const totalOperatorAllowance = items.reduce((sum, item) => sum + (Number(item.operator_allowance) || 0), 0);
  const totalOperationalCharges = items.reduce((sum, item) => sum + (Number(item.additional_charges) || 0), 0);
  const subtotal = baseRentalSubtotal + totalOperationalCharges;
  const taxAmount = subtotal * (taxRate / 100);
  const total = Math.max(0, subtotal + taxAmount - discount);
  
  const updateItem = (index: number, field: keyof Line, value: any) => {
    setItems(prevItems => prevItems.map((item, itemIndex) => {
      if (itemIndex !== index) return item;

      const updated = { ...item, [field]: value };

      if (field === 'mobilization_fee' || field === 'erection_dismantle_fee' || field === 'operator_allowance') {
        const mob = field === 'mobilization_fee' ? Math.max(0, Number(value) || 0) : Math.max(0, Number(item.mobilization_fee) || 0);
        const erec = field === 'erection_dismantle_fee' ? Math.max(0, Number(value) || 0) : Math.max(0, Number(item.erection_dismantle_fee) || 0);
        const op = field === 'operator_allowance' ? Math.max(0, Number(value) || 0) : Math.max(0, Number(item.operator_allowance) || 0);
        updated.additional_charges = mob + erec + op;
      }

      return updated;
    }));
  };

  const handleSelectEquipment = (index: number, equipIdStr: string) => {
    if (!equipIdStr) {
      setItems(prevItems => prevItems.map((item, i) => i === index ? { ...item, equipment_id: null } : item));
      return;
    }

    const equipId = Number(equipIdStr);
    const equip = equipmentList.find(e => e.id === equipId);
    if (!equip) return;

    const baseRate = Number(equip.rental_rate) || 0;
    const baseUnit: 'day' | 'week' | 'month' = 
      equip.rental_unit === 'month' ? 'month' :
      equip.rental_unit === 'week' ? 'week' : 'day';

    // Auto-calculate suggested operational charges based on crane/equipment category
    let defaultMob = 0;
    let defaultErec = 0;
    let defaultOp = 0;

    const cat = (equip.category || '').toLowerCase();
    const craneCat = (equip.crane_category || '').toLowerCase();
    const name = (equip.name || '').toLowerCase();

    if (cat.includes('tower') || craneCat.includes('luffing') || craneCat.includes('flat') || name.includes('tower')) {
      defaultMob = 35000; // Lowbed transport & site haulage
      defaultErec = 45000; // Erection, anchoring & auxiliary crane
      defaultOp = baseUnit === 'month' ? 25000 : 1500; // Certified operator & rigger
    } else if (cat.includes('mobile') || craneCat.includes('terrain') || name.includes('crane')) {
      defaultMob = 25000; // Heavy lowbed trailer dispatch
      defaultErec = 15000; // Jib assembly & counterweight rigging
      defaultOp = baseUnit === 'month' ? 20000 : 1200; // Certified mobile crane operator
    } else if (name.includes('excavator') || cat.includes('heavy') || name.includes('cat 320')) {
      defaultMob = 12000; // Lowbed trailer haulage
      defaultErec = 0;
      defaultOp = baseUnit === 'month' ? 18000 : 800; // Heavy equipment operator
    } else if (name.includes('boom truck') || name.includes('truck')) {
      defaultMob = 5000; // Dispatch & transport
      defaultErec = 0;
      defaultOp = baseUnit === 'month' ? 15000 : 700; // Driver-operator
    }

    const totalOps = defaultMob + defaultErec + defaultOp;

    setItems(prevItems => prevItems.map((item, i) => {
      if (i !== index) return item;
      return {
        ...item,
        equipment_id: equip.id,
        description: `${equip.name}${equip.code ? ` (${equip.code})` : ''}`,
        unit_rate: baseRate,
        rental_duration_unit: baseUnit,
        mobilization_fee: defaultMob,
        erection_dismantle_fee: defaultErec,
        operator_allowance: defaultOp,
        additional_charges: totalOps,
      };
    }));
  };

  const setValidityPreset = (days: number) => {
    const target = new Date();
    target.setDate(target.getDate() + days);
    const dateStr = target.toISOString().split('T')[0];
    setValidUntil(dateStr);
  };

  const getDaysFromToday = (dateStr: string): number | null => {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      const payloadItems = items.map(item => ({
        equipment_id: item.equipment_id ? Number(item.equipment_id) : null,
        description: item.description,
        quantity: Number(item.quantity) || 1,
        rental_duration: Number(item.rental_duration) || 1,
        rental_duration_unit: item.rental_duration_unit,
        unit_rate: Number(item.unit_rate) || 0,
        additional_charges: Number(item.additional_charges) || 0,
      }));

      const response = await fetch('/api/quotations', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, 
        body: JSON.stringify({ 
          customer_id: Number(customerId), 
          description, 
          valid_until: validUntil || null, 
          tax_rate: taxRate, 
          discount_amount: discount, 
          items: payloadItems 
        }) 
      });
      if (!response.ok) throw new Error();
      await load();
      setMessage('Draft quotation created. Submit it for manager approval when ready.');
      setDescription(''); 
      setItems([blankLine()]); 
      setTaxRate(0); 
      setDiscount(0); 
      setValidUntil('');
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

  const inputClass = "w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-sm text-content-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none transition shadow-xs";

  return (
    <>
      <Head title="Sales & Quotation Management" />
      <AppLayout title="CRM & Quotation Management">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <CrmNavTabs />
          
          <div className="mb-6 pb-2 border-b border-border-subtle flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-content-primary">Quotations</h1>
              <p className="text-sm text-content-secondary mt-1">Manage, approve, and convert commercial proposals into active Job Orders.</p>
            </div>
          </div>

          {message && (
            <div className="mb-6 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
              <p className="text-sm font-medium text-blue-500 dark:text-blue-400">{message}</p>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            
            <div className="flex-1 min-w-0 space-y-8">
              
              <div>
                <h2 className="text-lg font-semibold text-content-primary mb-4">New construction quotation</h2>
                
                <div className="space-y-5 rounded-2xl border border-border-default/80 bg-surface-card p-5 shadow-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-content-secondary mb-1">Select Client</label>
                      <select 
                        value={customerId} 
                        onChange={event => setCustomerId(event.target.value)} 
                        className={inputClass}
                      >
                        <option value="">Choose an account...</option>
                        {customers.map(customer => (
                          <option key={customer.id} value={customer.id} className="bg-surface-card text-content-primary">
                            {customer.company_name || customer.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-content-secondary mb-1">Proposal Subject</label>
                      <input 
                        type="text" 
                        placeholder="Tower crane lease / project reference..." 
                        value={description} 
                        onChange={event => setDescription(event.target.value)} 
                        className={inputClass} 
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-content-secondary">Offer Valid Until</label>
                        {validUntil && (
                          <span className="text-[11px] font-medium text-amber-500 dark:text-amber-400">
                            {(() => {
                              const days = getDaysFromToday(validUntil);
                              if (days === null) return '';
                              if (days < 0) return `${Math.abs(days)}d ago (Expired)`;
                              if (days === 0) return 'Expires today';
                              return `${days} days validity`;
                            })()}
                          </span>
                        )}
                      </div>
                      <input 
                        type="date" 
                        value={validUntil} 
                        onChange={event => setValidUntil(event.target.value)} 
                        className={inputClass} 
                      />
                      {/* Quick Offer Validity Presets */}
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-medium text-content-tertiary mr-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-500" /> Presets:
                        </span>
                        {[15, 30, 45, 60].map(days => {
                          const isSelected = getDaysFromToday(validUntil) === days;
                          return (
                            <button
                              key={days}
                              type="button"
                              onClick={() => setValidityPreset(days)}
                              className={`px-2 py-0.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer border ${
                                isSelected
                                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-xs'
                                  : 'bg-surface-app border-border-default/80 text-content-secondary hover:text-content-primary hover:border-border-default'
                              }`}
                            >
                              {days} Days{days === 30 ? ' (Std)' : ''}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border-subtle">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-content-primary flex items-center gap-2">
                          <Layers className="h-4 w-4 text-amber-500" />
                          Line items & heavy equipment operational charges
                        </h3>
                        <p className="text-xs text-content-secondary mt-0.5">
                          Select equipment to auto-populate standard leasing rates and suggested mobilization fees.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-content-tertiary">Fleet database:</span>
                        <span className="font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          {equipmentList.length} units loaded
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {items.map((item, index) => {
                        const baseLease = (Number(item.quantity) || 1) * (Number(item.rental_duration) || 1) * (Number(item.unit_rate) || 0);
                        const lineTotal = baseLease + (Number(item.additional_charges) || 0);
                        const isAutoFilled = !!item.equipment_id;

                        return (
                          <div 
                            key={index}
                            className="rounded-xl border border-border-default/80 bg-surface-app/30 p-4 transition-all hover:border-amber-500/30"
                          >
                            {/* Header of Item */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border-subtle/50 mb-3">
                              <div className="flex items-center gap-2">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 text-xs font-bold font-mono">
                                  {index + 1}
                                </span>
                                <span className="text-xs font-bold text-content-primary">
                                  Item #{index + 1}
                                </span>
                                {isAutoFilled && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full">
                                    <Sparkles className="w-3 h-3" /> Rate Auto-Filled
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-xs font-mono font-bold text-content-primary">
                                  Line Total: <span className="text-amber-500 dark:text-amber-400 font-bold">{formatPeso(lineTotal)}</span>
                                </div>
                                {items.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => setItems(items.filter((_, i) => i !== index))}
                                    className="text-content-secondary hover:text-red-500 p-1 cursor-pointer transition-colors"
                                    title="Remove item"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Equipment selector & Rate Auto-Fill */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3">
                              <div className="md:col-span-5">
                                <label className="block text-[11px] font-semibold text-content-secondary mb-1">
                                  Select Heavy Equipment / Crane (Auto-Fill Rate)
                                </label>
                                <select
                                  value={item.equipment_id ? String(item.equipment_id) : ''}
                                  onChange={e => handleSelectEquipment(index, e.target.value)}
                                  className={inputClass}
                                >
                                  <option value="">-- Choose from fleet database or manual entry --</option>
                                  <optgroup label="Tower Cranes (Flat-Top & Luffing)">
                                    {equipmentList.filter(e => (e.category || '').includes('tower') || (e.crane_category || '').includes('luffing') || (e.crane_category || '').includes('flat') || (e.name || '').includes('Tower')).map(eq => (
                                      <option key={eq.id} value={eq.id} className="bg-surface-card text-content-primary">
                                        [{eq.code}] {eq.name} — ₱{Number(eq.rental_rate).toLocaleString()}/{eq.rental_unit}
                                      </option>
                                    ))}
                                  </optgroup>
                                  <optgroup label="Mobile & Rough-Terrain Cranes">
                                    {equipmentList.filter(e => (e.category || '').includes('mobile') || (e.crane_category || '').includes('terrain') || ((e.name || '').includes('Crane') && !(e.name || '').includes('Tower'))).map(eq => (
                                      <option key={eq.id} value={eq.id} className="bg-surface-card text-content-primary">
                                        [{eq.code}] {eq.name} — ₱{Number(eq.rental_rate).toLocaleString()}/{eq.rental_unit}
                                      </option>
                                    ))}
                                  </optgroup>
                                  <optgroup label="Heavy Earthmoving & Excavators">
                                    {equipmentList.filter(e => (e.category || '').toLowerCase().includes('heavy') || (e.name || '').toLowerCase().includes('excavator') || (e.name || '').toLowerCase().includes('cat 320')).map(eq => (
                                      <option key={eq.id} value={eq.id} className="bg-surface-card text-content-primary">
                                        [{eq.code}] {eq.name} — ₱{Number(eq.rental_rate).toLocaleString()}/{eq.rental_unit}
                                      </option>
                                    ))}
                                  </optgroup>
                                  <optgroup label="Transportation & Boom Trucks">
                                    {equipmentList.filter(e => (e.category || '').toLowerCase().includes('transport') || (e.name || '').toLowerCase().includes('truck')).map(eq => (
                                      <option key={eq.id} value={eq.id} className="bg-surface-card text-content-primary">
                                        [{eq.code}] {eq.name} — ₱{Number(eq.rental_rate).toLocaleString()}/{eq.rental_unit}
                                      </option>
                                    ))}
                                  </optgroup>
                                  {equipmentList.filter(e => {
                                    const n = (e.name || '').toLowerCase();
                                    const c = (e.category || '').toLowerCase();
                                    return !n.includes('tower') && !n.includes('crane') && !n.includes('excavator') && !n.includes('truck') && !c.includes('crane');
                                  }).length > 0 && (
                                    <optgroup label="Other Equipment & Kits">
                                      {equipmentList.filter(e => {
                                        const n = (e.name || '').toLowerCase();
                                        const c = (e.category || '').toLowerCase();
                                        return !n.includes('tower') && !n.includes('crane') && !n.includes('excavator') && !n.includes('truck') && !c.includes('crane');
                                      }).map(eq => (
                                        <option key={eq.id} value={eq.id} className="bg-surface-card text-content-primary">
                                          [{eq.code}] {eq.name} — ₱{Number(eq.rental_rate).toLocaleString()}/{eq.rental_unit}
                                        </option>
                                      ))}
                                    </optgroup>
                                  )}
                                </select>
                              </div>

                              <div className="md:col-span-7">
                                <label className="block text-[11px] font-semibold text-content-secondary mb-1">
                                  Item Description & Proposal Specifications
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. Zoomlion TC6013A-6 Flat-Top Tower Crane with 60m Jib, Anchoring tie-ins..."
                                  value={item.description}
                                  onChange={e => updateItem(index, 'description', e.target.value)}
                                  className={inputClass}
                                />
                              </div>
                            </div>

                            {/* Primary lease parameters row */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                              <div>
                                <label className="block text-[11px] font-semibold text-content-secondary mb-1">Quantity</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={e => updateItem(index, 'quantity', Number(e.target.value))}
                                  className={`${inputClass} text-center`}
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-content-secondary mb-1">Duration</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.rental_duration}
                                  onChange={e => updateItem(index, 'rental_duration', Number(e.target.value))}
                                  className={`${inputClass} text-center`}
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-content-secondary mb-1">Rate Unit</label>
                                <select
                                  value={item.rental_duration_unit}
                                  onChange={e => updateItem(index, 'rental_duration_unit', e.target.value)}
                                  className={inputClass}
                                >
                                  <option value="day">Day</option>
                                  <option value="week">Week</option>
                                  <option value="month">Month</option>
                                </select>
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="block text-[11px] font-semibold text-content-secondary">Unit Rate (₱)</label>
                                  {isAutoFilled && <span className="text-[10px] text-amber-500 font-semibold">Auto</span>}
                                </div>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-content-tertiary">₱</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={item.unit_rate}
                                    onChange={e => updateItem(index, 'unit_rate', Number(e.target.value))}
                                    className={`${inputClass} pl-6 text-right font-mono`}
                                  />
                                </div>
                              </div>

                              <div className="col-span-2 sm:col-span-4 md:col-span-1">
                                <label className="block text-[11px] font-semibold text-content-secondary mb-1">Base Lease</label>
                                <div className="h-9 px-3 rounded-xl bg-surface-card border border-border-default/60 flex items-center justify-end text-xs font-mono font-bold text-content-primary">
                                  {formatPeso(baseLease)}
                                </div>
                              </div>
                            </div>

                            {/* Dedicated Operational Charges breakdown section */}
                            <div className="mt-3 pt-3 border-t border-border-subtle/60 bg-surface-card/60 rounded-xl p-3 border border-border-default/40">
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                                <div className="flex items-center gap-1.5">
                                  <Wrench className="h-3.5 w-3.5 text-amber-500" />
                                  <span className="text-xs font-bold text-content-primary">Dedicated Operational Charges</span>
                                  <span className="text-[11px] text-content-secondary hidden sm:inline">— Mobilization, Erection & Operator logistics</span>
                                </div>
                                <div className="text-xs font-mono font-bold text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                  <span>Total Operational:</span>
                                  <span>{formatPeso(item.additional_charges)}</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="text-[11px] font-semibold text-content-secondary flex items-center gap-1">
                                      <Truck className="h-3 w-3 text-amber-500/80" /> Mobilization & Demob
                                    </label>
                                    <span className="text-[10px] text-content-tertiary">Lowbed haulage</span>
                                  </div>
                                  <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-content-tertiary">₱</span>
                                    <input
                                      type="number"
                                      min="0"
                                      value={item.mobilization_fee || 0}
                                      onChange={e => updateItem(index, 'mobilization_fee', Number(e.target.value))}
                                      className={`${inputClass} pl-6 text-right py-1.5 text-xs font-mono`}
                                      placeholder="0"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="text-[11px] font-semibold text-content-secondary flex items-center gap-1">
                                      <Wrench className="h-3 w-3 text-amber-500/80" /> Erection & Dismantling
                                    </label>
                                    <span className="text-[10px] text-content-tertiary">Rigging & aux crane</span>
                                  </div>
                                  <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-content-tertiary">₱</span>
                                    <input
                                      type="number"
                                      min="0"
                                      value={item.erection_dismantle_fee || 0}
                                      onChange={e => updateItem(index, 'erection_dismantle_fee', Number(e.target.value))}
                                      className={`${inputClass} pl-6 text-right py-1.5 text-xs font-mono`}
                                      placeholder="0"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="text-[11px] font-semibold text-content-secondary flex items-center gap-1">
                                      <UserCheck className="h-3 w-3 text-amber-500/80" /> Operator & Crew Allowance
                                    </label>
                                    <span className="text-[10px] text-content-tertiary">Certified crew</span>
                                  </div>
                                  <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-content-tertiary">₱</span>
                                    <input
                                      type="number"
                                      min="0"
                                      value={item.operator_allowance || 0}
                                      onChange={e => updateItem(index, 'operator_allowance', Number(e.target.value))}
                                      className={`${inputClass} pl-6 text-right py-1.5 text-xs font-mono`}
                                      placeholder="0"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button 
                      type="button"
                      onClick={() => setItems([...items, blankLine()])}
                      className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-amber-500 hover:text-amber-400 transition cursor-pointer"
                    >
                      <Plus className="h-4 w-4" /> Add line item
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <h2 className="text-lg font-bold text-content-primary">Quotation review queue</h2>
                  
                  <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-surface-card border border-border-default text-xs shadow-xs">
                    <button
                      type="button"
                      onClick={() => setFilterStatus('all')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${filterStatus === 'all' ? 'bg-amber-500 text-slate-950 font-bold shadow-xs' : 'text-content-secondary hover:text-content-primary hover:bg-surface-app'}`}
                    >
                      All ({quotes.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterStatus('under_review')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${filterStatus === 'under_review' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/40' : 'text-content-secondary hover:text-content-primary hover:bg-surface-app'}`}
                    >
                      Awaiting Review ({quotes.filter(q => q.status === 'under_review').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterStatus('approved')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${filterStatus === 'approved' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/40' : 'text-content-secondary hover:text-content-primary hover:bg-surface-app'}`}
                    >
                      Approved ({quotes.filter(q => q.status === 'approved').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterStatus('sent')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${filterStatus === 'sent' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/40' : 'text-content-secondary hover:text-content-primary hover:bg-surface-app'}`}
                    >
                      Sent ({quotes.filter(q => q.status === 'sent').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterStatus('accepted')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${filterStatus === 'accepted' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/40' : 'text-content-secondary hover:text-content-primary hover:bg-surface-app'}`}
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
                      <div key={quote.id} className="flex flex-col gap-4 rounded-2xl border border-border-default/80 bg-surface-card p-5 transition hover:border-amber-500/40 hover:-translate-y-0.5 shadow-xs">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-3">
                              <p className="font-bold text-content-primary text-base font-mono tracking-tight">{quote.quotation_number}</p>
                              <span className="rounded-full bg-surface-app px-2.5 py-0.5 text-xs font-semibold text-content-primary border border-border-default">
                                {label(quote.status)}
                              </span>
                              {quote.job_order_id && (
                                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                  Converted to JO #{quote.job_order?.job_order_number || quote.job_order_id}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-content-secondary">
                              <span className="text-content-primary font-bold">{quote.customer?.company_name || quote.customer?.name}</span> · <span className="text-amber-600 dark:text-amber-400 font-mono font-bold">{formatPeso(Number(quote.total_amount))}</span>
                              {quote.description ? ` · ${quote.description}` : ''}
                            </p>
                            <p className="mt-1 text-xs text-content-secondary">
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
                <div className="rounded-2xl border border-border-default/80 bg-surface-card p-5 shadow-xs">
                  <h3 className="text-base font-bold text-content-primary mb-4">Quotation summary</h3>
                  
                  <div className="space-y-3.5 text-sm">
                    <div className="flex justify-between items-center text-content-secondary">
                      <span>Base Equipment Lease</span>
                      <span className="font-semibold text-content-primary font-mono">{formatPeso(baseRentalSubtotal)}</span>
                    </div>

                    {/* Operational charges breakdown summary */}
                    <div className="rounded-xl bg-surface-app/50 border border-border-subtle p-2.5 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-content-secondary">
                        <span className="flex items-center gap-1 font-medium">
                          <Truck className="w-3 h-3 text-amber-500" /> Mobilization:
                        </span>
                        <span className="font-mono text-content-primary font-medium">{formatPeso(totalMobilization)}</span>
                      </div>
                      <div className="flex justify-between items-center text-content-secondary">
                        <span className="flex items-center gap-1 font-medium">
                          <Wrench className="w-3 h-3 text-amber-500" /> Erection & Dismantle:
                        </span>
                        <span className="font-mono text-content-primary font-medium">{formatPeso(totalErection)}</span>
                      </div>
                      <div className="flex justify-between items-center text-content-secondary">
                        <span className="flex items-center gap-1 font-medium">
                          <UserCheck className="w-3 h-3 text-amber-500" /> Operator / Crew:
                        </span>
                        <span className="font-mono text-content-primary font-medium">{formatPeso(totalOperatorAllowance)}</span>
                      </div>
                      <div className="pt-1.5 border-t border-border-subtle/80 flex justify-between items-center text-content-secondary font-semibold">
                        <span>Total Operational:</span>
                        <span className="font-mono text-amber-500 font-bold">{formatPeso(totalOperationalCharges)}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-content-secondary pt-1">
                      <span className="font-medium">Combined Subtotal</span>
                      <span className="font-semibold text-content-primary font-mono">{formatPeso(subtotal)}</span>
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
                          className={`${inputClass} w-20 text-right py-1 text-xs`} 
                        />
                        <span className="text-content-primary font-semibold">%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-content-secondary">
                      <span>Tax Amount</span>
                      <span className="font-semibold text-content-primary font-mono">{formatPeso(taxAmount)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-content-secondary">
                      <span>Discount (₱)</span>
                      <input 
                        type="number" 
                        min="0" 
                        value={discount} 
                        onChange={event => setDiscount(Number(event.target.value))} 
                        className={`${inputClass} w-28 text-right py-1 text-xs font-mono`} 
                      />
                    </div>
                    
                    <div className="pt-3 mt-2 border-t border-border-subtle">
                      <div className="flex justify-between items-center text-base font-bold text-content-primary">
                        <span>Proposal Total</span>
                        <span className="text-amber-500 dark:text-amber-400 font-mono text-xl font-bold">{formatPeso(total)}</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={saveDraft} 
                    disabled={saving}
                    className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-400 shadow-sm cursor-pointer disabled:opacity-50 active:scale-98"
                  >
                    <ClipboardList className="h-4 w-4" /> {saving ? 'Saving...' : 'Save draft quotation'}
                  </button>
                </div>

                {/* Guidance Card */}
                <div className="rounded-2xl border border-border-default/80 bg-surface-card p-5 shadow-xs">
                  <h3 className="text-sm font-bold text-content-primary mb-3">Leasing Commercial Guidance</h3>
                  <ul className="space-y-2 text-xs text-content-secondary list-disc pl-4 marker:text-amber-500">
                    <li>Selecting heavy equipment auto-fills standard daily/monthly rates from fleet database.</li>
                    <li>Dedicated operational charges account for lowbed hauling, erection, and operator allowances.</li>
                    <li>Use validity presets (15–60 days) to match standard construction tender requirements.</li>
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