import { Head, usePage } from '@inertiajs/react';

export default function Rentals() {
  const page = usePage<any>();
  const rentals = page.props.rentals?.data || page.props.rentals || [];

  return (
    <>
      <Head title="My Rentals" />
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">My rentals</h1>
        <div className="mt-5 space-y-3">
          {rentals.length === 0 ? <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No rental records available.</div> : rentals.map((item: any) => (
            <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold text-slate-800">{item.rental_number}</div>
                <span className="rounded-full bg-violet-100 px-2 py-1 text-[10px] font-bold uppercase text-violet-700">{item.status}</span>
              </div>
              <div className="mt-2 text-sm text-slate-600">Equipment: {item.equipment?.name || 'Equipment record'}</div>
              <div className="mt-1 text-xs text-slate-500">Period: {item.start_date || 'N/A'} to {item.end_date || 'N/A'}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
