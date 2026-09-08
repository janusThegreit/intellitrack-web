import React from 'react';
import clsx from 'clsx';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
    label?: string;
  };
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'brand';
  subtitle?: string;
}

const Stat = ({
  title,
  value,
  unit,
  icon,
  change,
  loading = false,
  color = 'brand',
  subtitle,
}: StatProps) => {
  const colorClasses = {
    brand: 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/25 shadow-sm shadow-amber-500/10',
    primary: 'bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/25 shadow-sm shadow-blue-500/10',
    success: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/25 shadow-sm shadow-emerald-500/10',
    warning: 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/25 shadow-sm shadow-amber-500/10',
    error: 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/25 shadow-sm shadow-rose-500/10',
    neutral: 'bg-slate-500/10 text-content-secondary border border-border-default/50',
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border-default/70 bg-surface-card/90 p-6 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl hover:shadow-brand/5">
      {/* Subtle background glow effect */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-brand/5 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-brand/10" />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-content-secondary">{title}</p>
          
          {loading ? (
            <div className="mt-3">
              <div className="h-8 w-28 animate-pulse rounded-lg bg-surface-input" />
            </div>
          ) : (
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-3xl font-extrabold tracking-tight text-content-primary transition-colors group-hover:text-amber-500 dark:group-hover:text-amber-400">
                {value}
              </p>
              {unit && <p className="text-xs font-medium text-content-secondary">{unit}</p>}
            </div>
          )}

          {change && (
            <div className="mt-3 flex items-center gap-1.5">
              <span
                className={clsx(
                  'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-bold',
                  change.type === 'increase'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : change.type === 'decrease'
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                    : 'bg-slate-500/15 text-content-secondary'
                )}
              >
                {change.type === 'increase' && <TrendingUp className="h-3 w-3" />}
                {change.type === 'decrease' && <TrendingDown className="h-3 w-3" />}
                {change.type === 'neutral' && <Minus className="h-3 w-3" />}
                {change.type === 'increase' && '+'}
                {change.value}%
              </span>
              <span className="text-[11px] text-content-secondary">{change.label || 'vs last period'}</span>
            </div>
          )}

          {subtitle && !change && (
            <p className="mt-2 text-xs text-content-secondary">{subtitle}</p>
          )}
        </div>

        {icon && (
          <div className={clsx('rounded-2xl p-3.5 transition-transform duration-300 group-hover:scale-110', colorClasses[color])}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default Stat;
