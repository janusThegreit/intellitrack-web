import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { Filter, PackageSearch } from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';
import { Card, CardBody } from '../../Components/Card';

interface Crane {
  id: number; name: string; crane_model?: string; crane_category?: string; description?: string;
  maximum_load?: number; maximum_load_unit?: string; maximum_radius?: number; maximum_radius_unit?: string;
  final_height?: number; final_height_unit?: string; status: string; image_url?: string; rental_services?: string[];
}

const label = (value?: string) => value ? value.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase()) : 'Not recorded';

const TowerCranes = () => {
  const [cranes, setCranes] = useState<Crane[]>([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const query = new URLSearchParams({ per_page: '100', ...(category ? { category } : {}), ...(search ? { search } : {}) });
    fetch(`/api/equipment?${query}`, { headers: { Accept: 'application/json' } })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(data => { setCranes(data.data ?? []); setError(''); })
      .catch(() => setError('The tower crane catalog could not be loaded.'));
  }, [category, search]);

  return <><Head title="Tower Crane Catalog" /><AppLayout title="Tower Crane Catalog">
    <div className="space-y-6">
      <Card><CardBody><div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1"><PackageSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search crane model or code" className="w-full border border-neutral-300 py-2.5 pl-10 pr-3 text-sm" /></div>
        <label className="flex items-center gap-2 text-sm text-neutral-600"><Filter className="h-4 w-4" /><select value={category} onChange={event => setCategory(event.target.value)} className="border border-neutral-300 bg-white px-3 py-2.5"><option value="">All categories</option><option value="hammerhead">Hammerhead</option><option value="topless">Topless</option><option value="luffing">Luffing</option></select></label>
      </div></CardBody></Card>
      {error && <p className="border border-error-200 bg-error-50 p-3 text-sm text-error-700">{error}</p>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cranes.map(crane => <article className="border border-neutral-200 bg-white" key={crane.id}>
          <div className="flex h-36 items-center justify-center bg-neutral-100 text-neutral-400">{crane.image_url ? <img src={crane.image_url} alt="" className="h-full w-full object-cover" /> : <PackageSearch className="h-10 w-10" />}</div>
          <div className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-[#9b7800]">{label(crane.crane_category)}</p><h2 className="mt-1 font-semibold text-neutral-950">{crane.crane_model || crane.name}</h2></div><span className="border border-neutral-200 px-2 py-1 text-xs">{label(crane.status)}</span></div>
          <p className="mt-3 min-h-10 text-sm text-neutral-600">{crane.description || 'No catalog description recorded.'}</p>
          <dl className="mt-4 grid grid-cols-3 gap-2 border-y border-neutral-200 py-3 text-xs"><div><dt className="text-neutral-500">Max load</dt><dd className="mt-1 font-semibold">{crane.maximum_load ?? '-'} {crane.maximum_load_unit}</dd></div><div><dt className="text-neutral-500">Max radius</dt><dd className="mt-1 font-semibold">{crane.maximum_radius ?? '-'} {crane.maximum_radius_unit}</dd></div><div><dt className="text-neutral-500">Final height</dt><dd className="mt-1 font-semibold">{crane.final_height ?? '-'} {crane.final_height_unit}</dd></div></dl>
          <div className="mt-3 flex flex-wrap gap-1">{(crane.rental_services ?? []).map(service => <span className="bg-neutral-100 px-2 py-1 text-xs text-neutral-700" key={service}>{label(service)}</span>)}</div></div>
        </article>)}
      </div>
      {!error && cranes.length === 0 && <p className="py-10 text-center text-sm text-neutral-500">No catalog cranes match the current filter. Add only models and specifications verified in the client catalog.</p>}
    </div>
  </AppLayout></>;
};
export default TowerCranes;