import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';
import { Card, CardBody, CardHeader } from '../../Components/Card';
import Button from '../../Components/Button';
import { formatPeso } from '../../Utils/currency';

interface RecordPageProps { type: string; recordId: number; }

const config: Record<string, { endpoint: string; title: string; back: string; backLabel: string }> = {
  client: { endpoint: 'customers', title: 'Client profile', back: '/clients', backLabel: 'Client Management' },
  inquiry: { endpoint: 'customer-inquiries', title: 'CRM inquiry', back: '/crm', backLabel: 'Customer Relationship Management' },
  quotation: { endpoint: 'quotations', title: 'Quotation', back: '/crm/quotations', backLabel: 'Sales & Quotation Management' },
  'job-order': { endpoint: 'job-orders', title: 'Job order', back: '/job-orders', backLabel: 'Job Order Management' },
  rental: { endpoint: 'rentals', title: 'Rental', back: '/rental-requirements', backLabel: 'Rental Management' },
  project: { endpoint: 'projects', title: 'Project', back: '/projects', backLabel: 'Project Management' },
};

const readable = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());
const displayValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'object') return null;
  return String(value);
};

const RecordShow = ({ type, recordId }: RecordPageProps) => {
  const [record, setRecord] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');
  const item = config[type] ?? config.client;

  useEffect(() => {
    fetch(`/api/${item.endpoint}/${recordId}`, { headers: { Accept: 'application/json' } })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(setRecord)
      .catch(() => setError('This record could not be loaded.'));
  }, [item.endpoint, recordId]);

  const fields = record ? Object.entries(record).filter(([key, value]) => !['id', 'created_at', 'updated_at', 'deleted_at', 'customer', 'items', 'history', 'job_order_items', 'rentals', 'quotations', 'projects', 'tasks'].includes(key) && displayValue(value) !== null) : [];
  const heading = record?.company_name || record?.project_name || record?.subject || record?.quotation_number || record?.job_order_number || record?.rental_number || record?.name || item.title;

  return <><Head title={item.title} /><AppLayout title={item.title}><div className="mx-auto max-w-5xl space-y-5"><a href={item.back} className="inline-flex items-center gap-2 text-sm font-medium text-[#246bdb] dark:text-[#ffd000]"><ArrowLeft className="h-4 w-4" />Back to {item.backLabel}</a>{error && <p className="border border-error-200 bg-error-50 p-3 text-sm text-error-700">{error}</p>}{record && <><Card><CardHeader title={String(heading)} subtitle={`${item.title} record #${recordId}`} action={<a href={item.back} className="inline-flex items-center gap-2 text-sm text-[#246bdb] dark:text-[#ffd000]"><ExternalLink className="h-4 w-4" />Open module</a>} /><CardBody><div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">{fields.map(([key, value]) => <div key={key} className="border-b border-neutral-100 pb-3 dark:border-white/8"><p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{readable(key)}</p><p className="mt-1 text-sm text-neutral-900 dark:text-white">{key.includes('amount') || key.includes('budget') || key.includes('cost') || key.includes('rate') || key.includes('spending') ? formatPeso(value as string) : displayValue(value)}</p></div>)}</div></CardBody></Card>{Array.isArray(record.history) && <Card><CardHeader title="Workflow history" /><CardBody><div className="space-y-3">{(record.history as Array<Record<string, unknown>>).map((entry, index) => <div key={index} className="border-l-2 border-[#246bdb] pl-3 dark:border-[#ffd000]"><p className="text-sm font-medium text-neutral-900 dark:text-white">{readable(String(entry.action || 'updated'))}</p><p className="text-sm text-neutral-500 dark:text-neutral-400">{String(entry.notes || entry.created_at || '')}</p></div>)}{!(record.history as unknown[]).length && <p className="text-sm text-neutral-500">No workflow history recorded.</p>}</div></CardBody></Card>}</>}</div></AppLayout></>;
};

export default RecordShow;