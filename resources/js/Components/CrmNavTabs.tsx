import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
  Users,
  MessageSquare,
  PhoneCall,
  Mail,
  FileStack,
  MessageSquareQuote,
} from 'lucide-react';
import clsx from 'clsx';

interface CrmNavTabsProps {
  actionButton?: React.ReactNode;
}

export const CrmNavTabs: React.FC<CrmNavTabsProps> = ({ actionButton }) => {
  const { url } = usePage();
  const currentPath = url || window.location.pathname;

  const tabs = [
    {
      label: 'Customers',
      href: '/customers',
      icon: <Users className="h-4 w-4" />,
      active: currentPath === '/customers' || currentPath === '/crm/customers' || currentPath.startsWith('/customers/'),
    },
    {
      label: 'Inquiries',
      href: '/inquiries',
      icon: <MessageSquare className="h-4 w-4" />,
      active: currentPath === '/inquiries' || currentPath === '/crm' || currentPath === '/crm/inquiries' || currentPath.startsWith('/inquiries/'),
    },
    {
      label: 'Follow-Ups',
      href: '/crm/follow-ups',
      icon: <PhoneCall className="h-4 w-4" />,
      active: currentPath === '/crm/follow-ups' || currentPath.startsWith('/crm/follow-ups/'),
    },
    {
      label: 'Communications',
      href: '/crm/communications',
      icon: <Mail className="h-4 w-4" />,
      active: currentPath === '/crm/communications' || currentPath.startsWith('/crm/communications/'),
    },
    {
      label: 'Quotations',
      href: '/quotations',
      icon: <FileStack className="h-4 w-4" />,
      active: currentPath === '/quotations' || currentPath === '/crm/quotations' || currentPath.startsWith('/quotations/'),
    },
    {
      label: 'Feedback',
      href: '/crm/feedback',
      icon: <MessageSquareQuote className="h-4 w-4" />,
      active: currentPath === '/crm/feedback' || currentPath.startsWith('/crm/feedback/'),
    },
  ];

  return (
    <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-default pb-4">
      {/* Navigation Pills */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-surface-card/70 border border-border-default shadow-sm backdrop-blur-md">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 select-none',
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

export default CrmNavTabs;
