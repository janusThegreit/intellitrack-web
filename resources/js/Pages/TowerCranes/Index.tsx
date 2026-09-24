import { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { Filter, PackageSearch, Layers, Sparkles, Ruler, Weight, ArrowUpRight } from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';
import { Card, CardBody } from '../../Components/Card';

interface Crane {
  id: number;
  name: string;
  crane_model?: string;
  crane_category?: string;
  description?: string;
  maximum_load?: number;
  maximum_load_unit?: string;
  maximum_radius?: number;
  maximum_radius_unit?: string;
  final_height?: number;
  final_height_unit?: string;
  status: string;
  image_url?: string;
  rental_services?: string[];
}

const label = (value?: string) =>
  value ? value.replace(/_/g, ' ').replace(/\b\w/g, (letter: string) => letter.toUpperCase()) : 'Not recorded';

const TowerCranes = () => {
  const [cranes, setCranes] = useState<Crane[]>([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const query = new URLSearchParams({
      per_page: '100',
      ...(category ? { category } : {}),
      ...(search ? { search } : {}),
    });
    fetch(`/api/equipment?${query}`, { headers: { Accept: 'application/json' } })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => {
        setCranes(data.data ?? []);
        setError('');
      })
      .catch(() => setError('The tower crane catalog could not be loaded.'));
  }, [category, search]);

  return (
    <>
      <Head title="Tower Crane Master Catalog | IntelliTrack" />
      <AppLayout title="Tower Crane Catalog">
        <div className="space-y-6">
          {/* Header banner */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border-subtle pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
                <Layers className="h-4 w-4" />
                <span>Heavy Fleet Specification Dossier</span>
              </div>
              <h1 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-content-primary">
                Tower Crane Catalog
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-content-secondary">
                Verified high-rise lifting equipment, hook radius ratings, maximum load capacities, and operational status.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-500">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{cranes.length} Units In Master Roster</span>
              </span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <Card>
            <CardBody>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <PackageSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by crane model, code, or serial..."
                    className="w-full rounded-xl border border-border-default bg-surface-card py-2.5 pl-10 pr-4 text-xs sm:text-sm text-content-primary placeholder:text-content-muted focus:border-amber-500 focus:outline-none shadow-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-content-secondary" />
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="rounded-xl border border-border-default bg-surface-card px-4 py-2.5 text-xs sm:text-sm font-medium text-content-primary focus:border-amber-500 focus:outline-none shadow-xs"
                  >
                    <option value="">All Categories</option>
                    <option value="hammerhead">Hammerhead</option>
                    <option value="topless">Topless (Flat Top)</option>
                    <option value="luffing">Luffing Jib</option>
                  </select>
                </div>
              </div>
            </CardBody>
          </Card>

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-medium text-rose-500">
              {error}
            </div>
          )}

          {/* Crane Grid */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {cranes.map((crane) => (
              <article
                key={crane.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border-default bg-surface-card shadow-xs transition-all hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-lg"
              >
                {/* Image / Placeholder */}
                <div className="relative flex h-48 w-full items-center justify-center overflow-hidden bg-surface-input border-b border-border-subtle">
                  {crane.image_url ? (
                    <img
                      src={crane.image_url}
                      alt={crane.crane_model || crane.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 text-content-muted">
                      <PackageSearch className="h-10 w-10 text-amber-500/50" />
                      <span className="text-[11px] font-medium tracking-wide">Technical Asset Photo</span>
                    </div>
                  )}
                  <span className="absolute top-3 right-3 rounded-lg border border-border-default bg-surface-card/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-content-primary backdrop-blur-md shadow-xs">
                    {label(crane.status)}
                  </span>
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-amber-500">
                        {label(crane.crane_category || 'Heavy Tower Crane')}
                      </p>
                      <h2 className="mt-1 text-base font-bold text-content-primary group-hover:text-amber-500 transition-colors">
                        {crane.crane_model || crane.name}
                      </h2>
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-content-secondary line-clamp-2 leading-relaxed min-h-[2.5rem]">
                    {crane.description || 'Verified industrial tower crane asset calibrated for heavy mobilization and high-elevation operations.'}
                  </p>

                  {/* Specifications Matrix */}
                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-border-subtle bg-surface-input/50 p-3 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-content-muted uppercase">
                        <Weight className="h-3 w-3 text-amber-500" />
                        <span>Max Load</span>
                      </div>
                      <p className="mt-1 font-mono text-xs font-bold text-content-primary">
                        {crane.maximum_load ? `${crane.maximum_load} ${crane.maximum_load_unit || 'T'}` : '—'}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-content-muted uppercase">
                        <Ruler className="h-3 w-3 text-blue-500" />
                        <span>Max Jib</span>
                      </div>
                      <p className="mt-1 font-mono text-xs font-bold text-content-primary">
                        {crane.maximum_radius ? `${crane.maximum_radius} ${crane.maximum_radius_unit || 'm'}` : '—'}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-content-muted uppercase">
                        <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                        <span>Height</span>
                      </div>
                      <p className="mt-1 font-mono text-xs font-bold text-content-primary">
                        {crane.final_height ? `${crane.final_height} ${crane.final_height_unit || 'm'}` : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Services Tags */}
                  {(crane.rental_services?.length ?? 0) > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5 pt-3 border-t border-border-subtle/80">
                      {(crane.rental_services ?? []).map((service) => (
                        <span
                          key={service}
                          className="rounded-md border border-border-default bg-surface-card px-2 py-0.5 text-[10px] font-semibold text-content-secondary"
                        >
                          {label(service)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>

          {!error && cranes.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border-default p-12 text-center">
              <PackageSearch className="mx-auto h-12 w-12 text-content-muted" />
              <h3 className="mt-3 text-sm font-bold text-content-primary">No Catalog Equipment Found</h3>
              <p className="mt-1 text-xs text-content-secondary">
                No catalog cranes match the current filter. Try adjusting your search query or category.
              </p>
            </div>
          )}
        </div>
      </AppLayout>
    </>
  );
};

export default TowerCranes;