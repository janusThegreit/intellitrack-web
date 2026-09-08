import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { Card, CardBody } from '../../Components/Card';
import Table, { TableColumn } from '../../Components/Table';
import Button from '../../Components/Button';
import { Input } from '../../Components/Form';
import { StatusBadge } from '../../Components/Badge';
import Modal from '../../Components/Modal';
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [newInvoice, setNewInvoice] = useState<any>({
    customer_name: '', amount: 0, status: 'draft', issue_date: new Date().toISOString().slice(0, 10), due_date: ''
  });

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

  const createInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Mock save since there is no API yet
    setTimeout(() => {
      setIsCreateModalOpen(false);
      setMessage('Mock Invoice created successfully.');
      setNewInvoice({ customer_name: '', amount: 0, status: 'draft', issue_date: new Date().toISOString().slice(0, 10), due_date: '' });
      setSaving(false);
    }, 500);
  };

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
      <AppLayout title="Invoices" headerAction={<Button variant="primary" onClick={() => setIsCreateModalOpen(true)}><Plus className="w-4 h-4" />New Invoice</Button>}>
        <div className="space-y-4">
          {message && <p className="border border-neutral-300 bg-white p-3 text-sm rounded-md">{message}</p>}
          <Card><CardBody><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Input placeholder="Search by invoice # or customer..." startIcon={<Search className="w-4 h-4" />} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-neutral-300 rounded-lg text-sm"><option value="">All Status</option><option value="draft">Draft</option><option value="sent">Sent</option><option value="partially-paid">Partially Paid</option><option value="paid">Paid</option><option value="overdue">Overdue</option></select></div></CardBody></Card>
          <Card noPadding><Table columns={columns} data={filtered} /></Card>

          <Modal isOpen={isCreateModalOpen} onClose={() => !saving && setIsCreateModalOpen(false)} title="Create Invoice" size="lg" footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={saving}>Cancel</Button><Button type="submit" form="create-invoice-form" loading={saving}>Create</Button></div>}>
            <form id="create-invoice-form" onSubmit={createInvoice} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-neutral-700 md:col-span-2">Customer Name<input required value={newInvoice.customer_name} onChange={e => setNewInvoice({ ...newInvoice, customer_name: e.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 rounded-md" /></label>
              <label className="text-sm font-medium text-neutral-700">Issue Date<input type="date" required value={newInvoice.issue_date} onChange={e => setNewInvoice({ ...newInvoice, issue_date: e.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 rounded-md" /></label>
              <label className="text-sm font-medium text-neutral-700">Due Date<input type="date" required value={newInvoice.due_date} onChange={e => setNewInvoice({ ...newInvoice, due_date: e.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 rounded-md" /></label>
              <label className="text-sm font-medium text-neutral-700">Status<select value={newInvoice.status} onChange={e => setNewInvoice({ ...newInvoice, status: e.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 rounded-md"><option value="draft">Draft</option><option value="sent">Sent</option><option value="paid">Paid</option></select></label>
              <label className="text-sm font-medium text-neutral-700">Amount<input type="number" required min="0" value={newInvoice.amount} onChange={e => setNewInvoice({ ...newInvoice, amount: Number(e.target.value) })} className="mt-1 w-full border border-neutral-300 p-2.5 rounded-md" /></label>
            </form>
          </Modal>
        </div>
      </AppLayout>
    </>
  );
};

export default InvoicesList;
