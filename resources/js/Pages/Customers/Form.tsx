import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { Card, CardHeader, CardBody, CardFooter } from '../../Components/Card';
import Button from '../../Components/Button';
import { Input, Select, TextArea } from '../../Components/Form';
import { ArrowLeft } from 'lucide-react';

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  company_name: string;
  contact_person: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  tax_id: string;
  customer_type: string;
  status: string;
  notes: string;
}

interface CustomerFormProps {
  customer?: CustomerFormData & { id: number };
  isEditing?: boolean;
}

const CustomerForm = ({ customer, isEditing = false }: CustomerFormProps) => {
  const { data, setData, post, processing, errors } = useForm<CustomerFormData>({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    company_name: customer?.company_name || '',
    contact_person: customer?.contact_person || '',
    address: customer?.address || '',
    city: customer?.city || '',
    province: customer?.province || '',
    postal_code: customer?.postal_code || '',
    tax_id: customer?.tax_id || '',
    customer_type: customer?.customer_type || 'individual',
    status: customer?.status || 'active',
    notes: customer?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = isEditing ? `/api/customers/${customer?.id}` : '/api/customers';
    const method = isEditing ? 'post' : 'post';
    post(url);
  };

  return (
    <>
      <Head title={isEditing ? 'Edit Customer' : 'New Customer'} />
      <AppLayout title={isEditing ? 'Edit Customer' : 'Add New Customer'}>
        <div className="max-w-4xl">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Customers
          </button>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader title="Basic Information" />
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Full Name"
                    required
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    error={errors.name}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    required
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    error={errors.email}
                  />
                  <Input
                    label="Phone Number"
                    type="tel"
                    required
                    value={data.phone}
                    onChange={(e) => setData('phone', e.target.value)}
                    error={errors.phone}
                  />
                  <Select
                    label="Customer Type"
                    options={[
                      { value: 'individual', label: 'Individual' },
                      { value: 'corporate', label: 'Corporate' },
                      { value: 'government', label: 'Government' },
                    ]}
                    value={data.customer_type}
                    onChange={(e) => setData('customer_type', e.target.value)}
                  />
                </div>
              </CardBody>
            </Card>

            {/* Company Information */}
            <Card>
              <CardHeader title="Company Information" />
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Company Name"
                    value={data.company_name}
                    onChange={(e) => setData('company_name', e.target.value)}
                    error={errors.company_name}
                  />
                  <Input
                    label="Contact Person"
                    value={data.contact_person}
                    onChange={(e) => setData('contact_person', e.target.value)}
                    error={errors.contact_person}
                  />
                  <Input
                    label="Tax ID"
                    value={data.tax_id}
                    onChange={(e) => setData('tax_id', e.target.value)}
                    error={errors.tax_id}
                  />
                </div>
              </CardBody>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader title="Address" />
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <Input
                      label="Street Address"
                      value={data.address}
                      onChange={(e) => setData('address', e.target.value)}
                      error={errors.address}
                    />
                  </div>
                  <Input
                    label="City"
                    value={data.city}
                    onChange={(e) => setData('city', e.target.value)}
                    error={errors.city}
                  />
                  <Input
                    label="Province/State"
                    value={data.province}
                    onChange={(e) => setData('province', e.target.value)}
                    error={errors.province}
                  />
                  <Input
                    label="Postal Code"
                    value={data.postal_code}
                    onChange={(e) => setData('postal_code', e.target.value)}
                    error={errors.postal_code}
                  />
                </div>
              </CardBody>
            </Card>

            {/* Status & Notes */}
            <Card>
              <CardHeader title="Status & Notes" />
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Select
                    label="Status"
                    options={[
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' },
                      { value: 'suspended', label: 'Suspended' },
                    ]}
                    value={data.status}
                    onChange={(e) => setData('status', e.target.value)}
                  />
                  <div />
                </div>
                <TextArea
                  label="Notes"
                  value={data.notes}
                  onChange={(e) => setData('notes', e.target.value)}
                  rows={4}
                  placeholder="Add any additional notes about this customer..."
                />
              </CardBody>
            </Card>

            {/* Actions */}
            <Card>
              <CardFooter className="border-0">
                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.history.back()}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={processing}
                  >
                    {isEditing ? 'Update Customer' : 'Add Customer'}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </form>
        </div>
      </AppLayout>
    </>
  );
};

export default CustomerForm;
