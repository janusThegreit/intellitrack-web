import { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { ClipboardCheck, RefreshCw, MapPin } from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';
import { Card, CardBody } from '../../Components/Card';
import Button from '../../Components/Button';
import FleetNavTabs from '../../Components/FleetNavTabs';

interface Requirement {
  id: number;
  requirement_number: string;
  crane_category: string;
  status: string;
  site_location?: string;
  required_load?: number;
  required_load_unit?: string;
  required_height?: number;
  required_height_unit?: string;
  inquiry?: { inquiry_number: string; subject: string };
  customer?: { company_name: string; name: string };
  equipment?: { name: string; crane_model?: string };
  services?: string[];
}

const text = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());

const RentalRequirements = () => {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    fetch('/api/rental-requirements?per_page=100', { headers: { Accept: 'application/json' } })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(data => {
        setRequirements(data.data ?? []);
        setError('');
      })
      .catch(() => setError('Rental requirements could not be loaded.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <Head title="Rental Requirements & Assessments" />
      <AppLayout
        dark={true}
        title="Fleet & Rentals"
      >
        <div className="space-y-4">
          <FleetNavTabs
            actionButton={
              <Button variant="secondary" onClick={load} loading={loading}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            }
          />

          <Card>
            <CardBody>
              <div className="flex items-start gap-3">
                <ClipboardCheck className="mt-0.5 h-5 w-5 text-amber-500" />
                <div>
                  <h2 className="font-semibold text-content-primary">Inquiry Assessment Queue</h2>
                  <p className="mt-1 text-sm text-content-secondary">
                    Assess required crane specifications, select a compatible Alibaton catalog asset, then link the requirement to quotation and job order stages.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          {error && <p className="border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-400 rounded-xl">{error}</p>}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {requirements.map(requirement => (
              <Card key={requirement.id}>
                <CardBody>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                        {requirement.requirement_number}
                      </span>
                      <h2 className="mt-2 font-bold text-base text-content-primary">
                        {text(requirement.crane_category)} Crane
                      </h2>
                      <p className="mt-1 text-xs text-content-secondary">
                        {requirement.inquiry?.inquiry_number} · {requirement.inquiry?.subject}
                      </p>
                    </div>
                    <span className="border border-border-default px-2.5 py-1 text-xs font-semibold bg-surface-elevated text-amber-400 rounded-lg capitalize">
                      {text(requirement.status)}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-y border-border-default py-3 text-sm">
                    <div>
                      <p className="text-xs text-content-secondary">Selected Asset</p>
                      <p className="mt-1 font-semibold text-content-primary">
                        {requirement.equipment?.crane_model || requirement.equipment?.name || 'Pending selection'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-content-secondary flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-amber-500" /> Site Location
                      </p>
                      <p className="mt-1 font-medium text-content-primary truncate">
                        {requirement.site_location || 'Not recorded'}
                      </p>
                    </div>
                  </div>

                  {requirement.required_load && (
                    <div className="mt-3 flex items-center gap-4 text-xs text-content-secondary">
                      <span>Capacity: <strong className="text-content-primary">{requirement.required_load} {requirement.required_load_unit}</strong></span>
                      {requirement.required_height && (
                        <span>Height: <strong className="text-content-primary">{requirement.required_height} {requirement.required_height_unit}</strong></span>
                      )}
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(requirement.services ?? []).map(service => (
                      <span className="bg-surface-elevated border border-border-default px-2 py-0.5 text-xs text-content-secondary rounded-md" key={service}>
                        {text(service)}
                      </span>
                    ))}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          {!loading && !error && requirements.length === 0 && (
            <div className="py-12 text-center text-sm text-content-secondary bg-surface-card rounded-2xl border border-border-default">
              <ClipboardCheck className="mx-auto h-8 w-8 text-content-muted mb-2" />
              No assessed crane rental requirements yet. Create a client inquiry, then add its rental requirement through the CRM workflow.
            </div>
          )}
        </div>
      </AppLayout>
    </>
  );
};

export default RentalRequirements;