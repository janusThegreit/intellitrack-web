import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { Card, CardBody } from '../../Components/Card';
import Table, { TableColumn } from '../../Components/Table';
import Button from '../../Components/Button';
import { Input } from '../../Components/Form';
import { StatusBadge } from '../../Components/Badge';
import Modal from '../../Components/Modal';
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [newPayment, setNewPayment] = useState<any>({
    invoice_number: '', customer_name: '', amount: 0, status: 'completed', payment_date: new Date().toISOString().slice(0, 10), method: 'Bank Transfer'
  });

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

  const createPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Mock save since there is no API yet
    setTimeout(() => {
      setIsCreateModalOpen(false);
      setMessage('Mock Payment recorded successfully.');
      setNewPayment({ invoice_number: '', customer_name: '', amount: 0, status: 'completed', payment_date: new Date().toISOString().slice(0, 10), method: 'Bank Transfer' });
      setSaving(false);
    }, 500);
  };

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
      <AppLayout title="Payments" headerAction={<Button variant="primary" onClick={() => setIsCreateModalOpen(true)}><Plus className="w-4 h-4" />Record Payment</Button>}>
        <div className="space-y-4">
          {message && <p className="border border-neutral-300 bg-white p-3 text-sm rounded-md">{message}</p>}
          <Card><CardBody><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Input placeholder="Search..." startIcon={<Search className="w-4 h-4" />} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-neutral-300 rounded-lg text-sm"><option value="">All Status</option><option value="pending">Pending</option><option value="processing">Processing</option><option value="completed">Completed</option><option value="failed">Failed</option></select></div></CardBody></Card>
          <Card noPadding><Table columns={columns} data={filtered} /></Card>

          <Modal isOpen={isCreateModalOpen} onClose={() => !saving && setIsCreateModalOpen(false)} title="Record Payment" size="lg" footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={saving}>Cancel</Button><Button type="submit" form="create-payment-form" loading={saving}>Record</Button></div>}>
            <form id="create-payment-form" onSubmit={createPayment} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-neutral-700">Invoice Number<input required value={newPayment.invoice_number} onChange={e => setNewPayment({ ...newPayment, invoice_number: e.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 rounded-md" /></label>
              <label className="text-sm font-medium text-neutral-700">Customer Name<input required value={newPayment.customer_name} onChange={e => setNewPayment({ ...newPayment, customer_name: e.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 rounded-md" /></label>
              <label className="text-sm font-medium text-neutral-700">Amount<input type="number" required min="0" value={newPayment.amount} onChange={e => setNewPayment({ ...newPayment, amount: Number(e.target.value) })} className="mt-1 w-full border border-neutral-300 p-2.5 rounded-md" /></label>
              <label className="text-sm font-medium text-neutral-700">Method<select value={newPayment.method} onChange={e => setNewPayment({ ...newPayment, method: e.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 rounded-md"><option value="Bank Transfer">Bank Transfer</option><option value="Credit Card">Credit Card</option><option value="Cash">Cash</option><option value="Check">Check</option></select></label>
              <label className="text-sm font-medium text-neutral-700">Payment Date<input type="date" required value={newPayment.payment_date} onChange={e => setNewPayment({ ...newPayment, payment_date: e.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 rounded-md" /></label>
              <label className="text-sm font-medium text-neutral-700">Status<select value={newPayment.status} onChange={e => setNewPayment({ ...newPayment, status: e.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 rounded-md"><option value="pending">Pending</option><option value="processing">Processing</option><option value="completed">Completed</option><option value="failed">Failed</option></select></label>
            </form>
          </Modal>
        </div>
      </AppLayout>
    </>
  );
};

export default PaymentsList;
