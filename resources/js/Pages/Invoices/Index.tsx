import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { Card, CardBody } from '../../Components/Card';
import Table, { TableColumn } from '../../Components/Table';
import Button from '../../Components/Button';
import { Input } from '../../Components/Form';
import { StatusBadge } from '../../Components/Badge';
import { Plus, Download, Eye, Search } from 'lucide-react';

interface Invoice {
  id: number;
  invoice_number: string;
  customer_name: string;
  amount: number;
  status: string;
  issue_date: string;
  due_date: string;
  amount_paid: number;
}

const InvoicesList = ({ invoices = [] }: { invoices?: Array<Invoice> }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filtered, setFiltered] = useState<Invoice[]>(invoices);

  useEffect(() => {
    let result = [...invoices];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item) => item.invoice_number.toLowerCase().includes(query) || item.customer_name.toLowerCase().includes(query));
    }
    if (statusFilter) {
      result = result.filter((item) => item.status === statusFilter);
    }
    setFiltered(result);
  }, [searchQuery, statusFilter, invoices]);

  const columns: TableColumn<Invoice>[] = [
    { key: 'invoice_number', label: 'Invoice #', width: '12%', render: (value) => <span className="font-semibold text-primary-600">{value}</span> },
    { key: 'customer_name', label: 'Customer', width: '18%' },
    { key: 'amount', label: 'Amount', render: (amt) => `$${typeof amt === 'number' ? amt.toFixed(2) : parseFloat(String(amt)).toFixed(2)}` },
    { key: 'amount_paid', label: 'Paid', render: (paid) => `$${typeof paid === 'number' ? paid.toFixed(2) : parseFloat(String(paid)).toFixed(2)}` },
    { key: 'status', label: 'Status', render: (status) => <StatusBadge status={status} /> },
    { key: 'due_date', label: 'Due Date', render: (date) => new Date(date).toLocaleDateString() },
    {
      key: 'id',
      label: 'Actions',
      render: (id) => (
        <div className="flex items-center gap-2">
          <button onClick={() => window.location.href = `/invoices/${id}`} className="p-1.5 hover:bg-primary-50 rounded-lg text-primary-600 transition-colors"><Eye className="w-4 h-4" /></button>
          <button onClick={() => {}} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-600 transition-colors"><Download className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Head title="Invoices" />
      <AppLayout title="Invoices" headerAction={<Button variant="primary" onClick={() => window.location.href = '/invoices/create'}><Plus className="w-4 h-4" />New Invoice</Button>}>
        <div className="space-y-4">
          <Card><CardBody><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Input placeholder="Search by invoice # or customer..." startIcon={<Search className="w-4 h-4" />} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-neutral-300 rounded-lg text-sm"><option value="">All Status</option><option value="draft">Draft</option><option value="sent">Sent</option><option value="partially-paid">Partially Paid</option><option value="paid">Paid</option><option value="overdue">Overdue</option></select></div></CardBody></Card>
          <Card noPadding><Table columns={columns} data={filtered} /></Card>
        </div>
      </AppLayout>
    </>
  );
};

export default InvoicesList;
