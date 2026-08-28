import React, { useEffect, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { AppLayout } from '../../Layouts/AppLayout';
import { 
  Search, UserPlus, Eye, Edit2, Trash2, X, Download, Filter,
  Shield, CheckCircle2, XCircle
} from 'lucide-react';
import clsx from 'clsx';
import Modal from '../../Components/Modal';
import axios from 'axios';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
  recent: number;
}

const formatRole = (role: string) => {
  const map: Record<string, string> = {
    administrator: 'Administrator',
    sales_manager: 'Sales Manager',
    sales_business_development: 'Sales Business Dev',
    staff: 'Staff',
    customer: 'Customer',
  };
  return map[role] || role;
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

export default function UsersIndex() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0, recent: 0 });
  
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'sales_manager',
    password: '',
  });
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearErrors = () => setErrors({});
  const reset = () => setFormData({ name: '', email: '', role: 'sales_manager', password: '' });

  const load = () => {
    const query = new URLSearchParams();
    if (search) query.append('search', search);
    if (roleFilter !== 'all') query.append('role', roleFilter);
    if (statusFilter !== 'all') query.append('status', statusFilter);

    fetch(`/api/users?${query.toString()}`, { headers: { Accept: 'application/json' } })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        setUsers(data.users?.data || data.data || []);
        if (data.stats) setStats(data.stats);
      })
      .catch(console.error);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, roleFilter, statusFilter]);

  const openAddModal = () => {
    clearErrors();
    reset();
    setIsAddModalOpen(true);
  };

  const openEditModal = (user: User) => {
    clearErrors();
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '',
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    clearErrors();
    try {
      await axios.post('/api/users', formData);
      setIsAddModalOpen(false);
      load();
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const flatErrors: Record<string, string> = {};
        Object.entries(err.response.data.errors).forEach(([key, value]) => {
          flatErrors[key] = (value as string[])[0];
        });
        setErrors(flatErrors);
      }
    } finally {
      setProcessing(false);
    }
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setProcessing(true);
    clearErrors();
    try {
      await axios.put(`/api/users/${selectedUser.id}`, formData);
      setIsEditModalOpen(false);
      load();
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const flatErrors: Record<string, string> = {};
        Object.entries(err.response.data.errors).forEach(([key, value]) => {
          flatErrors[key] = (value as string[])[0];
        });
        setErrors(flatErrors);
      }
    } finally {
      setProcessing(false);
    }
  };

  const toggleStatus = async (user: User) => {
    try {
      await axios.patch(`/api/users/${user.id}/status`, {
        is_active: !user.is_active
      });
      load();
    } catch (error) {
      console.error(error);
    }
  };


  const submitDelete = async () => {
    if (!selectedUser) return;
    setProcessing(true);
    try {
      await axios.delete(`/api/users/${selectedUser.id}`);
      setIsDeleteModalOpen(false);
      load();
    } catch (error) {
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AppLayout 
      dark={true}
      showHeader={false}
    >
      {/* Page Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">User Management</h1>
          <p className="mt-1 text-xs text-content-secondary">Manage system users, roles, permissions, and account status.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-md bg-[#ffcc00] px-4 py-2 text-sm font-bold text-black transition hover:bg-[#ffcc00]/90"
        >
          <UserPlus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border-subtle bg-surface-card p-5 shadow-lg">
          <p className="text-xs font-semibold tracking-wider text-content-secondary">TOTAL USERS</p>
          <p className="mt-2 text-3xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-border-subtle bg-surface-card p-5 shadow-lg">
          <p className="text-xs font-semibold tracking-wider text-green-500">ACTIVE USERS</p>
          <p className="mt-2 text-3xl font-bold text-green-500">{stats.active}</p>
        </div>
        <div className="rounded-xl border border-border-subtle bg-surface-card p-5 shadow-lg">
          <p className="text-xs font-semibold tracking-wider text-red-500">INACTIVE USERS</p>
          <p className="mt-2 text-3xl font-bold text-red-500">{stats.inactive}</p>
        </div>
        <div className="rounded-xl border border-border-subtle bg-surface-card p-5 shadow-lg">
          <p className="text-xs font-semibold tracking-wider text-content-secondary">RECENTLY ADDED</p>
          <p className="mt-2 text-3xl font-bold text-white">{stats.recent} <span className="text-sm font-normal text-content-secondary">this month</span></p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="rounded-xl border border-border-subtle bg-surface-card shadow-lg">
        
        {/* Filters */}
        <div className="flex flex-col items-center justify-between gap-4 border-b border-border-subtle p-4 sm:flex-row">
          <div className="flex w-full flex-wrap gap-4 sm:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-secondary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search user..."
                className="w-full rounded-lg border border-border-default bg-surface-input py-2 pl-9 pr-4 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>
            
            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-content-secondary">Role:</span>
              <select 
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-lg border border-border-default bg-surface-input py-2 pl-3 pr-8 text-sm text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              >
                <option value="all">All</option>
                <option value="administrator">Administrator</option>
                <option value="sales_manager">Sales Manager</option>
                <option value="sales_business_development">Sales BD</option>
                <option value="customer">Customer</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-content-secondary">Status:</span>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-border-default bg-surface-input py-2 pl-3 pr-8 text-sm text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-default text-content-secondary hover:bg-border-subtle hover:text-white">
              <Filter className="h-4 w-4" />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-default text-content-secondary hover:bg-border-subtle hover:text-white">
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-content-secondary">
            <thead className="border-b border-border-subtle bg-transparent text-[10px] font-semibold uppercase tracking-wider text-content-secondary">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Account Status</th>
                <th className="px-6 py-4">Last Login</th>
                <th className="px-6 py-4">Created Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {users.length > 0 ? users.map((user) => (
                <tr key={user.id} className="hover:bg-zinc-800/20">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={clsx( "flex h-8 w-8 overflow-hidden shrink-0 items-center justify-center rounded-full font-bold text-white",
                        user.role === 'administrator' ? 'bg-purple-600' : 'bg-blue-600'
                      )}>
                        {/* @ts-ignore */}
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.name} className="h-full w-full object-cover" />
                        ) : (
                          getInitials(user.name)
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-200">{user.name}</p>
                        <p className="text-xs text-content-secondary">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={clsx( "inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium",
                      user.role === 'administrator' ? "border-[#ffcc00]/30 text-brand" : "border-border-default text-content-primary"
                    )}>
                      {formatRole(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={clsx( "inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      user.is_active ? "border-green-500/30 text-green-500" : "border-red-500/30 text-red-500"
                    )}>
                      {user.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-content-secondary">
                    {user.last_login_at ? 'Online Now' : '2 hours ago'} {/* Placeholder for demo */}
                  </td>
                  <td className="px-6 py-4 text-content-secondary">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="rounded p-1 text-content-secondary hover:bg-border-subtle hover:text-white">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => toggleStatus(user)} className={clsx("rounded p-1 hover:bg-border-subtle", user.is_active ? "text-green-500 hover:text-green-400" : "text-red-500 hover:text-red-400")} title={user.is_active ? "Deactivate User" : "Activate User"}>
                        {user.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                      </button>
                      <button onClick={() => openEditModal(user)} className="rounded p-1 text-content-secondary hover:bg-border-subtle hover:text-white">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => openDeleteModal(user)} className="rounded p-1 text-content-secondary hover:bg-border-subtle hover:text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-content-secondary">
                    No users found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} size="md">
        <div className="bg-surface-card p-6 text-white">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">Add New User</h3>
            <button onClick={() => setIsAddModalOpen(false)} className="text-content-secondary hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={submitAdd} className="space-y-4">
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-slate-300">Full Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 p-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-slate-300">Email Address</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 p-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-slate-300">Role</label>
              <select 
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 p-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="administrator">Administrator</option>
                <option value="sales_manager">Sales Manager</option>
                <option value="sales_business_development">Sales Business Development</option>
                <option value="staff">Staff</option>
                <option value="customer">Customer</option>
              </select>
              {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role}</p>}
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-slate-300">Password</label>
              <input 
                type="password" 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 p-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg border border-border-default px-4 py-2 text-sm font-medium text-content-primary hover:bg-border-subtle"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-black hover:bg-brand/90 disabled:opacity-70"
              >
                {processing ? 'Saving...' : 'Add User'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} size="md">
        <div className="bg-surface-card p-6 text-white">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">Edit User</h3>
            <button onClick={() => setIsEditModalOpen(false)} className="text-content-secondary hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={submitEdit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-content-secondary">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full rounded-lg border border-border-default bg-surface-input px-3 py-2 text-white focus:border-brand focus:ring-1 focus:ring-brand"
                required
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-content-secondary">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full rounded-lg border border-border-default bg-surface-input px-3 py-2 text-white focus:border-brand focus:ring-1 focus:ring-brand"
                required
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-content-secondary">Role</label>
              <select
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
                className="w-full rounded-lg border border-border-default bg-surface-input px-3 py-2 text-white focus:border-brand focus:ring-1 focus:ring-brand"
              >
                <option value="administrator">Administrator</option>
                <option value="sales_manager">Sales Manager</option>
                <option value="sales_business_development">Sales Business Dev</option>
                <option value="staff">Staff</option>
                <option value="customer">Customer</option>
              </select>
              {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-content-secondary">Reset Password (Optional)</label>
              <input
                type="password"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                placeholder="Leave blank to keep current password"
                className="w-full rounded-lg border border-border-default bg-surface-input px-3 py-2 text-white focus:border-brand focus:ring-1 focus:ring-brand"
                minLength={8}
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-lg border border-border-default px-4 py-2 text-sm font-medium text-content-primary hover:bg-border-subtle"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-black hover:bg-brand/90 disabled:opacity-70"
              >
                {processing ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete User Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} size="sm">
        <div className="bg-surface-card p-6 text-white">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-red-500">Delete User</h3>
            <button onClick={() => setIsDeleteModalOpen(false)} className="text-content-secondary hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-content-primary">
            Are you sure you want to delete <span className="font-bold text-white">{selectedUser?.name}</span>? This action cannot be undone.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="rounded-lg border border-border-default px-4 py-2 text-sm font-medium text-content-primary hover:bg-border-subtle"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitDelete}
              disabled={processing}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-70"
            >
              {processing ? 'Deleting...' : 'Delete User'}
            </button>
          </div>
        </div>
      </Modal>

    </AppLayout>
  );
}