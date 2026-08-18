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
    primary: 'bg-primary-50 text-primary-600 dark:bg-[#203354] dark:text-[#8cb9ff]',
    success: 'bg-success-50 text-success-600 dark:bg-[#163c2b] dark:text-[#8be2af]',
    warning: 'bg-warning-50 text-warning-600 dark:bg-[#4a3a0d] dark:text-[#ffd95a]',
    error: 'bg-error-50 text-error-600 dark:bg-[#4b2022] dark:text-[#ffa4a8]',
    neutral: 'bg-neutral-50 text-neutral-600 dark:bg-[#2b2b2b] dark:text-neutral-300',
  };

  return (
    <div className="border border-neutral-200 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-[#1b1b1b]">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="mb-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">{title}</p>
          {loading ? (
            <div className="h-8 bg-neutral-200 rounded animate-pulse w-24" />
          ) : (
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">{value}</p>
              {unit && <p className="text-sm text-neutral-500 dark:text-neutral-400">{unit}</p>}
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
              <span className="text-xs text-neutral-500">vs last month</span>
            </div>
          )}
        </div>

        {icon && (
          <div className={clsx('p-2.5', colorClasses[color])}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default Stat;
