import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  highlight?: boolean;
  noPadding?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, highlight = false, noPadding = false, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(
        'bg-white rounded-xl border border-neutral-200 shadow-sm transition-all duration-200 dark:border-white/10 dark:bg-[#1b1b1b] dark:text-neutral-100',
        highlight && 'border-primary-300 shadow-md hover:shadow-lg',
        !noPadding && 'p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

Card.displayName = 'Card';

interface CardHeaderProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

const CardHeader = ({ title, subtitle, action, children }: CardHeaderProps) => (
  <div className="flex items-start justify-between mb-4 pb-4 border-b border-neutral-200 dark:border-white/10">
    <div className="flex-1">
      {children ? (
        children
      ) : (
        <>
          {title && <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{title}</h3>}
          {subtitle && <p className="text-sm text-neutral-500 mt-1 dark:text-neutral-400">{subtitle}</p>}
        </>
      )}
    </div>
    {action && <div className="ml-4 flex-shrink-0">{action}</div>}
  </div>
);

const CardBody = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={className}>{children}</div>
);

const CardFooter = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={clsx('pt-4 border-t border-neutral-200 dark:border-white/10', className)}>{children}</div>
);

export { Card, CardHeader, CardBody, CardFooter };
export default Card;
