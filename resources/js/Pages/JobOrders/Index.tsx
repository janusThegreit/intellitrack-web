import { useState, useEffect, useMemo, FormEvent } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { Card, CardBody } from '../../Components/Card';
import Table, { TableColumn } from '../../Components/Table';
import Button from '../../Components/Button';
import { Input } from '../../Components/Form';
import { StatusBadge } from '../../Components/Badge';
import Modal from '../../Components/Modal';
import WorkOrderPrint from '../../Components/WorkOrderPrint';
import { 
  Plus, 
  Edit2, 
  Eye, 
  Trash2, 
  Search, 
  UserCheck, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Star, 
  FileText, 
  AlertCircle,
  Truck,
  Wrench,
  Printer,
  MapPin,
  Layers,
  XCircle,
  Copy,
  Briefcase,
  DollarSign,
  Send,
  ArrowUpRight,
  Info,
  Activity,
} from 'lucide-react';
import { formatPeso } from '../../Utils/currency';

interface StaffUser {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
}

interface EquipmentItem {
  id: number;
  code: string;
  name: string;
  rental_rate: number | string;
  rental_unit: string;
  category?: string;
}

interface JobOrderItem {
  id: number;
  job_order_id: number;
  equipment_id: number;
  quantity: number;
  unit_price: number | string;
  unit: string;
  total_price: number | string;
  notes?: string;
  equipment?: EquipmentItem;
}

interface CustomerFeedback {
  id: number;
  overall_rating: number;
  equipment_condition_rating?: number;
  operator_competence_rating?: number;
  timeliness_rating?: number;
  comments?: string;
  status: string;
}

interface JobOrder {
  id: number;
  job_number: string;
  customer_id?: number;
  customer_name: string;
  customer?: {
    id: number;
    name: string;
    company_name?: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
  };
  description: string;
  status: string;
  total_amount: number;
  estimated_cost?: number;
  actual_cost?: number;
  start_date?: string;
  scheduled_date?: string;
  end_date?: string;
  due_date?: string;
  completion_date?: string;
  priority?: string;
  location?: string;
  notes?: string;
  equipment_count?: number;
  assigned_to?: number | null;
  assigned_to_user?: StaffUser | null;
  created_by?: number | null;
  creator?: StaffUser | null;
  quotation_id?: number | null;
  job_order_items?: JobOrderItem[];
  feedback?: CustomerFeedback | null;
  created_at?: string;
}

interface JobOrderListProps {
  view?: 'all' | 'requests' | 'registered' | 'completion' | 'assignment' | 'scheduling' | 'tracking';
  jobOrders?: Array<JobOrder>;
}

