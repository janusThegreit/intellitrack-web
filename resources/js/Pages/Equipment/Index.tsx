import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { Card, CardHeader, CardBody } from '../../Components/Card';
import Table, { TableColumn } from '../../Components/Table';
import Button from '../../Components/Button';
import { Input } from '../../Components/Form';
import { StatusBadge } from '../../Components/Badge';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';

interface Equipment {
  id: number;
  name: string;
  category: string;
  serial_number: string;
  status: string;
  acquisition_cost: number;
  daily_rate: number;
  location: string;
}

interface EquipmentListProps {
  equipment?: Array<Equipment>;
}

const EquipmentList = ({ equipment = [] }: EquipmentListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>(equipment);
  const [sortBy, setSortBy] = useState<keyof Equipment>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    let result = [...equipment];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.serial_number.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.location.toLowerCase().includes(query)
      );
    }

    if (statusFilter) {
      result = result.filter((item) => item.status === statusFilter);
    }

    result.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (typeof aVal === 'string') {
        aVal = (aVal as string).toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredEquipment(result);
  }, [searchQuery, statusFilter, sortBy, sortOrder, equipment]);

  const columns: TableColumn<Equipment>[] = [
    {
      key: 'name',
      label: 'Equipment Name',
      sortable: true,
      width: '25%',
      render: (value, row) => (
        <div>
          <p className="font-medium text-neutral-900">{value}</p>
          <p className="text-sm text-neutral-500">{row.serial_number}</p>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
    },
    {
      key: 'location',
      label: 'Location',
      sortable: true,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (status) => <StatusBadge status={status} />,
    },
    {
      key: 'daily_rate',
      label: 'Daily Rate',
      sortable: true,
      render: (rate) => `$${typeof rate === 'number' ? rate.toFixed(2) : parseFloat(String(rate)).toFixed(2)}`,
    },
    {
      key: 'id',
      label: 'Actions',
      render: (id, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.href = `/equipment/${id}`}
            className="p-1.5 hover:bg-primary-50 rounded-lg text-primary-600 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete equipment "${row.name}"?`)) {
                // Call delete API
              }
            }}
            className="p-1.5 hover:bg-error-50 rounded-lg text-error-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Head title="Equipment" />
      <AppLayout
        title="Equipment"
        headerAction={
          <Button variant="primary" onClick={() => window.location.href = '/equipment/create'}>
            <Plus className="w-4 h-4" />
            Add Equipment
          </Button>
        }
      >
        <div className="space-y-4">
          <Card>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Search by name, serial number..."
                  startIcon={<Search className="w-4 h-4" />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg text-sm"
                >
                  <option value="">All Status</option>
                  <option value="available">Available</option>
                  <option value="rented">Rented</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
            </CardBody>
          </Card>

          <Card noPadding>
            <Table
              columns={columns}
              data={filteredEquipment}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={(column, order) => {
                setSortBy(column);
                setSortOrder(order);
              }}
            />
          </Card>
        </div>
      </AppLayout>
    </>
  );
};

export default EquipmentList;
