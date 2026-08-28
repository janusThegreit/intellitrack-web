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
      className={clsx( 'rounded-xl border border-border-subtle bg-surface-card shadow-sm transition-shadow duration-200',
        highlight && 'border-brand shadow-md hover:shadow-lg',
        !noPadding && 'p-5',
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
  <div className="mb-4 flex items-start justify-between border-b border-border-subtle pb-4">
    <div className="flex-1">
      {children ? (
        children
      ) : (
        <>
          {title && <h3 className="text-base font-semibold text-content-primary">{title}</h3>}
          {subtitle && <p className="mt-1 text-sm text-content-secondary">{subtitle}</p>}
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
  <div className={clsx('border-t border-border-subtle pt-4', className)}>{children}</div>
);

export { Card, CardHeader, CardBody, CardFooter };
export default Card;
