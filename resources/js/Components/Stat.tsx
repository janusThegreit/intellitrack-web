import React from 'react';
import clsx from 'clsx';

interface StatProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
}

const Stat = ({
  title,
  value,
  unit,
  icon,
  change,
  loading = false,
  color = 'primary',
}: StatProps) => {
  const colorClasses = {
    primary: 'bg-blue-50 text-blue-600',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    error: 'bg-red-50 text-red-600',
    neutral: 'bg-slate-100 text-slate-600',
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="mb-2 text-sm text-slate-500">{title}</p>
          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded bg-slate-200" />
          ) : (
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
              {unit && <p className="text-sm text-slate-500">{unit}</p>}
            </div>
          )}

          {change && (
            <div className="mt-3 flex items-center gap-1">
              <span
                className={clsx(
                  'text-sm font-medium',
                  change.type === 'increase'
                    ? 'text-success-600'
                    : change.type === 'decrease'
                    ? 'text-error-600'
                    : 'text-neutral-600'
                )}
              >
                {change.type === 'increase' && '+'}
                {change.value}%
              </span>
              <span className="text-xs text-slate-500">vs last month</span>
            </div>
          )}
        </div>

        {icon && (
          <div className={clsx('rounded-xl p-2.5', colorClasses[color])}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default Stat;
