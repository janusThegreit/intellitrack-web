import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { Card, CardBody } from '../../Components/Card';
import Table, { TableColumn } from '../../Components/Table';
import Button from '../../Components/Button';
import { Input } from '../../Components/Form';
import { StatusBadge } from '../../Components/Badge';
import { Plus, Eye, Search } from 'lucide-react';

interface Payment {
  id: number;
  payment_number: string;
  invoice_number: string;
  customer_name: string;
  amount: number;
  status: string;
  payment_date: string;
  method: string;
}

const PaymentsList = ({ payments = [] }: { payments?: Array<Payment> }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filtered, setFiltered] = useState<Payment[]>(payments);

  useEffect(() => {
    let result = [...payments];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item) => item.payment_number.toLowerCase().includes(query) || item.customer_name.toLowerCase().includes(query));
    }
    if (statusFilter) {
      result = result.filter((item) => item.status === statusFilter);
    }
    setFiltered(result);
  }, [searchQuery, statusFilter, payments]);

  const columns: TableColumn<Payment>[] = [
    { key: 'payment_number', label: 'Payment #', width: '12%' },
    { key: 'invoice_number', label: 'Invoice #', width: '12%' },
    { key: 'customer_name', label: 'Customer', width: '20%' },
    { key: 'amount', label: 'Amount', render: (amt) => <span className="font-semibold text-success-600">${typeof amt === 'number' ? amt.toFixed(2) : parseFloat(String(amt)).toFixed(2)}</span> },
    { key: 'method', label: 'Method', width: '12%' },
    { key: 'status', label: 'Status', render: (status) => <StatusBadge status={status} /> },
    { key: 'payment_date', label: 'Date', render: (date) => new Date(date).toLocaleDateString() },
    {
      key: 'id',
      label: 'Actions',
      render: (id) => (
        <button onClick={() => window.location.href = `/payments/${id}`} className="p-1.5 hover:bg-primary-50 rounded-lg text-primary-600 transition-colors"><Eye className="w-4 h-4" /></button>
      ),
    },
  ];

  return (
    <>
      <Head title="Payments" />
      <AppLayout title="Payments" headerAction={<Button variant="primary" onClick={() => window.location.href = '/payments/create'}><Plus className="w-4 h-4" />Record Payment</Button>}>
        <div className="space-y-4">
          <Card><CardBody><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Input placeholder="Search..." startIcon={<Search className="w-4 h-4" />} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-neutral-300 rounded-lg text-sm"><option value="">All Status</option><option value="pending">Pending</option><option value="processing">Processing</option><option value="completed">Completed</option><option value="failed">Failed</option></select></div></CardBody></Card>
          <Card noPadding><Table columns={columns} data={filtered} /></Card>
        </div>
      </AppLayout>
    </>
  );
};

export default PaymentsList;
