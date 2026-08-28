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
    primary: 'bg-blue-50 text-brand',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    error: 'bg-red-50 text-red-600',
    neutral: 'bg-surface-input text-content-secondary',
  };

  return (
    <div className="rounded-xl border border-border-default bg-surface-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="mb-2 text-sm text-content-secondary">{title}</p>
          {loading ? (
            <div className="mt-2">
              <div className="h-8 w-24 animate-pulse rounded bg-surface-input" />
            </div>
          ) : (
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold tracking-tight text-content-primary">{value}</p>
              {unit && <p className="text-sm text-content-secondary">{unit}</p>}
            </div>
          )}

          {change && (
            <div className="mt-3 flex items-center gap-1">
              <span
                className={clsx( 'text-sm font-medium',
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
              <span className="text-xs text-content-secondary">vs last month</span>
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
