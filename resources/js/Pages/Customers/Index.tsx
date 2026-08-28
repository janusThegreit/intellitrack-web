import React, { useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
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
  Trash2,
  Search,
  Filter,
  Eye,
  Building2,
  MapPin,
  Archive,
  ArchiveRestore,
  Download,
  MoreHorizontal,
  MessageSquare,
  FileText,
  BriefcaseBusiness,
  FolderKanban,
  Truck,
  History,
} from 'lucide-react';

import { formatPeso } from '../../Utils/currency';

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

interface Inquiry {
  id: number;
  source?: string;
  details?: string;
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
  status?: string;
  created_at?: string;
}

interface RelatedTransaction {
  id: number;
  reference?: string;
  status?: string;
  date?: string;
}

interface Customer {
  id: number;

  /*
   * Basic customer information
   */
  name: string;
  email: string;
  phone: string;

  /*
   * Client / company information
   */
  company_name?: string;
  contact_person?: string;
  position?: string;

  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;

  industry?: string;
  customer_reference?: string;

  /*
   * Client status
   * Prospect
   * Active
   * Inactive
   * On Hold
   * Closed
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
   * Related business transactions
   */
  related_job_orders?: RelatedTransaction[];
  related_rentals?: RelatedTransaction[];
  related_projects?: RelatedTransaction[];

  total_spending?: number;
  total_job_orders?: number;
  last_order_date?: string;
  last_activity?: string;

  /*
   * Optional interaction history
   */
  interaction_history?: {
    id: number;
    type?: string;
    description?: string;
    date?: string;
    user?: string;
  }[];
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
  name: string;
  email: string;
  phone: string;

  company_name: string;
  contact_person: string;
  position: string;

  address: string;
  city: string;
  province: string;
  postal_code: string;

  industry: string;
  customer_reference: string;

  status: string;

  remarks: string;
  notes: string;

  project_information: string;
  project_location: string;
  technical_requirements: string;
  site_condition: string;

  estimated_budget: string;
}

const emptyCustomer: CustomerForm = {
  name: '',
  email: '',
  phone: '',

  company_name: '',
  contact_person: '',
  position: '',

  address: '',
  city: '',
  province: '',
  postal_code: '',

  industry: '',
  customer_reference: '',

  status: 'prospect',

  remarks: '',
  notes: '',

  project_information: '',
  project_location: '',
  technical_requirements: '',
  site_condition: '',

  estimated_budget: '',
};

/*
|--------------------------------------------------------------------------
| STATUS OPTIONS
|--------------------------------------------------------------------------
*/

const clientStatuses = [
  {
    value: 'prospect',
    label: 'Prospect',
  },
  {
    value: 'active',
    label: 'Active',
  },
  {
    value: 'inactive',
    label: 'Inactive',
  },
  {
    value: 'on_hold',
    label: 'On Hold',
  },
  {
    value: 'closed',
    label: 'Closed',
  },
];

