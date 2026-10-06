import { Head, Link } from '@inertiajs/react';
import { BriefcaseBusiness, FileText, FolderKanban, MessageSquareText, PackageCheck, Wrench } from 'lucide-react';

export default function Dashboard({ client, stats, recentInquiries, recentQuotations, recentJobOrders, recentRentals, recentProjects }: any) {
  const cards = [
    { label: 'Inquiries', value: stats?.inquiries_count ?? 0, icon: MessageSquareText },
    { label: 'Quotations', value: stats?.active_quotations_count ?? 0, icon: FileText },
    { label: 'Job Orders', value: stats?.job_orders_count ?? 0, icon: BriefcaseBusiness },
    { label: 'Rentals', value: stats?.active_rentals_count ?? 0, icon: PackageCheck },
    { label: 'Projects', value: stats?.projects_count ?? 0, icon: FolderKanban },
  ];

  return (
    <>
      <Head title="Client Portal Dashboard" />
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Welcome back</p>
              <h1 className="text-3xl font-bold text-slate-900">{client?.company_name || client?.name || 'Client Portal'}</h1>
            </div>
            <Link href="/portal/profile" className="rounded-full bg-[#f2b600] px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-[#e0a800]">
              View profile
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {cards.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{label}</p>
                <Icon className="h-5 w-5 text-[#f2b600]" />
              </div>
              <div className="mt-4 text-3xl font-black text-slate-900">{value}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Recent inquiries</h2>
            <div className="mt-4 space-y-3">
              {(recentInquiries || []).slice(0, 5).map((item: any) => (
                <div key={item.id} className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-slate-800">{item.subject}</div>
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase text-amber-700">{item.status}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">#{item.inquiry_number}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Recent quotations</h2>
            <div className="mt-4 space-y-3">
              {(recentQuotations || []).slice(0, 5).map((item: any) => (
                <div key={item.id} className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-slate-800">{item.quotation_number}</div>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">{item.status}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">Total: ₱{Number(item.total_amount || 0).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
