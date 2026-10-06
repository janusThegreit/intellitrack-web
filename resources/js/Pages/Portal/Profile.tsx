import { Head, usePage } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';

export default function Profile() {
  const page = usePage<any>();
  const client = page.props.client || {};
  const user = page.props.user || {};

  const { data, setData, put, processing } = useForm({
    contact_person: client.contact_person || user.name || '',
    phone: client.phone || user.phone || '',
    address: client.address || '',
    project_location: client.project_location || '',
    password: '',
    password_confirmation: '',
  });

  return (
    <>
      <Head title="My Profile" />
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">My profile</h1>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-5">
            <div className="text-sm text-slate-500">Company</div>
            <div className="mt-2 text-xl font-bold text-slate-900">{client.company_name || client.name}</div>
            <div className="mt-3 text-sm text-slate-600">Contact person: {client.contact_person}</div>
            <div className="text-sm text-slate-600">Phone: {client.phone}</div>
            <div className="text-sm text-slate-600">Email: {client.email}</div>
            <div className="text-sm text-slate-600">Address: {client.address}</div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); put('/portal/profile'); }} className="rounded-2xl bg-slate-50 p-5">
            <div className="grid gap-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Contact person</label>
                <input value={data.contact_person} onChange={(e) => setData('contact_person', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Phone</label>
                <input value={data.phone} onChange={(e) => setData('phone', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Address</label>
                <input value={data.address} onChange={(e) => setData('address', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Project location</label>
                <input value={data.project_location} onChange={(e) => setData('project_location', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">New password</label>
                <input type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Confirm password</label>
                <input type="password" value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800" />
              </div>
              <button type="submit" disabled={processing} className="rounded-xl bg-[#f2b600] px-4 py-3 text-sm font-bold text-slate-950 hover:bg-[#e0a800] disabled:opacity-60">{processing ? 'Updating...' : 'Save changes'}</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
