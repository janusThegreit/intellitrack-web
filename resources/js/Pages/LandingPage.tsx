import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Building2, CheckCircle2, ClipboardCheck, ContactRound, HardHat, Phone, ShieldCheck, Truck } from 'lucide-react';

const services = [
  'Equipment rental and crane solutions',
  'Project-based technical support',
  'Quotation and job order coordination',
  'Site-ready operations and project updates',
];

const steps = [
  { title: 'Submit inquiry', description: 'Share your project requirements and preferred equipment or services.' },
  { title: 'Review proposal', description: 'Our sales team reviews your inquiry and prepares a suitable quotation.' },
  { title: 'Proceed with operations', description: 'Approved work moves into job order, rental, and project coordination.' },
];

const stats = [
  { label: 'Operations coverage', value: 'Nationwide' },
  { label: 'Rental support', value: '24/7' },
  { label: 'Project focus', value: 'Heavy Lift' },
];

export default function LandingPage() {
  return (
    <>
      <Head title="IntelliTrack | Construction & Client Portal" />
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <img src="/images/intellitrack-logo-white.png" alt="IntelliTrack" className="h-8 w-auto" />
            </div>
            <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
              <a href="#about" className="hover:text-white">About</a>
              <a href="#services" className="hover:text-white">Services</a>
              <a href="#process" className="hover:text-white">How it works</a>
              <a href="#contact" className="hover:text-white">Contact</a>
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/login" className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white">
                Login
              </Link>
              <Link href="/register" className="rounded-full bg-[#f2b600] px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-[#e0a800]">
                Sign up as client
              </Link>
            </div>
          </div>
        </header>

        <main>
          <section className="relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(242,182,0,0.2),_transparent_30%),linear-gradient(120deg,_rgba(2,6,23,1)_0%,_rgba(15,23,42,1)_40%,_rgba(17,24,39,1)_100%)]" />
            <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
                  <HardHat className="h-3.5 w-3.5" />
                  Alibaton Construction / IntelliTrack
                </div>
                <h1 className="mt-8 max-w-2xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Safer equipment, smarter project coordination, and faster client response.
                </h1>
                <p className="mt-6 max-w-xl text-lg text-slate-300">
                  IntelliTrack brings project requirements, quotations, equipment rental, job orders, and progress updates into one operational workflow for our clients and internal teams.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link href="/register" className="inline-flex items-center gap-2 rounded-full bg-[#f2b600] px-6 py-3 font-semibold text-slate-950 transition hover:bg-[#e0a800]">
                    Register as client <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/login" className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-6 py-3 font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800">
                    Client login
                  </Link>
                </div>
                <div className="mt-10 grid max-w-xl grid-cols-3 gap-4">
                  {stats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                      <div className="text-xl font-black text-[#f2b600]">{stat.value}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/40">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Business snapshot</p>
                    <h2 className="mt-2 text-2xl font-bold text-white">Client support</h2>
                  </div>
                  <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
                    <ShieldCheck className="h-7 w-7" />
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  {services.map((service) => (
                    <div key={service} className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#f2b600]" />
                      <span className="text-sm text-slate-200">{service}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 border-t border-slate-800 pt-5 text-sm text-slate-300">
                  Need an internal account? Please sign in through the enterprise login and request access from the authorized IntelliTrack administrator.
                </div>
              </div>
            </div>
          </section>

          <section id="about" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f2b600]">About</p>
                <h2 className="mt-4 text-3xl font-bold text-white">Built for dependable construction operations.</h2>
                <p className="mt-5 text-slate-300">
                  We support construction, industrial, and project-based clients with responsive coordination, equipment deployment, rental tracking, and service visibility across project lifecycles.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <Building2 className="h-8 w-8 text-[#f2b600]" />
                  <div className="mt-4 text-2xl font-black text-white">60+</div>
                  <div className="text-sm text-slate-400">project engagements</div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <Truck className="h-8 w-8 text-[#f2b600]" />
                  <div className="mt-4 text-2xl font-black text-white">Fleet</div>
                  <div className="text-sm text-slate-400">rental support</div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <ClipboardCheck className="h-8 w-8 text-[#f2b600]" />
                  <div className="mt-4 text-2xl font-black text-white">QA</div>
                  <div className="text-sm text-slate-400">project oversight</div>
                </div>
              </div>
            </div>
          </section>

          <section id="services" className="bg-slate-900/80 py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f2b600]">Services</p>
              <h2 className="mt-4 text-3xl font-bold text-white">Project-ready solutions for your business.</h2>
              <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {[
                  ['Heavy equipment rental', 'Flexible rental packages with operational coordination and support.'],
                  ['Tower crane solutions', 'Lifting equipment support tailored to demanding construction requirements.'],
                  ['Quotation & inquiries', 'Structured commercial review through the sales and project workflow.'],
                  ['Client portal access', 'Track your inquiries, quotations, job orders, rentals, and project status.'],
                ].map(([title, description]) => (
                  <div key={title} className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
                    <div className="mb-4 inline-flex rounded-xl bg-amber-400/10 p-3 text-[#f2b600]">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">{title}</h3>
                    <p className="mt-3 text-sm text-slate-300">{description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="process" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f2b600]">How it works</p>
            <h2 className="mt-4 text-3xl font-bold text-white">A clear client workflow.</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {steps.map((step, index) => (
                <div key={step.title} className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#f2b600] font-black text-slate-950">0{index + 1}</div>
                  <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                  <p className="mt-3 text-sm text-slate-300">{step.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="contact" className="border-t border-slate-800 bg-slate-900/70 py-20">
            <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f2b600]">Contact</p>
                <h2 className="mt-4 text-3xl font-bold text-white">Talk to the IntelliTrack team.</h2>
                <div className="mt-6 space-y-4 text-slate-300">
                  <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-[#f2b600]" /> +63 (2) 8888-0000</div>
                  <div className="flex items-center gap-3"><ContactRound className="h-4 w-4 text-[#f2b600]" /> support@alibaton.com.ph</div>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-slate-300">
                For client and project service requests, please register for a client account and submit your inquiry through the portal. Internal personnel should continue using the enterprise login for authorized IntelliTrack access.
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
