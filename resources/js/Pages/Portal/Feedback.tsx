import { Head, usePage } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';

export default function Feedback() {
  const page = usePage<any>();
  const feedbacks = page.props.feedbacks?.data || page.props.feedbacks || [];
  const jobOrders = page.props.availableJobOrders || [];
  const { data, setData, post, processing } = useForm({ job_order_id: '', rating: '5', comments: '', feedback_type: 'service_quality' });

  return (
    <>
      <Head title="Feedback" />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={(e) => { e.preventDefault(); post('/portal/feedback'); }} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Submit feedback</h1>
          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Job order</label>
              <select value={data.job_order_id} onChange={(e) => setData('job_order_id', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800">
                <option value="">Select a job order</option>
                {jobOrders.map((item: any) => <option key={item.id} value={item.id}>{item.job_order_number}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Rating</label>
              <select value={data.rating} onChange={(e) => setData('rating', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800">
                <option value="5">5 / Excellent</option>
                <option value="4">4 / Good</option>
                <option value="3">3 / Fair</option>
                <option value="2">2 / Poor</option>
                <option value="1">1 / Very poor</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Comments</label>
              <textarea value={data.comments} onChange={(e) => setData('comments', e.target.value)} rows={6} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800" />
            </div>
            <button type="submit" disabled={processing} className="w-full rounded-xl bg-[#f2b600] px-4 py-3 text-sm font-bold text-slate-950 hover:bg-[#e0a800] disabled:opacity-60">{processing ? 'Submitting...' : 'Send feedback'}</button>
          </div>
        </form>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">My feedback</h2>
          <div className="mt-5 space-y-3">
            {feedbacks.length === 0 ? <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No feedback submitted.</div> : feedbacks.map((item: any) => (
              <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-slate-800">Rating: {item.rating}/5</div>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">{item.feedback_type}</span>
                </div>
                <div className="mt-2 text-sm text-slate-600">{item.comments}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
