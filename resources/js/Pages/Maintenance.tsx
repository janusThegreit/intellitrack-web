import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Wrench } from 'lucide-react';

export default function Maintenance() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f0f11] text-white">
      <Head title="System Maintenance" />
      
      <div className="mx-auto max-w-md text-center px-4">
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-[#ffcc00]/10 border border-[#ffcc00]/20">
          <Wrench className="h-10 w-10 text-[#ffcc00]" />
        </div>
        
        <h1 className="mb-4 text-3xl font-bold tracking-tight">We'll be back soon!</h1>
        
        <p className="mb-8 text-lg text-zinc-400">
          IntelliTrack is currently undergoing scheduled maintenance to improve our services and reliability. We apologize for any inconvenience.
        </p>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-sm text-zinc-400 mb-4">
            If you need immediate assistance, please contact your system administrator or support team.
          </p>
          <div className="pt-2 border-t border-zinc-800/50">
            <Link 
              href="/logout" 
              method="post" 
              as="button"
              className="text-sm text-[#ffcc00] hover:text-[#ffdd44] font-medium transition"
            >
              Log out of current account
            </Link>
          </div>
        </div>

        <div className="mt-12 text-sm text-zinc-600 font-medium">
          &copy; {new Date().getFullYear()} IntelliTrack. All rights reserved.
        </div>
      </div>
    </div>
  );
}
