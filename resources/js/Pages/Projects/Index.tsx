import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { Card, CardBody } from '../../Components/Card';
import Table, { TableColumn } from '../../Components/Table';
import Button from '../../Components/Button';
import { Input } from '../../Components/Form';
import { StatusBadge } from '../../Components/Badge';
import Modal from '../../Components/Modal';
import { Plus, Edit2, Eye, Search } from 'lucide-react';
import { formatPeso } from '../../Utils/currency';

interface Project {
  id: number;
  project_name: string;
  customer_name: string;
  status: string;
  budget: number;
  progress: number;
  start_date: string;
  end_date?: string;
  description?: string;
  deadline?: string;
  spent_amount?: number;
  objectives?: string;
  deliverables?: string;
}

const ProjectsList = ({ projects = [] }: { projects?: Array<Project> }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [records, setRecords] = useState<Project[]>(projects);
  const [filtered, setFiltered] = useState<Project[]>(records);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let result = [...records];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item) => item.project_name.toLowerCase().includes(query) || item.customer_name.toLowerCase().includes(query));
    }
    if (statusFilter) {
      result = result.filter((item) => item.status === statusFilter);
    }
    setFiltered(result);
  }, [searchQuery, statusFilter, records]);

  useEffect(() => {
    fetch('/api/projects?per_page=100', { headers: { Accept: 'application/json' } })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(data => setRecords((data.data ?? []).map((project: any) => ({ id: project.id, project_name: project.project_name, customer_name: project.customer?.company_name || project.customer?.name || '-', status: project.status, budget: Number(project.budget ?? 0), progress: Number(project.progress_percentage ?? 0), start_date: project.start_date, end_date: project.end_date || project.deadline, deadline: project.deadline, description: project.description, spent_amount: Number(project.spent_amount ?? 0), objectives: project.objectives, deliverables: project.deliverables }))))
      .catch(() => setRecords([]));
  }, []);

  const updateProject = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingProject) return;
    setSaving(true);
    const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
    const response = await fetch(`/api/projects/${editingProject.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrf }, body: JSON.stringify({ project_name: editingProject.project_name, description: editingProject.description, status: editingProject.status, deadline: editingProject.deadline || null, budget: editingProject.budget, spent_amount: editingProject.spent_amount, progress_percentage: editingProject.progress, objectives: editingProject.objectives, deliverables: editingProject.deliverables }) });
    if (response.ok) {
      setEditingProject(null);
      setMessage('Project updated. Refresh the page to view the latest project record.');
    } else {
      setMessage('Project could not be updated.');
    }
    setSaving(false);
  };

  const columns: TableColumn<Project>[] = [
    { key: 'project_name', label: 'Project Name', width: '22%' },
    { key: 'customer_name', label: 'Customer', width: '18%' },
    { key: 'status', label: 'Status', render: (status) => <StatusBadge status={status} /> },
    { key: 'budget', label: 'Budget', render: (budget) => formatPeso(budget) },
    { key: 'progress', label: 'Progress', render: (progress) => <div className="w-24 bg-neutral-200 rounded-full h-2"><div className="bg-primary-600 h-2 rounded-full" style={{ width: `${progress}%` }} /></div> },
    { key: 'start_date', label: 'Start Date', render: (date) => new Date(date).toLocaleDateString() },
    {
      key: 'id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => setSelectedProject(row)} className="p-1.5 hover:bg-primary-50 rounded-lg text-primary-600 transition-colors dark:text-[#8cb9ff] dark:hover:bg-white/10" title="View project"><Eye className="w-4 h-4" /></button>
          <button onClick={() => setEditingProject({ ...row })} className="p-1.5 hover:bg-primary-50 rounded-lg text-primary-600 transition-colors dark:text-[#8cb9ff] dark:hover:bg-white/10" title="Edit project"><Edit2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Head title="Projects" />
      <AppLayout title="Projects" headerAction={<Button variant="primary" onClick={() => window.location.href = '/projects/create'}><Plus className="w-4 h-4" />New Project</Button>}>
        <div className="space-y-4">
          {message && <p className="border border-neutral-300 bg-neutral-50 p-3 text-sm dark:border-white/10 dark:bg-white/5 dark:text-neutral-200">{message}</p>}
          <Card><CardBody><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Input placeholder="Search..." startIcon={<Search className="w-4 h-4" />} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-neutral-300 rounded-lg text-sm"><option value="">All Status</option><option value="planning">Planning</option><option value="active">Active</option><option value="on-hold">On Hold</option><option value="completed">Completed</option></select></div></CardBody></Card>
          <Card noPadding><Table columns={columns} data={filtered} emptyMessage="No client projects yet. Create a project after a confirmed client transaction." /></Card>
          <Modal isOpen={!!selectedProject} onClose={() => setSelectedProject(null)} title={selectedProject?.project_name || 'Project details'} size="lg" footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => selectedProject && setEditingProject({ ...selectedProject })}>Edit project</Button><Button onClick={() => setSelectedProject(null)}>Close</Button></div>}>
            {selectedProject && <div className="space-y-5 text-sm"><div className="grid grid-cols-2 gap-4 border-b border-neutral-200 pb-4 dark:border-white/10"><div><p className="text-xs text-neutral-500">Customer</p><p className="mt-1 font-medium dark:text-white">{selectedProject.customer_name}</p></div><div><p className="text-xs text-neutral-500">Status</p><p className="mt-1"><StatusBadge status={selectedProject.status} /></p></div><div><p className="text-xs text-neutral-500">Budget</p><p className="mt-1 font-semibold dark:text-white">{formatPeso(selectedProject.budget)}</p></div><div><p className="text-xs text-neutral-500">Progress</p><p className="mt-1 font-semibold dark:text-white">{selectedProject.progress}%</p></div></div><div><p className="text-xs text-neutral-500">Description</p><p className="mt-1 dark:text-neutral-200">{selectedProject.description || '-'}</p></div><div><p className="text-xs text-neutral-500">Objectives</p><p className="mt-1 dark:text-neutral-200">{selectedProject.objectives || '-'}</p></div><div><p className="text-xs text-neutral-500">Deliverables</p><p className="mt-1 dark:text-neutral-200">{selectedProject.deliverables || '-'}</p></div></div>}
          </Modal>
          <Modal isOpen={!!editingProject} onClose={() => !saving && setEditingProject(null)} title="Edit Project" size="xl" footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEditingProject(null)} disabled={saving}>Cancel</Button><Button type="submit" form="edit-project-form" loading={saving}>Save changes</Button></div>}>
            {editingProject && <form id="edit-project-form" onSubmit={updateProject} className="grid grid-cols-1 gap-4 md:grid-cols-2"><label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Project name<input value={editingProject.project_name} onChange={event => setEditingProject({ ...editingProject, project_name: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5" /></label><label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Status<select value={editingProject.status} onChange={event => setEditingProject({ ...editingProject, status: event.target.value })} className="mt-1 w-full border border-neutral-300 bg-white p-2.5"><option value="planning">Planning</option><option value="active">Active</option><option value="on-hold">On Hold</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label><label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Budget<input type="number" min="0" value={editingProject.budget} onChange={event => setEditingProject({ ...editingProject, budget: Number(event.target.value) })} className="mt-1 w-full border border-neutral-300 p-2.5" /></label><label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Progress (%)<input type="number" min="0" max="100" value={editingProject.progress} onChange={event => setEditingProject({ ...editingProject, progress: Number(event.target.value) })} className="mt-1 w-full border border-neutral-300 p-2.5" /></label><label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Deadline<input type="date" value={editingProject.deadline ? editingProject.deadline.slice(0, 10) : ''} onChange={event => setEditingProject({ ...editingProject, deadline: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5" /></label><label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Spent amount<input type="number" min="0" value={editingProject.spent_amount || 0} onChange={event => setEditingProject({ ...editingProject, spent_amount: Number(event.target.value) })} className="mt-1 w-full border border-neutral-300 p-2.5" /></label><label className="text-sm font-medium text-neutral-700 dark:text-neutral-200 md:col-span-2">Description<textarea value={editingProject.description || ''} onChange={event => setEditingProject({ ...editingProject, description: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5" rows={3} /></label><label className="text-sm font-medium text-neutral-700 dark:text-neutral-200 md:col-span-2">Objectives<textarea value={editingProject.objectives || ''} onChange={event => setEditingProject({ ...editingProject, objectives: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5" rows={3} /></label><label className="text-sm font-medium text-neutral-700 dark:text-neutral-200 md:col-span-2">Deliverables<textarea value={editingProject.deliverables || ''} onChange={event => setEditingProject({ ...editingProject, deliverables: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5" rows={3} /></label></form>}
          </Modal>
        </div>
      </AppLayout>
    </>
  );
};

export default ProjectsList;
