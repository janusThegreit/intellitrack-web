import { Head, usePage } from '@inertiajs/react';

export default function Quotations() {
  const page = usePage<any>();
  const quotations = page.props.quotations?.data || page.props.quotations || [];

  return (
    <>
      <Head title="My Quotations" />
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">My quotations</h1>
        <div className="mt-5 space-y-3">
          {quotations.length === 0 ? <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No quotations available.</div> : quotations.map((item: any) => (
            <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold text-slate-800">{item.quotation_number}</div>
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">{item.status}</span>
              </div>
              <div className="mt-2 text-sm text-slate-600">Total amount: ₱{Number(item.total_amount || 0).toLocaleString()}</div>
              <div className="mt-1 text-xs text-slate-500">Valid until: {item.valid_until || 'N/A'}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
