import { Head, usePage } from '@inertiajs/react';

export default function JobOrders() {
  const page = usePage<any>();
  const jobOrders = page.props.jobOrders?.data || page.props.jobOrders || [];

  return (
    <>
      <Head title="My Job Orders" />
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">My job orders</h1>
        <div className="mt-5 space-y-3">
          {jobOrders.length === 0 ? <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No job orders available.</div> : jobOrders.map((item: any) => (
            <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold text-slate-800">{item.job_order_number}</div>
                <span className="rounded-full bg-sky-100 px-2 py-1 text-[10px] font-bold uppercase text-sky-700">{item.status}</span>
              </div>
              <div className="mt-2 text-sm text-slate-600">{item.description}</div>
              <div className="mt-2 text-xs text-slate-500">Project/site: {item.project_name || item.site_location || 'TBD'}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
