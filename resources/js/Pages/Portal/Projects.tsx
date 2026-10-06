import { Head, usePage } from '@inertiajs/react';

export default function Projects() {
  const page = usePage<any>();
  const projects = page.props.projects?.data || page.props.projects || [];

  return (
    <>
      <Head title="My Projects" />
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">My projects</h1>
        <div className="mt-5 space-y-3">
          {projects.length === 0 ? <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No projects available.</div> : projects.map((item: any) => (
            <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold text-slate-800">{item.project_name || item.project_code}</div>
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">{item.status}</span>
              </div>
              <div className="mt-2 text-sm text-slate-600">Location: {item.location || 'TBD'}</div>
              <div className="mt-1 text-xs text-slate-500">Progress: {item.progress || 'Awaiting update'}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
