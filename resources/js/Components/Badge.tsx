import React from 'react';
import clsx from 'clsx';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'info' | 'brand';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  dot?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ 
    className, 
    variant = 'neutral', 
    size = 'md',
    children,
    dot = false,
    ...props 
  }, ref) => {
    const variants = {
      primary: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
      success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
      warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
      error: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
      neutral: 'bg-slate-500/10 text-content-secondary border border-border-default/60',
      info: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20',
      brand: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30',
    };

    const sizes = {
      sm: 'px-2.5 py-0.5 text-[11px] font-semibold',
      md: 'px-3 py-1 text-xs font-semibold',
      lg: 'px-3.5 py-1.5 text-sm font-semibold',
    };

    const dotColors = {
      primary: 'bg-blue-500 shadow-sm shadow-blue-500/50',
      success: 'bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse',
      warning: 'bg-amber-500 shadow-sm shadow-amber-500/50',
      error: 'bg-rose-500 shadow-sm shadow-rose-500/50',
      neutral: 'bg-slate-400',
      info: 'bg-cyan-500 shadow-sm shadow-cyan-500/50',
      brand: 'bg-amber-400 shadow-sm shadow-amber-400/50 animate-pulse',
    };

    return (
      <span
        ref={ref}
        className={clsx(
          'inline-flex items-center gap-1.5 rounded-full backdrop-blur-sm transition-all duration-200 select-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {dot && <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

interface StatusBadgeProps {
  status: string;
  label?: string;
}

const getStatusConfig = (status: string) => {
  const statusMap: Record<string, { variant: NonNullable<BadgeProps['variant']>; label: string }> = {
    'active': { variant: 'success', label: 'Active' },
    'inactive': { variant: 'neutral', label: 'Inactive' },
    'suspended': { variant: 'error', label: 'Suspended' },
    'pending': { variant: 'warning', label: 'Pending' },
    'submitted': { variant: 'info', label: 'Submitted' },
    'under_review': { variant: 'warning', label: 'Under Review' },
    'approved': { variant: 'success', label: 'Approved' },
    'revision_requested': { variant: 'warning', label: 'Revision Requested' },
    'sent': { variant: 'primary', label: 'Sent' },
    'accepted': { variant: 'success', label: 'Accepted' },
    'rejected': { variant: 'error', label: 'Rejected' },
    'in-progress': { variant: 'primary', label: 'In Progress' },
    'completed': { variant: 'success', label: 'Completed' },
    'cancelled': { variant: 'error', label: 'Cancelled' },
    'on-hold': { variant: 'warning', label: 'On Hold' },
    'available': { variant: 'success', label: 'Available' },
    'rented': { variant: 'brand', label: 'Rented' },
    'maintenance': { variant: 'warning', label: 'Maintenance' },
    'retired': { variant: 'neutral', label: 'Retired' },
    'planning': { variant: 'primary', label: 'Planning' },
    'draft': { variant: 'neutral', label: 'Draft' },
    'new': { variant: 'info', label: 'New' },
    'contacted': { variant: 'primary', label: 'Contacted' },
    'qualified': { variant: 'brand', label: 'Qualified' },
    'converted': { variant: 'success', label: 'Converted' },
    'closed_lost': { variant: 'error', label: 'Closed Lost' },
  };

  const key = (status || '').toLowerCase().replace(/[\s-]/g, '_');
  return statusMap[key] || { variant: 'neutral', label: status || 'Unknown' };
};

const StatusBadge = ({ status, label }: StatusBadgeProps) => {
  const config = getStatusConfig(status);
  return (
    <Badge variant={config.variant} size="sm" dot>
      {label || config.label}
    </Badge>
  );
};

export { Badge, StatusBadge };
export default Badge;
