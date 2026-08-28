import React from 'react';
import { AppLayout } from '../../Layouts/AppLayout';
import { History } from 'lucide-react';

export default function LogsIndex() {
  return (
    <AppLayout dark={true} showHeader={false}>
      {/* Page Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">System Logs</h1>
          <p className="mt-1 text-xs text-content-secondary">View system activity, audit trails, and error logs.</p>
        </div>
      </div>

      <div className="rounded-xl border border-border-subtle bg-surface-card shadow-lg p-10 text-center">
        <History className="mx-auto h-12 w-12 text-content-secondary opacity-50" />
        <h3 className="mt-4 text-lg font-medium text-white">Coming Soon</h3>
        <p className="mt-2 text-sm text-content-secondary">The System Logs module is currently under development.</p>
      </div>
    </AppLayout>
  );
}