const quotationStatuses = [
  'Draft',
  'For Approval',
  'Revision Requested',
  'Approved',
  'Sent',
  'Accepted',
  'Rejected',
  'Expired',
  'Cancelled',
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
    [
      'sales manager',
      'salesmanager',
      'manager sales',
      'sales management',
    ].includes(role)
  );

  const isSalesBusinessDevelopment = userRoles.some(role =>
    [
      'sales business development',
      'sales & business development',
      'sales and business development',
      'sales business development officer',
      'sales business development staff',
      'sales business development specialist',
      'business development',
      'business development officer',
      'business development specialist',
      'sales bdo',
      'sbd',
    ].includes(role)
  );

  /*
   * ------------------------------------------------------------
   * STATE
   * ------------------------------------------------------------
   */

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
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

  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);

  const [sortBy, setSortBy] =
    useState<keyof Customer>('company_name');

  const [sortOrder, setSortOrder] =
    useState<'asc' | 'desc'>('asc');

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
          customer.name,
          customer.email,
          customer.phone,
          customer.company_name,
          customer.contact_person,
          customer.position,
          customer.industry,
          customer.customer_reference,
          customer.address,
          customer.city,
          customer.province,
        ].some(value =>
          String(value ?? '')
            .toLowerCase()
            .includes(query)
        )
      );
    }

    /*
     * Client status
     */
    if (statusFilter !== 'all') {
      result = result.filter(
        customer =>
          customer.status?.toLowerCase() ===
          statusFilter.toLowerCase()
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
    event: React.FormEvent
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
            estimated_budget:
              form.estimated_budget === ''
                ? null
                : Number(form.estimated_budget),
          }),
        }
      );

      if (!response.ok) {
        throw new Error();
      }

      setCreateOpen(false);
      setForm(emptyCustomer);

      await loadCustomers();
    } catch {
      setLoadError(
        'Customer/client could not be saved. Please check the required fields.'
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
            estimated_budget:
              form.estimated_budget === ''
                ? null
                : Number(form.estimated_budget),
          }),
        }
      );

      if (!response.ok) {
        throw new Error();
      }

      setEditingCustomer(null);
      setForm(emptyCustomer);

      await loadCustomers();
    } catch {
      setLoadError(
        'Customer/client could not be updated.'
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
      name: customer.name ?? '',
      email: customer.email ?? '',
      phone: customer.phone ?? '',

      company_name:
        customer.company_name ?? '',
      contact_person:
        customer.contact_person ?? '',
      position: customer.position ?? '',

      address: customer.address ?? '',
      city: customer.city ?? '',
      province: customer.province ?? '',
      postal_code:
        customer.postal_code ?? '',

      industry: customer.industry ?? '',
      customer_reference:
        customer.customer_reference ?? '',

      status:
        customer.status ?? 'prospect',

      remarks: customer.remarks ?? '',
      notes: customer.notes ?? '',

      project_information:
        customer.project_information ?? '',

      project_location:
        customer.project_location ?? '',

      technical_requirements:
        customer.technical_requirements ?? '',

      site_condition:
        customer.site_condition ?? '',

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
      !window.confirm(
        `Permanently remove ${name} from Customer and Client Management?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/customers/${customer.id}`,
        {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
            'X-CSRF-TOKEN': getCsrfToken(),
          },
        }
      );

      if (!response.ok) {
        throw new Error();
      }

      setSelectedCustomer(null);
      await loadCustomers();
    } catch {
      setLoadError(
        'Customer/client could not be removed.'
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
      !window.confirm(
        `Archive ${name}? It can be restored later.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/customers/${customer.id}/archive`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'X-CSRF-TOKEN': getCsrfToken(),
          },
        }
      );

      if (!response.ok) {
        throw new Error();
      }

      setSelectedCustomer(null);
      await loadCustomers();
    } catch {
      setLoadError(
        'Customer/client could not be archived.'
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
      const response = await fetch(
        `/api/customers/${customer.id}/restore`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'X-CSRF-TOKEN': getCsrfToken(),
          },
        }
      );

      if (!response.ok) {
        throw new Error();
      }

      setSelectedCustomer(null);
      await loadCustomers();
    } catch {
      setLoadError(
        'Customer/client could not be restored.'
      );
    }
  };

  /*
   * ------------------------------------------------------------
   * EXPORT
   * ------------------------------------------------------------
   */

  const exportCustomers = () => {
    const rows = filteredCustomers.map(
      customer => ({
        Customer:
          customer.company_name ||
          customer.name,

        'Contact Person':
          customer.contact_person || '',

        Position:
          customer.position || '',

        Email:
          customer.email || '',

        'Contact Number':
          customer.phone || '',

        Industry:
          customer.industry || '',

        'Customer Reference':
          customer.customer_reference || '',

        Status:
          customer.status || '',

        Inquiries:
          customer.inquiries_count ?? 0,

        Quotations:
          customer.quotations_count ?? 0,

        Leads:
          customer.leads_count ?? 0,

        Opportunities:
          customer.opportunities_count ?? 0,

        'Related Job Orders':
          customer.total_job_orders ?? 0,

        'Last Activity':
          customer.last_activity ||
          customer.last_order_date ||
          '',
      })
    );

    const header = Object.keys(
      rows[0] ?? {
        Customer: '',
        'Contact Person': '',
        Position: '',
        Email: '',
        'Contact Number': '',
        Industry: '',
        'Customer Reference': '',
        Status: '',
        Inquiries: '',
        Quotations: '',
        Leads: '',
        Opportunities: '',
        'Related Job Orders': '',
        'Last Activity': '',
      }
    );

    const csv = [
      header.join(','),
      ...rows.map(row =>
        header
          .map(key =>
            JSON.stringify(
              row[
                key as keyof typeof row
              ] ?? ''
            )
          )
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob(
      [csv],
      {
        type: 'text/csv;charset=utf-8;',
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement('a');

    link.href = url;
    link.download =
      'customers-clients.csv';

    link.click();

    URL.revokeObjectURL(url);
  };

  /*
   * ------------------------------------------------------------
   * TABLE COLUMNS
   * ------------------------------------------------------------
   *
   * Same table can be used by both roles.
   *
   * Sales Business Development:
   * - View
   * - Edit
   * - More
   *
   * Sales Manager:
   * - View
   * - More
   */

  const columns: TableColumn<Customer>[] =
    [
      {
        key: 'company_name',
        label: 'CUSTOMER / CLIENT',
        sortable: true,
        width: '20%',

        render: (value, row) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-white">
              {value || row.name}
            </p>

            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              CUS-{new Date().getFullYear()}-
              {String(row.id).padStart(3, '0')}
            </p>
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
            <p className="font-medium text-neutral-900 dark:text-white">
              {value || '—'}
            </p>

            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {row.position || row.email}
            </p>
          </div>
        ),
      },

      {
        key: 'industry',
        label: 'INDUSTRY',
        sortable: true,
        width: '12%',

        render: value => (
          <span className="text-neutral-700 dark:text-neutral-200">
            {value || '—'}
          </span>
        ),
      },

      {
        key: 'inquiries_count',
        label: 'INQUIRIES',
        sortable: true,
        width: '9%',

        render: value => (
          <span className="font-medium text-blue-600">
            {value ?? 0}
          </span>
        ),
      },

      {
        key: 'quotations_count',
        label: 'QUOTATIONS',
        sortable: true,
        width: '10%',

        render: value => (
          <span className="font-medium text-purple-600">
            {value ?? 0}
          </span>
        ),
      },

      {
        key: 'status',
        label: 'CLIENT STATUS',
        sortable: true,
        width: '12%',

        render: status => (
          <StatusBadge status={status} />
        ),
      },

      {
        key: 'last_activity',
        label: 'LAST ACTIVITY',
        sortable: true,
        width: '12%',

        render: (value, row) => (
          <span className="text-sm text-neutral-600 dark:text-neutral-300">
            {value ||
              row.last_order_date ||
              '—'}
          </span>
        ),
      },

      {
        key: 'id',
        label: '',
        width: '8%',

        render: (_id, row) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={event => {
                event.stopPropagation();
                setSelectedCustomer(row);
              }}
              className="p-1.5 text-neutral-400 transition-colors hover:text-primary-600"
              title="View customer/client"
            >
              <Eye className="h-4 w-4" />
            </button>

            {isSalesBusinessDevelopment && (
              <button
                onClick={event => {
                  event.stopPropagation();
                  openEdit(row);
                }}
                className="p-1.5 text-neutral-400 transition-colors hover:text-primary-600"
                title="Edit customer/client"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )}

            <button
              onClick={event =>
                event.stopPropagation()
              }
              className="p-1.5 text-neutral-400 transition-colors hover:text-neutral-700"
              title="More"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
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
      customer.status?.toLowerCase() ===
      'active'
  ).length;

  const prospectClients = records.filter(
    customer =>
      customer.status?.toLowerCase() ===
      'prospect'
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
      {/* CUSTOMER INFORMATION */}

      <div>
        <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
          Customer Information
        </h3>

        <p className="mt-1 text-sm text-neutral-500">
          Basic customer information used by
          Customer Relationship Management.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Customer Name
          <input
            required
            value={form.name}
            onChange={event =>
              setForm({
                ...form,
                name: event.target.value,
              })
            }
            className="mt-1 w-full border border-neutral-300 p-2.5 text-sm"
          />
        </label>

        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Customer Reference
          <input
            value={form.customer_reference}
            onChange={event =>
              setForm({
                ...form,
                customer_reference:
                  event.target.value,
              })
            }
            placeholder="e.g. CUS-2026-001"
            className="mt-1 w-full border border-neutral-300 p-2.5 text-sm"
          />
        </label>

        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Email Address
          <input
            required
            type="email"
            value={form.email}
            onChange={event =>
              setForm({
                ...form,
                email: event.target.value,
              })
            }
            className="mt-1 w-full border border-neutral-300 p-2.5 text-sm"
          />
        </label>

        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Contact Number
          <input
            value={form.phone}
            onChange={event =>
              setForm({
                ...form,
                phone: event.target.value,
              })
            }
            placeholder="09XXXXXXXXX"
            className="mt-1 w-full border border-neutral-300 p-2.5 text-sm"
          />
        </label>
      </div>

      {/* CLIENT INFORMATION */}

      <div className="border-t border-neutral-200 pt-5 dark:border-white/10">
        <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
          Client / Company Information
        </h3>

        <p className="mt-1 text-sm text-neutral-500">
          Information maintained under Client
          Management.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Client / Company Name
          <input
            value={form.company_name}
            onChange={event =>
              setForm({
                ...form,
                company_name:
                  event.target.value,
              })
            }
            className="mt-1 w-full border border-neutral-300 p-2.5 text-sm"
          />
        </label>

        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Industry / Business Type
          <input
            value={form.industry}
            onChange={event =>
              setForm({
                ...form,
                industry:
                  event.target.value,
              })
            }
            placeholder="e.g. Construction"
            className="mt-1 w-full border border-neutral-300 p-2.5 text-sm"
          />
        </label>

        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Contact Person
          <input
            value={form.contact_person}
            onChange={event =>
              setForm({
                ...form,
                contact_person:
                  event.target.value,
              })
            }
            className="mt-1 w-full border border-neutral-300 p-2.5 text-sm"
          />
        </label>

        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Position
          <input
            value={form.position}
            onChange={event =>
              setForm({
                ...form,
                position:
                  event.target.value,
              })
            }
            placeholder="e.g. Project Manager"
            className="mt-1 w-full border border-neutral-300 p-2.5 text-sm"
          />
        </label>

        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Client Status
          <select
            value={form.status}
            onChange={event =>
              setForm({
                ...form,
                status:
                  event.target.value,
              })
            }
            className="mt-1 w-full border border-neutral-300 bg-white p-2.5 text-sm"
          >
            {clientStatuses.map(status => (
              <option
                key={status.value}
                value={status.value}
              >
                {status.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Estimated Budget (PHP)
          <input
            type="number"
            min="0"
            value={form.estimated_budget}
            onChange={event =>
              setForm({
                ...form,
                estimated_budget:
                  event.target.value,
              })
            }
            placeholder="0.00"
            className="mt-1 w-full border border-neutral-300 p-2.5 text-sm"
          />
        </label>

        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200 md:col-span-2">
          Company Address
          <input
            value={form.address}
            onChange={event =>
              setForm({
                ...form,
                address:
                  event.target.value,
              })
            }
            className="mt-1 w-full border border-neutral-300 p-2.5 text-sm"
          />
        </label>

        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          City
          <input
            value={form.city}
            onChange={event =>
              setForm({
                ...form,
                city: event.target.value,
              })
            }
            className="mt-1 w-full border border-neutral-300 p-2.5 text-sm"
          />
        </label>

        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Province
          <input
            value={form.province}
            onChange={event =>
              setForm({
                ...form,
                province:
                  event.target.value,
              })
            }
            className="mt-1 w-full border border-neutral-300 p-2.5 text-sm"
          />
        </label>

        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Postal Code
          <input
            value={form.postal_code}
            onChange={event =>
              setForm({
                ...form,
                postal_code:
                  event.target.value,
              })
            }
            className="mt-1 w-full border border-neutral-300 p-2.5 text-sm"
          />
        </label>
      </div>

      {/* PROJECT INFORMATION */}

      <div className="border-t border-neutral-200 pt-5 dark:border-white/10">
        <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
          Project Information
        </h3>

        <p className="mt-1 text-sm text-neutral-500">
          Information that can be used by Sales,
          Job Orders, Rentals, and Project
          Management.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Project Location
          <input
            value={form.project_location}
            onChange={event =>
              setForm({
                ...form,
                project_location:
                  event.target.value,
              })
            }
            className="mt-1 w-full border border-neutral-300 p-2.5 text-sm"
          />
        </label>

        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Estimated Project Budget
          <input
            type="number"
            min="0"
            value={form.estimated_budget}
            onChange={event =>
              setForm({
                ...form,
                estimated_budget:
                  event.target.value,
              })
            }
            className="mt-1 w-full border border-neutral-300 p-2.5 text-sm"
          />
        </label>

        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200 md:col-span-2">
          Project Information
          <textarea
            value={
              form.project_information
            }
            onChange={event =>
              setForm({
                ...form,
                project_information:
                  event.target.value,
              })
            }
            rows={3}
            placeholder="Project name, scope, requirements, timeline, etc."
            className="mt-1 w-full border border-neutral-300 p-2.5 text-sm"
          />
        </label>

        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200 md:col-span-2">
          Technical Requirements
          <textarea
            value={
              form.technical_requirements
            }
            onChange={event =>
              setForm({
                ...form,
                technical_requirements:
                  event.target.value,
              })
            }
            rows={3}
            className="mt-1 w-full border border-neutral-300 p-2.5 text-sm"
          />
        </label>

        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200 md:col-span-2">
          Site Condition
          <textarea
            value={form.site_condition}
            onChange={event =>
              setForm({
                ...form,
                site_condition:
                  event.target.value,
              })
            }
            rows={3}
            className="mt-1 w-full border border-neutral-300 p-2.5 text-sm"
          />
        </label>
      </div>

      {/* REMARKS */}

      <div className="border-t border-neutral-200 pt-5 dark:border-white/10">
        <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
          Remarks
        </h3>
      </div>

      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
        Remarks / Notes
        <textarea
          value={form.remarks}
          onChange={event =>
            setForm({
              ...form,
              remarks:
                event.target.value,
            })
          }
          rows={4}
          placeholder="Add customer or client remarks..."
          className="mt-1 w-full border border-neutral-300 p-2.5 text-sm"
        />
      </label>
    </form>
  );

  /*
   * ------------------------------------------------------------
   * RELATED RECORDS COMPONENT
   * ------------------------------------------------------------
   */

  const RelatedRecords = ({
    customer,
  }: {
    customer: Customer;
  }) => (
    <div className="space-y-5">
      {/* INQUIRIES */}

      <div>
        <div className="mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-blue-600" />

          <h4 className="font-semibold text-neutral-900 dark:text-white">
            Inquiries
          </h4>

          <span className="text-sm text-neutral-500">
            ({customer.inquiries_count ?? 0})
          </span>
        </div>

        {customer.inquiries &&
        customer.inquiries.length > 0 ? (
          <div className="space-y-2">
            {customer.inquiries.map(
              inquiry => (
                <div
                  key={inquiry.id}
                  className="rounded-lg border border-neutral-200 p-3 dark:border-white/10"
                >
                  <div className="flex justify-between gap-3">
                    <p className="font-medium">
                      {inquiry.source ||
                        'Inquiry'}
                    </p>

                    <span className="text-xs text-neutral-500">
                      {inquiry.status ||
                        'Pending'}
                    </span>
                  </div>

                  {inquiry.details && (
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                      {inquiry.details}
                    </p>
                  )}

                  {inquiry.remarks && (
                    <p className="mt-1 text-xs text-neutral-500">
                      Remarks: {inquiry.remarks}
                    </p>
                  )}
                </div>
              )
            )}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">
            No inquiry records available.
          </p>
        )}
      </div>

      {/* LEADS / OPPORTUNITIES */}

      <div className="border-t border-neutral-200 pt-5 dark:border-white/10">
        <div className="mb-3 flex items-center gap-2">
          <BriefcaseBusiness className="h-4 w-4 text-orange-600" />

          <h4 className="font-semibold text-neutral-900 dark:text-white">
            Leads / Opportunities
          </h4>

          <span className="text-sm text-neutral-500">
            {(customer.leads_count ?? 0) +
              (customer.opportunities_count ??
                0)}
          </span>
        </div>

        {[
          ...(customer.leads ?? []),
          ...(customer.opportunities ?? []),
        ].length > 0 ? (
          <div className="space-y-2">
            {[
              ...(customer.leads ?? []),
              ...(customer.opportunities ?? []),
            ].map(item => (
              <div
                key={item.id}
                className="rounded-lg border border-neutral-200 p-3 dark:border-white/10"
              >
                <p className="font-medium">
                  {item.name ||
                    'Lead / Opportunity'}
                </p>

                <p className="text-sm text-neutral-500">
                  {item.status ||
                    'No status'}
                </p>

                {item.estimated_value !=
                  null && (
                  <p className="mt-1 text-sm font-medium">
                    {formatPeso(
                      item.estimated_value
                    )}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">
            No leads or opportunities available.
          </p>
        )}
      </div>

      {/* QUOTATIONS */}

      <div className="border-t border-neutral-200 pt-5 dark:border-white/10">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-purple-600" />

          <h4 className="font-semibold text-neutral-900 dark:text-white">
            Quotations
          </h4>

          <span className="text-sm text-neutral-500">
            ({customer.quotations_count ?? 0})
          </span>
        </div>

        {customer.quotations &&
        customer.quotations.length > 0 ? (
          <div className="space-y-2">
            {customer.quotations.map(
              quotation => (
                <div
                  key={quotation.id}
                  className="rounded-lg border border-neutral-200 p-3 dark:border-white/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {quotation.quotation_number ||
                          `Quotation #${quotation.id}`}
                      </p>

                      {quotation.title && (
                        <p className="text-sm text-neutral-500">
                          {quotation.title}
                        </p>
                      )}
                    </div>

                    <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-700">
                      {quotation.status ||
                        'Draft'}
                    </span>
                  </div>

                  {quotation.amount !=
                    null && (
                    <p className="mt-2 font-semibold">
                      {formatPeso(
                        quotation.amount
                      )}
                    </p>
                  )}
                </div>
              )
            )}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">
            No quotation records available.
          </p>
        )}
      </div>

      {/* JOB ORDERS */}

      <div className="border-t border-neutral-200 pt-5 dark:border-white/10">
        <div className="mb-3 flex items-center gap-2">
          <FolderKanban className="h-4 w-4 text-green-600" />

          <h4 className="font-semibold text-neutral-900 dark:text-white">
            Related Job Orders
          </h4>
        </div>

        {customer.related_job_orders &&
        customer.related_job_orders.length >
          0 ? (
          <div className="space-y-2">
            {customer.related_job_orders.map(
              item => (
                <div
                  key={item.id}
                  className="flex justify-between rounded-lg border border-neutral-200 p-3 dark:border-white/10"
                >
                  <span>
                    {item.reference ||
                      `Job Order #${item.id}`}
                  </span>

                  <span className="text-sm text-neutral-500">
                    {item.status ||
                      '—'}
                  </span>
                </div>
              )
            )}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">
            No related Job Orders available.
          </p>
        )}
      </div>

      {/* RENTALS */}

      <div className="border-t border-neutral-200 pt-5 dark:border-white/10">
        <div className="mb-3 flex items-center gap-2">
          <Truck className="h-4 w-4 text-indigo-600" />

          <h4 className="font-semibold text-neutral-900 dark:text-white">
            Related Rentals
          </h4>
        </div>

        {customer.related_rentals &&
        customer.related_rentals.length >
          0 ? (
          <div className="space-y-2">
            {customer.related_rentals.map(
              item => (
                <div
                  key={item.id}
                  className="flex justify-between rounded-lg border border-neutral-200 p-3 dark:border-white/10"
                >
                  <span>
                    {item.reference ||
                      `Rental #${item.id}`}
                  </span>

                  <span className="text-sm text-neutral-500">
                    {item.status ||
                      '—'}
                  </span>
                </div>
              )
            )}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">
            No rental requests available.
          </p>
        )}
      </div>

      {/* PROJECTS */}

      <div className="border-t border-neutral-200 pt-5 dark:border-white/10">
        <div className="mb-3 flex items-center gap-2">
          <FolderKanban className="h-4 w-4 text-cyan-600" />

          <h4 className="font-semibold text-neutral-900 dark:text-white">
            Related Projects
          </h4>
        </div>

        {customer.related_projects &&
        customer.related_projects.length >
          0 ? (
          <div className="space-y-2">
            {customer.related_projects.map(
              item => (
                <div
                  key={item.id}
                  className="flex justify-between rounded-lg border border-neutral-200 p-3 dark:border-white/10"
                >
                  <span>
                    {item.reference ||
                      `Project #${item.id}`}
                  </span>

                  <span className="text-sm text-neutral-500">
                    {item.status ||
                      '—'}
                  </span>
                </div>
              )
            )}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">
            No related projects available.
          </p>
        )}
      </div>

      {/* INTERACTION HISTORY */}

      <div className="border-t border-neutral-200 pt-5 dark:border-white/10">
        <div className="mb-3 flex items-center gap-2">
          <History className="h-4 w-4 text-neutral-600" />

          <h4 className="font-semibold text-neutral-900 dark:text-white">
            Interaction History
          </h4>
        </div>

        {customer.interaction_history &&
        customer.interaction_history.length >
          0 ? (
          <div className="space-y-3">
            {customer.interaction_history.map(
              interaction => (
                <div
                  key={interaction.id}
                  className="border-l-2 border-neutral-300 pl-3"
                >
                  <p className="font-medium">
                    {interaction.type ||
                      'Interaction'}
                  </p>

                  <p className="text-sm text-neutral-600 dark:text-neutral-300">
                    {interaction.description ||
                      'No description'}
                  </p>

                  <p className="mt-1 text-xs text-neutral-500">
                    {interaction.date ||
                      'No date'}
                    {interaction.user
                      ? ` · ${interaction.user}`
                      : ''}
                  </p>
                </div>
              )
            )}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">
            No interaction history available.
          </p>
        )}
      </div>
    </div>
  );

  /*
   * ------------------------------------------------------------
   * MAIN UI
   * ------------------------------------------------------------
   */

  return (
    <>
      <Head title="Customer & Client Management" />

      <AppLayout
        title="Customer & Client Management"
        headerAction={
          isSalesBusinessDevelopment ? (
            <Button
              variant="primary"
              onClick={() => {
                setForm(emptyCustomer);
                setCreateOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Create Customer
            </Button>
          ) : undefined
        }
      >
        <div className="space-y-4">
          {/* ERROR */}

          {loadError && (
            <p className="border border-error-200 bg-error-50 p-3 text-sm text-error-700">
              {loadError}
            </p>
          )}

          {/* SUMMARY */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardBody>
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  Total Customers
                </p>

                <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">
                  {totalCustomers}
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  Active Clients
                </p>

                <p className="mt-1 text-2xl font-bold text-success-600 dark:text-[#8be2af]">
                  {activeClients}
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  Prospects
                </p>

                <p className="mt-1 text-2xl font-bold text-orange-600">
                  {prospectClients}
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  CRM Activities
                </p>

                <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">
                  {totalInquiries +
                    totalQuotations}
                </p>

                <p className="mt-1 text-xs text-neutral-500">
                  {totalInquiries} inquiries ·{' '}
                  {totalQuotations} quotations
                </p>
              </CardBody>
            </Card>
          </div>

          {/* SEARCH / FILTER */}

          <Card>
            <CardBody>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="flex-1">
                  <Input
                    placeholder="Search customers, clients, contacts, industry..."
                    startIcon={
                      <Search className="h-4 w-4" />
                    }
                    value={searchQuery}
                    onChange={event =>
                      setSearchQuery(
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="flex flex-wrap items-center rounded-lg border border-neutral-200 bg-white p-1">
                  <button
                    onClick={() =>
                      setStatusFilter('all')
                    }
                    className={`rounded-md px-4 py-2 text-sm font-medium ${
                      statusFilter === 'all'
                        ? 'bg-[#0b1733] text-white'
                        : 'text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    All
                  </button>

                  {clientStatuses.map(
                    status => (
                      <button
                        key={status.value}
                        onClick={() =>
                          setStatusFilter(
                            status.value
                          )
                        }
                        className={`rounded-md px-3 py-2 text-sm font-medium ${
                          statusFilter ===
                          status.value
                            ? 'bg-[#0b1733] text-white'
                            : 'text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        {status.label}
                      </button>
                    )
                  )}
                </div>

                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setSearchQuery('');
                  }}
                  className="flex items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
                >
                  <Filter className="h-4 w-4" />
                  Clear Filters
                </button>

                <button
                  onClick={exportCustomers}
                  className="flex items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                  <input
                    type="checkbox"
                    checked={showArchived}
                    onChange={event =>
                      setShowArchived(
                        event.target.checked
                      )
                    }
                    className="h-4 w-4"
                  />

                  Show archived
                </label>

                <span className="text-sm text-neutral-500">
                  {filteredCustomers.length}{' '}
                  records
                </span>
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
                  ? 'No archived customer/client records.'
                  : 'No customer or client records found.'
              }
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={(column, order) => {
                setSortBy(column);
                setSortOrder(order);
              }}
              onRowClick={customer =>
                setSelectedCustomer(customer)
              }
            />
          </Card>

          {/* ======================================================
              CREATE CUSTOMER
          ====================================================== */}

          <Modal
            isOpen={createOpen}
            onClose={() =>
              !saving &&
              setCreateOpen(false)
            }
            title="Create Customer / Client"
            size="xl"
            footer={
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    setCreateOpen(false)
                  }
                  disabled={saving}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  form="create-customer-form"
                  loading={saving}
                >
                  Save Customer
                </Button>
              </div>
            }
          >
            {customerForm(
              'create-customer-form',
              createCustomer
            )}
          </Modal>

          {/* ======================================================
              VIEW CUSTOMER / CLIENT
          ====================================================== */}

          <Modal
            isOpen={!!selectedCustomer}
            onClose={() =>
              setSelectedCustomer(null)
            }
            title={
              selectedCustomer?.company_name ||
              selectedCustomer?.name ||
              'Customer Details'
            }
            size="xl"
            footer={
              <div className="flex justify-between gap-2">
                <div>
                  {isSalesBusinessDevelopment &&
                    selectedCustomer && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() =>
                            archiveCustomer(
                              selectedCustomer
                            )
                          }
                        >
                          <Archive className="h-4 w-4" />
                          Archive
                        </Button>
                      </>
                    )}
                </div>

                <div className="flex gap-2">
                  {isSalesBusinessDevelopment &&
                    selectedCustomer && (
                      <Button
                        variant="outline"
                        onClick={() =>
                          openEdit(
                            selectedCustomer
                          )
                        }
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit Customer
                      </Button>
                    )}

                  <Button
                    onClick={() =>
                      setSelectedCustomer(null)
                    }
                  >
                    Close
                  </Button>
                </div>
              </div>
            }
          >
            {selectedCustomer && (
              <div className="space-y-6">
                {/* HEADER */}

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-primary-50 text-primary-700 dark:bg-[#203354] dark:text-[#8cb9ff]">
                    <Building2 className="h-6 w-6" />
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-neutral-900 dark:text-white">
                        {selectedCustomer.company_name ||
                          selectedCustomer.name}
                      </h3>

                      <StatusBadge
                        status={
                          selectedCustomer.status
                        }
                      />
                    </div>

                    <p className="mt-1 text-sm text-neutral-500">
                      Customer Reference:{' '}
                      {selectedCustomer.customer_reference ||
                        `CUS-${new Date().getFullYear()}-${String(
                          selectedCustomer.id
                        ).padStart(3, '0')}`}
                    </p>
                  </div>
                </div>

                {/* BASIC INFORMATION */}

                <div className="grid grid-cols-1 gap-4 border-y border-neutral-200 py-5 dark:border-white/10 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-xs text-neutral-500">
                      Contact Person
                    </p>

                    <p className="mt-1 font-medium">
                      {selectedCustomer.contact_person ||
                        '—'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-neutral-500">
                      Position
                    </p>

                    <p className="mt-1 font-medium">
                      {selectedCustomer.position ||
                        '—'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-neutral-500">
                      Industry / Business Type
                    </p>

                    <p className="mt-1 font-medium">
                      {selectedCustomer.industry ||
                        '—'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-neutral-500">
                      Contact Number
                    </p>

                    <p className="mt-1 font-medium">
                      {selectedCustomer.phone ||
                        '—'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-neutral-500">
                      Email Address
                    </p>

                    <p className="mt-1 font-medium">
                      {selectedCustomer.email ||
                        '—'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-neutral-500">
                      Client Status
                    </p>

                    <div className="mt-1">
                      <StatusBadge
                        status={
                          selectedCustomer.status
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* ADDRESS */}

                <div className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                  <MapPin className="h-4 w-4 shrink-0" />

                  <span>
                    {[
                      selectedCustomer.address,
                      selectedCustomer.city,
                      selectedCustomer.province,
                      selectedCustomer.postal_code,
                    ]
                      .filter(Boolean)
                      .join(', ') ||
                      'No company address recorded'}
                  </span>
                </div>

                {/* PROJECT */}

                {(selectedCustomer.project_information ||
                  selectedCustomer.project_location ||
                  selectedCustomer.technical_requirements ||
                  selectedCustomer.site_condition) && (
                  <div className="border-t border-neutral-200 pt-5 dark:border-white/10">
                    <h4 className="font-semibold text-neutral-900 dark:text-white">
                      Project Information
                    </h4>

                    <div className="mt-3 space-y-3 text-sm">
                      {selectedCustomer.project_information && (
                        <div>
                          <p className="text-xs text-neutral-500">
                            Project
                          </p>

                          <p className="mt-1">
                            {
                              selectedCustomer.project_information
                            }
                          </p>
                        </div>
                      )}

                      {selectedCustomer.project_location && (
                        <div>
                          <p className="text-xs text-neutral-500">
                            Project Location
                          </p>

                          <p className="mt-1">
                            {
                              selectedCustomer.project_location
                            }
                          </p>
                        </div>
                      )}

                      {selectedCustomer.technical_requirements && (
                        <div>
                          <p className="text-xs text-neutral-500">
                            Technical Requirements
                          </p>

                          <p className="mt-1">
                            {
                              selectedCustomer.technical_requirements
                            }
                          </p>
                        </div>
                      )}

                      {selectedCustomer.site_condition && (
                        <div>
                          <p className="text-xs text-neutral-500">
                            Site Condition
                          </p>

                          <p className="mt-1">
                            {
                              selectedCustomer.site_condition
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* CRM SUMMARY */}

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border border-neutral-200 p-3 dark:border-white/10">
                    <p className="text-xs text-neutral-500">
                      Inquiries
                    </p>

                    <p className="mt-1 text-xl font-bold text-blue-600">
                      {selectedCustomer.inquiries_count ??
                        0}
                    </p>
                  </div>

                  <div className="rounded-lg border border-neutral-200 p-3 dark:border-white/10">
                    <p className="text-xs text-neutral-500">
                      Leads
                    </p>

                    <p className="mt-1 text-xl font-bold text-orange-600">
                      {selectedCustomer.leads_count ??
                        0}
                    </p>
                  </div>

                  <div className="rounded-lg border border-neutral-200 p-3 dark:border-white/10">
                    <p className="text-xs text-neutral-500">
                      Opportunities
                    </p>

                    <p className="mt-1 text-xl font-bold text-amber-600">
                      {selectedCustomer.opportunities_count ??
                        0}
                    </p>
                  </div>

                  <div className="rounded-lg border border-neutral-200 p-3 dark:border-white/10">
                    <p className="text-xs text-neutral-500">
                      Quotations
                    </p>

                    <p className="mt-1 text-xl font-bold text-purple-600">
                      {selectedCustomer.quotations_count ??
                        0}
                    </p>
                  </div>
                </div>

                {/* TRANSACTION SUMMARY */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-neutral-500">
                      Total Spending
                    </p>

                    <p className="mt-1 font-semibold">
                      {formatPeso(
                        selectedCustomer.total_spending ??
                          0
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-neutral-500">
                      Job Orders
                    </p>

                    <p className="mt-1 font-semibold">
                      {selectedCustomer.total_job_orders ??
                        0}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-neutral-500">
                      Last Activity
                    </p>

                    <p className="mt-1 font-semibold">
                      {selectedCustomer.last_activity ||
                        selectedCustomer.last_order_date ||
                        '—'}
                    </p>
                  </div>
                </div>

                {/* REMARKS */}

                {(selectedCustomer.remarks ||
                  selectedCustomer.notes) && (
                  <div className="border-t border-neutral-200 pt-5 dark:border-white/10">
                    <h4 className="font-semibold text-neutral-900 dark:text-white">
                      Remarks
                    </h4>

                    <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                      {selectedCustomer.remarks ||
                        selectedCustomer.notes}
                    </p>
                  </div>
                )}

                {/* RELATED CRM AND TRANSACTIONS */}

                <div className="border-t border-neutral-200 pt-5 dark:border-white/10">
                  <h3 className="mb-4 text-base font-semibold text-neutral-900 dark:text-white">
                    CRM & Related Transactions
                  </h3>

                  <RelatedRecords
                    customer={selectedCustomer}
                  />
                </div>
              </div>
            )}
          </Modal>

          {/* ======================================================
              EDIT CUSTOMER
          ====================================================== */}

          <Modal
            isOpen={!!editingCustomer}
            onClose={() =>
              !saving &&
              setEditingCustomer(null)
            }
            title="Edit Customer / Client"
            size="xl"
            footer={
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    setEditingCustomer(null)
                  }
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
            {customerForm(
              'edit-customer-form',
              updateCustomer
            )}
          </Modal>
        </div>
      </AppLayout>
    </>
  );
};

export default CustomersList;