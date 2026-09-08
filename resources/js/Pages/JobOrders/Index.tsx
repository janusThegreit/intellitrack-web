import { useState, useEffect, useMemo, FormEvent } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { Card, CardBody } from '../../Components/Card';
import Table, { TableColumn } from '../../Components/Table';
import Button from '../../Components/Button';
import { Input } from '../../Components/Form';
import { StatusBadge } from '../../Components/Badge';
import Modal from '../../Components/Modal';
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
  view?: 'all' | 'requests' | 'assignment' | 'scheduling' | 'completion';
  jobOrders?: Array<JobOrder>;
}

const JobOrdersList = ({ view = 'all', jobOrders = [] }: JobOrderListProps) => {
  const [activeTab, setActiveTab] = useState<'all' | 'requests' | 'assignment' | 'scheduling' | 'completion'>(view || 'all');
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
  const [assigningJob, setAssigningJob] = useState<JobOrder | null>(null);
  const [assignedUserId, setAssignedUserId] = useState<string>('');
  const [schedulingJob, setSchedulingJob] = useState<JobOrder | null>(null);
  const [scheduleData, setScheduleData] = useState({
    scheduled_date: '',
    start_date: '',
    due_date: '',
    location: '',
    notes: '',
  });

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

  // Sync activeTab if view prop changes
  useEffect(() => {
    if (view) {
      setActiveTab(view);
    }
  }, [view]);

  const handleTabChange = (tab: 'all' | 'requests' | 'assignment' | 'scheduling' | 'completion') => {
    setActiveTab(tab);
    const path = tab === 'all' ? '/job-orders' : `/job-orders/${tab}`;
    window.history.pushState({}, '', path);
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

  // Tab count indicators
  const counts = useMemo(() => {
    return {
      all: records.length,
      requests: records.filter((r) => r.status === 'pending' || r.status === 'draft').length,
      assignment: records.filter((r) => !r.assigned_to && r.status !== 'completed' && r.status !== 'cancelled').length,
      scheduling: records.filter((r) => (!r.scheduled_date || r.status === 'approved' || r.status === 'in-progress') && r.status !== 'completed' && r.status !== 'cancelled').length,
      completion: records.filter((r) => r.status === 'completed').length,
    };
  }, [records]);

  // Overall Telemetry Metrics
  const telemetry = useMemo(() => {
    const active = records.filter(r => r.status === 'in-progress' || r.status === 'approved').length;
    const dispatched = records.filter(r => !!r.assigned_to && r.status !== 'completed' && r.status !== 'cancelled').length;
    const totalVal = records.reduce((acc, r) => acc + (r.total_amount || 0), 0);
    const completedCount = records.filter(r => r.status === 'completed').length;
    return { active, dispatched, totalVal, completedCount };
  }, [records]);

  // Workload count per staff member
  const staffWorkload = useMemo(() => {
    const map: Record<number, number> = {};
    records.forEach(r => {
      if (r.assigned_to && r.status !== 'completed' && r.status !== 'cancelled') {
        map[r.assigned_to] = (map[r.assigned_to] || 0) + 1;
      }
    });
    return map;
  }, [records]);

  // Tab and Search Filtering
  const filtered = useMemo(() => {
    let result = [...records];

    // Tab-level filtering
    if (activeTab === 'requests') {
      result = result.filter((item) => item.status === 'pending' || item.status === 'draft');
    } else if (activeTab === 'assignment') {
      result = result.filter((item) => !item.assigned_to && item.status !== 'completed' && item.status !== 'cancelled');
    } else if (activeTab === 'scheduling') {
      result = result.filter((item) => item.status === 'approved' || item.status === 'in-progress');
    } else if (activeTab === 'completion') {
      result = result.filter((item) => item.status === 'completed');
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

  const handleAssignStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningJob || !assignedUserId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/job-orders/${assigningJob.id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrf,
        },
        body: JSON.stringify({ assigned_to: Number(assignedUserId) }),
      });
      if (res.ok) {
        setAssigningJob(null);
        setAssignedUserId('');
        await loadJobOrders();
        setMessage('Technical personnel assigned and dispatched.');
        setTimeout(() => setMessage(''), 4000);
      } else {
        setMessage('Failed to assign personnel.');
      }
    } catch {
      setMessage('Error updating assignment.');
    } finally {
      setSaving(false);
    }
  };

  const handleScheduleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingJob) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/job-orders/${schedulingJob.id}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrf,
        },
        body: JSON.stringify(scheduleData),
      });
      if (res.ok) {
        setSchedulingJob(null);
        await loadJobOrders();
        setMessage('Job Order schedule and deployment dates updated.');
        setTimeout(() => setMessage(''), 4000);
      } else {
        setMessage('Failed to update schedule.');
      }
    } catch {
      setMessage('Error updating schedule.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeployNow = async (job: JobOrder) => {
    if (!window.confirm(`Deploy ${job.job_number} to site now? This will record today as the execution start date and set status to In-Progress.`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/job-orders/${job.id}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrf,
        },
        body: JSON.stringify({
          start_date: new Date().toISOString().slice(0, 10),
          status: 'in-progress',
        }),
      });
      if (res.ok) {
        await loadJobOrders();
        setMessage(`${job.job_number} is now officially Mobilized and In-Progress.`);
        setTimeout(() => setMessage(''), 4000);
      }
    } finally {
      setSaving(false);
    }
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

  // Master Table Columns
  const columns: TableColumn<JobOrder>[] = [
    {
      key: 'job_number',
      label: 'Job #',
      sortable: true,
      width: '14%',
      render: (value, row) => (
        <div>
          <span className="font-semibold text-amber-500 hover:underline cursor-pointer" onClick={() => setSelectedJob(row)}>
            {value}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
              row.priority === 'urgent' ? 'bg-rose-500/20 text-rose-400' :
              row.priority === 'high' ? 'bg-amber-500/20 text-amber-400' :
              'bg-surface-card text-content-muted'
            }`}>
              {row.priority || 'Medium'}
            </span>
            {row.quotation_id && (
              <span className="text-[10px] text-content-muted">From Quote</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'customer_name',
      label: 'Customer & Site',
      sortable: true,
      width: '22%',
      render: (value, row) => (
        <div>
          <p className="font-semibold text-content-primary truncate">{value}</p>
          {row.location ? (
            <p className="text-[11px] text-content-secondary truncate flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3 shrink-0 text-amber-500" /> {row.location}
            </p>
          ) : (
            <span className="text-[11px] text-content-muted italic">Site location not set</span>
          )}
        </div>
      ),
    },
    {
      key: 'equipment_count',
      label: 'Allocated Equipment',
      width: '18%',
      render: (_, row) => {
        const items = row.job_order_items ?? [];
        if (items.length === 0) {
          return (
            <button
              onClick={() => setAddingEquipmentJob(row)}
              className="text-[11px] text-amber-500 font-semibold hover:underline flex items-center gap-1"
            >
              <Truck className="h-3 w-3" /> + Allocate Fleet
            </button>
          );
        }
        return (
          <div className="space-y-1">
            <div className="flex flex-wrap gap-1">
              {items.slice(0, 2).map((it) => (
                <span key={it.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-card border border-border-default/60 text-[10px] text-content-secondary font-medium">
                  <Wrench className="h-2.5 w-2.5 text-amber-400" />
                  {it.equipment?.code || it.equipment?.name || 'Unit'}
                </span>
              ))}
              {items.length > 2 && (
                <span className="text-[10px] text-content-muted font-bold self-center">
                  +{items.length - 2} more
                </span>
              )}
            </div>
            <p className="text-[10px] text-content-muted font-mono">{items.length} fleet unit{items.length > 1 ? 's' : ''}</p>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: '11%',
      render: (status) => <StatusBadge status={status} />,
    },
    {
      key: 'assigned_to',
      label: 'Assigned Lead',
      width: '14%',
      render: (_, row) => {
        const staff = staffList.find((s) => s.id === row.assigned_to) || row.assigned_to_user;
        return (
          <div className="flex items-center gap-1.5">
            {staff ? (
              <div className="flex items-center gap-1.5 text-xs text-content-primary">
                <div className="h-6 w-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[10px] font-bold text-amber-400 shrink-0">
                  {staff.name ? staff.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="truncate max-w-[100px]">
                  <p className="font-semibold text-xs truncate">{staff.name}</p>
                  <p className="text-[9px] text-content-muted capitalize truncate">{staff.role.replaceAll('_', ' ')}</p>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAssigningJob(row);
                  setAssignedUserId('');
                }}
                className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg hover:bg-amber-500/20 flex items-center gap-1 transition-all"
              >
                <UserCheck className="h-3 w-3" /> Assign Lead
              </button>
            )}
          </div>
        );
      },
    },
    {
      key: 'total_amount',
      label: 'Total Value',
      sortable: true,
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
      render: (_, row) => (
        <div className="text-xs">
          {row.scheduled_date ? (
            <div>
              <span className="text-content-primary flex items-center gap-1 font-mono text-[11px]">
                <Calendar className="h-3 w-3 text-amber-500" />
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
              className="text-[11px] text-amber-400 font-semibold hover:underline flex items-center gap-1"
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
      render: (_, row) => (
        <div className="flex items-center gap-1">
          {row.status === 'completed' && (
            <Link
              href={`/crm/feedback?customer_id=${row.customer_id}&job_order_id=${row.id}`}
              className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/25 text-amber-400 text-xs font-semibold flex items-center gap-1 transition-all border border-amber-500/20"
              title="Record CSAT Feedback"
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            </Link>
          )}

          {row.status === 'pending' && (
            <button
              type="button"
              onClick={() => handleStatusTransition(row.id, 'approved')}
              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 text-xs font-semibold flex items-center gap-1 transition-all border border-emerald-500/20"
              title="Approve Job Order"
            >
              <CheckCircle className="w-3.5 h-3.5" />
            </button>
          )}

          {row.status === 'approved' && (
            <button
              type="button"
              onClick={() => handleDeployNow(row)}
              className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/25 text-amber-400 text-xs font-semibold flex items-center gap-1 transition-all border border-amber-500/20"
              title="Deploy & Mobilize Now"
            >
              <Truck className="w-3.5 h-3.5" />
            </button>
          )}

          {row.status === 'in-progress' && (
            <button
              type="button"
              onClick={() => handleStatusTransition(row.id, 'completed')}
              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 text-xs font-semibold flex items-center gap-1 transition-all border border-emerald-500/20"
              title="Mark as Completed"
            >
              <CheckCircle className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setSelectedJob(row)}
            className="p-1.5 hover:bg-surface-card rounded-lg text-content-secondary hover:text-amber-500 transition-colors"
            title="View Full Dossier"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => setEditingJob({ ...row })}
            className="p-1.5 hover:bg-surface-card rounded-lg text-content-secondary hover:text-amber-500 transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => void deleteJob(row)}
            className="p-1.5 hover:bg-rose-500/10 rounded-lg text-rose-400 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Head title="Job Orders & Fleet Mobilization - IntelliTrack" />
      <AppLayout
        dark={true}
        title="Job Orders & Fleet Mobilization"
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
                <span className="text-[11px] font-bold uppercase tracking-wider text-content-muted">Active Work Orders</span>
                <Briefcase className="h-4 w-4 text-amber-500" />
              </div>
              <p className="mt-2 text-2xl font-black text-content-primary">{telemetry.active}</p>
              <p className="mt-1 text-[11px] text-content-secondary">Approved & on-site operations</p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-card border border-border-default/60 relative overflow-hidden group hover:border-blue-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-content-muted">Dispatched Staff</span>
                <UserCheck className="h-4 w-4 text-blue-400" />
              </div>
              <p className="mt-2 text-2xl font-black text-content-primary">{telemetry.dispatched}</p>
              <p className="mt-1 text-[11px] text-content-secondary">Technical leads in the field</p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-card border border-border-default/60 relative overflow-hidden group hover:border-purple-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-content-muted">Awaiting Dispatch</span>
                <Clock className="h-4 w-4 text-purple-400" />
              </div>
              <p className="mt-2 text-2xl font-black text-content-primary">{counts.assignment}</p>
              <p className="mt-1 text-[11px] text-content-secondary">Orders needing personnel lead</p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-card border border-border-default/60 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-content-muted">Total Order Value</span>
                <DollarSign className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="mt-2 text-2xl font-black text-emerald-400 font-mono">{formatPeso(telemetry.totalVal)}</p>
              <p className="mt-1 text-[11px] text-content-secondary">{records.length} total work orders</p>
            </div>
          </div>

          {/* Sub-Navigation Workflow Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-border-default pb-4">
            <button
              onClick={() => handleTabChange('all')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
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

            <button
              onClick={() => handleTabChange('requests')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                activeTab === 'requests'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-surface-card text-content-secondary hover:text-content-primary border border-border-default/60'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Requests & Approvals</span>
              {counts.requests > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                  activeTab === 'requests' ? 'bg-slate-950 text-amber-500' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {counts.requests}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('assignment')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                activeTab === 'assignment'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-surface-card text-content-secondary hover:text-content-primary border border-border-default/60'
              }`}
            >
              <UserCheck className="h-4 w-4" />
              <span>Personnel Assignment</span>
              {counts.assignment > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                  activeTab === 'assignment' ? 'bg-slate-950 text-amber-500' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {counts.assignment}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('scheduling')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                activeTab === 'scheduling'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-surface-card text-content-secondary hover:text-content-primary border border-border-default/60'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Scheduling & Mobilization</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                activeTab === 'scheduling' ? 'bg-slate-950 text-amber-500' : 'bg-surface-input text-content-muted'
              }`}>
                {counts.scheduling}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('completion')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                activeTab === 'completion'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-surface-card text-content-secondary hover:text-content-primary border border-border-default/60'
              }`}
            >
              <Star className="h-4 w-4" />
              <span>Completion & CSAT Feedback</span>
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

          {/* TAB 3: PERSONNEL ASSIGNMENT & DISPATCH COCKPIT */}
          {activeTab === 'assignment' && (
            <div className="space-y-6">
              {/* Staff Workload Overview Strip */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-content-muted mb-3">Available Field Personnel & Engineers</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {staffList.map((staff) => {
                    const activeCount = staffWorkload[staff.id] || 0;
                    return (
                      <div key={staff.id} className="p-3.5 rounded-xl bg-surface-card border border-border-default flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 text-xs shrink-0">
                            {staff.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-xs text-content-primary truncate max-w-[120px]">{staff.name}</p>
                            <p className="text-[10px] text-content-muted capitalize truncate max-w-[120px]">{staff.role.replaceAll('_', ' ')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            activeCount === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {activeCount} active job{activeCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Unassigned Work Orders (Priority Queue) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-content-primary flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                    Unassigned Orders Needing Designated Lead Engineer
                  </h3>
                  <span className="text-xs font-mono text-content-muted">{filtered.length} Orders in Queue</span>
                </div>

                {filtered.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-surface-card border border-border-default">
                    <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-content-primary">All approved orders have assigned engineering personnel!</p>
                    <p className="text-[11px] text-content-secondary mt-1">Great job! No pending field dispatches.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map((job) => (
                      <div
                        key={job.id}
                        className="p-5 rounded-2xl bg-surface-card border border-rose-500/30 hover:border-rose-500/60 transition-all shadow-sm flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between border-b border-border-default pb-3">
                            <span className="font-bold text-amber-500 text-sm">{job.job_number}</span>
                            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold uppercase">
                              Unassigned
                            </span>
                          </div>

                          <div className="mt-3">
                            <h4 className="font-bold text-content-primary text-sm">{job.customer_name}</h4>
                            <p className="text-xs text-content-secondary flex items-center gap-1 mt-1">
                              <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                              {job.location || 'Site location pending'}
                            </p>
                            <p className="text-xs text-content-secondary mt-2 line-clamp-2 bg-surface-input p-2.5 rounded-xl border border-border-default/60">
                              {job.description}
                            </p>
                          </div>

                          {job.job_order_items && job.job_order_items.length > 0 && (
                            <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                              {job.job_order_items.map((i) => (
                                <span key={i.id} className="text-[10px] px-2 py-0.5 rounded bg-surface-input border border-border-default text-content-secondary font-mono">
                                  {i.equipment?.name || i.equipment?.code}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-border-default flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setSelectedJob(job)}
                            className="text-xs text-content-secondary hover:text-amber-500"
                          >
                            View Details
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setAssigningJob(job);
                              setAssignedUserId('');
                            }}
                            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            Assign Lead Engineer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Already Dispatched Orders Table */}
              <div className="mt-8 space-y-3">
                <h3 className="text-sm font-bold text-content-primary">Active Field Dispatches (Assigned Orders)</h3>
                <Card noPadding>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-surface-card border-b border-border-default text-content-muted uppercase text-[10px] font-bold">
                        <tr>
                          <th className="p-3">Job #</th>
                          <th className="p-3">Client</th>
                          <th className="p-3">Designated Lead</th>
                          <th className="p-3">Role</th>
                          <th className="p-3">Site Location</th>
                          <th className="p-3">Mobilization Date</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default/60">
                        {records.filter(r => !!r.assigned_to && r.status !== 'completed' && r.status !== 'cancelled').map((r) => {
                          const staff = staffList.find(s => s.id === r.assigned_to) || r.assigned_to_user;
                          return (
                            <tr key={r.id} className="hover:bg-surface-card/60 transition-colors">
                              <td className="p-3 font-semibold text-amber-500">{r.job_number}</td>
                              <td className="p-3 font-medium text-content-primary">{r.customer_name}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-6 w-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-[10px]">
                                    {staff?.name?.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="font-semibold text-content-primary">{staff?.name || 'Assigned'}</span>
                                </div>
                              </td>
                              <td className="p-3 text-content-secondary capitalize">{staff?.role?.replaceAll('_', ' ') || '-'}</td>
                              <td className="p-3 text-content-secondary truncate max-w-[150px]">📍 {r.location || 'Site'}</td>
                              <td className="p-3 text-content-secondary font-mono">
                                {r.scheduled_date ? new Date(r.scheduled_date).toLocaleDateString() : 'Pending'}
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => {
                                    setAssigningJob(r);
                                    setAssignedUserId(String(r.assigned_to));
                                  }}
                                  className="text-amber-500 hover:underline font-semibold text-[11px]"
                                >
                                  Reassign Staff
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 4: SCHEDULING & MOBILIZATION LOGISTICS BOARD */}
          {activeTab === 'scheduling' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-surface-card border border-border-default flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-content-primary flex items-center gap-2">
                    <Truck className="h-4 w-4 text-amber-500" />
                    Fleet Mobilization & Site Deployment Cockpit
                  </h3>
                  <p className="text-xs text-content-secondary mt-0.5">
                    Track equipment haulage, on-site heavy crane assembly, gate pass clearances, and project execution timelines.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-xs font-bold">
                    {records.filter(r => r.status === 'in-progress').length} Fleets Active On-Site
                  </span>
                </div>
              </div>

              {/* Mobilization Columns / Stages */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* 1. Needs Schedule */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border-default">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-content-primary">Needs Mobilization Date</h4>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-card text-content-muted">
                      {records.filter(r => !r.scheduled_date && (r.status === 'approved' || r.status === 'pending')).length}
                    </span>
                  </div>

                  {records.filter(r => !r.scheduled_date && (r.status === 'approved' || r.status === 'pending')).map(job => (
                    <div key={job.id} className="p-4 rounded-2xl bg-surface-card border border-border-default hover:border-amber-500/40 transition-all space-y-3">
                      <div>
                        <span className="text-xs font-bold text-amber-500">{job.job_number}</span>
                        <h5 className="font-semibold text-content-primary text-xs mt-0.5">{job.customer_name}</h5>
                        <p className="text-[11px] text-content-secondary mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-amber-500 shrink-0" />
                          {job.location || 'Location not set'}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-border-default flex items-center justify-between">
                        <span className="text-[10px] text-content-muted">Target: {job.due_date ? new Date(job.due_date).toLocaleDateString() : 'TBD'}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSchedulingJob(job);
                            setScheduleData({
                              scheduled_date: job.scheduled_date || '',
                              start_date: job.start_date || '',
                              due_date: job.due_date || '',
                              location: job.location || '',
                              notes: job.notes || '',
                            });
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] flex items-center gap-1 transition-all"
                        >
                          <Calendar className="h-3 w-3" /> Set Date
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 2. Mobilization Scheduled */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border-default">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-content-primary">Scheduled for Mobilization</h4>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-card text-content-muted">
                      {records.filter(r => !!r.scheduled_date && r.status === 'approved').length}
                    </span>
                  </div>

                  {records.filter(r => !!r.scheduled_date && r.status === 'approved').map(job => (
                    <div key={job.id} className="p-4 rounded-2xl bg-surface-card border border-blue-500/30 hover:border-blue-500/60 transition-all space-y-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-500">{job.job_number}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-semibold">
                            {new Date(job.scheduled_date!).toLocaleDateString()}
                          </span>
                        </div>
                        <h5 className="font-semibold text-content-primary text-xs mt-1">{job.customer_name}</h5>
                        <p className="text-[11px] text-content-secondary mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-amber-500 shrink-0" />
                          {job.location}
                        </p>
                      </div>

                      {job.notes && (
                        <p className="text-[10px] text-content-secondary bg-surface-input p-2 rounded-lg border border-border-default/60 line-clamp-2">
                          {job.notes}
                        </p>
                      )}

                      <div className="pt-2 border-t border-border-default flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            setSchedulingJob(job);
                            setScheduleData({
                              scheduled_date: job.scheduled_date || '',
                              start_date: job.start_date || '',
                              due_date: job.due_date || '',
                              location: job.location || '',
                              notes: job.notes || '',
                            });
                          }}
                          className="text-[11px] text-content-muted hover:text-amber-500"
                        >
                          Reschedule
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeployNow(job)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-[11px] flex items-center gap-1 transition-all shadow-sm"
                        >
                          <Truck className="h-3 w-3" /> Mobilize Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 3. On-Site Active Execution */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border-default">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-content-primary">On-Site Execution (Active)</h4>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                      {records.filter(r => r.status === 'in-progress').length}
                    </span>
                  </div>

                  {records.filter(r => r.status === 'in-progress').map(job => (
                    <div key={job.id} className="p-4 rounded-2xl bg-surface-card border border-emerald-500/30 hover:border-emerald-500/60 transition-all space-y-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-500">{job.job_number}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                            In-Progress
                          </span>
                        </div>
                        <h5 className="font-semibold text-content-primary text-xs mt-1">{job.customer_name}</h5>
                        <p className="text-[11px] text-content-secondary mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-amber-500 shrink-0" />
                          {job.location}
                        </p>
                      </div>

                      <div className="bg-surface-input p-2.5 rounded-xl border border-border-default/60 space-y-1 text-[11px]">
                        <div className="flex justify-between text-content-muted">
                          <span>Mobilized Since:</span>
                          <span className="font-mono text-content-primary">{job.start_date ? new Date(job.start_date).toLocaleDateString() : 'Active'}</span>
                        </div>
                        <div className="flex justify-between text-content-muted">
                          <span>Target Due:</span>
                          <span className="font-mono text-content-primary">{job.due_date ? new Date(job.due_date).toLocaleDateString() : 'Open'}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border-default flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setSelectedJob(job)}
                          className="text-[11px] text-content-secondary hover:text-amber-500"
                        >
                          View Site Dossier
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusTransition(job.id, 'completed')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-bold text-[11px] flex items-center gap-1 transition-all"
                        >
                          <CheckCircle className="h-3 w-3" /> Complete & Demobilize
                        </button>
                      </div>
                    </div>
                  ))}
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
                    onClick={() => window.print()}
                    title="Print Official Work Order Slip"
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
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => selectedJob && setEditingJob({ ...selectedJob })}>
                    <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                    Edit Order
                  </Button>
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

                {/* 2. Visual 5-Stage Lifecycle Stepper */}
                <div className="p-4 rounded-2xl bg-surface-input border border-border-default/60">
                  <p className="text-[10px] font-bold uppercase text-content-muted mb-3">Work Order Lifecycle Flow</p>
                  <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
                    <div className={`p-2 rounded-xl ${selectedJob.status !== 'cancelled' ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30' : 'bg-surface-card text-content-muted'}`}>
                      1. Requested
                    </div>
                    <div className={`p-2 rounded-xl ${selectedJob.status !== 'draft' && selectedJob.status !== 'pending' && selectedJob.status !== 'cancelled' ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30' : 'bg-surface-card text-content-muted'}`}>
                      2. Approved
                    </div>
                    <div className={`p-2 rounded-xl ${selectedJob.assigned_to ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30' : 'bg-surface-card text-content-muted'}`}>
                      3. Staff Assigned
                    </div>
                    <div className={`p-2 rounded-xl ${selectedJob.status === 'in-progress' || selectedJob.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30' : 'bg-surface-card text-content-muted'}`}>
                      4. Site Mobilized
                    </div>
                    <div className={`p-2 rounded-xl ${selectedJob.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30' : 'bg-surface-card text-content-muted'}`}>
                      5. Done & CSAT
                    </div>
                  </div>
                </div>

                {/* 3. Client, Logistics & Staff Assignment Grid */}
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

                  {/* Designated Lead Engineer Card */}
                  <div className="p-4 rounded-2xl bg-surface-card border border-border-default space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-content-primary flex items-center gap-1.5 text-xs">
                        <UserCheck className="h-4 w-4 text-blue-400" />
                        Designated Technical Lead
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setAssigningJob(selectedJob);
                          setAssignedUserId(String(selectedJob.assigned_to || ''));
                        }}
                        className="text-[11px] font-bold text-amber-500 hover:underline"
                      >
                        {selectedJob.assigned_to ? 'Change Lead' : '+ Assign Lead'}
                      </button>
                    </div>

                    {selectedJob.assigned_to ? (
                      <div className="p-3 rounded-xl bg-surface-input border border-border-default/60 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-sm shrink-0">
                          {staffList.find(s => s.id === selectedJob.assigned_to)?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-content-primary text-xs">
                            {staffList.find(s => s.id === selectedJob.assigned_to)?.name || 'Assigned Staff'}
                          </p>
                          <p className="text-[11px] text-content-muted capitalize">
                            {staffList.find(s => s.id === selectedJob.assigned_to)?.role?.replaceAll('_', ' ')}
                          </p>
                          <p className="text-[10px] text-content-secondary font-mono mt-0.5">
                            {staffList.find(s => s.id === selectedJob.assigned_to)?.email}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                        <p className="text-xs font-semibold text-rose-400">No Lead Engineer Assigned</p>
                        <p className="text-[11px] text-content-secondary mt-1">Designate a technical specialist to supervise site operations.</p>
                      </div>
                    )}

                    <div className="text-[11px] text-content-secondary space-y-1">
                      <p><strong className="text-content-primary">Priority Level:</strong> <span className="capitalize font-bold text-amber-500">{selectedJob.priority || 'Medium'}</span></p>
                      <p><strong className="text-content-primary">Order Creator:</strong> {selectedJob.creator?.name || 'Sales Representative'}</p>
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
                    <button
                      type="button"
                      onClick={() => setAddingEquipmentJob(selectedJob)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 font-bold text-[11px] flex items-center gap-1 transition-all"
                    >
                      <Plus className="h-3 w-3" /> Add Equipment to Order
                    </button>
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
                                <button
                                  type="button"
                                  onClick={() => handleDeleteEquipmentItem(selectedJob.id, item.id)}
                                  className="text-rose-400 hover:text-rose-300 p-1"
                                  title="Remove item"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
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

          {/* ASSIGN PERSONNEL MODAL */}
          <Modal
            isOpen={!!assigningJob}
            onClose={() => setAssigningJob(null)}
            title={`Assign Staff Lead: ${assigningJob?.job_number || ''}`}
            size="md"
            footer={
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAssigningJob(null)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleAssignStaff} loading={saving} disabled={!assignedUserId}>
                  Confirm Dispatch
                </Button>
              </div>
            }
          >
            <div className="space-y-4 text-xs">
              <p className="text-content-secondary">
                Select a certified field engineer or operations manager to oversee the execution, rigging, and safety standards of this work order.
              </p>
              <div>
                <label className="block text-[11px] font-bold uppercase text-content-muted mb-1">
                  Designated Staff Member *
                </label>
                <select
                  required
                  value={assignedUserId}
                  onChange={(e) => setAssignedUserId(e.target.value)}
                  className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2.5 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                >
                  <option value="">-- Choose Personnel --</option>
                  {staffList.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email}) - {user.role.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Modal>

          {/* SCHEDULE & MOBILIZE MODAL */}
          <Modal
            isOpen={!!schedulingJob}
            onClose={() => setSchedulingJob(null)}
            title={`Mobilization & Site Schedule: ${schedulingJob?.job_number || ''}`}
            size="lg"
            footer={
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSchedulingJob(null)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleScheduleOrder} loading={saving}>
                  Save Schedule
                </Button>
              </div>
            }
          >
            <form onSubmit={handleScheduleOrder} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-content-muted mb-1">
                  Scheduled Mobilization Date
                </label>
                <input
                  type="date"
                  value={scheduleData.scheduled_date ? scheduleData.scheduled_date.slice(0, 10) : ''}
                  onChange={(e) => setScheduleData({ ...scheduleData, scheduled_date: e.target.value })}
                  className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-content-muted mb-1">
                  Execution Start Date (Sets to In-Progress)
                </label>
                <input
                  type="date"
                  value={scheduleData.start_date ? scheduleData.start_date.slice(0, 10) : ''}
                  onChange={(e) => setScheduleData({ ...scheduleData, start_date: e.target.value })}
                  className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-content-muted mb-1">
                  Target Completion Due Date
                </label>
                <input
                  type="date"
                  value={scheduleData.due_date ? scheduleData.due_date.slice(0, 10) : ''}
                  onChange={(e) => setScheduleData({ ...scheduleData, due_date: e.target.value })}
                  className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-content-muted mb-1">
                  Project Site Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fairview Commercial Complex, QC"
                  value={scheduleData.location}
                  onChange={(e) => setScheduleData({ ...scheduleData, location: e.target.value })}
                  className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold uppercase text-content-muted mb-1">
                  Logistics & Transport Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Heavy haulage permits, MMDA night transport coordination, security gate pass requirements..."
                  value={scheduleData.notes}
                  onChange={(e) => setScheduleData({ ...scheduleData, notes: e.target.value })}
                  className="w-full rounded-xl border border-border-default bg-surface-input px-3.5 py-2 text-xs text-content-primary focus:border-amber-500 focus:outline-none"
                />
              </div>
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
        </div>
      </AppLayout>
    </>
  );
};

export default JobOrdersList;
