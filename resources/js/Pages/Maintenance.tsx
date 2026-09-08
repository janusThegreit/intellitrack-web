import { Head, Link } from '@inertiajs/react';
import { Wrench, ArrowLeft, Shield } from 'lucide-react';

interface MaintenanceProps {
  custom_message?: string;
}

export default function Maintenance({ custom_message }: MaintenanceProps) {
  const displayMessage =
    custom_message ||
    'IntelliTrack is currently undergoing scheduled infrastructure maintenance to improve service performance, reliability, and security.';

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white px-4 overflow-hidden">
      <Head title="System Under Scheduled Maintenance | IntelliTrack" />

      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-amber-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-indigo-500/10 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-lg text-center">
        {/* Brand Logo */}
        <div className="mb-8 flex justify-center">
          <img
            src="/images/intellitrack-logo-white.png"
            alt="IntelliTrack"
            className="h-8 w-auto object-contain"
          />
        </div>

        {/* Maintenance Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-xl shadow-amber-500/5">
          <Wrench className="h-9 w-9 animate-pulse" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20 mb-3">
          <Shield className="w-3.5 h-3.5" /> Maintenance Mode Active
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
          System Maintenance in Progress
        </h1>

        <p className="mt-4 text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
          {displayMessage}
        </p>

        <div className="mt-8 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl shadow-2xl text-left space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-2 w-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0 animate-ping" />
            <p className="text-xs text-slate-300 leading-relaxed">
              Our core infrastructure and database services are currently undergoing maintenance. Access is temporarily restricted to system administrators.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800/70 flex items-center justify-between text-xs">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Administrator Sign In
            </Link>

            <Link
              href="/logout"
              method="post"
              as="button"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Sign out
            </Link>
          </div>
        </div>

        <p className="mt-10 text-xs text-slate-500 font-medium">
          &copy; {new Date().getFullYear()} IntelliTrack Enterprise. All rights reserved.
        </p>
      </div>
    </div>
  );
}