const JobOrdersList = ({ view = 'all', jobOrders = [] }: JobOrderListProps) => {
  const { auth } = usePage<any>().props;
  const userRole = auth?.user?.role || '';
  const isSalesManager = userRole === 'sales_manager';
  const isSBD = userRole === 'sales_business_development';
  const canManage = isSalesManager || isSBD;

  const [activeTab, setActiveTab] = useState<'all' | 'requests' | 'registered' | 'completion' | 'assignment' | 'scheduling' | 'tracking'>((view as any) || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [records, setRecords] = useState<JobOrder[]>(jobOrders);
  const [sortBy, setSortBy] = useState<keyof JobOrder>('job_number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [customers, setCustomers] = useState<Array<{ id: number; name: string; company_name?: string; address?: string; city?: string }>>([]);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [equipmentCatalog, setEquipmentCatalog] = useState<EquipmentItem[]>([]);
  
  // Modals state
  const [selectedJob, setSelectedJob] = useState<JobOrder | null>(null);
  const [editingJob, setEditingJob] = useState<JobOrder | null>(null);
  const [creatingJob, setCreatingJob] = useState(false);
  const [handoffModalJob, setHandoffModalJob] = useState<JobOrder | null>(null);
  const [printingJob, setPrintingJob] = useState<JobOrder | null>(null);

  // Adding equipment modal state
  const [addingEquipmentJob, setAddingEquipmentJob] = useState<JobOrder | null>(null);
  const [newEquipmentItem, setNewEquipmentItem] = useState({
    equipment_id: '',
    quantity: 1,
    unit_price: '',
    unit: 'day',
    notes: '',
  });

  const [newJob, setNewJob] = useState({
    customer_id: '',
    service_type: 'Tower Crane Erection',
    required_equipment: '',
    special_instructions: '',
    description: '',
    priority: 'medium',
    scheduled_date: '',
    due_date: '',
    estimated_cost: '',
    location: '',
    notes: '',
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [copiedNumber, setCopiedNumber] = useState(false);

  // Sync activeTab if view prop or URL changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam) {
        setActiveTab(tabParam);
        return;
      }
    }
    if (view) {
      setActiveTab(view);
    }
  }, [view]);

  const handleTabChange = (tab: 'all' | 'requests' | 'registered' | 'completion' | 'assignment' | 'scheduling' | 'tracking') => {
    setActiveTab(tab);
    if (tab === 'all') {
      router.visit('/job-orders', { preserveState: true, preserveScroll: true });
    } else if (tab === 'requests') {
      router.visit('/job-orders/requests', { preserveState: true, preserveScroll: true });
    } else if (tab === 'completion') {
      router.visit('/job-orders/completion', { preserveState: true, preserveScroll: true });
    } else if (tab === 'tracking') {
      router.visit('/job-orders/tracking', { preserveState: true, preserveScroll: true });
    } else {
      router.visit(`/job-orders?tab=${tab}`, { preserveState: true, preserveScroll: true });
    }
  };

  const loadJobOrders = async () => {
    try {
      const res = await fetch('/api/job-orders?per_page=100', { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        const mapped: JobOrder[] = (data.data ?? []).map((job: any) => ({
          id: job.id,
          job_number: job.job_order_number,
          customer_id: job.customer_id,
          customer_name: job.customer?.company_name || job.customer?.name || '-',
          customer: job.customer,
          description: job.description,
          status: job.status,
          total_amount: Number(job.total_amount ?? job.estimated_cost ?? 0),
          estimated_cost: Number(job.estimated_cost ?? 0),
          actual_cost: Number(job.actual_cost ?? 0),
          start_date: job.start_date,
          scheduled_date: job.scheduled_date,
          end_date: job.completion_date || job.due_date,
          due_date: job.due_date,
          completion_date: job.completion_date,
          priority: job.priority,
          location: job.location,
          notes: job.notes,
          equipment_count: job.equipment_count ?? (job.job_order_items?.length ?? 0),
          assigned_to: job.assigned_to?.id || job.assigned_to,
          assigned_to_user: job.assigned_to,
          created_by: job.created_by?.id || job.created_by,
          creator: job.created_by,
          quotation_id: job.quotation_id,
          job_order_items: job.job_order_items ?? [],
          feedback: job.feedback ?? null,
          created_at: job.created_at,
        }));
        setRecords(mapped);

        // Update selectedJob if open
        if (selectedJob) {
          const updated = mapped.find(m => m.id === selectedJob.id);
          if (updated) setSelectedJob(updated);
        }
      }
    } catch {
      setRecords([]);
    }
  };

  useEffect(() => {
    loadJobOrders();

    fetch('/api/customers?per_page=100', { headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setCustomers(data.data ?? []))
      .catch(() => setCustomers([]));

    fetch('/api/assignable-staff', { headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setStaffList(data ?? []))
      .catch(() => setStaffList([]));

    fetch('/api/equipment?per_page=100', { headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setEquipmentCatalog(data.data ?? []))
      .catch(() => setEquipmentCatalog([]));
  }, []);

  const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

  // Tab count indicators (Sales, Customer & Job Order Management)
  const counts = useMemo(() => {
    return {
      all: records.length,
      requests: records.filter((r) => r.status === 'pending' || r.status === 'draft').length,
      tracking: records.filter((r) => r.status === 'in-progress' || r.status === 'approved' || r.status === 'registered' || r.status === 'pending_dispatch').length,
      completion: records.filter((r) => r.status === 'completed').length,
    };
  }, [records]);

  // Overall Telemetry Metrics
  const telemetry = useMemo(() => {
    const total = records.length;
    const pendingAuth = records.filter(r => r.status === 'pending' || r.status === 'draft').length;
    const activeOperations = records.filter(r => r.status === 'in-progress' || r.status === 'approved' || r.status === 'registered' || r.status === 'pending_dispatch').length;
    const completedCount = records.filter(r => r.status === 'completed').length;
    const totalVal = records.reduce((acc, r) => acc + (r.total_amount || 0), 0);
    return { total, pendingAuth, activeOperations, completedCount, totalVal };
  }, [records]);

  // Tab and Search Filtering
  const filtered = useMemo(() => {
    let result = [...records];

    // Tab-level filtering
    if (activeTab === 'requests' || (activeTab as string) === 'requirements_review') {
      result = result.filter((item) => item.status === 'pending' || item.status === 'draft');
    } else if (activeTab === 'completion') {
      result = result.filter((item) => item.status === 'completed');
    } else if (activeTab === 'tracking') {
      result = result.filter((item) => item.status === 'in-progress' || item.status === 'approved' || item.status === 'registered' || item.status === 'pending_dispatch');
    } else if (activeTab === 'registered') {
      result = result.filter((item) => item.status === 'registered' || item.status === 'approved');
    }

    // Status filter dropdown (when in All Orders)
    if (statusFilter && activeTab === 'all') {
      result = result.filter((item) => item.status === statusFilter);
    }

    // Priority filter dropdown
    if (priorityFilter) {
      result = result.filter((item) => (item.priority || 'medium').toLowerCase() === priorityFilter.toLowerCase());
    }

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.job_number.toLowerCase().includes(q) ||
          item.customer_name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          (item.location && item.location.toLowerCase().includes(q)) ||
          item.job_order_items?.some(i => i.equipment?.name?.toLowerCase().includes(q) || i.equipment?.code?.toLowerCase().includes(q))
      );
    }

    // Sorting
    result.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (aVal === undefined || aVal === null) return sortOrder === 'asc' ? 1 : -1;
      if (bVal === undefined || bVal === null) return sortOrder === 'asc' ? -1 : 1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [records, activeTab, statusFilter, priorityFilter, searchQuery, sortBy, sortOrder]);

  const createJob = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const response = await fetch('/api/job-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrf },
      body: JSON.stringify({
        ...newJob,
        customer_id: Number(newJob.customer_id),
        estimated_cost: Number(newJob.estimated_cost || 0),
        status: 'pending',
      }),
    });
    if (response.ok) {
      setCreatingJob(false);
      setNewJob({
        customer_id: '',
        service_type: 'Tower Crane Erection',
        required_equipment: '',
        special_instructions: '',
        description: '',
        priority: 'medium',
        scheduled_date: '',
        due_date: '',
        estimated_cost: '',
        location: '',
        notes: '',
      });
      await loadJobOrders();
      setMessage('Job Order created successfully.');
      setTimeout(() => setMessage(''), 4000);
    } else {
      setMessage('Job Order could not be created.');
    }
    setSaving(false);
  };

  const updateJob = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingJob) return;
    setSaving(true);
    const response = await fetch(`/api/job-orders/${editingJob.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrf },
      body: JSON.stringify({
        description: editingJob.description,
        status: editingJob.status,
        priority: editingJob.priority,
        scheduled_date: editingJob.scheduled_date || null,
        due_date: editingJob.due_date || null,
        estimated_cost: editingJob.total_amount,
        location: editingJob.location,
        notes: editingJob.notes,
      }),
    });
    if (response.ok) {
      setEditingJob(null);
      await loadJobOrders();
      setMessage('Job Order updated successfully.');
      setTimeout(() => setMessage(''), 4000);
    } else {
      setMessage('Job Order could not be updated.');
    }
    setSaving(false);
  };



  const handleStatusTransition = async (jobId: number, nextStatus: string) => {
    try {
      const res = await fetch(`/api/job-orders/${jobId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrf,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        await loadJobOrders();
        setMessage(`Job Order status changed to ${nextStatus}.`);
        setTimeout(() => setMessage(''), 4000);
      }
    } catch {
      setMessage('Failed to update status.');
    }
  };

  // Add Equipment Item to Job Order
  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingEquipmentJob || !newEquipmentItem.equipment_id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/job-orders/${addingEquipmentJob.id}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrf,
        },
        body: JSON.stringify({
          equipment_id: Number(newEquipmentItem.equipment_id),
          quantity: Number(newEquipmentItem.quantity || 1),
          unit_price: Number(newEquipmentItem.unit_price || 0),
          unit: newEquipmentItem.unit,
          notes: newEquipmentItem.notes,
        }),
      });
      if (res.ok) {
        setAddingEquipmentJob(null);
        setNewEquipmentItem({
          equipment_id: '',
          quantity: 1,
          unit_price: '',
          unit: 'day',
          notes: '',
        });
        await loadJobOrders();
        setMessage('Heavy equipment allocated to Job Order.');
        setTimeout(() => setMessage(''), 4000);
      } else {
        setMessage('Failed to allocate equipment.');
      }
    } catch {
      setMessage('Error allocating equipment.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEquipmentItem = async (jobId: number, itemId: number) => {
    if (!window.confirm('Remove this equipment item from the Job Order?')) return;
    try {
      const res = await fetch(`/api/job-orders/${jobId}/items/${itemId}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrf },
      });
      if (res.ok) {
        await loadJobOrders();
        setMessage('Equipment item removed.');
        setTimeout(() => setMessage(''), 4000);
      }
    } catch {
      setMessage('Failed to remove item.');
    }
  };

  const deleteJob = async (job: JobOrder) => {
    if (!window.confirm(`Are you sure you want to remove ${job.job_number}?`)) return;
    const response = await fetch(`/api/job-orders/${job.id}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrf },
    });
    if (response.ok) {
      setSelectedJob(null);
      await loadJobOrders();
      setMessage('Job Order removed.');
      setTimeout(() => setMessage(''), 4000);
    } else {
      setMessage('Job Order could not be removed.');
    }
  };

  const handleCopyJobNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  // Sales → Operations Handoff
  const handleSubmitToOperations = async (job: JobOrder) => {
    if (!window.confirm(`Submit "${job.job_number}" to Operations & Dispatch for field scheduling? This handoff transfers operational dispatch and driver assignment to the Operations Department.`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/job-orders/${job.id}/submit-to-operations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrf,
        },
        body: JSON.stringify({ notes: 'Submitted from Sales & Commercial Department' }),
      });
      if (res.ok) {
        await loadJobOrders();
        setMessage(`${job.job_number} successfully submitted to Operations & Dispatch. Dispatch and scheduling will be handled by the Operations team.`);
        setTimeout(() => setMessage(''), 6000);
      } else {
        const err = await res.json().catch(() => ({}));
        setMessage(err.message || 'Failed to submit to Operations. Ensure the job order is in Registered status.');
        setTimeout(() => setMessage(''), 5000);
      }
    } catch {
      setMessage('Network error. Could not submit to Operations.');
    } finally {
      setSaving(false);
    }
  };


  const columns: TableColumn<JobOrder>[] = [
    {
      key: 'job_number',
      label: 'Job #',
      sortable: true,
      width: '12%',
      render: (value, row) => (
        <div>
          <span className="font-semibold text-amber-500 hover:underline cursor-pointer" onClick={() => setSelectedJob(row)}>
            {value}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
              row.priority === 'urgent' ? 'bg-rose-500/20 text-rose-400' :
              row.priority === 'high' ? 'bg-amber-500/20 text-amber-400' :
              'bg-surface-input text-content-muted border border-border-default/50'
            }`}>
              {row.priority || 'Medium'}
            </span>
            {row.quotation_id && (
              <span className="text-[9px] text-content-muted">From Quote</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'customer_name',
      label: 'Customer & Site',
      sortable: true,
      width: '18%',
      render: (value, row) => (
        <div className="max-w-[190px]">
          <p className="font-semibold text-content-primary truncate text-xs" title={value}>{value}</p>
          {row.location ? (
            <p className="text-[11px] text-content-secondary truncate flex items-center gap-1 mt-0.5" title={row.location}>
              <MapPin className="h-3 w-3 shrink-0 text-amber-500" />
              <span className="truncate">{row.location}</span>
            </p>
          ) : (
            <span className="text-[10px] text-content-muted italic">Site location not set</span>
          )}
        </div>
      ),
    },
    {
      key: 'service_type',
      label: 'Service Task',
      width: '12%',
      render: (_, row) => (
        <div className="max-w-[140px]">
          <span className="font-semibold text-content-primary text-xs truncate block" title={row.service_type || 'Tower Crane Erection'}>
            {row.service_type || 'Tower Crane Erection'}
          </span>
          <p className="text-[10px] text-content-secondary mt-0.5 truncate" title={row.description || 'Heavy Lifting Operation'}>
            {row.description || 'Heavy Lifting Operation'}
          </p>
        </div>
      ),
    },
    {
      key: 'equipment_count',
      label: 'Equipment Specs',
      width: '12%',
      render: (_, row) => {
        const items = row.job_order_items ?? [];
        if (items.length === 0 && row.required_equipment) {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-input border border-border-default/60 text-[10px] text-content-secondary max-w-[125px]" title={row.required_equipment}>
              <Truck className="h-3 w-3 text-amber-500 shrink-0" />
              <span className="truncate">{row.required_equipment}</span>
            </span>
          );
        }
        if (items.length === 0) {
          return (
            <button
              onClick={() => setAddingEquipmentJob(row)}
              className="text-[10px] text-amber-500 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="h-3 w-3" /> + Add Spec
            </button>
          );
        }
        return (
          <div className="space-y-0.5">
            <div className="flex flex-wrap gap-1">
              {items.slice(0, 2).map((it) => (
                <span key={it.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-input border border-border-default/60 text-[9px] text-content-secondary font-medium">
                  <Wrench className="h-2.5 w-2.5 text-amber-400" />
                  {it.equipment?.code || it.equipment?.name || 'Unit'}
                </span>
              ))}
              {items.length > 2 && (
                <span className="text-[9px] text-content-muted font-bold self-center">
                  +{items.length - 2}
                </span>
              )}
            </div>
            <p className="text-[9px] text-content-muted font-mono">{items.length} fleet spec{items.length > 1 ? 's' : ''}</p>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Status & Operations',
      sortable: true,
      width: '14%',
      render: (_, row) => {
        const opStatus = (row as any).operational_status;
        const isForwarded = row.status === 'in-progress' || row.status === 'completed' || opStatus;
        return (
          <div className="space-y-1">
            <div>
              <StatusBadge status={row.status} />
            </div>
            <div className="flex items-center gap-1">
              {isForwarded ? (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-semibold max-w-[130px] truncate"
                  title={opStatus || 'Forwarded to Ops'}
                >
                  <Truck className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">{opStatus ? opStatus.replace('Transmitted to ', '') : 'Forwarded to Ops'}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-input border border-border-default/50 text-[9px] text-content-muted">
                  <span>Awaiting Ops</span>
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'total_amount',
      label: 'Total Value',
      sortable: true,
      width: '10%',
      render: (amount) => (
        <span className="font-bold text-emerald-400 font-mono text-xs">
          {formatPeso(amount)}
        </span>
      ),
    },
    {
      key: 'scheduled_date',
      label: 'Timeline',
      sortable: true,
      width: '10%',
      render: (_, row) => (
        <div className="text-xs">
          {row.scheduled_date ? (
            <div>
              <span className="text-content-primary flex items-center gap-1 font-mono text-[11px]">
                <Calendar className="h-3 w-3 text-amber-500 shrink-0" />
                {new Date(row.scheduled_date).toLocaleDateString()}
              </span>
              {row.due_date && (
                <span className="text-[10px] text-content-muted block">
                  Due: {new Date(row.due_date).toLocaleDateString()}
                </span>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSchedulingJob(row);
                setScheduleData({
                  scheduled_date: row.scheduled_date || '',
                  start_date: row.start_date || '',
                  due_date: row.due_date || '',
                  location: row.location || '',
                  notes: row.notes || '',
                });
              }}
              className="text-[10px] text-amber-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Calendar className="h-3 w-3" /> Set Schedule
            </button>
          )}
        </div>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      stickyRight: true,
      width: '12%',
      render: (_, row) => {
        const isCompleted = row.status === 'completed' || row.status === 'cancelled';
        return (
          <div className="flex items-center justify-end gap-1">
            {/* Forward to Ops button — hidden for completed/cancelled */}
            {!isCompleted && (
              <button
                type="button"
                onClick={() => setHandoffModalJob(row)}
                className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-600 dark:text-emerald-400 transition-all border border-emerald-500/30 cursor-pointer shadow-xs"
                title="Forward to Operations & Dispatch"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Sales Manager: Approve pending Job Orders */}
            {isSalesManager && row.status === 'pending' && (
              <button
                type="button"
                onClick={() => handleStatusTransition(row.id, 'registered')}
                className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 text-xs font-semibold flex items-center gap-1 transition-all border border-emerald-500/20 cursor-pointer"
                title="Approve & Register Job Order"
              >
                <CheckCircle className="w-3.5 h-3.5" />
              </button>
            )}

            {/* SBD or SM: Submit Registered Job Order to Operations */}
            {canManage && (row.status === 'registered' || row.status === 'approved') && (
              <button
                type="button"
                onClick={() => void handleSubmitToOperations(row)}
                className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/25 text-blue-400 text-xs font-semibold flex items-center gap-1 transition-all border border-blue-500/20 cursor-pointer"
                title="Submit to Operations & Dispatch"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}

            {/* CSAT Feedback — only for completed */}
            {row.status === 'completed' && (
              <Link
                href={`/crm/feedback?customer_id=${row.customer_id}&job_order_id=${row.id}`}
                className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/25 text-amber-400 text-xs font-semibold flex items-center gap-1 transition-all border border-amber-500/20"
                title="Record CSAT Feedback"
              >
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              </Link>
            )}

            {/* View Full Dossier */}
            <button
              onClick={() => setSelectedJob(row)}
              className="p-1.5 hover:bg-surface-input rounded-lg text-content-secondary hover:text-amber-500 transition-colors cursor-pointer"
              title="View Full Dossier"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Edit — hidden for completed/cancelled */}
            {!isCompleted && (
              <button
                onClick={() => setEditingJob({ ...row })}
                className="p-1.5 hover:bg-surface-input rounded-lg text-content-secondary hover:text-amber-500 transition-colors cursor-pointer"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}

            {/* Delete */}
            {isSalesManager && (
              <button
                onClick={() => void deleteJob(row)}
                className="p-1.5 hover:bg-rose-500/10 rounded-lg text-rose-400 transition-colors cursor-pointer"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <Head title="Job Order Management - IntelliTrack" />
      <AppLayout
        title="Job Order Management"
        headerAction={
          <div className="flex items-center gap-2">
            <Button variant="primary" onClick={() => setCreatingJob(true)}>
              <Plus className="w-4 h-4 mr-1" />
              New Job Order
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {message && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-400 animate-fadeIn">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {/* KPI Statistics Ribbon */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-surface-card border border-border-default/60 relative overflow-hidden group hover:border-amber-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-content-muted">Total Job Orders</span>
                <Briefcase className="h-4 w-4 text-amber-500" />
              </div>
              <p className="mt-2 text-2xl font-black text-content-primary">{telemetry.total}</p>
              <p className="mt-1 text-[11px] text-content-secondary">Commercial work orders registered</p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-card border border-border-default/60 relative overflow-hidden group hover:border-amber-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-content-muted">Pending Authorization</span>
                <Clock className="h-4 w-4 text-amber-400" />
              </div>
              <p className="mt-2 text-2xl font-black text-amber-400">{telemetry.pendingAuth}</p>
              <p className="mt-1 text-[11px] text-content-secondary">Awaiting Sales Manager release</p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-card border border-border-default/60 relative overflow-hidden group hover:border-blue-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-content-muted">In Field Operations</span>
                <Activity className="h-4 w-4 text-blue-400" />
              </div>
              <p className="mt-2 text-2xl font-black text-blue-400">{telemetry.activeOperations}</p>
              <p className="mt-1 text-[11px] text-content-secondary">Forwarded to Operations for field dispatch</p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-card border border-border-default/60 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-content-muted">Total Contract Value</span>
                <DollarSign className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="mt-2 text-2xl font-black text-emerald-400 font-mono">{formatPeso(telemetry.totalVal)}</p>
              <p className="mt-1 text-[11px] text-content-secondary">{records.length} total work orders</p>
            </div>
          </div>

          {/* Sub-Navigation Workflow Tabs (Sales Manager Job Order Lifecycle) */}
          <div className="flex flex-wrap items-center gap-2 border-b border-border-default pb-4">
            {/* Tab 1: All Orders (Master Registry) */}
            <button
              onClick={() => handleTabChange('all')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-surface-card text-content-secondary hover:text-content-primary border border-border-default/60'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>All Orders</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                activeTab === 'all' ? 'bg-slate-950 text-amber-500' : 'bg-surface-input text-content-muted'
              }`}>
                {counts.all}
              </span>
            </button>

            {/* Tab 2: Registration & Queue (Manager Authorization) */}
            <button
              onClick={() => handleTabChange('requests')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'requests' || (activeTab as string) === 'requirements_review'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-surface-card text-content-secondary hover:text-content-primary border border-border-default/60'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Registration & Queue</span>
              {counts.requests > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                  activeTab === 'requests' || (activeTab as string) === 'requirements_review' ? 'bg-slate-950 text-amber-500' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {counts.requests}
                </span>
              )}
            </button>

            {/* Tab 3: Operations Tracking & Coordination */}
            <button
              onClick={() => handleTabChange('tracking')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'tracking'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-surface-card text-content-secondary hover:text-content-primary border border-border-default/60'
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Operations Tracking</span>
              {counts.tracking > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                  activeTab === 'tracking' ? 'bg-slate-950 text-amber-500' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {counts.tracking}
                </span>
              )}
            </button>

            {/* Tab 4: Completed Orders (CSAT & Billing Handoff) */}
            <button
              onClick={() => handleTabChange('completion')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'completion'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-surface-card text-content-secondary hover:text-content-primary border border-border-default/60'
              }`}
            >
              <CheckCircle className="h-4 w-4" />
              <span>Completed Orders</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                activeTab === 'completion' ? 'bg-slate-950 text-amber-500' : 'bg-surface-input text-content-muted'
              }`}>
                {counts.completion}
              </span>
            </button>
          </div>

          {/* TAB 1: ALL ORDERS (MASTER VIEW) */}
          {activeTab === 'all' && (
            <div className="space-y-4">
              {/* Filter and Search Bar */}
              <Card>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <Input
                        placeholder="Search by Job #, client, scope, equipment or location..."
                        startIcon={<Search className="w-4 h-4" />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2 border border-border-default rounded-xl text-xs bg-surface-input text-content-primary focus:border-amber-500 focus:outline-none"
                    >
                      <option value="">All Statuses</option>
                      <option value="draft">Draft</option>
                      <option value="pending">Pending Approval</option>
                      <option value="approved">Approved</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="px-4 py-2 border border-border-default rounded-xl text-xs bg-surface-input text-content-primary focus:border-amber-500 focus:outline-none"
                    >
                      <option value="">All Priorities</option>
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </CardBody>
              </Card>

              {/* Data Table */}
              <Card noPadding>
                <Table
                  columns={columns}
                  data={filtered}
                  compact
                  emptyMessage="No job orders found matching your criteria. Create a new job order or convert from an accepted sales quotation."
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={(column, order) => {
                    setSortBy(column as keyof JobOrder);
                    setSortOrder(order);
                  }}
                />
              </Card>
            </div>
          )}

          {/* TAB 2: REQUESTS & APPROVALS WORKFLOW */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-content-primary">Pending Work Orders Awaiting Management Authorization</h3>
                    <p className="text-xs text-content-secondary mt-0.5">
                      Review commercial budgets, site specifications, and fleet feasibility before approving deployment.
                    </p>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-mono font-bold text-amber-400">{filtered.length} Requests Pending</span>
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-surface-card border border-border-default">
                  <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-content-primary">All Job Order Requests Processed</h4>
                  <p className="text-xs text-content-secondary mt-1 max-w-md mx-auto">
                    There are currently no job orders awaiting management authorization. New orders generated from accepted quotations will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filtered.map((job) => (
                    <div
                      key={job.id}
                      className="p-5 rounded-2xl bg-surface-card border border-border-default hover:border-amber-500/40 transition-all shadow-sm"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-default pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-amber-500 text-sm">{job.job_number}</span>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              job.priority === 'urgent' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              {job.priority || 'Medium'} Priority
                            </span>
                            <span className="text-xs text-content-muted">
                              Created: {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'Recent'}
                            </span>
                          </div>
                          <h4 className="font-bold text-content-primary mt-1 text-base">{job.customer_name}</h4>
                          <p className="text-xs text-content-secondary flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3.5 w-3.5 text-amber-500" />
                            {job.location || 'Project site address not specified'}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase text-content-muted">Estimated Budget</p>
                          <p className="text-xl font-bold text-emerald-400 font-mono mt-0.5">{formatPeso(job.total_amount)}</p>
                          <p className="text-[11px] text-content-secondary mt-0.5">
                            Requested Start: {job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString() : 'Flexible'}
                          </p>
                        </div>
                      </div>

                      <div className="py-3 text-xs text-content-secondary">
                        <p className="font-bold text-content-primary mb-1">Scope Description:</p>
                        <p className="bg-surface-input p-3 rounded-xl border border-border-default/60 text-content-secondary leading-relaxed">
                          {job.description}
                        </p>
                      </div>

                      {/* Equipment preview */}
                      {job.job_order_items && job.job_order_items.length > 0 && (
                        <div className="py-2 border-t border-border-default">
                          <p className="text-[11px] font-bold uppercase text-content-muted mb-2">Requested Fleet Units:</p>
                          <div className="flex flex-wrap gap-2">
                            {job.job_order_items.map((item) => (
                              <div key={item.id} className="px-3 py-1.5 rounded-xl bg-surface-input border border-border-default text-xs flex items-center gap-2">
                                <Truck className="h-3.5 w-3.5 text-amber-500" />
                                <span className="font-semibold text-content-primary">{item.equipment?.name || item.equipment?.code}</span>
                                <span className="text-content-muted">({item.quantity} unit{item.quantity > 1 ? 's' : ''})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border-default mt-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedJob(job)}>
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View Full Details
                        </Button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleStatusTransition(job.id, 'cancelled')}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-all border border-rose-500/20"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Reject Order
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusTransition(job.id, 'approved')}
                            className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Authorize & Approve Order
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: OPERATIONS COORDINATION & DISPATCH TRACKING */}
          {activeTab === 'tracking' && (
            <div className="space-y-6">
              {/* Coordination Cockpit Header & Scope Notice */}
              <div className="p-4 rounded-2xl bg-surface-card border border-border-default/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <Activity className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-bold text-content-primary">
                      Operations Tracking & Service Coordination Cockpit
                    </h3>
                  </div>
                  <p className="text-xs text-content-secondary max-w-3xl">
                    Commercial tracking of Job Orders forwarded to the <strong className="text-content-primary">Operations & Dispatch Department</strong>. Sales Management maintains oversight of mobilization milestones, crane erection, and safety compliance without direct driver, rigger, or fleet dispatching.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-xs font-bold flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                    {records.filter(r => r.status === 'in-progress' || r.status === 'approved' || r.status === 'registered' || r.status === 'pending_dispatch').length} Active in Operations
                  </span>
                </div>
              </div>

              {/* Inter-Department Coordination Cards (Sales Commercial Oversight vs Operations Execution vs Finance) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-surface-card border border-border-default space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Sales & Commercial</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400">Sales Department</span>
                  </div>
                  <p className="text-xs font-bold text-content-primary">Customer Scoping & JO Registration</p>
                  <p className="text-[11px] text-content-secondary">
                    Quote acceptance, Down Payment verification, technical specs definition, DOLE safety requirements, and commercial authorization.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface-card border border-border-default space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Operations & Dispatch</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-400">Operations Department</span>
                  </div>
                  <p className="text-xs font-bold text-content-primary">Personnel & Equipment Dispatching</p>
                  <p className="text-[11px] text-content-secondary">
                    Crane operator, supervisor & driver assignment, heavy haulage mobilization trips, and on-site assembly.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface-card border border-border-default space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Finance & Billing</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400">Finance Department</span>
                  </div>
                  <p className="text-xs font-bold text-content-primary">Billing & Payment Collection</p>
                  <p className="text-[11px] text-content-secondary">
                    Accounts Receivable (AR) invoicing, progress billing releases, and payment receipts once CSAT is closed.
                  </p>
                </div>
              </div>

              {/* Status Columns: 1. Awaiting Operations Dispatch | 2. On-Site Mobilization & Execution | 3. Operations Handshake Dossier */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Column 1: Awaiting Operations Dispatch */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border-default">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-content-primary">Awaiting Operations Dispatch</h4>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-card text-content-muted">
                      {records.filter(r => r.status === 'approved' || r.status === 'registered' || r.status === 'pending_dispatch').length}
                    </span>
                  </div>

                  {records.filter(r => r.status === 'approved' || r.status === 'registered' || r.status === 'pending_dispatch').length === 0 ? (
                    <div className="p-6 text-center rounded-2xl bg-surface-card border border-border-default">
                      <CheckCircle className="h-8 w-8 text-emerald-400/60 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-content-primary">No orders awaiting dispatch</p>
                      <p className="text-[11px] text-content-secondary mt-1">All approved orders have been mobilized or completed.</p>
                    </div>
                  ) : (
                    records.filter(r => r.status === 'approved' || r.status === 'registered' || r.status === 'pending_dispatch').map(job => (
                      <div key={job.id} className="p-4 rounded-2xl bg-surface-card border border-amber-500/30 hover:border-amber-500/60 transition-all space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-500 font-mono">{job.job_number}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                            Forwarded to Ops
                          </span>
                        </div>

                        <div>
                          <h5 className="font-semibold text-content-primary text-xs">{job.customer_name}</h5>
                          <p className="text-[11px] text-content-secondary mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-amber-500 shrink-0" />
                            {job.location || 'Construction Site Address Pending'}
                          </p>
                          <p className="text-xs text-content-secondary mt-2 line-clamp-2 bg-surface-input p-2 rounded-xl border border-border-default/60">
                            {job.description}
                          </p>
                        </div>

                        {job.job_order_items && job.job_order_items.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {job.job_order_items.map((i) => (
                              <span key={i.id} className="text-[10px] px-2 py-0.5 rounded bg-surface-input border border-border-default text-content-secondary font-mono">
                                {i.equipment?.name || i.equipment?.code}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="pt-2 border-t border-border-default flex items-center justify-between">
                          <span className="text-[10px] font-mono text-content-muted">
                            Target: {job.due_date ? new Date(job.due_date).toLocaleDateString() : 'TBD'}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedJob(job)}
                              className="text-[11px] text-content-secondary hover:text-amber-500 font-medium"
                            >
                              View Dossier
                            </button>
                            <button
                              type="button"
                              onClick={() => setHandoffModalJob(job)}
                              className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-[10px] font-bold flex items-center gap-1 transition-all"
                            >
                              <Send className="h-3 w-3" /> Re-sync
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Column 2: On-Site Mobilization & Assembly (Active) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border-default">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-content-primary">On-Site Execution & Erection</h4>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                      {records.filter(r => r.status === 'in-progress').length}
                    </span>
                  </div>

                  {records.filter(r => r.status === 'in-progress').length === 0 ? (
                    <div className="p-6 text-center rounded-2xl bg-surface-card border border-border-default">
                      <Clock className="h-8 w-8 text-content-muted mx-auto mb-2" />
                      <p className="text-xs font-semibold text-content-primary">No active on-site jobs right now</p>
                      <p className="text-[11px] text-content-secondary mt-1">Orders dispatched by Operations will appear here.</p>
                    </div>
                  ) : (
                    records.filter(r => r.status === 'in-progress').map(job => (
                      <div key={job.id} className="p-4 rounded-2xl bg-surface-card border border-emerald-500/30 hover:border-emerald-500/60 transition-all space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-500 font-mono">{job.job_number}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                            On-Site Active
                          </span>
                        </div>

                        <div>
                          <h5 className="font-semibold text-content-primary text-xs">{job.customer_name}</h5>
                          <p className="text-[11px] text-content-secondary mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-amber-500 shrink-0" />
                            {job.location}
                          </p>
                        </div>

                        <div className="bg-surface-input p-2.5 rounded-xl border border-border-default/60 space-y-1 text-[11px]">
                          <div className="flex justify-between text-content-muted">
                            <span>Mobilized Since:</span>
                            <span className="font-mono text-content-primary">{job.start_date ? new Date(job.start_date).toLocaleDateString() : 'In Progress'}</span>
                          </div>
                          <div className="flex justify-between text-content-muted">
                            <span>Target Completion:</span>
                            <span className="font-mono text-content-primary">{job.due_date ? new Date(job.due_date).toLocaleDateString() : 'TBD'}</span>
                          </div>
                          <div className="flex justify-between text-content-muted">
                            <span>DOLE Safety Permit:</span>
                            <span className="text-emerald-400 font-bold">100% Verified</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-border-default flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setSelectedJob(job)}
                            className="text-[11px] text-content-secondary hover:text-amber-500 font-medium"
                          >
                            View Site Dossier
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusTransition(job.id, 'completed')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <CheckCircle className="h-3 w-3" /> Mark Completed
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Column 3: Handoff & Dispatch Interface Dossier */}
                <div className="space-y-3">
                  <div className="pb-2 border-b border-border-default flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-content-primary">Operations Dispatch Transmission Log</h4>
                    <span className="text-[10px] font-mono text-content-muted">Standard Operating Protocol</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-surface-card border border-border-default space-y-3 text-xs">
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-blue-400">
                        <Info className="h-3.5 w-3.5" />
                        Service & Coordination Protocol
                      </p>
                      <p className="text-[10px] text-content-secondary leading-relaxed">
                        Sales Manager creates official Job Orders once down payment is secured, transmitting technical specs (boom height, load charts, attachments) to Operations for trip scheduling and assembly.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-content-primary uppercase">Transmitted Data Elements to Operations:</p>
                      <ul className="space-y-1 text-[11px] text-content-secondary">
                        <li className="flex items-center gap-1.5">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span>Customer Name & Verified Site Address</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span>Service Task Type (Erection / Dismantling / Rigging)</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span>Required Crane Model & Mast/Jib Configuration</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span>DOLE Safety Directives & PPE Compliance Terms</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span>Official Sales Manager Authorization Stamp</span>
                        </li>
                      </ul>
                    </div>

                    <div className="p-3 rounded-xl bg-surface-input border border-border-default/60 text-[10px] font-mono text-content-muted">
                      <p className="text-amber-400 font-bold mb-1">// Operations Department Handshake Status</p>
                      <p>ENDPOINT: /api/operations/dispatch-queue</p>
                      <p>STATUS: OPERATIONAL (200 OK)</p>
                      <p>DISPATCH TARGET: Operations & Dispatch Department</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: COMPLETION & CSAT FEEDBACK ROOM */}
          {activeTab === 'completion' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-surface-card border border-border-default flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-content-primary flex items-center gap-2">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    Completed Job Orders & CSAT Quality Audit Room
                  </h3>
                  <p className="text-xs text-content-secondary mt-0.5">
                    View customer satisfaction scores, equipment reliability ratings, operator competence, and final completion sign-offs.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">{filtered.length} Completed Projects</span>
              </div>

              {filtered.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-surface-card border border-border-default">
                  <Star className="h-10 w-10 text-amber-400 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold text-content-primary">No completed job orders yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filtered.map((job) => (
                    <div key={job.id} className="p-5 rounded-2xl bg-surface-card border border-border-default hover:border-amber-500/30 transition-all space-y-4">
                      <div className="flex items-center justify-between border-b border-border-default pb-3">
                        <div>
                          <span className="font-bold text-amber-500 text-sm">{job.job_number}</span>
                          <h4 className="font-bold text-content-primary text-sm mt-0.5">{job.customer_name}</h4>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">
                            Completed
                          </span>
                          <p className="text-[10px] text-content-muted mt-1 font-mono">
                            {job.completion_date ? new Date(job.completion_date).toLocaleDateString() : 'Recently'}
                          </p>
                        </div>
                      </div>

                      <div className="text-xs text-content-secondary">
                        <p className="line-clamp-2">{job.description}</p>
                        <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                          <span className="text-content-muted">Final Contract Value:</span>
                          <span className="font-bold text-emerald-400">{formatPeso(job.total_amount)}</span>
                        </div>
                      </div>

                      {/* CSAT Display Card */}
                      <div className="p-3.5 rounded-xl bg-surface-input border border-border-default/60">
                        {job.feedback ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, idx) => (
                                  <Star
                                    key={idx}
                                    className={`h-4 w-4 ${
                                      idx < (job.feedback?.overall_rating || 0)
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-content-muted'
                                    }`}
                                  />
                                ))}
                                <span className="ml-1 text-xs font-bold text-amber-400 font-mono">
                                  {job.feedback.overall_rating}.0 / 5.0
                                </span>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold uppercase">
                                Verified CSAT
                              </span>
                            </div>

                            {job.feedback.comments && (
                              <p className="text-xs text-content-primary italic border-l-2 border-amber-500 pl-2 mt-1">
                                "{job.feedback.comments}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-content-muted">Awaiting Customer CSAT Survey</span>
                            <Link
                              href={`/crm/feedback?customer_id=${job.customer_id}&job_order_id=${job.id}`}
                              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all"
                            >
                              <Star className="h-3 w-3 fill-slate-950" /> Record CSAT
                            </Link>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end pt-2 border-t border-border-default">
                        <Button variant="outline" size="sm" onClick={() => setSelectedJob(job)}>
                          <Eye className="h-3.5 w-3.5 mr-1" /> View Project Archive
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW DETAILS MODAL: HIGH-END WORK ORDER DOSSIER */}
          <Modal
            isOpen={!!selectedJob}
            onClose={() => setSelectedJob(null)}
            title={`Work Order Dossier: ${selectedJob?.job_number || ''}`}
            size="xl"
            footer={
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectedJob && setPrintingJob(selectedJob)}
                    title="Print Official Work Order Document"
                  >
                    <Printer className="h-3.5 w-3.5 mr-1.5" />
                    Print Work Order
                  </Button>
                  {selectedJob?.status === 'completed' && !selectedJob.feedback && (
                    <Link
                      href={`/crm/feedback?customer_id=${selectedJob.customer_id}&job_order_id=${selectedJob.id}`}
                    >
                      <Button variant="primary" size="sm">
                        <Star className="h-3.5 w-3.5 fill-amber-400 mr-1.5" />
                        Record CSAT Feedback
                      </Button>
                    </Link>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isSalesManager && (selectedJob?.status === 'pending' || selectedJob?.status === 'draft') && (
                    <button
                      type="button"
                      onClick={() => {
                        handleStatusTransition(selectedJob.id, 'approved');
                        setSelectedJob(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Authorize & Approve
                    </button>
                  )}
                  {selectedJob?.status !== 'completed' && selectedJob?.status !== 'cancelled' && (
                    <Button variant="outline" onClick={() => selectedJob && setEditingJob({ ...selectedJob })}>
                      <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                      Edit Order
                    </Button>
                  )}
                  <Button onClick={() => setSelectedJob(null)}>Close</Button>
                </div>
              </div>
            }
          >
            {selectedJob && (
              <div className="space-y-6 text-xs">
                {/* 1. Header with Job Number and Financial Value */}
                <div className="p-4 rounded-2xl bg-surface-card border border-border-default flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-extrabold text-amber-500">{selectedJob.job_number}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyJobNumber(selectedJob.job_number)}
                        className="text-content-muted hover:text-amber-500"
                        title="Copy Job #"
                      >
                        {copiedNumber ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                      <StatusBadge status={selectedJob.status} />
                    </div>
                    <p className="text-xs text-content-secondary mt-1 font-semibold">{selectedJob.customer_name}</p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-[10px] font-bold uppercase text-content-muted">Total Contract Value</p>
                    <p className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                      {formatPeso(selectedJob.total_amount)}
                    </p>
                  </div>
                </div>

                {/* 2. Visual 5-Stage Commercial Lifecycle Stepper */}
                <div className="p-4 rounded-2xl bg-surface-input border border-border-default/60">
                  <p className="text-[10px] font-bold uppercase text-content-muted mb-3">Commercial Work Order Lifecycle Flow</p>
                  <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
                    <div className={`p-2 rounded-xl ${selectedJob.status !== 'cancelled' ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30' : 'bg-surface-card text-content-muted'}`}>
                      1. Scoped & Created
                    </div>
                    <div className={`p-2 rounded-xl ${selectedJob.status !== 'draft' && selectedJob.status !== 'pending' && selectedJob.status !== 'cancelled' ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30' : 'bg-surface-card text-content-muted'}`}>
                      2. Sales Authorized
                    </div>
                    <div className={`p-2 rounded-xl ${selectedJob.status === 'approved' || selectedJob.status === 'registered' || selectedJob.status === 'pending_dispatch' || selectedJob.status === 'in-progress' || selectedJob.status === 'completed' ? 'bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30' : 'bg-surface-card text-content-muted'}`}>
                      3. Forwarded to Ops
                    </div>
                    <div className={`p-2 rounded-xl ${selectedJob.status === 'in-progress' || selectedJob.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30' : 'bg-surface-card text-content-muted'}`}>
                      4. On-Site Mobilized
                    </div>
                    <div className={`p-2 rounded-xl ${selectedJob.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30' : 'bg-surface-card text-content-muted'}`}>
                      5. Closed & Billed
                    </div>
                  </div>
                </div>

                {/* 3. Client, Logistics & Operations Coordination Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Client & Site Logistics */}
                  <div className="p-4 rounded-2xl bg-surface-card border border-border-default space-y-2">
                    <h4 className="font-bold text-content-primary flex items-center gap-1.5 text-xs">
                      <MapPin className="h-4 w-4 text-amber-500" />
                      Client & Site Logistics
                    </h4>
                    <div className="space-y-1.5 text-content-secondary text-[11px] pt-1">
                      <p><strong className="text-content-primary">Client:</strong> {selectedJob.customer_name}</p>
                      {selectedJob.customer?.contact_person && (
                        <p><strong className="text-content-primary">Contact Person:</strong> {selectedJob.customer.contact_person}</p>
                      )}
                      {selectedJob.customer?.phone && (
                        <p><strong className="text-content-primary">Phone:</strong> {selectedJob.customer.phone}</p>
                      )}
                      {selectedJob.customer?.email && (
                        <p><strong className="text-content-primary">Email:</strong> {selectedJob.customer.email}</p>
                      )}
                      <p><strong className="text-content-primary">Project Site Address:</strong> {selectedJob.location || 'Not specified'}</p>
                      <p><strong className="text-content-primary">Scheduled Mobilization:</strong> {selectedJob.scheduled_date ? new Date(selectedJob.scheduled_date).toLocaleDateString() : 'Pending'}</p>
                      <p><strong className="text-content-primary">Target Due Date:</strong> {selectedJob.due_date ? new Date(selectedJob.due_date).toLocaleDateString() : 'Not specified'}</p>
                    </div>
                  </div>

                  {/* Operations Coordination Card */}
                  <div className="p-4 rounded-2xl bg-surface-card border border-border-default space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-content-primary flex items-center gap-1.5 text-xs">
                        <Activity className="h-4 w-4 text-blue-400" />
                        Operations & Dispatch Coordination
                      </h4>
                      {selectedJob?.status !== 'completed' && selectedJob?.status !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => setHandoffModalJob(selectedJob)}
                          className="text-[11px] font-bold text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="h-3 w-3" /> Transmit to Ops
                        </button>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-surface-input border border-border-default/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-content-muted">Operations Unit</span>
                        <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">Operations & Dispatch Department</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-content-muted">Operational Status</span>
                        <span className="text-xs font-semibold text-content-primary">
                          {selectedJob.status === 'completed' ? 'Completed & Demobilized' :
                           selectedJob.status === 'in-progress' ? 'Active On-Site Erection' :
                           selectedJob.status === 'approved' || selectedJob.status === 'registered' || selectedJob.status === 'pending_dispatch' ? 'Forwarded — Pending Field Dispatch' :
                           'Awaiting Sales Manager Authorization'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-content-muted">DOLE Safety Compliance</span>
                        <span className="text-xs font-semibold text-emerald-400">100% Verified</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-content-secondary space-y-1">
                      <p><strong className="text-content-primary">Commercial Priority:</strong> <span className="capitalize font-bold text-amber-500">{selectedJob.priority || 'Medium'}</span></p>
                      <p><strong className="text-content-primary">Registered By:</strong> {selectedJob.creator?.name || 'Sales Management'}</p>
                    </div>
                  </div>
                </div>

                {/* 4. Allocated Heavy Equipment & Line Items Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-content-primary flex items-center gap-1.5 text-xs">
                      <Layers className="h-4 w-4 text-amber-500" />
                      Allocated Heavy Equipment & Line Items (BOM)
                    </h4>
                    {selectedJob?.status !== 'completed' && selectedJob?.status !== 'cancelled' && (
                      <button
                        type="button"
                        onClick={() => setAddingEquipmentJob(selectedJob)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 font-bold text-[11px] flex items-center gap-1 transition-all"
                      >
                        <Plus className="h-3 w-3" /> Add Equipment to Order
                      </button>
                    )}
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-border-default bg-surface-card">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-surface-input border-b border-border-default text-content-muted uppercase text-[10px] font-bold">
                        <tr>
                          <th className="p-3">Code / Unit</th>
                          <th className="p-3">Equipment Specification</th>
                          <th className="p-3 text-center">Qty</th>
                          <th className="p-3 text-right">Unit Rate</th>
                          <th className="p-3 text-right">Line Total</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default/60">
                        {(!selectedJob.job_order_items || selectedJob.job_order_items.length === 0) ? (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-content-muted">
                              No heavy equipment items allocated to this Job Order yet.
                            </td>
                          </tr>
                        ) : (
                          selectedJob.job_order_items.map((item) => (
                            <tr key={item.id} className="hover:bg-surface-input/30">
                              <td className="p-3 font-mono font-bold text-amber-500">
                                {item.equipment?.code || 'EQUIP'}
                              </td>
                              <td className="p-3">
                                <p className="font-semibold text-content-primary">{item.equipment?.name || 'Equipment Unit'}</p>
                                {item.notes && <p className="text-[10px] text-content-muted">{item.notes}</p>}
                              </td>
                              <td className="p-3 text-center font-bold text-content-primary">{item.quantity}</td>
                              <td className="p-3 text-right font-mono text-content-secondary">
                                {formatPeso(Number(item.unit_price))} / {item.unit || 'day'}
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-emerald-400">
                                {formatPeso(Number(item.total_price))}
                              </td>
                              <td className="p-3 text-right">
                                {selectedJob?.status !== 'completed' && selectedJob?.status !== 'cancelled' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteEquipmentItem(selectedJob.id, item.id)}
                                    className="text-rose-400 hover:text-rose-300 p-1"
                                    title="Remove item"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                ) : (
                                  <span className="text-content-muted text-[10px]">—</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {selectedJob.job_order_items && selectedJob.job_order_items.length > 0 && (
                        <tfoot className="bg-surface-input/60 border-t border-border-default font-bold">
                          <tr>
                            <td colSpan={4} className="p-3 text-right uppercase text-[10px] text-content-muted">
                              Total Calculated Contract:
                            </td>
                            <td className="p-3 text-right font-mono text-sm text-emerald-400">
                              {formatPeso(selectedJob.total_amount)}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>

                {/* 5. Scope & Engineering Notes */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase text-content-muted">Technical Scope & Project Directives</p>
                  <div className="p-3.5 rounded-xl bg-surface-input border border-border-default/60 text-content-secondary leading-relaxed">
                    {selectedJob.description}
                  </div>
                </div>

                {selectedJob.notes && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase text-content-muted">Site Safety, Gate Pass & Logistical Notes</p>
                    <div className="p-3.5 rounded-xl bg-surface-input border border-border-default/60 text-content-secondary leading-relaxed">
                      {selectedJob.notes}
                    </div>
                  </div>
                )}

                {/* 6. Customer Feedback (If Completed) */}
                {selectedJob.feedback && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-amber-400 flex items-center gap-1.5 text-xs">
                        <Star className="h-4 w-4 fill-amber-400" />
                        Client CSAT Audit & Performance Review
                      </h4>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < (selectedJob.feedback?.overall_rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-content-muted'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {selectedJob.feedback.comments && (
                      <p className="text-xs text-content-primary italic bg-surface-card p-3 rounded-xl border border-border-default">
                        "{selectedJob.feedback.comments}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </Modal>

          {/* ADD EQUIPMENT ITEM MODAL */}
          <Modal
            isOpen={!!addingEquipmentJob}
            onClose={() => setAddingEquipmentJob(null)}
            title={`Allocate Equipment: ${addingEquipmentJob?.job_number || ''}`}
            size="md"
            footer={
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAddingEquipmentJob(null)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleAddEquipment} loading={saving} disabled={!newEquipmentItem.equipment_id}>
                  Add to Job Order
                </Button>
              </div>
            }
          >
            <form onSubmit={handleAddEquipment} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-content-muted mb-1">
                  Select Equipment from Fleet *
                </label>
                <select
                  required
                  value={newEquipmentItem.equipment_id}
                  onChange={(e) => {
                    const eq = equipmentCatalog.find(item => item.id === Number(e.target.value));
                    setNewEquipmentItem({
                      ...newEquipmentItem,
                      equipment_id: e.target.value,
                      unit_price: eq ? String(eq.rental_rate) : '',
                      unit: eq?.rental_unit || 'day',
                    });
                  }}
                  className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2.5 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                >
                  <option value="">-- Choose Equipment Unit --</option>
                  {equipmentCatalog.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.code} - {eq.name} ({formatPeso(Number(eq.rental_rate))} / {eq.rental_unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-content-muted mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newEquipmentItem.quantity}
                    onChange={(e) => setNewEquipmentItem({ ...newEquipmentItem, quantity: Number(e.target.value) })}
                    className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-content-muted mb-1">Unit Rate (PHP)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newEquipmentItem.unit_price}
                    onChange={(e) => setNewEquipmentItem({ ...newEquipmentItem, unit_price: e.target.value })}
                    className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-content-muted mb-1">Rental Unit</label>
                  <select
                    value={newEquipmentItem.unit}
                    onChange={(e) => setNewEquipmentItem({ ...newEquipmentItem, unit: e.target.value })}
                    className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                  >
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                    <option value="2-months">2 Months</option>
                    <option value="3-months">3 Months</option>
                    <option value="project">Project Lump Sum</option>
                    <option value="deployment">Deployment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-content-muted mb-1">Configuration Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Includes 50m mast sections and climbing frame..."
                  value={newEquipmentItem.notes}
                  onChange={(e) => setNewEquipmentItem({ ...newEquipmentItem, notes: e.target.value })}
                  className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                />
              </div>

              {newEquipmentItem.unit_price && (
                <div className="p-3 rounded-xl bg-surface-input border border-border-default/60 flex items-center justify-between text-xs">
                  <span className="text-content-muted">Calculated Line Total:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {formatPeso(Number(newEquipmentItem.quantity) * Number(newEquipmentItem.unit_price))}
                  </span>
                </div>
              )}
            </form>
          </Modal>

          {/* CREATE JOB ORDER MODAL */}
          <Modal
            isOpen={creatingJob}
            onClose={() => !saving && setCreatingJob(false)}
            title="Create New Job Order"
            size="xl"
            footer={
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreatingJob(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" form="create-job-form" loading={saving}>
                  Create Job Order
                </Button>
              </div>
            }
          >
            <form id="create-job-form" onSubmit={createJob} className="grid grid-cols-1 gap-4 md:grid-cols-2 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-content-muted mb-1">Client *</label>
                <select
                  required
                  value={newJob.customer_id}
                  onChange={(e) => {
                    const cust = customers.find(c => c.id === Number(e.target.value));
                    setNewJob({
                      ...newJob,
                      customer_id: e.target.value,
                      location: cust?.address || (cust?.city ? `${cust.city} Project Site` : newJob.location),
                    });
                  }}
                  className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2.5 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                >
                  <option value="">Select client</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name || c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-content-muted mb-1">Service Task Type *</label>
                <select
                  required
                  value={newJob.service_type}
                  onChange={(e) => setNewJob({ ...newJob, service_type: e.target.value })}
                  className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2.5 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                >
                  <option value="Tower Crane Erection">Tower Crane Erection</option>
                  <option value="Tower Crane Dismantling">Tower Crane Dismantling</option>
                  <option value="Preventative Maintenance & Inspection">Preventative Maintenance & Inspection</option>
                  <option value="Mobile Crane Rigging & Lifting">Mobile Crane Rigging & Lifting</option>
                  <option value="Equipment Mobilization & Hauling">Equipment Mobilization & Hauling</option>
                  <option value="General Commercial Rental">General Commercial Rental</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-content-muted mb-1">Priority</label>
                <select
                  value={newJob.priority}
                  onChange={(e) => setNewJob({ ...newJob, priority: e.target.value })}
                  className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2.5 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-content-muted mb-1">Mobilization Date</label>
                <input
                  type="date"
                  value={newJob.scheduled_date}
                  onChange={(e) => setNewJob({ ...newJob, scheduled_date: e.target.value })}
                  className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-content-muted mb-1">Target Due Date</label>
                <input
                  type="date"
                  value={newJob.due_date}
                  onChange={(e) => setNewJob({ ...newJob, due_date: e.target.value })}
                  className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-content-muted mb-1">Estimated Budget (PHP)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={newJob.estimated_cost}
                  onChange={(e) => setNewJob({ ...newJob, estimated_cost: e.target.value })}
                  className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-content-muted mb-1">Project Site Location</label>
                <input
                  value={newJob.location}
                  placeholder="e.g. Fairview Commercial Center, QC"
                  onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                  className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold uppercase text-content-muted mb-1">Job Scope Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detailed engineering scope, crane height, load capacity, core wall requirements..."
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold uppercase text-content-muted mb-1">Equipment & Materials Required</label>
                <input
                  placeholder="e.g. 12T Flat Top Tower Crane, 50T Mobile Crane for Erection, 4x 50T Rigging Shackles..."
                  value={newJob.required_equipment}
                  onChange={(e) => setNewJob({ ...newJob, required_equipment: e.target.value })}
                  className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold uppercase text-content-muted mb-1">Safety Instructions & PPE Compliance (DOLE Guidelines)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 100% Tie-off safety harness, Hard Hat, Steel toe boots required on-site. Gate pass & DOLE safety permit verified..."
                  value={newJob.special_instructions}
                  onChange={(e) => setNewJob({ ...newJob, special_instructions: e.target.value })}
                  className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold uppercase text-content-muted mb-1">Sales & Logistics Notes</label>
                <textarea
                  rows={2}
                  placeholder="Gate pass, transport trailer schedule, site safety officer details..."
                  value={newJob.notes}
                  onChange={(e) => setNewJob({ ...newJob, notes: e.target.value })}
                  className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                />
              </div>
            </form>
          </Modal>

          {/* EDIT JOB ORDER MODAL */}
          <Modal
            isOpen={!!editingJob}
            onClose={() => !saving && setEditingJob(null)}
            title={`Edit Job Order: ${editingJob?.job_number || ''}`}
            size="xl"
            footer={
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingJob(null)} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" form="edit-job-form" loading={saving}>
                  Save Changes
                </Button>
              </div>
            }
          >
            {editingJob && (
              <form id="edit-job-form" onSubmit={updateJob} className="grid grid-cols-1 gap-4 md:grid-cols-2 text-xs">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-content-muted mb-1">Status</label>
                  <select
                    value={editingJob.status}
                    onChange={(e) => setEditingJob({ ...editingJob, status: e.target.value })}
                    className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2.5 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                  >
                    <option value="draft">Draft</option>
                    <option value="pending">Pending Approval</option>
                    <option value="approved">Approved</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-content-muted mb-1">Priority</label>
                  <select
                    value={editingJob.priority || 'medium'}
                    onChange={(e) => setEditingJob({ ...editingJob, priority: e.target.value })}
                    className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2.5 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-content-muted mb-1">Target Due Date</label>
                  <input
                    type="date"
                    value={editingJob.due_date ? editingJob.due_date.slice(0, 10) : ''}
                    onChange={(e) => setEditingJob({ ...editingJob, due_date: e.target.value })}
                    className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-content-muted mb-1">Total Contract (PHP)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingJob.total_amount}
                    onChange={(e) => setEditingJob({ ...editingJob, total_amount: Number(e.target.value) })}
                    className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold uppercase text-content-muted mb-1">Project Site Location</label>
                  <input
                    value={editingJob.location || ''}
                    onChange={(e) => setEditingJob({ ...editingJob, location: e.target.value })}
                    className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold uppercase text-content-muted mb-1">Scope Description</label>
                  <textarea
                    rows={3}
                    value={editingJob.description}
                    onChange={(e) => setEditingJob({ ...editingJob, description: e.target.value })}
                    className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold uppercase text-content-muted mb-1">Logistical Notes</label>
                  <textarea
                    rows={2}
                    value={editingJob.notes || ''}
                    onChange={(e) => setEditingJob({ ...editingJob, notes: e.target.value })}
                    className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </form>
            )}
          </Modal>

          {/* Operations Hand-off Gateway Modal (Bridge to Operations & Dispatch) */}
          <Modal
            isOpen={!!handoffModalJob}
            onClose={() => setHandoffModalJob(null)}
            title="Forward to Operations & Dispatch"
            size="lg"
            footer={
              <div className="flex items-center justify-between w-full">
                <div className="text-xs text-content-muted">
                  Receiving: <span className="font-semibold text-emerald-500">Operations & Dispatch Department</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => setHandoffModalJob(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={async () => {
                      if (handoffModalJob) {
                        await handleStatusTransition(handoffModalJob.id, 'pending_dispatch');
                        setMessage(`Job Order ${handoffModalJob.job_number} forwarded to Operations & Dispatch! Status updated to Pending Operations Dispatch.`);
                        setHandoffModalJob(null);
                        setTimeout(() => setMessage(''), 5000);
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 mr-1" />
                    Forward to Operations
                  </Button>
                </div>
              </div>
            }
          >
            {handoffModalJob && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    Job Order Finalized — Ready for Operations Dispatch
                  </p>
                  <p className="mt-1 text-[11px] text-content-secondary">
                    This Job Order has completed commercial registration (Client Verification, Inquiry, Approved Quotation, and Site Specifications). Forward this to Operations & Dispatch for personnel assignment and mobilization trip scheduling.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-surface-card p-3 rounded-xl border border-border-default/60">
                  <div>
                    <span className="text-[10px] font-bold text-content-muted uppercase">Official JO Number</span>
                    <p className="font-mono font-bold text-amber-500">{handoffModalJob.job_number}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-content-muted uppercase">Client / Contractor</span>
                    <p className="font-semibold text-content-primary">{handoffModalJob.customer_name}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-content-muted uppercase">Project Site Location</span>
                    <p className="text-content-primary">{handoffModalJob.location || 'Construction Site'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-content-muted uppercase">Total Contract Value</span>
                    <p className="font-mono font-bold text-emerald-500">{formatPeso(handoffModalJob.total_amount)}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-content-primary">Scope of Work & Technical Specs Transmitted</label>
                  <div className="p-3 rounded-xl bg-surface-input border border-border-default text-xs text-content-secondary">
                    {handoffModalJob.description || 'Heavy equipment mobilization, foundation anchoring, assembly, and erection with safety compliance.'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-600 dark:text-blue-300">
                  <strong>Operations & Dispatch Integration Protocol:</strong>
                  <ul className="mt-1 list-disc list-inside space-y-0.5 text-content-secondary text-[10px]">
                    <li>Direct status hand-off to Operations & Dispatch Department</li>
                    <li>Hands off site technical specs and mobilized equipment requirements for scheduling</li>
                  </ul>
                </div>
              </div>
            )}
          </Modal>
        </div>
      </AppLayout>

      {/* Print Work Order Document Overlay */}
      {printingJob && (
        <WorkOrderPrint
          job={printingJob}
          onClose={() => setPrintingJob(null)}
        />
      )}
    </>
  );
};

export default JobOrdersList;
