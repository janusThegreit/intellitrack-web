import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { Card, CardBody } from '../../Components/Card';
import Table, { TableColumn } from '../../Components/Table';
import Button from '../../Components/Button';
import { Input } from '../../Components/Form';
import { StatusBadge } from '../../Components/Badge';
import { Plus, Edit2, Eye, Trash2, Search } from 'lucide-react';
import { formatPeso } from '../../Utils/currency';

interface Quotation {
  id: number;
  quote_number: string;
  customer_name: string;
  amount: number;
  status: string;
  created_date: string;
  expiry_date: string;
}

const QuotationsList = ({ quotations = [] }: { quotations?: Array<Quotation> }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [records, setRecords] = useState<Quotation[]>(quotations);
  const [filtered, setFiltered] = useState<Quotation[]>(records);
  const [sortBy, setSortBy] = useState<keyof Quotation>('created_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    let result = [...records];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.quote_number.toLowerCase().includes(query) ||
          item.customer_name.toLowerCase().includes(query)
      );
    }
    if (statusFilter) {
      result = result.filter((item) => item.status === statusFilter);
    }
    result.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    setFiltered(result);
  }, [searchQuery, statusFilter, sortBy, sortOrder, records]);

  useEffect(() => {
    fetch('/api/quotations?per_page=100', { headers: { Accept: 'application/json' } })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(data => setRecords((data.data ?? []).map((quote: any) => ({ id: quote.id, quote_number: quote.quotation_number, customer_name: quote.customer?.company_name || quote.customer?.name || '-', amount: Number(quote.total_amount ?? 0), status: quote.status, created_date: quote.quotation_date, expiry_date: quote.valid_until }))))
      .catch(() => setRecords([]));
  }, []);

  const columns: TableColumn<Quotation>[] = [
    { key: 'quote_number', label: 'Quote #', sortable: true, width: '12%' },
    { key: 'customer_name', label: 'Customer', sortable: true, width: '25%' },
    { key: 'amount', label: 'Amount', sortable: true, render: (amt) => formatPeso(amt) },
    { key: 'status', label: 'Status', sortable: true, render: (status) => <StatusBadge status={status} /> },
    { key: 'expiry_date', label: 'Expires', sortable: true, render: (date) => new Date(date).toLocaleDateString() },
    {
      key: 'id',
      label: 'Actions',
      render: (id) => (
        <div className="flex items-center gap-2">
          <button onClick={() => window.location.href = `/quotations/${id}`} className="p-1.5 hover:bg-primary-50 rounded-lg text-primary-600 transition-colors"><Eye className="w-4 h-4" /></button>
          <button onClick={() => window.location.href = `/quotations/${id}/edit`} className="p-1.5 hover:bg-primary-50 rounded-lg text-primary-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
          <button onClick={() => { if (confirm('Delete?')) {} }} className="p-1.5 hover:bg-error-50 rounded-lg text-error-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Head title="Quotations" />
      <AppLayout title="Quotations" headerAction={<Button variant="primary" onClick={() => window.location.href = '/quotations/create'}><Plus className="w-4 h-4" />New Quotation</Button>}>
        <div className="space-y-4">
          <Card><CardBody><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Input placeholder="Search..." startIcon={<Search className="w-4 h-4" />} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-neutral-300 rounded-lg text-sm"><option value="">All Status</option><option value="draft">Draft</option><option value="sent">Sent</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option><option value="expired">Expired</option></select></div></CardBody></Card>
          <Card noPadding><Table columns={columns} data={filtered} emptyMessage="No quotations yet. Create one from an assessed CRM requirement." sortBy={sortBy} sortOrder={sortOrder} onSort={(column, order) => { setSortBy(column); setSortOrder(order); }} /></Card>
        </div>
      </AppLayout>
    </>
  );
};

export default QuotationsList;
