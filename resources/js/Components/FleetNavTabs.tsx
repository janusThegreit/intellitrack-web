import { FC, ReactNode } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Truck, CalendarCheck, ClipboardList } from 'lucide-react';
import clsx from 'clsx';

interface FleetNavTabsProps {
  actionButton?: ReactNode;
}

export const FleetNavTabs: FC<FleetNavTabsProps> = ({ actionButton }) => {
  const { url } = usePage();
  const currentPath = url || window.location.pathname;

  const tabs = [
    {
      label: 'Fleet & Equipment',
      href: '/equipment',
      icon: <Truck className="h-4 w-4" />,
      active: currentPath === '/equipment' || currentPath === '/fleet' || currentPath.startsWith('/equipment/'),
      description: 'Heavy cranes, trucks & machinery assets'
    },
    {
      label: 'Active Rentals',
      href: '/rentals',
      icon: <CalendarCheck className="h-4 w-4" />,
      active: currentPath === '/rentals' || currentPath === '/fleet-rentals' || currentPath.startsWith('/rentals/'),
      description: 'Customer bookings & active deployments'
    },
    {
      label: 'Rental Requirements',
      href: '/rental-requirements',
      icon: <ClipboardList className="h-4 w-4" />,
      active: currentPath === '/rental-requirements' || currentPath.startsWith('/rental-requirements/'),
      description: 'Inquiry technical assessments'
    },
  ];

  return (
    <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-default pb-4">
      {/* Navigation Pills */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-surface-card/60 border border-border-default shadow-sm backdrop-blur-md">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 select-none',
              tab.active
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 shadow-md shadow-amber-500/20 font-bold'
                : 'text-content-secondary hover:text-content-primary hover:bg-surface-elevated/70'
            )}
          >
            <span className={clsx('shrink-0', tab.active ? 'text-neutral-950' : 'text-amber-500/80')}>
              {tab.icon}
            </span>
            <span>{tab.label}</span>
          </Link>
        ))}
      </div>

      {/* Right action button */}
      {actionButton && (
        <div className="shrink-0 flex items-center gap-2">
          {actionButton}
        </div>
      )}
    </div>
  );
};

export default FleetNavTabs;
