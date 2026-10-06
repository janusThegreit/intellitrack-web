import { Head, usePage } from '@inertiajs/react';
import { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';

export default function Inquiries() {
  const page = usePage<any>();
  const inquiries = page.props.inquiries?.data || page.props.inquiries || [];
  const { data, setData, post, processing } = useForm({ subject: '', details: '', priority: 'medium' });

  return (
    <>
      <Head title="My Inquiries" />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={(e: FormEvent) => {e.preventDefault(); post('/portal/inquiries');}} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Submit inquiry</h1>
          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Subject</label>
              <input value={data.subject} onChange={(e) => setData('subject', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800" />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Priority</label>
              <select value={data.priority} onChange={(e) => setData('priority', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Details</label>
              <textarea value={data.details} onChange={(e) => setData('details', e.target.value)} rows={6} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800" />
            </div>
            <button type="submit" disabled={processing} className="w-full rounded-xl bg-[#f2b600] px-4 py-3 text-sm font-bold text-slate-950 hover:bg-[#e0a800] disabled:opacity-60">{processing ? 'Submitting...' : 'Submit inquiry'}</button>
          </div>
        </form>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">My inquiries</h2>
          <div className="mt-5 space-y-3">
            {inquiries.length === 0 ? <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No inquiries yet.</div> : inquiries.map((item: any) => (
              <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-slate-800">{item.subject}</div>
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase text-amber-700">{item.status}</span>
                </div>
                <div className="mt-2 text-xs text-slate-500">#{item.inquiry_number || item.id}</div>
                <div className="mt-2 text-sm text-slate-600">{item.details}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
