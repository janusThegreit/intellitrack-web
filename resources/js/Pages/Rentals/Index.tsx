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

interface Rental {
  id: number;
  rental_number: string;
  customer_name: string;
  equipment_name: string;
  status: string;
  daily_rate: number;
  rental_start_date: string;
  rental_end_date: string;
}

const RentalsList = ({ rentals = [] }: { rentals?: Array<Rental> }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [records, setRecords] = useState<Rental[]>(rentals);
  const [filtered, setFiltered] = useState<Rental[]>(records);
  const [sortBy, setSortBy] = useState<keyof Rental>('rental_start_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    let result = [...records];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item) => item.rental_number.toLowerCase().includes(query) || item.customer_name.toLowerCase().includes(query));
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
    fetch('/api/rentals?per_page=100', { headers: { Accept: 'application/json' } })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(data => setRecords((data.data ?? []).map((rental: any) => ({ id: rental.id, rental_number: rental.rental_number, customer_name: rental.customer?.company_name || rental.customer?.name || '-', equipment_name: rental.equipment?.crane_model || rental.equipment?.name || '-', status: rental.status, daily_rate: Number(rental.daily_rate ?? 0), rental_start_date: rental.rental_start_date, rental_end_date: rental.rental_end_date }))))
      .catch(() => setRecords([]));
  }, []);

  const columns: TableColumn<Rental>[] = [
    { key: 'rental_number', label: 'Rental #', sortable: true, width: '12%' },
    { key: 'customer_name', label: 'Customer', sortable: true, width: '18%' },
    { key: 'equipment_name', label: 'Equipment', sortable: true, width: '18%' },
    { key: 'status', label: 'Status', sortable: true, render: (status) => <StatusBadge status={status} /> },
    { key: 'daily_rate', label: 'Daily Rate', render: (rate) => formatPeso(rate) },
    { key: 'rental_start_date', label: 'Start', sortable: true, render: (date) => new Date(date).toLocaleDateString() },
    { key: 'rental_end_date', label: 'End', render: (date) => new Date(date).toLocaleDateString() },
    {
      key: 'id',
      label: 'Actions',
      render: (id) => (
        <div className="flex items-center gap-2">
          <button onClick={() => window.location.href = `/rentals/${id}`} className="p-1.5 hover:bg-primary-50 rounded-lg text-primary-600 transition-colors"><Eye className="w-4 h-4" /></button>
          <button onClick={() => window.location.href = `/rentals/${id}/edit`} className="p-1.5 hover:bg-primary-50 rounded-lg text-primary-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Head title="Rentals" />
      <AppLayout title="Rentals" headerAction={<Button variant="primary" onClick={() => window.location.href = '/rentals/create'}><Plus className="w-4 h-4" />New Rental</Button>}>
        <div className="space-y-4">
          <Card><CardBody><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Input placeholder="Search..." startIcon={<Search className="w-4 h-4" />} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-neutral-300 rounded-lg text-sm"><option value="">All Status</option><option value="pending">Pending</option><option value="active">Active</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div></CardBody></Card>
          <Card noPadding><Table columns={columns} data={filtered} emptyMessage="No confirmed rentals yet. Rental requests are recorded through Rental Management." sortBy={sortBy} sortOrder={sortOrder} onSort={(column, order) => { setSortBy(column); setSortOrder(order); }} /></Card>
        </div>
      </AppLayout>
    </>
  );
};

export default RentalsList;
