import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { ClipboardCheck, RefreshCw } from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';
import { Card, CardBody } from '../../Components/Card';
import Button from '../../Components/Button';

interface Requirement { id: number; requirement_number: string; crane_category: string; status: string; site_location?: string; inquiry?: { inquiry_number: string; subject: string }; equipment?: { name: string; crane_model?: string }; services?: string[]; }
const text = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());

const RentalRequirements = () => {
  const [requirements, setRequirements] = useState<Requirement[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = () => { setLoading(true); fetch('/api/rental-requirements?per_page=100', { headers: { Accept: 'application/json' } }).then(response => response.ok ? response.json() : Promise.reject()).then(data => { setRequirements(data.data ?? []); setError(''); }).catch(() => setError('Rental requirements could not be loaded.')).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);
  return <><Head title="Rental Requirements" /><AppLayout title="Rental Requirements" headerAction={<Button variant="secondary" onClick={load} loading={loading}><RefreshCw className="h-4 w-4" />Refresh</Button>}>
    <div className="space-y-5"><Card><CardBody><div className="flex items-start gap-3"><ClipboardCheck className="mt-0.5 h-5 w-5 text-[#9b7800]" /><div><h2 className="font-semibold text-neutral-950">Inquiry assessment queue</h2><p className="mt-1 text-sm text-neutral-600">Assess the required crane, select a compatible catalog asset, then link the requirement to quotation and job order stages.</p></div></div></CardBody></Card>
    {error && <p className="border border-error-200 bg-error-50 p-3 text-sm text-error-700">{error}</p>}
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">{requirements.map(requirement => <Card key={requirement.id}><CardBody><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-[#9b7800]">{requirement.requirement_number}</p><h2 className="mt-1 font-semibold text-neutral-950">{text(requirement.crane_category)} crane</h2><p className="mt-1 text-sm text-neutral-600">{requirement.inquiry?.inquiry_number} · {requirement.inquiry?.subject}</p></div><span className="border border-neutral-200 px-2 py-1 text-xs">{text(requirement.status)}</span></div><div className="mt-4 grid grid-cols-2 gap-3 border-y border-neutral-200 py-3 text-sm"><div><p className="text-neutral-500">Selected crane</p><p className="mt-1 font-medium">{requirement.equipment?.crane_model || requirement.equipment?.name || 'Pending selection'}</p></div><div><p className="text-neutral-500">Site location</p><p className="mt-1 font-medium">{requirement.site_location || 'Not recorded'}</p></div></div><div className="mt-3 flex flex-wrap gap-1">{(requirement.services ?? []).map(service => <span className="bg-neutral-100 px-2 py-1 text-xs" key={service}>{text(service)}</span>)}</div></CardBody></Card>)}</div>
    {!loading && !error && requirements.length === 0 && <p className="py-12 text-center text-sm text-neutral-500">No assessed crane rental requirements yet. Create a client inquiry, then add its rental requirement through the API workflow.</p>}
    </div></AppLayout></>;
};
export default RentalRequirements;