import { FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Building2, Lock, Mail, MapPin, Phone, UserRound } from 'lucide-react';

export default function Register() {
  const { data, setData, post, processing, errors } = useForm({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    project_location: '',
    password: '',
    password_confirmation: '',
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    post('/register');
  };

  return (
    <>
      <Head title="Client Registration | IntelliTrack" />
      <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl shadow-slate-950/50">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
            <div className="bg-gradient-to-br from-[#f2b600]/20 via-slate-900 to-slate-950 p-8 lg:p-10">
              <img src="/images/intellitrack-logo-white.png" alt="IntelliTrack" className="h-9 w-auto" />
              <h1 className="mt-8 text-3xl font-black text-white">Register as a client</h1>
              <p className="mt-4 text-sm text-slate-300">
                Open a client account to submit inquiries, view quotations, and track your project-related records in the client portal.
              </p>
              <div className="mt-8 space-y-4 text-sm text-slate-200">
                <div className="flex items-center gap-3"><Building2 className="h-4 w-4 text-[#f2b600]" /> Business profile setup</div>
                <div className="flex items-center gap-3"><UserRound className="h-4 w-4 text-[#f2b600]" /> Contact person and company details</div>
                <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-[#f2b600]" /> Access to your inquiry and quotation history</div>
              </div>
              <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-950/40 p-4 text-xs text-slate-300">
                Internal employees and managers must continue using the enterprise sign-in and must not self-register through this form.
              </div>
            </div>

            <div className="p-6 sm:p-8 lg:p-10">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Create your account</h2>
                <Link href="/login" className="inline-flex items-center gap-2 text-sm text-[#f2b600] hover:text-amber-300"><ArrowLeft className="h-4 w-4" /> Back to login</Link>
              </div>

              <form onSubmit={submit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Company name</label>
                    <input value={data.company_name} onChange={(e) => setData('company_name', e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none ring-0 transition focus:border-[#f2b600]" placeholder="Alibaton Project Partners" />
                    {errors.company_name && <div className="mt-1 text-xs text-rose-400">{errors.company_name}</div>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Contact person</label>
                    <input value={data.contact_person} onChange={(e) => setData('contact_person', e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-[#f2b600]" placeholder="Jane Dela Cruz" />
                    {errors.contact_person && <div className="mt-1 text-xs text-rose-400">{errors.contact_person}</div>}
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Email</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                      <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-3 text-sm text-white outline-none transition focus:border-[#f2b600]" placeholder="name@example.com" />
                    </div>
                    {errors.email && <div className="mt-1 text-xs text-rose-400">{errors.email}</div>}
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Phone</label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                      <input value={data.phone} onChange={(e) => setData('phone', e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-3 text-sm text-white outline-none transition focus:border-[#f2b600]" placeholder="0917 000 0000" />
                    </div>
                    {errors.phone && <div className="mt-1 text-xs text-rose-400">{errors.phone}</div>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Business address</label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                      <input value={data.address} onChange={(e) => setData('address', e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-3 text-sm text-white outline-none transition focus:border-[#f2b600]" placeholder="123 Aurora Blvd, Quezon City" />
                    </div>
                    {errors.address && <div className="mt-1 text-xs text-rose-400">{errors.address}</div>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Project location (optional)</label>
                    <input value={data.project_location} onChange={(e) => setData('project_location', e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-[#f2b600]" placeholder="Taguig, Cebu, Davao" />
                    {errors.project_location && <div className="mt-1 text-xs text-rose-400">{errors.project_location}</div>}
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Password</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                      <input type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-3 text-sm text-white outline-none transition focus:border-[#f2b600]" placeholder="••••••••" />
                    </div>
                    {errors.password && <div className="mt-1 text-xs text-rose-400">{errors.password}</div>}
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Confirm password</label>
                    <input type="password" value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-[#f2b600]" placeholder="••••••••" />
                  </div>
                </div>

                <button type="submit" disabled={processing} className="w-full rounded-xl bg-[#f2b600] px-5 py-3 font-bold text-slate-950 transition hover:bg-[#e0a800] disabled:opacity-60">
                  {processing ? 'Creating account...' : 'Create client account'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
