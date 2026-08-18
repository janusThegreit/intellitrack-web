import React from 'react';
import clsx from 'clsx';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'info';
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
      primary: 'bg-primary-100 text-primary-800 dark:bg-[#203354] dark:text-[#a9c9ff]',
      success: 'bg-success-100 text-success-800 dark:bg-[#163c2b] dark:text-[#9be6b8]',
      warning: 'bg-warning-100 text-warning-800 dark:bg-[#4a3a0d] dark:text-[#ffe071]',
      error: 'bg-error-100 text-error-800 dark:bg-[#4b2022] dark:text-[#ffb0b4]',
      neutral: 'bg-neutral-100 text-neutral-800 dark:bg-[#303030] dark:text-neutral-200',
      info: 'bg-primary-100 text-primary-800 dark:bg-[#203354] dark:text-[#a9c9ff]',
    };

    const sizes = {
      sm: 'px-2 py-1 text-xs font-medium',
      md: 'px-3 py-1 text-sm font-medium',
      lg: 'px-4 py-2 text-base font-medium',
    };

    const dotColors = {
      primary: 'bg-primary-500',
      success: 'bg-success-500',
      warning: 'bg-warning-500',
      error: 'bg-error-500',
      neutral: 'bg-neutral-400',
      info: 'bg-primary-500',
    };

    return (
      <span
        ref={ref}
        className={clsx(
          'inline-flex items-center gap-2 rounded-full font-medium transition-colors',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {dot && <span className={clsx('w-2 h-2 rounded-full', dotColors[variant])} />}
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
  const statusMap: Record<string, { variant: 'success' | 'warning' | 'error' | 'primary' | 'neutral'; label: string }> = {
    // Customer statuses
    'active': { variant: 'success', label: 'Active' },
    'inactive': { variant: 'neutral', label: 'Inactive' },
    'suspended': { variant: 'error', label: 'Suspended' },
    
    // Job Order statuses
    'pending': { variant: 'warning', label: 'Pending' },
    'approved': { variant: 'primary', label: 'Approved' },
    'in-progress': { variant: 'primary', label: 'In Progress' },
    'completed': { variant: 'success', label: 'Completed' },
    'cancelled': { variant: 'error', label: 'Cancelled' },
    'on-hold': { variant: 'warning', label: 'On Hold' },
    
    // Rental statuses
    'available': { variant: 'success', label: 'Available' },
    'rented': { variant: 'primary', label: 'Rented' },
    'maintenance': { variant: 'warning', label: 'Maintenance' },
    'retired': { variant: 'neutral', label: 'Retired' },
    
    // Project statuses
    'planning': { variant: 'primary', label: 'Planning' },
    'active': { variant: 'primary', label: 'Active' },
    'on-hold': { variant: 'warning', label: 'On Hold' },
    'completed': { variant: 'success', label: 'Completed' },
    'cancelled': { variant: 'error', label: 'Cancelled' },
    
    // Invoice statuses
    'draft': { variant: 'neutral', label: 'Draft' },
    'sent': { variant: 'primary', label: 'Sent' },
    'partially-paid': { variant: 'warning', label: 'Partially Paid' },
    'paid': { variant: 'success', label: 'Paid' },
    'overdue': { variant: 'error', label: 'Overdue' },
    'cancelled': { variant: 'error', label: 'Cancelled' },
    
    // Payment statuses
    'pending': { variant: 'warning', label: 'Pending' },
    'processing': { variant: 'primary', label: 'Processing' },
    'completed': { variant: 'success', label: 'Completed' },
    'failed': { variant: 'error', label: 'Failed' },
    'refunded': { variant: 'neutral', label: 'Refunded' },
  };

  return statusMap[status.toLowerCase()] || { variant: 'neutral', label: status };
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
