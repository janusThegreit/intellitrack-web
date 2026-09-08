import { useEffect, useMemo, useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { Card, CardBody } from '../../Components/Card';
import Table, { TableColumn } from '../../Components/Table';
import Button from '../../Components/Button';
import { Input } from '../../Components/Form';
import { StatusBadge } from '../../Components/Badge';
import Modal from '../../Components/Modal';
import CrmNavTabs from '../../Components/CrmNavTabs';

import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Eye,
  Building2,
  MapPin,
  Phone,
  Archive,
  ArchiveRestore,
  Download,
  MessageSquare,
  FileText,
  BriefcaseBusiness,
  FolderKanban,
  Truck,
  History,
  ExternalLink,
  ShieldCheck,
  Mail,
  RefreshCw,
  Calendar,
  Wrench,
  Activity,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';

import { formatPeso } from '../../Utils/currency';

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

interface Inquiry {
  id: number;
  inquiry_number?: string;
  source?: string;
  details?: string;
  project_details?: string;
  status?: string;
  remarks?: string;
  created_at?: string;
}

interface LeadOpportunity {
  id: number;
  name?: string;
  description?: string;
  status?: string;
  estimated_value?: number;
  created_at?: string;
}

interface Quotation {
  id: number;
  quotation_number?: string;
  title?: string;
  amount?: number;
  total_amount?: number;
  grand_total?: number;
  status?: string;
  valid_until?: string;
  created_at?: string;
}

interface RelatedTransaction {
  id: number;
  reference?: string;
  status?: string;
  date?: string;
}

interface DeployedCrane {
  id: number;
  name: string;
  model?: string;
  code?: string;
  tonnage?: number;
  status?: string;
  site?: string;
  reference?: string;
}

interface JobOrderItemEquipment {
  id: number;
  name?: string;
  model_number?: string;
  equipment_code?: string;
  tonnage_capacity?: number;
}

interface JobOrderItem {
  id: number;
  equipment?: JobOrderItemEquipment;
}

interface JobOrderRecord {
  id: number;
  order_number: string;
  project_name?: string;
  site_location?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  total_amount?: number;
  created_at?: string;
  job_order_items?: JobOrderItem[];
}

interface RentalEquipment {
  id: number;
  name?: string;
  model_number?: string;
  equipment_code?: string;
  tonnage_capacity?: number;
  status?: string;
}

interface RentalRecord {
  id: number;
  rental_code: string;
  status: string;
  rental_start_date?: string;
  rental_end_date?: string;
  total_price?: number;
  site_location?: string;
  equipment?: RentalEquipment;
}

interface FollowUpRecord {
  id: number;
  follow_up_date?: string;
  type?: string;
  status?: string;
  notes?: string;
  assignee?: { id: number; name: string; email?: string };
}

interface CommunicationRecord {
  id: number;
  communication_date?: string;
  type?: string;
  subject?: string;
  notes?: string;
  creator?: { id: number; name: string };
}

interface ProjectRecord {
  id: number;
  project_name?: string;
  status?: string;
  location?: string;
}

interface Customer {
  id: number;
  customer_code?: string;

  /*
   * Basic customer information
   */
  name: string;
  email: string;
  phone: string;
  mobile_number?: string;

  /*
   * Client / company information
   */
  company_name?: string;
  contact_person?: string;
  position?: string;
  business_reg_no?: string;
  tax_id?: string;
  industry?: string;
  customer_type?: string;
  source?: string;

  /*
   * Address
   */
  address?: string;
  barangay?: string;
  city?: string;
  province?: string;
  postal_code?: string;

  customer_reference?: string;

  /*
   * Client status
   */
  status: string;

  remarks?: string;
  notes?: string;

  /*
   * Project information
   */
  project_location?: string;
  technical_requirements?: string;
  site_condition?: string;
  project_information?: string;
  estimated_budget?: number;

  /*
   * CRM information
   */
  inquiries_count?: number;
  quotations_count?: number;
  leads_count?: number;
  opportunities_count?: number;

  inquiries?: Inquiry[];
  leads?: LeadOpportunity[];
  opportunities?: LeadOpportunity[];
  quotations?: Quotation[];

  /*
   * Enterprise Relational Telemetry
   */
  lifetime_value?: number;
  active_job_orders_count?: number;
  active_rentals_count?: number;
  deployed_cranes?: DeployedCrane[];
  job_orders?: JobOrderRecord[];
  rentals?: RentalRecord[];
  projects?: ProjectRecord[];
  follow_ups?: FollowUpRecord[];
  communications?: CommunicationRecord[];

  /*
   * Related business transactions (legacy fallback)
   */
  related_job_orders?: RelatedTransaction[];
  related_rentals?: RelatedTransaction[];
  related_projects?: RelatedTransaction[];

  total_spending?: number;
  total_job_orders?: number;
  last_order_date?: string;
  last_activity?: string;

  interaction_history?: {
    id: number;
    type?: string;
    description?: string;
    date?: string;
    user?: string;
  }[];

  deleted_at?: string | null;
  archived_at?: string | null;
}

interface CustomersListProps {
  customers?: Customer[];

  pagination?: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

interface AuthUser {
  role?: string;
  roles?: Array<string | { name?: string }>;
  name?: string;
}

interface PageProps {
  [key: string]: unknown;
  auth?: {
    user?: AuthUser;
  };
}

/*
|--------------------------------------------------------------------------
| FORM
|--------------------------------------------------------------------------
*/

interface CustomerForm {
  // Basic Information
  customer_type: string;
  company_name: string;
  name: string;
  business_reg_no: string;
  tax_id: string;
  industry: string;

  // Contact Information
  contact_person: string;
  position: string;
  phone: string;
  mobile_number: string;
  email: string;

  // Address
  address: string;
  barangay: string;
  city: string;
  province: string;
  postal_code: string;

  // Additional
  source: string;
  notes: string;
  status: string;

  // Legacy/Project
  remarks: string;
  customer_reference: string;
  project_information: string;
  project_location: string;
  technical_requirements: string;
  site_condition: string;
  estimated_budget: string;
}

const emptyCustomer: CustomerForm = {
  customer_type: 'corporate',
  company_name: '',
  name: '',
  business_reg_no: '',
  tax_id: '',
  industry: '',

  contact_person: '',
  position: '',
  phone: '',
  mobile_number: '',
  email: '',

  address: '',
  barangay: '',
  city: '',
  province: '',
  postal_code: '',

  source: 'Website',
  notes: '',
  status: 'active',

  remarks: '',
  customer_reference: '',
  project_information: '',
  project_location: '',
  technical_requirements: '',
  site_condition: '',
  estimated_budget: '',
};

/*
|--------------------------------------------------------------------------
| OPTIONS & ANALYTICS SOURCES
|--------------------------------------------------------------------------
*/

const customerTypes = [
  { value: 'corporate', label: 'Corporate' },
  { value: 'business', label: 'Business' },
  { value: 'individual', label: 'Individual' },
];

const customerSources = [
  'Website',
  'Facebook',
  'Referral',
  'Walk-in',
  'Phone Call',
  'Email',
  'Existing Customer',
  'Other',
];

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

const CustomersList = ({
  customers = [],
}: CustomersListProps) => {
  const { auth } = usePage<PageProps>().props;

  /*
   * ------------------------------------------------------------
   * ROLE DETECTION
   * ------------------------------------------------------------
   */

  const normalizeRole = (role?: string) =>
    String(role ?? '')
      .toLowerCase()
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const userRoles: string[] = [
    ...(auth?.user?.role ? [auth.user.role] : []),
    ...(auth?.user?.roles ?? []).map(role =>
      typeof role === 'string' ? role : role?.name ?? ''
    ),
  ]
    .map(normalizeRole)
    .filter(Boolean);

  const isSalesManager = userRoles.some(role =>
    [ 'sales manager', 'salesmanager', 'manager sales', 'sales management',
    ].includes(role)
  );

  const isSalesBusinessDevelopment = userRoles.some(role =>
    [ 'sales business development', 'sales & business development', 'sales and business development', 'sales business development officer', 'sales business development staff', 'sales business development specialist', 'business development', 'business development officer', 'business development specialist', 'sales bdo', 'sbd',
    ].includes(role)
  );

  /*
   * ------------------------------------------------------------
   * STATE
   * ------------------------------------------------------------
   */

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);

  const [records, setRecords] =
    useState<Customer[]>(customers);

  const [loadError, setLoadError] = useState('');

  const [createOpen, setCreateOpen] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [form, setForm] =
    useState<CustomerForm>(emptyCustomer);

  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<
    'overview' | 'job_orders' | 'rentals' | 'quotations' | 'inquiries' | 'timeline'
  >('overview');

  const viewCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setActiveProfileTab('overview');
    setLoadingProfile(true);
    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        headers: {
          Accept: 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        const profile = data?.customer ?? (data?.id ? data : null);
        if (profile) {
          setSelectedCustomer(profile);
        }
      }
    } catch (err) {
      console.error('Failed to load customer profile details:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);

  const [sortBy, setSortBy] =
    useState<keyof Customer>('id');

  const [sortOrder, setSortOrder] =
    useState<'asc' | 'desc'>('desc');

  /*
   * ------------------------------------------------------------
   * LOAD CUSTOMERS
   * ------------------------------------------------------------
   *
   * Both Sales Business Development and Sales Manager can
   * access the customer/client records.
   */

  const loadCustomers = async () => {
    try {
      const response = await fetch(
        `/api/customers?per_page=100${
          showArchived ? '&archived=1' : ''
        }`,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error();
      }

      const data = await response.json();

      setRecords(data.data ?? []);
      setLoadError('');
    } catch {
      setLoadError(
        'Customer and client records could not be loaded.'
      );
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [showArchived]);

  /*
   * ------------------------------------------------------------
   * FILTERED RECORDS
   * ------------------------------------------------------------
   */

  const filteredCustomers = useMemo(() => {
    let result = [...records];

    /*
     * Search
     */
    if (searchQuery.trim()) {
      const query = searchQuery
        .toLowerCase()
        .trim();

      result = result.filter(customer =>
        [
          customer.customer_code,
          customer.name,
          customer.email,
          customer.phone,
          customer.mobile_number,
          customer.company_name,
          customer.contact_person,
          customer.position,
          customer.industry,
          customer.business_reg_no,
          customer.tax_id,
          customer.customer_type,
          customer.source,
          customer.customer_reference,
          customer.address,
          customer.barangay,
          customer.city,
          customer.province,
          customer.postal_code,
        ].some(value =>
          String(value ?? '')
            .toLowerCase()
            .includes(query)
        )
      );
    }

    /*
     * Status filter
     */
    if (statusFilter !== 'all') {
      result = result.filter(
        customer =>
          customer.status?.toLowerCase() ===
          statusFilter.toLowerCase()
      );
    }

    /*
     * Customer Type filter
     */
    if (typeFilter !== 'all') {
      result = result.filter(
        customer =>
          customer.customer_type?.toLowerCase() ===
          typeFilter.toLowerCase()
      );
    }

    /*
     * Customer Source filter
     */
    if (sourceFilter !== 'all') {
      result = result.filter(
        customer =>
          customer.source?.toLowerCase() ===
          sourceFilter.toLowerCase()
      );
    }

    /*
     * Sort
     */
    result.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
      }

      if (typeof bValue === 'string') {
        bValue = bValue.toLowerCase();
      }

      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (aValue < bValue) {
        return sortOrder === 'asc' ? -1 : 1;
      }

      if (aValue > bValue) {
        return sortOrder === 'asc' ? 1 : -1;
      }

      return 0;
    });

    return result;
  }, [
    records,
    searchQuery,
    statusFilter,
    typeFilter,
    sourceFilter,
    sortBy,
    sortOrder,
  ]);

  /*
   * ------------------------------------------------------------
   * CSRF
   * ------------------------------------------------------------
   */

  const getCsrfToken = () =>
    document.querySelector<HTMLMetaElement>(
      'meta[name="csrf-token"]'
    )?.content ?? '';

  /*
   * ------------------------------------------------------------
   * CREATE CUSTOMER / CLIENT
   * ------------------------------------------------------------
   */

  const createCustomer = async (
    event: React.FormEvent,
    addInquiry: boolean = false
  ) => {
    event.preventDefault();

    setSaving(true);
    setLoadError('');

    try {
      const response = await fetch(
        '/api/customers',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-CSRF-TOKEN': getCsrfToken(),
          },
          body: JSON.stringify({
            ...form,
            name: form.company_name || form.name,
            company_name: form.company_name || form.name,
            estimated_budget:
              form.estimated_budget === ''
                ? null
                : Number(form.estimated_budget),
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        const errDetail = errData?.message || (errData?.errors ? Object.values(errData.errors).flat().join(', ') : 'Customer could not be saved.');
        throw new Error(errDetail);
      }

      const created = await response.json();

      setCreateOpen(false);
      setForm(emptyCustomer);

      await loadCustomers();

      if (addInquiry) {
        const cName = created.company_name || created.name || '';
        const cPerson = created.contact_person || '';
        const cPhone = created.phone || created.mobile_number || '';
        const cEmail = created.email || '';
        window.location.href = `/inquiries?create=true&customer_id=${created.id}&customer_name=${encodeURIComponent(cName)}&contact_person=${encodeURIComponent(cPerson)}&phone=${encodeURIComponent(cPhone)}&email=${encodeURIComponent(cEmail)}`;
      }
    } catch (err: any) {
      setLoadError(
        err?.message || 'Customer/client could not be saved. Please check the required fields.'
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * ------------------------------------------------------------
   * UPDATE CUSTOMER / CLIENT
   * ------------------------------------------------------------
   */

  const updateCustomer = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!editingCustomer) return;

    setSaving(true);
    setLoadError('');

    try {
      const response = await fetch(
        `/api/customers/${editingCustomer.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-CSRF-TOKEN': getCsrfToken(),
          },
          body: JSON.stringify({
            ...form,
            name: form.company_name || form.name,
            company_name: form.company_name || form.name,
            estimated_budget:
              form.estimated_budget === ''
                ? null
                : Number(form.estimated_budget),
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        const errDetail = errData?.message || (errData?.errors ? Object.values(errData.errors).flat().join(', ') : 'Customer could not be updated.');
        throw new Error(errDetail);
      }

      setEditingCustomer(null);
      setForm(emptyCustomer);

      await loadCustomers();
    } catch (err: any) {
      setLoadError(
        err?.message || 'Customer/client could not be updated.'
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * ------------------------------------------------------------
   * OPEN EDIT
   * ------------------------------------------------------------
   */

  const openEdit = (customer: Customer) => {
    setSelectedCustomer(null);
    setEditingCustomer(customer);

    setForm({
      customer_type: customer.customer_type ?? 'corporate',
      name: customer.name ?? '',
      company_name: customer.company_name ?? customer.name ?? '',
      business_reg_no: customer.business_reg_no ?? '',
      tax_id: customer.tax_id ?? '',
      industry: customer.industry ?? '',

      contact_person: customer.contact_person ?? '',
      position: customer.position ?? '',
      phone: customer.phone ?? '',
      mobile_number: customer.mobile_number ?? '',
      email: customer.email ?? '',

      address: customer.address ?? '',
      barangay: customer.barangay ?? '',
      city: customer.city ?? '',
      province: customer.province ?? '',
      postal_code: customer.postal_code ?? '',

      source: customer.source ?? 'Website',
      notes: customer.notes ?? '',
      status: customer.status ?? 'active',

      remarks: customer.remarks ?? '',
      customer_reference: customer.customer_reference ?? customer.customer_code ?? '',
      project_information: customer.project_information ?? '',
      project_location: customer.project_location ?? '',
      technical_requirements: customer.technical_requirements ?? '',
      site_condition: customer.site_condition ?? '',
      estimated_budget:
        customer.estimated_budget != null
          ? String(customer.estimated_budget)
          : '',
    });
  };

  /*
   * ------------------------------------------------------------
   * DELETE
   * ------------------------------------------------------------
   */

  const deleteCustomer = async (
    customer: Customer
  ) => {
    const name =
      customer.company_name ||
      customer.name;

    if (
      !window.confirm( `Permanently remove ${name} from Customer and Client Management?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch( `/api/customers/${customer.id}`,
        {
          method: 'DELETE',
          headers: {
            Accept: 'application/json', 'X-CSRF-TOKEN': getCsrfToken(),
          },
        }
      );

      if (!response.ok) {
        throw new Error();
      }

      setSelectedCustomer(null);
      await loadCustomers();
    } catch {
      setLoadError( 'Customer/client could not be removed.'
      );
    }
  };

  /*
   * ------------------------------------------------------------
   * ARCHIVE
   * ------------------------------------------------------------
   */

  const archiveCustomer = async (
    customer: Customer
  ) => {
    const name =
      customer.company_name ||
      customer.name;

    if (
      !window.confirm( `Archive ${name}? It can be restored later.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch( `/api/customers/${customer.id}/archive`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json', 'X-CSRF-TOKEN': getCsrfToken(),
          },
        }
      );

      if (!response.ok) {
        throw new Error();
      }

      setSelectedCustomer(null);
      await loadCustomers();
    } catch {
      setLoadError( 'Customer/client could not be archived.'
      );
    }
  };

  /*
   * ------------------------------------------------------------
   * RESTORE
   * ------------------------------------------------------------
   */

  const restoreCustomer = async (
    customer: Customer
  ) => {
    try {
      const response = await fetch( `/api/customers/${customer.id}/restore`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json', 'X-CSRF-TOKEN': getCsrfToken(),
          },
        }
      );

      if (!response.ok) {
        throw new Error();
      }

      setSelectedCustomer(null);
      await loadCustomers();
    } catch {
      setLoadError( 'Customer/client could not be restored.'
      );
    }
  };

  /*
   * ------------------------------------------------------------
   * EXPORT
   * ------------------------------------------------------------
   */

  const exportCustomers = () => {
    const query = new URLSearchParams({
      ...(searchQuery ? { search: searchQuery } : {}),
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
      ...(typeFilter !== 'all' ? { type: typeFilter } : {}),
      ...(sourceFilter !== 'all' ? { source: sourceFilter } : {}),
      ...(showArchived ? { archived: '1' } : {}),
    });
    window.location.href = `/api/customers/export?${query.toString()}`;
  };

  /*
   * ------------------------------------------------------------
   * TABLE COLUMNS (CAPSTONE SPECIFICATION)
   * ------------------------------------------------------------
   * Columns: Customer ID | Customer | Contact Person | Contact No. | Type | Status | Actions
   */

  const columns: TableColumn<Customer>[] = [
    {
      key: 'customer_code',
      label: 'CUSTOMER ID',
      sortable: true,
      width: '12%',
      render: (value, row) => (
        <span className="font-mono font-bold text-amber-700 dark:text-amber-400 text-xs px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
          {value || row.customer_reference || `CUS-${String(row.id).padStart(4, '0')}`}
        </span>
      ),
    },
    {
      key: 'company_name',
      label: 'CUSTOMER',
      sortable: true,
      width: '21%',
      render: (value, row) => (
        <div>
          <p className="font-bold text-content-primary">
            {value || row.name}
          </p>
          {(row.industry || row.city) && (
            <p className="text-xs text-content-secondary mt-0.5 font-medium">
              {[row.industry, row.city].filter(Boolean).join(' • ')}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'contact_person',
      label: 'CONTACT PERSON',
      sortable: true,
      width: '17%',
      render: (value, row) => (
        <div>
          <p className="font-semibold text-content-primary">
            {value || '—'}
          </p>
          {row.position && (
            <p className="text-xs text-content-secondary mt-0.5">
              {row.position}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'CONTACT NO.',
      sortable: true,
      width: '15%',
      render: (value, row) => (
        <div>
          <p className="font-mono text-sm font-semibold text-content-primary">
            {value || row.mobile_number || '—'}
          </p>
          {row.email && (
            <p className="text-xs text-content-secondary truncate max-w-[160px]">
              {row.email}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'customer_type',
      label: 'TYPE',
      sortable: true,
      width: '11%',
      render: (value) => {
        const type = String(value || 'corporate').toLowerCase();
        const displayType = type.charAt(0).toUpperCase() + type.slice(1);
        const colorClass =
          type === 'corporate'
            ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
            : type === 'business'
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
            : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';

        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${colorClass}`}>
            {displayType}
          </span>
        );
      },
    },
    {
      key: 'status',
      label: 'STATUS',
      sortable: true,
      width: '11%',
      render: (status) => <StatusBadge status={status || 'active'} />,
    },
    {
      key: 'id',
      label: 'ACTIONS',
      width: '13%',
      render: (_id, row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => viewCustomer(row)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/15 dark:hover:bg-blue-500/25 text-xs font-semibold text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 transition-all cursor-pointer shadow-xs"
            title="View Customer"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>View</span>
          </button>

          {(isSalesBusinessDevelopment || isSalesManager) && (
            <>
              <button
                onClick={() => openEdit(row)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/15 dark:hover:bg-amber-500/25 text-xs font-semibold text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 transition-all cursor-pointer shadow-xs"
                title="Edit Customer"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>

              {!row.deleted_at && !row.archived_at ? (
                <button
                  onClick={() => archiveCustomer(row)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-xs"
                  title="Archive Customer"
                >
                  <Archive className="h-3.5 w-3.5" />
                  <span>Archive</span>
                </button>
              ) : (
                <button
                  onClick={() => restoreCustomer(row)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 transition-all cursor-pointer shadow-xs"
                  title="Restore Customer"
                >
                  <ArchiveRestore className="h-3.5 w-3.5" />
                  <span>Restore</span>
                </button>
              )}

              {isSalesManager && (
                <button
                  onClick={() => deleteCustomer(row)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 text-xs font-semibold text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 transition-all cursor-pointer shadow-xs"
                  title="Delete Customer Permanently"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  /*
   * ------------------------------------------------------------
   * SUMMARY DATA
   * ------------------------------------------------------------
   */

  const totalCustomers = records.length;

  const activeClients = records.filter(
    customer =>
      customer.status?.toLowerCase() === 'active'
  ).length;

  const prospectClients = records.filter(
    customer =>
      customer.status?.toLowerCase() === 'prospect'
  ).length;

  const totalInquiries = records.reduce(
    (total, customer) =>
      total +
      Number(customer.inquiries_count ?? 0),
    0
  );

  const totalQuotations = records.reduce(
    (total, customer) =>
      total +
      Number(customer.quotations_count ?? 0),
    0
  );

  /*
   * ------------------------------------------------------------
   * CREATE / EDIT FORM
   * ------------------------------------------------------------
   */

  const customerForm = (
    formId: string,
    submitHandler: (
      event: React.FormEvent
    ) => void
  ) => (
    <form
      id={formId}
      onSubmit={submitHandler}
      className="space-y-6"
    >
      {/* 1. BASIC INFORMATION */}
      <div>
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border-subtle">
          <Building2 className="h-4 w-4 text-brand" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-content-primary">
            Basic Information
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Customer Type <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={form.customer_type}
              onChange={event =>
                setForm({
                  ...form,
                  customer_type: event.target.value,
                })
              }
              className="w-full rounded-md border border-border-default bg-surface-input p-2.5 text-sm text-content-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            >
              {customerTypes.map(type => (
                <option key={type.value} value={type.value} className="bg-surface-card text-content-primary">
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Customer/Company Name <span className="text-rose-500">*</span>
            </label>
            <input
              required
              placeholder="e.g. ABC Construction"
              value={form.company_name}
              onChange={event =>
                setForm({
                  ...form,
                  company_name: event.target.value,
                  name: event.target.value,
                })
              }
              className="w-full rounded-md border border-border-default bg-surface-input p-2.5 text-sm text-content-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Business Registration No.
            </label>
            <input
              placeholder="e.g. SEC / DTI Reg. No."
              value={form.business_reg_no}
              onChange={event =>
                setForm({
                  ...form,
                  business_reg_no: event.target.value,
                })
              }
              className="w-full rounded-md border border-border-default bg-surface-input p-2.5 text-sm text-content-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              TIN (Tax Identification Number)
            </label>
            <input
              placeholder="000-000-000-000"
              value={form.tax_id}
              onChange={event =>
                setForm({
                  ...form,
                  tax_id: event.target.value,
                })
              }
              className="w-full rounded-md border border-border-default bg-surface-input p-2.5 text-sm text-content-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Industry
            </label>
            <input
              placeholder="e.g. Construction, Infrastructure, Engineering, Logistics"
              value={form.industry}
              onChange={event =>
                setForm({
                  ...form,
                  industry: event.target.value,
                })
              }
              className="w-full rounded-md border border-border-default bg-surface-input p-2.5 text-sm text-content-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. CONTACT INFORMATION */}
      <div>
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border-subtle">
          <Phone className="h-4 w-4 text-brand" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-content-primary">
            Contact Information
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Contact Person <span className="text-rose-500">*</span>
            </label>
            <input
              required
              placeholder="e.g. Juan Dela Cruz"
              value={form.contact_person}
              onChange={event =>
                setForm({
                  ...form,
                  contact_person: event.target.value,
                })
              }
              className="w-full rounded-md border border-border-default bg-surface-input p-2.5 text-sm text-content-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Position
            </label>
            <input
              placeholder="e.g. Project Director / Procurement Manager"
              value={form.position}
              onChange={event =>
                setForm({
                  ...form,
                  position: event.target.value,
                })
              }
              className="w-full rounded-md border border-border-default bg-surface-input p-2.5 text-sm text-content-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Phone Number <span className="text-rose-500">*</span>
            </label>
            <input
              required
              placeholder="e.g. (02) 8123-4567 or 09171234567"
              value={form.phone}
              onChange={event =>
                setForm({
                  ...form,
                  phone: event.target.value,
                })
              }
              className="w-full rounded-md border border-border-default bg-surface-input p-2.5 text-sm text-content-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Mobile Number
            </label>
            <input
              placeholder="e.g. 09XXXXXXXXX"
              value={form.mobile_number}
              onChange={event =>
                setForm({
                  ...form,
                  mobile_number: event.target.value,
                })
              }
              className="w-full rounded-md border border-border-default bg-surface-input p-2.5 text-sm text-content-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="client@company.com"
              value={form.email}
              onChange={event =>
                setForm({
                  ...form,
                  email: event.target.value,
                })
              }
              className="w-full rounded-md border border-border-default bg-surface-input p-2.5 text-sm text-content-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>
        </div>
      </div>

      {/* 3. ADDRESS */}
      <div>
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border-subtle">
          <MapPin className="h-4 w-4 text-brand" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-content-primary">
            Address
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Street Address
            </label>
            <input
              placeholder="Unit / Floor / Bldg, Street Name"
              value={form.address}
              onChange={event =>
                setForm({
                  ...form,
                  address: event.target.value,
                })
              }
              className="w-full rounded-md border border-border-default bg-surface-input p-2.5 text-sm text-content-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Barangay
            </label>
            <input
              placeholder="e.g. Brgy. San Antonio"
              value={form.barangay}
              onChange={event =>
                setForm({
                  ...form,
                  barangay: event.target.value,
                })
              }
              className="w-full rounded-md border border-border-default bg-surface-input p-2.5 text-sm text-content-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              City / Municipality
            </label>
            <input
              placeholder="e.g. Pasig City"
              value={form.city}
              onChange={event =>
                setForm({
                  ...form,
                  city: event.target.value,
                })
              }
              className="w-full rounded-md border border-border-default bg-surface-input p-2.5 text-sm text-content-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Province
            </label>
            <input
              placeholder="e.g. Metro Manila / Rizal"
              value={form.province}
              onChange={event =>
                setForm({
                  ...form,
                  province: event.target.value,
                })
              }
              className="w-full rounded-md border border-border-default bg-surface-input p-2.5 text-sm text-content-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Postal Code
            </label>
            <input
              placeholder="e.g. 1605"
              value={form.postal_code}
              onChange={event =>
                setForm({
                  ...form,
                  postal_code: event.target.value,
                })
              }
              className="w-full rounded-md border border-border-default bg-surface-input p-2.5 text-sm text-content-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>
        </div>
      </div>

      {/* 4. ADDITIONAL */}
      <div>
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border-subtle">
          <BriefcaseBusiness className="h-4 w-4 text-brand" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-content-primary">
            Additional Information
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Customer Source <span className="text-xs text-content-secondary font-normal">(For analytics)</span>
            </label>
            <select
              value={form.source}
              onChange={event =>
                setForm({
                  ...form,
                  source: event.target.value,
                })
              }
              className="w-full rounded-md border border-border-default bg-surface-input p-2.5 text-sm text-content-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            >
              {customerSources.map(src => (
                <option key={src} value={src} className="bg-surface-card text-content-primary">
                  {src}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Status
            </label>
            <select
              value={form.status}
              onChange={event =>
                setForm({
                  ...form,
                  status: event.target.value,
                })
              }
              className="w-full rounded-md border border-border-default bg-surface-input p-2.5 text-sm text-content-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            >
              <option value="active" className="bg-surface-card text-content-primary">Active</option>
              <option value="prospect" className="bg-surface-card text-content-primary">Prospect</option>
              <option value="inactive" className="bg-surface-card text-content-primary">Inactive</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Notes
            </label>
            <textarea
              rows={3}
              placeholder="Additional client background, special instructions, or notes..."
              value={form.notes}
              onChange={event =>
                setForm({
                  ...form,
                  notes: event.target.value,
                })
              }
              className="w-full rounded-md border border-border-default bg-surface-input p-2.5 text-sm text-content-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>
        </div>
      </div>
    </form>
  );

  /*
   * ------------------------------------------------------------
   * CUSTOMER 360 DOSSIER TABS
   * ------------------------------------------------------------
   */

  const Customer360OverviewTab = ({ customer }: { customer: Customer }) => {
    return (
      <div className="space-y-6">
        {/* 2-Column Core Info */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Column 1: Fiscal & Corporate Profile */}
          <div className="rounded-xl border border-border-default bg-surface-app/70 dark:bg-neutral-900/60 p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border-subtle text-xs font-semibold uppercase tracking-wider text-amber-400">
              <Building2 className="h-4 w-4" />
              <span>Corporate & Fiscal Registry</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-content-secondary">Customer Code</p>
                <p className="mt-1 font-mono font-semibold text-content-primary">
                  {customer.customer_code || `CUS-${String(customer.id).padStart(4, '0')}`}
                </p>
              </div>
              <div>
                <p className="text-xs text-content-secondary">Account Classification</p>
                <p className="mt-1 font-semibold capitalize text-content-primary">
                  {customer.customer_type || 'Corporate'}
                </p>
              </div>
              <div>
                <p className="text-xs text-content-secondary">Business Registration No.</p>
                <p className="mt-1 font-mono font-semibold text-content-primary">
                  {customer.business_reg_no || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-content-secondary">Tax ID (TIN)</p>
                <p className="mt-1 font-mono font-semibold text-content-primary">
                  {customer.tax_id || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-content-secondary">Industry Vertical</p>
                <p className="mt-1 font-semibold text-content-primary">
                  {customer.industry || 'Commercial Construction'}
                </p>
              </div>
              <div>
                <p className="text-xs text-content-secondary">Acquisition Source</p>
                <p className="mt-1 font-semibold text-content-primary">
                  {customer.source || 'Direct Client'}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-border-subtle/60">
              <div className="flex items-center gap-2 mb-1.5 text-xs text-content-secondary">
                <MapPin className="h-3.5 w-3.5 text-amber-400" />
                <span>Headquarters / Registered Address</span>
              </div>
              <p className="text-sm text-content-primary">
                {[
                  customer.address,
                  customer.barangay,
                  customer.city,
                  customer.province,
                  customer.postal_code,
                ]
                  .filter(Boolean)
                  .join(', ') || 'No registered company address on file.'}
              </p>
            </div>
          </div>

          {/* Column 2: Key Contacts & Operational Reqs */}
          <div className="rounded-xl border border-border-default bg-surface-app/70 dark:bg-neutral-900/60 p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border-subtle text-xs font-semibold uppercase tracking-wider text-blue-400">
              <UserCheck className="h-4 w-4" />
              <span>Key Decision Maker & Operations</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-content-secondary">Primary Contact Person</p>
                <p className="mt-1 font-semibold text-content-primary">
                  {customer.contact_person || customer.name || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-content-secondary">Designation / Role</p>
                <p className="mt-1 font-semibold text-content-primary">
                  {customer.position || 'Project Representative'}
                </p>
              </div>
              <div>
                <p className="text-xs text-content-secondary">Official Phone</p>
                {customer.phone ? (
                  <a href={`tel:${customer.phone}`} className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-amber-400 hover:underline">
                    <Phone className="h-3 w-3" />
                    {customer.phone}
                  </a>
                ) : (
                  <p className="mt-1 text-neutral-500 font-mono text-xs">—</p>
                )}
              </div>
              <div>
                <p className="text-xs text-content-secondary">Mobile Number</p>
                {customer.mobile_number ? (
                  <a href={`tel:${customer.mobile_number}`} className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-amber-400 hover:underline">
                    <Phone className="h-3 w-3" />
                    {customer.mobile_number}
                  </a>
                ) : (
                  <p className="mt-1 text-neutral-500 font-mono text-xs">—</p>
                )}
              </div>
              <div className="col-span-2">
                <p className="text-xs text-content-secondary">Official Email</p>
                {customer.email ? (
                  <a href={`mailto:${customer.email}`} className="mt-1 inline-flex items-center gap-1.5 font-medium text-blue-400 hover:underline">
                    <Mail className="h-3.5 w-3.5" />
                    {customer.email}
                  </a>
                ) : (
                  <p className="mt-1 text-neutral-500">—</p>
                )}
              </div>
            </div>

            {(customer.project_location || customer.site_condition || customer.technical_requirements) && (
              <div className="pt-3 border-t border-border-subtle/60 space-y-2 text-xs">
                {customer.project_location && (
                  <div>
                    <span className="text-content-secondary">Primary Site Location: </span>
                    <span className="text-content-primary font-semibold">{customer.project_location}</span>
                  </div>
                )}
                {customer.technical_requirements && (
                  <div>
                    <span className="text-content-secondary">Crane / Rigging Specs: </span>
                    <span className="text-content-primary font-medium">{customer.technical_requirements}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Deployed Fleet Highlight */}
        {customer.deployed_cranes && customer.deployed_cranes.length > 0 && (
          <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-neutral-900/40 to-neutral-900/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
                <Truck className="h-4 w-4" />
                <span>Heavy Cranes Currently Deployed on Client Sites ({customer.deployed_cranes.length})</span>
              </div>
              <span className="text-xs text-content-secondary">Real-time Mobilization Telemetry</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {customer.deployed_cranes.map((crane: any, idx) => (
                <div key={idx} className="rounded-lg border border-border-default bg-surface-card p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-bold text-content-primary">{crane.name || crane.crane_model}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                        Active
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-content-secondary">
                      <span className="font-mono text-amber-400 font-semibold">{crane.code || 'CRANE'}</span>
                      {(crane.maximum_load || crane.tonnage) && (
                        <span>· {crane.maximum_load || crane.tonnage} {crane.maximum_load_unit || 'Tons'}</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-border-subtle text-xs text-content-secondary flex items-center justify-between">
                    <span className="truncate max-w-[160px]">{crane.location || crane.site || 'Active Site'}</span>
                    <span className="font-mono text-neutral-300 text-[11px]">{crane.rental_number || crane.job_order_number || crane.reference}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Internal Directives & Notes */}
        {(customer.notes || customer.remarks) && (
          <div className="rounded-xl border border-border-default bg-surface-app/70 dark:bg-neutral-900/40 p-4">
            <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold uppercase tracking-wider text-content-secondary">
              <FileText className="h-3.5 w-3.5 text-amber-500" />
              <span>Internal Directives & Account Notes</span>
            </div>
            <p className="text-xs text-content-secondary whitespace-pre-line leading-relaxed">
              {customer.notes || customer.remarks}
            </p>
          </div>
        )}
      </div>
    );
  };

  const Customer360JobOrdersTab = ({ customer }: { customer: Customer }) => {
    const jobOrders = customer.job_orders ?? [];

    if (jobOrders.length === 0) {
      return (
        <div className="rounded-xl border border-dashed border-neutral-800 p-12 text-center">
          <FolderKanban className="mx-auto h-12 w-12 text-neutral-600 mb-3" />
          <h4 className="text-sm font-semibold text-content-primary">No Linked Job Orders Recorded</h4>
          <p className="mt-1 text-xs text-content-secondary max-w-sm mx-auto">
            There are no active or historical job orders dispatched for this customer yet.
          </p>
          <button
            onClick={() => router.visit(`/job-orders?action=create&customer_id=${customer.id}`)}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create New Job Order</span>
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-content-secondary">
            Showing <span className="text-content-primary font-semibold">{jobOrders.length}</span> recorded job order{jobOrders.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => router.visit(`/job-orders?action=create&customer_id=${customer.id}`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Job Order</span>
          </button>
        </div>

        <div className="space-y-3">
          {jobOrders.map((order: any) => {
            const statusColors: Record<string, string> = {
              in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
              'in-progress': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
              scheduled: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
              mobilized: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
              completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
              cancelled: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
            };
            const statusBadge = statusColors[order.status?.toLowerCase()] || 'bg-neutral-800 text-neutral-300 border-neutral-700';
            const orderNum = order.order_number || order.job_order_number || `JO-${order.id}`;

            return (
              <div
                key={order.id}
                className="rounded-xl border border-border-default bg-surface-card hover:bg-surface-app/40 dark:border-neutral-800 dark:bg-neutral-900/70 dark:hover:bg-neutral-900 p-4 transition-all shadow-xs"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-sm font-bold text-amber-400">
                        {orderNum}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded border capitalize font-medium ${statusBadge}`}>
                        {order.status?.replace(/[_-]/g, ' ')}
                      </span>
                    </div>
                    <h4 className="mt-1 text-sm font-semibold text-content-primary">
                      {order.project_name || 'Heavy Rigging Operation'}
                    </h4>
                    {(order.site_location || order.location) && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-content-secondary">
                        <MapPin className="h-3 w-3 text-amber-400 shrink-0" />
                        <span>{order.site_location || order.location}</span>
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-content-secondary">Contract Value</p>
                    <p className="font-mono text-sm font-bold text-emerald-400">
                      {formatPeso(order.total_amount ?? 0)}
                    </p>
                    <button
                      onClick={() => router.visit(`/job-orders?search=${encodeURIComponent(orderNum)}`)}
                      className="mt-2 inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      <span>View in Operations</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Equipment Items if any */}
                {order.job_order_items && order.job_order_items.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border-subtle/80 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-content-secondary">Assigned Equipment:</span>
                    {order.job_order_items.map((item: any, idx: number) => {
                      const eq = item.equipment;
                      const cap = eq?.maximum_load || eq?.tonnage_capacity;
                      return (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-800 text-xs text-content-primary border border-neutral-700"
                        >
                          <Wrench className="h-3 w-3 text-amber-400" />
                          <span>{eq?.name || eq?.crane_model || eq?.model_number || 'Crane Unit'}</span>
                          {cap && (
                            <span className="text-content-secondary">({cap}T)</span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const Customer360RentalsTab = ({ customer }: { customer: Customer }) => {
    const rentals = customer.rentals ?? [];
    const deployed = customer.deployed_cranes ?? [];

    return (
      <div className="space-y-6">
        {/* Deployed Cranes Banner */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
              <Truck className="h-4 w-4" />
              <span>Active Site Fleet Dispatches ({deployed.length})</span>
            </div>
          </div>

          {deployed.length === 0 ? (
            <div className="rounded-lg border border-border-default bg-surface-app/60 dark:border-neutral-800/80 dark:bg-neutral-900/40 p-4 text-center text-xs text-content-secondary">
              No heavy cranes currently mobilized on active sites for this customer.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {deployed.map((crane: any, idx) => (
                <div key={idx} className="rounded-xl border border-amber-500/30 bg-surface-card dark:bg-neutral-900/80 p-4 shadow-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-bold text-content-primary text-sm">{crane.name || crane.crane_model}</h5>
                      <p className="text-xs text-amber-500 dark:text-amber-400 font-mono mt-0.5">
                        {crane.code} · {crane.maximum_load || crane.tonnage} {crane.maximum_load_unit || 'Tons'} Capacity
                      </p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                      Deployed
                    </span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-border-subtle text-xs text-content-secondary space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-content-secondary">Site:</span>
                      <span className="font-semibold text-content-primary">{crane.location || crane.site}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-content-secondary">Tracking Ref:</span>
                      <span className="font-mono text-amber-500 dark:text-amber-400">{crane.rental_number || crane.job_order_number || crane.reference}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rental Agreements List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Rental Agreements & Dispatches ({rentals.length})
            </span>
            <button
              onClick={() => router.visit(`/rentals?action=create&customer_id=${customer.id}`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Dispatch Crane</span>
            </button>
          </div>

          {rentals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-800 p-8 text-center text-xs text-content-secondary">
              No rental agreements logged for this customer.
            </div>
          ) : (
            <div className="space-y-3">
              {rentals.map((rental: any) => {
                const code = rental.rental_number || rental.rental_code || `RNT-${rental.id}`;
                const eq = rental.equipment;
                const eqName = eq?.name || eq?.crane_model || eq?.model_number || 'Heavy Crane Unit';
                const cap = eq?.maximum_load || eq?.tonnage_capacity;
                const capUnit = eq?.maximum_load_unit || 'Tons';
                const cost = rental.total_amount ?? rental.total_price ?? rental.rental_cost ?? 0;

                return (
                  <div
                    key={rental.id}
                    className="rounded-xl border border-border-default bg-surface-card dark:border-neutral-800 dark:bg-neutral-900/70 p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-sm font-bold text-amber-500 dark:text-amber-400">{code}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20 capitalize font-medium">
                          {rental.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-content-primary">
                        {eqName}
                        {cap && (
                          <span className="text-content-secondary text-xs ml-1.5 font-normal">
                            ({cap} {capUnit} Heavy Lift)
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-content-secondary">
                        Period: <span className="text-content-primary">{rental.rental_start_date || 'N/A'}</span> to{' '}
                        <span className="text-content-primary">{rental.rental_end_date || 'N/A'}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-content-secondary">Contract Rental Fee</p>
                      <p className="font-mono text-sm font-bold text-emerald-500 dark:text-emerald-400">
                        {formatPeso(cost)}
                      </p>
                      <button
                        onClick={() => router.visit(`/rentals?search=${encodeURIComponent(code)}`)}
                        className="mt-2 inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                      >
                        <span>View in Fleet & Rentals</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const Customer360QuotationsTab = ({ customer }: { customer: Customer }) => {
    const quotations = customer.quotations ?? [];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-content-secondary">
            Showing <span className="text-content-primary font-semibold">{quotations.length}</span> recorded quotation{quotations.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => router.visit(`/quotations?action=create&customer_id=${customer.id}`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30 text-xs font-semibold transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Quotation</span>
          </button>
        </div>

        {quotations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-default dark:border-neutral-800 p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-content-secondary mb-3 opacity-40" />
            <h4 className="text-sm font-semibold text-content-primary">No Quotations on File</h4>
            <p className="mt-1 text-xs text-content-secondary max-w-sm mx-auto">
              Draft, pending, and approved commercial quotations for this client will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {quotations.map((quote: any) => {
              const quoteNum = quote.quotation_number || quote.quote_number || `QT-${quote.id}`;
              const quoteTitle = quote.project_name || quote.title || 'Heavy Crane Rental Quotation';
              const total = quote.total_amount ?? quote.grand_total ?? quote.total ?? 0;

              return (
                <div
                  key={quote.id}
                  className="rounded-xl border border-border-default bg-surface-card dark:border-neutral-800 dark:bg-neutral-900/70 p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs"
                >
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-sm font-bold text-purple-600 dark:text-purple-400">
                        {quoteNum}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 capitalize font-medium">
                        {quote.status || 'Draft'}
                      </span>
                    </div>
                    <h4 className="mt-1 text-sm font-semibold text-content-primary">
                      {quoteTitle}
                    </h4>
                    {quote.valid_until && (
                      <p className="mt-1 text-xs text-content-secondary">
                        Valid Until: <span className="text-content-primary">{quote.valid_until}</span>
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-content-secondary">Quotation Total</p>
                    <p className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
                      {formatPeso(total)}
                    </p>
                    <button
                      onClick={() => router.visit(`/quotations?search=${encodeURIComponent(quoteNum)}`)}
                      className="mt-2 inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                    >
                      <span>Open Quotation</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const Customer360InquiriesTab = ({ customer }: { customer: Customer }) => {
    const inquiries = customer.inquiries ?? [];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-content-secondary">
            Showing <span className="text-content-primary font-semibold">{inquiries.length}</span> recorded inquiry item{inquiries.length !== 1 ? 's' : ''}
          </span>
        </div>

        {inquiries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-default dark:border-neutral-800 p-10 text-center">
            <MessageSquare className="mx-auto h-10 w-10 text-content-secondary mb-2 opacity-40" />
            <p className="text-sm font-semibold text-content-primary">No CRM Inquiries</p>
            <p className="mt-1 text-xs text-content-secondary">All direct inquiries from web or phone will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {inquiries.map(inq => (
              <div key={inq.id} className="rounded-xl border border-border-default bg-surface-card dark:border-neutral-800 dark:bg-neutral-900/70 p-4 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-amber-500 dark:text-amber-400 font-semibold">
                      {inq.inquiry_number || `INQ-${inq.id}`}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20">
                      Source: {inq.source || 'Website'}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-surface-input text-content-secondary border border-border-default capitalize font-medium">
                    {inq.status || 'Active'}
                  </span>
                </div>
                <p className="text-xs text-content-primary">
                  {inq.project_details || inq.details || 'No project description recorded.'}
                </p>
                {inq.remarks && (
                  <p className="text-xs text-content-secondary italic pt-2 border-t border-border-subtle">
                    Notes: {inq.remarks}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const Customer360TimelineTab = ({ customer }: { customer: Customer }) => {
    const communications = customer.communications ?? [];
    const followUps = customer.follow_ups ?? [];

    return (
      <div className="space-y-6">
        {/* Scheduled Follow-ups */}
        <div>
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-amber-500 dark:text-amber-400">
            <Calendar className="h-4 w-4" />
            <span>Scheduled Client Follow-ups ({followUps.length})</span>
          </div>

          {followUps.length === 0 ? (
            <p className="text-xs text-content-secondary italic">No scheduled follow-up tasks currently pending.</p>
          ) : (
            <div className="space-y-2">
              {followUps.map(fu => (
                <div key={fu.id} className="rounded-lg border border-border-default bg-surface-card dark:border-neutral-800 dark:bg-neutral-900/60 p-3 flex items-start justify-between shadow-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-content-primary capitalize">{fu.type || 'Follow-up'}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20">
                        {fu.status || 'Pending'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-content-secondary">{fu.notes || 'Routine client check-in'}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="text-content-secondary font-mono">{fu.follow_up_date || 'Upcoming'}</p>
                    {fu.assignee && <p className="text-content-secondary mt-0.5">{fu.assignee.name}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Communication Log */}
        <div>
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-blue-500 dark:text-blue-400">
            <History className="h-4 w-4" />
            <span>Communications & Touchpoint History ({communications.length})</span>
          </div>

          {communications.length === 0 ? (
            <p className="text-xs text-content-secondary italic">No past communication logs recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {communications.map(comm => (
                <div key={comm.id} className="rounded-lg border border-border-default bg-surface-card dark:border-neutral-800 dark:bg-neutral-900/60 p-3 shadow-xs">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-content-primary capitalize">{comm.type || 'Touchpoint'}</span>
                      <span className="text-content-secondary">— {comm.subject || 'Client discussion'}</span>
                    </div>
                    <span className="font-mono text-content-secondary">{comm.communication_date || 'Recent'}</span>
                  </div>
                  {comm.notes && <p className="mt-1.5 text-xs text-content-secondary">{comm.notes}</p>}
                  {comm.creator && (
                    <p className="mt-2 text-[11px] text-content-secondary border-t border-border-subtle/60 pt-1">
                      Logged by: {comm.creator.name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  /*
   * ------------------------------------------------------------
   * MAIN UI
   * ------------------------------------------------------------
   */

  return (
    <>
      <Head title="Customer & Client Management" />

      <AppLayout dark={true} title="CRM & Client Management">
        <div className="space-y-4">
          <CrmNavTabs
            actionButton={
              isSalesBusinessDevelopment ? (
                <Button
                  variant="primary"
                  onClick={() => {
                    setForm(emptyCustomer);
                    setCreateOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  + Add Customer
                </Button>
              ) : undefined
            }
          />
          {/* ERROR */}

          {loadError && (
            <p className="border border-error-200 bg-error-50 p-3 text-sm text-error-700 rounded-md">
              {loadError}
            </p>
          )}

          {/* SUMMARY */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="group relative overflow-hidden rounded-2xl border border-border-default/80 bg-surface-card p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">Total Customers</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-content-primary font-mono">
                {totalCustomers}
              </p>
              <p className="mt-1 text-xs text-content-secondary">Registered client entities</p>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600" />
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-border-default/80 bg-surface-card p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">Active Clients</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <UserCheck className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
                {activeClients}
              </p>
              <p className="mt-1 text-xs text-content-secondary">Currently contracting</p>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-600" />
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-border-default/80 bg-surface-card p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">Prospects</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400 font-mono">
                {prospectClients}
              </p>
              <p className="mt-1 text-xs text-content-secondary">Lead opportunities</p>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600" />
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-border-default/80 bg-surface-card p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">CRM Activities</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Activity className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-content-primary font-mono">
                {totalInquiries + totalQuotations}
              </p>
              <p className="mt-1 text-xs text-content-secondary">
                {totalInquiries} inquiries · {totalQuotations} quotations
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-purple-600" />
            </div>
          </div>

          {/* SEARCH / FILTER / ACTION TOOLBAR */}

          <Card>
            <CardBody>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <div className="flex-1">
                    <Input
                      placeholder="Search Customer ID, Customer name, Contact Person, Phone, TIN..."
                      startIcon={<Search className="h-4 w-4" />}
                      value={searchQuery}
                      onChange={event => setSearchQuery(event.target.value)}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Customer Type Filter */}
                    <select
                      value={typeFilter}
                      onChange={e => setTypeFilter(e.target.value)}
                      className="rounded-lg border border-border-default bg-surface-card px-3 py-2 text-sm font-semibold text-content-primary outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 shadow-xs"
                    >
                      <option value="all">All Types</option>
                      {customerTypes.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>

                    {/* Status Filter */}
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="rounded-lg border border-border-default bg-surface-card px-3 py-2 text-sm font-semibold text-content-primary outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 shadow-xs"
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="prospect">Prospect</option>
                      <option value="inactive">Inactive</option>
                    </select>

                    {/* Customer Source Filter */}
                    <select
                      value={sourceFilter}
                      onChange={e => setSourceFilter(e.target.value)}
                      className="rounded-lg border border-border-default bg-surface-card px-3 py-2 text-sm font-semibold text-content-primary outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 shadow-xs"
                    >
                      <option value="all">All Sources</option>
                      {customerSources.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => {
                        setStatusFilter('all');
                        setTypeFilter('all');
                        setSourceFilter('all');
                        setSearchQuery('');
                      }}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-border-default bg-surface-card px-3 py-2 text-sm font-semibold text-content-secondary hover:text-content-primary hover:border-amber-500/40 hover:bg-surface-app transition-all shadow-xs cursor-pointer"
                      title="Clear All Filters"
                    >
                      <Filter className="h-4 w-4" />
                      Reset
                    </button>

                    <button
                      onClick={exportCustomers}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-border-default bg-surface-card px-3.5 py-2 text-sm font-semibold text-content-secondary hover:text-content-primary hover:border-amber-500/40 hover:bg-surface-app transition-all shadow-xs cursor-pointer"
                      title="Export Customers List as CSV"
                    >
                      <Download className="h-4 w-4" />
                      Export
                    </button>

                    {isSalesBusinessDevelopment && (
                      <Button
                        variant="primary"
                        onClick={() => {
                          setForm(emptyCustomer);
                          setCreateOpen(true);
                        }}
                        className="whitespace-nowrap"
                      >
                        <Plus className="h-4 w-4" />
                        + Add Customer
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border-subtle pt-2.5">
                  <label className="flex items-center gap-2 text-sm text-content-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showArchived}
                      onChange={event => setShowArchived(event.target.checked)}
                      className="h-4 w-4 rounded border-border-default bg-surface-input text-brand focus:ring-brand"
                    />
                    <span>Show archived</span>
                  </label>

                  <span className="text-xs text-content-secondary font-mono">
                    Showing {filteredCustomers.length} record{filteredCustomers.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* TABLE */}

          <Card noPadding>
            <Table
              columns={columns}
              data={filteredCustomers}
              emptyMessage={
                showArchived
                  ? 'No archived customer records.'
                  : 'No customer records found matching your filters.'
              }
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={(column, order) => {
                setSortBy(column as keyof Customer);
                setSortOrder(order);
              }}
              onRowClick={customer => viewCustomer(customer)}
            />
          </Card>

          {/* ======================================================
              ADD CUSTOMER MODAL
          ====================================================== */}

          <Modal
            isOpen={createOpen}
            onClose={() => !saving && setCreateOpen(false)}
            title="Add Customer"
            size="xl"
            footer={
              <div className="flex flex-wrap items-center justify-between w-full gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={e => createCustomer(e, true)}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Save & Add Inquiry</span>
                  </button>

                  <Button
                    type="submit"
                    form="create-customer-form"
                    loading={saving}
                  >
                    Save Customer
                  </Button>
                </div>
              </div>
            }
          >
            {customerForm('create-customer-form', e => createCustomer(e, false))}
          </Modal>

          {/* ======================================================
              CUSTOMER 360 PROFILE DOSSIER MODAL
          ====================================================== */}

          <Modal
            isOpen={!!selectedCustomer}
            onClose={() => setSelectedCustomer(null)}
            title={
              selectedCustomer ? (
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
                    {selectedCustomer.customer_code || `CUS-${String(selectedCustomer.id).padStart(4, '0')}`}
                  </span>
                  <span className="text-content-primary font-bold text-base">
                    {selectedCustomer.company_name || selectedCustomer.name}
                  </span>
                  <span className="hidden sm:inline-block text-xs text-content-secondary font-normal">
                    — Customer 360 Dossier
                  </span>
                </div>
              ) : 'Customer Profile Dossier'
            }
            size="5xl"
            footer={
              <div className="flex flex-wrap justify-between items-center w-full gap-3">
                <div className="flex items-center gap-2">
                  {(isSalesBusinessDevelopment || isSalesManager) && selectedCustomer && (
                    <>
                      {!selectedCustomer.archived_at ? (
                        <Button
                          variant="outline"
                          onClick={() => archiveCustomer(selectedCustomer)}
                        >
                          <Archive className="h-4 w-4" />
                          Archive Account
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => restoreCustomer(selectedCustomer)}
                        >
                          <ArchiveRestore className="h-4 w-4" />
                          Restore Account
                        </Button>
                      )}
                    </>
                  )}
                  {loadingProfile && (
                    <span className="flex items-center gap-1.5 text-xs text-amber-400">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span>Syncing relational records...</span>
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  {(isSalesBusinessDevelopment || isSalesManager) && selectedCustomer && (
                    <Button
                      variant="outline"
                      onClick={() => openEdit(selectedCustomer)}
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit Client Profile
                    </Button>
                  )}

                  <Button onClick={() => setSelectedCustomer(null)}>
                    Close Dossier
                  </Button>
                </div>
              </div>
            }
          >
            {selectedCustomer && (
              <div className="space-y-6">
                {/* 1. DOSSIER HERO HEADER */}
                <div className="rounded-2xl border border-neutral-800 bg-gradient-to-b from-neutral-900 via-neutral-900/90 to-neutral-950 p-5 shadow-xl">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                    {/* Left: Avatar & Identity */}
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-neutral-900 border border-amber-500/30 text-amber-400 font-black text-xl shadow-inner">
                        {(selectedCustomer.company_name || selectedCustomer.name || 'C').charAt(0).toUpperCase()}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-black tracking-tight text-content-primary">
                            {selectedCustomer.company_name || selectedCustomer.name}
                          </h2>
                          <StatusBadge status={selectedCustomer.status || 'active'} />
                          {selectedCustomer.customer_type && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium capitalize">
                              {selectedCustomer.customer_type} Account
                            </span>
                          )}
                          {selectedCustomer.industry && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                              {selectedCustomer.industry}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-content-secondary">
                          {selectedCustomer.contact_person && (
                            <span className="text-content-primary">
                              Attn: <strong className="text-content-primary">{selectedCustomer.contact_person}</strong>
                              {selectedCustomer.position ? ` (${selectedCustomer.position})` : ''}
                            </span>
                          )}
                          {selectedCustomer.email && (
                            <span className="font-mono text-neutral-300">{selectedCustomer.email}</span>
                          )}
                          {selectedCustomer.phone && (
                            <span className="font-mono text-amber-400">{selectedCustomer.phone}</span>
                          )}
                          <span>
                            Source: <strong className="text-neutral-300">{selectedCustomer.source || 'Website'}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Quick Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-neutral-800">
                      <button
                        onClick={() => router.visit(`/job-orders?action=create&customer_id=${selectedCustomer.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md transition-all active:scale-95"
                      >
                        <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                        <span>Job Order</span>
                      </button>

                      <button
                        onClick={() => router.visit(`/rentals?action=create&customer_id=${selectedCustomer.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-app hover:bg-surface-card text-content-primary font-semibold text-xs border border-border-default transition-all active:scale-95 shadow-xs cursor-pointer"
                      >
                        <Truck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Rent Crane</span>
                      </button>

                      <button
                        onClick={() => router.visit(`/quotations?action=create&customer_id=${selectedCustomer.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-app hover:bg-surface-card text-content-primary font-semibold text-xs border border-border-default transition-all active:scale-95 shadow-xs cursor-pointer"
                      >
                        <FileText className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Quote</span>
                      </button>

                      <button
                        onClick={() => openEdit(selectedCustomer)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-surface-app hover:bg-surface-card text-content-primary border border-border-default text-xs transition-all shadow-xs cursor-pointer font-semibold"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. TOP TELEMETRY STRIP (5 High-End KPI Cards) */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {/* KPI 1: Lifetime Contract Value */}
                  <div className="rounded-xl border border-border-default bg-surface-app/70 dark:bg-neutral-900/60 p-3.5 relative overflow-hidden">
                    <div className="flex items-center justify-between text-content-secondary mb-1">
                      <span className="text-[11px] uppercase font-bold tracking-wider">Lifetime Value</span>
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="font-mono text-base font-black text-emerald-700 dark:text-emerald-400 truncate">
                      {formatPeso(selectedCustomer.lifetime_value ?? selectedCustomer.total_spending ?? 0)}
                    </p>
                    <p className="text-[10px] text-content-secondary mt-0.5 truncate">
                      Cumulative volume
                    </p>
                  </div>

                  {/* KPI 2: Active Job Orders */}
                  <div className="rounded-xl border border-border-default bg-surface-app/70 dark:bg-neutral-900/60 p-3.5 relative overflow-hidden">
                    <div className="flex items-center justify-between text-content-secondary mb-1">
                      <span className="text-[11px] uppercase font-bold tracking-wider">Active Job Orders</span>
                      <FolderKanban className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="font-mono text-base font-black text-content-primary">
                      {selectedCustomer.active_job_orders_count ??
                        (selectedCustomer.job_orders?.filter(j => ['in_progress', 'scheduled', 'mobilized', 'active'].includes(j.status?.toLowerCase())).length ?? 0)}
                    </p>
                    <p className="text-[10px] text-content-secondary mt-0.5 truncate">
                      {selectedCustomer.job_orders?.length ?? 0} total registered
                    </p>
                  </div>

                  {/* KPI 3: Cranes Deployed On Site */}
                  <div className="rounded-xl border border-border-default bg-surface-app/70 dark:bg-neutral-900/60 p-3.5 relative overflow-hidden">
                    <div className="flex items-center justify-between text-content-secondary mb-1">
                      <span className="text-[11px] uppercase font-bold tracking-wider">Cranes on Site</span>
                      <Truck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <p className="font-mono text-base font-black text-amber-700 dark:text-amber-400">
                      {selectedCustomer.deployed_cranes?.length ?? 0} <span className="text-xs font-normal text-content-secondary">Units</span>
                    </p>
                    <p className="text-[10px] text-content-secondary mt-0.5 truncate">
                      Active heavy equipment
                    </p>
                  </div>

                  {/* KPI 4: Quotations & Bids */}
                  <div className="rounded-xl border border-border-default bg-surface-app/70 dark:bg-neutral-900/60 p-3.5 relative overflow-hidden">
                    <div className="flex items-center justify-between text-content-secondary mb-1">
                      <span className="text-[11px] uppercase font-bold tracking-wider">Quotations</span>
                      <FileText className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="font-mono text-base font-black text-content-primary">
                      {selectedCustomer.quotations?.length ?? selectedCustomer.quotations_count ?? 0}
                    </p>
                    <p className="text-[10px] text-content-secondary mt-0.5 truncate">
                      Proposals & estimates
                    </p>
                  </div>

                  {/* KPI 5: Account Standing */}
                  <div className="rounded-xl border border-border-default bg-surface-app/70 dark:bg-neutral-900/60 p-3.5 relative overflow-hidden col-span-2 md:col-span-1">
                    <div className="flex items-center justify-between text-content-secondary mb-1">
                      <span className="text-[11px] uppercase font-bold tracking-wider">Account Standing</span>
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="font-semibold text-sm text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                      {selectedCustomer.status || 'Active'}
                    </p>
                    <p className="text-[10px] text-content-secondary mt-0.5 truncate">
                      Tier: {selectedCustomer.customer_type || 'Corporate'}
                    </p>
                  </div>
                </div>

                {/* 3. 6-TAB NAVIGATION CONTROLLER */}
                <div className="border-b border-border-subtle">
                  <nav className="flex space-x-1 overflow-x-auto pb-px" aria-label="Customer 360 Tabs">
                    {[
                      {
                        key: 'overview' as const,
                        label: '360 Overview & Contacts',
                        icon: Building2,
                        count: null,
                      },
                      {
                        key: 'job_orders' as const,
                        label: 'Job Orders & Sites',
                        icon: FolderKanban,
                        count: selectedCustomer.job_orders?.length ?? 0,
                      },
                      {
                        key: 'rentals' as const,
                        label: 'Heavy Cranes & Fleet',
                        icon: Truck,
                        count: selectedCustomer.deployed_cranes?.length ?? selectedCustomer.rentals?.length ?? 0,
                      },
                      {
                        key: 'quotations' as const,
                        label: 'Quotations & Bids',
                        icon: FileText,
                        count: selectedCustomer.quotations?.length ?? 0,
                      },
                      {
                        key: 'inquiries' as const,
                        label: 'Inquiries & Pipeline',
                        icon: MessageSquare,
                        count: selectedCustomer.inquiries?.length ?? 0,
                      },
                      {
                        key: 'timeline' as const,
                        label: 'Activity & History',
                        icon: History,
                        count: (selectedCustomer.communications?.length ?? 0) + (selectedCustomer.follow_ups?.length ?? 0),
                      },
                    ].map(tab => {
                      const Icon = tab.icon;
                      const isActive = activeProfileTab === tab.key;
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setActiveProfileTab(tab.key)}
                          className={`group inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                            isActive
                              ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                              : 'border-transparent text-content-secondary hover:text-content-primary hover:border-neutral-700'
                          }`}
                        >
                          <Icon className={`h-4 w-4 ${isActive ? 'text-amber-400' : 'text-neutral-500 group-hover:text-neutral-300'}`} />
                          <span>{tab.label}</span>
                          {tab.count !== null && tab.count > 0 && (
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                              isActive ? 'bg-amber-500/20 text-amber-300' : 'bg-neutral-800 text-content-secondary'
                            }`}>
                              {tab.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* 4. TAB CONTENT VIEWPORTS */}
                <div className="min-h-[280px]">
                  {activeProfileTab === 'overview' && (
                    <Customer360OverviewTab customer={selectedCustomer} />
                  )}

                  {activeProfileTab === 'job_orders' && (
                    <Customer360JobOrdersTab customer={selectedCustomer} />
                  )}

                  {activeProfileTab === 'rentals' && (
                    <Customer360RentalsTab customer={selectedCustomer} />
                  )}

                  {activeProfileTab === 'quotations' && (
                    <Customer360QuotationsTab customer={selectedCustomer} />
                  )}

                  {activeProfileTab === 'inquiries' && (
                    <Customer360InquiriesTab customer={selectedCustomer} />
                  )}

                  {activeProfileTab === 'timeline' && (
                    <Customer360TimelineTab customer={selectedCustomer} />
                  )}
                </div>
              </div>
            )}
          </Modal>

          {/* ======================================================
              EDIT CUSTOMER MODAL
          ====================================================== */}

          <Modal
            isOpen={!!editingCustomer}
            onClose={() => !saving && setEditingCustomer(null)}
            title="Edit Customer"
            size="xl"
            footer={
              <div className="flex justify-end gap-2 w-full">
                <Button
                  variant="outline"
                  onClick={() => setEditingCustomer(null)}
                  disabled={saving}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  form="edit-customer-form"
                  loading={saving}
                >
                  Save Changes
                </Button>
              </div>
            }
          >
            {customerForm('edit-customer-form', updateCustomer)}
          </Modal>
        </div>
      </AppLayout>
    </>
  );
};

export default CustomersList;