import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  highlight?: boolean;
  glass?: boolean;
  noPadding?: boolean;
  hoverEffect?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, highlight = false, glass = true, noPadding = false, hoverEffect = true, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(
        'rounded-2xl border transition-all duration-300',
        glass ? 'bg-surface-card/90 backdrop-blur-md border-border-default/70 shadow-sm' : 'bg-surface-card border-border-default shadow-sm',
        hoverEffect && 'hover:-translate-y-0.5 hover:shadow-lg hover:border-brand/40',
        highlight && 'border-brand/60 shadow-md ring-1 ring-brand/30',
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
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

const CardHeader = ({ title, subtitle, action, icon, children, className }: CardHeaderProps) => (
  <div className={clsx('mb-5 flex items-start justify-between border-b border-border-subtle/80 pb-4', className)}>
    <div className="flex items-center gap-3">
      {icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand border border-brand/20 shadow-sm">
          {icon}
        </div>
      )}
      <div className="flex-1">
        {children ? (
          children
        ) : (
          <>
            {title && <h3 className="text-base font-semibold tracking-tight text-content-primary">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-content-secondary">{subtitle}</p>}
          </>
        )}
      </div>
    </div>
    {action && <div className="ml-4 flex-shrink-0">{action}</div>}
  </div>
);

const CardBody = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={className}>{children}</div>
);

const CardFooter = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={clsx('mt-5 border-t border-border-subtle/80 pt-4 flex items-center justify-between', className)}>{children}</div>
);

export { Card, CardHeader, CardBody, CardFooter };
export default Card;
