import React from 'react';
import clsx from 'clsx';

interface AlibatonBrandProps {
  compact?: boolean;
  dark?: boolean;
  className?: string;
}

const AlibatonBrand = ({ compact = false, dark = false, className }: AlibatonBrandProps) => {
  return (
    <div className={clsx('flex items-center', className)} aria-label="Alibaton Construction Incorporated">
      <img
        src={compact ? '/images/alibaton-icon.svg' : '/images/alibaton-logo.svg'}
        alt="Alibaton Construction Incorporated"
        className={clsx(compact ? 'h-10 w-10 rounded-full' : 'h-16 w-auto', dark && !compact && 'border border-white/15')}
      />
    </div>
  );
};

export default AlibatonBrand;