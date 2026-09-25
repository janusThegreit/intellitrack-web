import React from 'react';
import { Link } from '@inertiajs/react';
import clsx from 'clsx';
import {
  Building2,
  MessageSquare,
  FileStack,
  FolderKanban,
  FileCheck,
  Send,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

interface Step {
  step: number;
  title: string;
  subtitle: string;
  member: string;
  href: string;
  icon: React.ReactNode;
}

const steps: Step[] = [
  {
    step: 1,
    title: 'Client Management',
    subtitle: 'Profiles & Accreditation',
    member: 'Berongoy',
    href: '/clients',
    icon: <Building2 className="w-4 h-4" />,
  },
  {
    step: 2,
    title: 'CRM & Inquiries',
    subtitle: 'Leads & Communications',
    member: 'Reginaldo',
    href: '/inquiries',
    icon: <MessageSquare className="w-4 h-4" />,
  },
  {
    step: 3,
    title: 'Rental Quotations',
    subtitle: 'Rates & Terms Approved',
    member: 'Runes & Reginaldo',
    href: '/quotations',
    icon: <FileStack className="w-4 h-4" />,
  },
  {
    step: 4,
    title: 'Project Management',
    subtitle: 'Site Specs & Hazards',
    member: 'Tinaja',
    href: '/projects',
    icon: <FolderKanban className="w-4 h-4" />,
  },
  {
    step: 5,
    title: 'Job Order Registration',
    subtitle: 'Official JO & Scope of Work',
    member: 'Camarig',
    href: '/job-orders',
    icon: <FileCheck className="w-4 h-4" />,
  },
];

interface Core1PipelineStepperProps {
  currentStep?: number;
  className?: string;
  showHandoffButton?: boolean;
  onHandoffClick?: () => void;
}

export const Core1PipelineStepper: React.FC<Core1PipelineStepperProps> = ({
  currentStep = 1,
  className,
  showHandoffButton = true,
  onHandoffClick,
}) => {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-border-default/80 bg-surface-card p-4 shadow-sm transition-all',
        className
      )}
    >
      <div className="flex flex-col gap-2 border-b border-border-default/60 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 items-center rounded-full bg-amber-500/10 px-2.5 text-[11px] font-bold text-amber-500 border border-amber-500/20 uppercase tracking-wider">
            Group #187
          </span>
          <h3 className="text-sm font-bold text-content-primary">
            Core Transaction 1: Sales, Customer, and Job Order Pipeline
          </h3>
        </div>
        <div className="text-xs text-content-muted flex items-center gap-1.5">
          <span>End-to-End Linear Workflow</span>
          <ChevronRight className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-semibold text-emerald-500">Core 2 Handoff</span>
        </div>
      </div>

      {/* Steps Flow */}
      <div className="mt-3.5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between overflow-x-auto pb-1">
        <div className="flex flex-1 items-center gap-1 sm:gap-2">
          {steps.map((item, idx) => {
            const isCompleted = item.step < currentStep;
            const isCurrent = item.step === currentStep;

            return (
              <React.Fragment key={item.step}>
                <Link
                  href={item.href}
                  className={clsx(
                    'group relative flex flex-1 min-w-[130px] sm:min-w-[160px] items-center gap-2.5 rounded-xl border p-2.5 transition-all select-none',
                    isCurrent
                      ? 'border-amber-500 bg-amber-500/10 shadow-sm'
                      : isCompleted
                      ? 'border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/70 hover:bg-emerald-500/10'
                      : 'border-border-default/70 bg-surface-app/40 hover:border-border-default hover:bg-surface-app'
                  )}
                >
                  <div
                    className={clsx(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-transform group-hover:scale-105',
                      isCurrent
                        ? 'bg-amber-500 text-white shadow-sm'
                        : isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-surface-card border border-border-default text-content-muted'
                    )}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : item.step}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p
                        className={clsx(
                          'truncate text-xs font-bold',
                          isCurrent
                            ? 'text-amber-500'
                            : isCompleted
                            ? 'text-emerald-500'
                            : 'text-content-primary'
                        )}
                      >
                        {item.title}
                      </p>
                    </div>
                    <p className="truncate text-[10px] text-content-muted">
                      {item.member} • {item.subtitle}
                    </p>
                  </div>
                </Link>

                {idx < steps.length - 1 && (
                  <ArrowRight
                    className={clsx(
                      'h-3.5 w-3.5 shrink-0 hidden sm:block',
                      isCompleted ? 'text-emerald-500' : 'text-content-muted/40'
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Handoff to Core 2 indicator / button */}
        {showHandoffButton && (
          <div className="shrink-0 pt-2 sm:pt-0 pl-1 border-t lg:border-t-0 lg:border-l border-border-default/60">
            <button
              type="button"
              onClick={onHandoffClick}
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm hover:from-emerald-500 hover:to-teal-500 transition-all cursor-pointer active:scale-95"
              title="Forward Registered Job Orders to Group 188 (Core 2: Operations & Dispatch)"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Forward to Core 2</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Core1PipelineStepper;
