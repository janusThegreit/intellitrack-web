import React from 'react';
import clsx from 'clsx';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

type AlertVariant = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  variant: AlertVariant;
  title?: string;
  message: string;
  onClose?: () => void;
  closeable?: boolean;
}

const Alert = ({
  variant,
  title,
  message,
  onClose,
  closeable = false,
}: AlertProps) => {
  const variants = {
    success: {
      bg: 'bg-success-50',
      border: 'border-success-200',
      icon: <CheckCircle className="w-5 h-5 text-success-600" />,
      text: 'text-success-800',
    },
    error: {
      bg: 'bg-error-50',
      border: 'border-error-200',
      icon: <AlertCircle className="w-5 h-5 text-error-600" />,
      text: 'text-error-800',
    },
    warning: {
      bg: 'bg-warning-50',
      border: 'border-warning-200',
      icon: <AlertCircle className="w-5 h-5 text-warning-600" />,
      text: 'text-warning-800',
    },
    info: {
      bg: 'bg-primary-50',
      border: 'border-primary-200',
      icon: <Info className="w-5 h-5 text-primary-600" />,
      text: 'text-primary-800',
    },
  };

  const config = variants[variant];

  return (
    <div
      className={clsx(
        'rounded-lg border p-4 flex gap-4',
        config.bg,
        config.border,
        config.text
      )}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
      <div className="flex-1">
        {title && <h3 className="font-semibold mb-1">{title}</h3>}
        <p className="text-sm">{message}</p>
      </div>
      {closeable && (
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 hover:bg-black hover:bg-opacity-10 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({
  currentPage,
  lastPage,
  perPage,
  total,
  onPageChange,
}: PaginationProps) => {
  const startItem = (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, total);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7;
    const halfVisible = Math.floor(maxVisible / 2);

    let start = Math.max(1, currentPage - halfVisible);
    let end = Math.min(lastPage, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < lastPage) {
      if (end < lastPage - 1) pages.push('...');
      pages.push(lastPage);
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200">
      <div className="text-sm text-neutral-600">
        Showing <span className="font-medium">{startItem}</span> to{' '}
        <span className="font-medium">{endItem}</span> of{' '}
        <span className="font-medium">{total}</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 border border-neutral-300 rounded-lg text-sm text-neutral-700 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>

        {getPageNumbers().map((page, idx) => (
          <React.Fragment key={idx}>
            {page === '...' ? (
              <span className="px-2 text-neutral-500">...</span>
            ) : (
              <button
                onClick={() => onPageChange(page as number)}
                className={clsx(
                  'px-3 py-1 border rounded-lg text-sm transition-colors',
                  page === currentPage
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                )}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === lastPage}
          className="px-3 py-1 border border-neutral-300 rounded-lg text-sm text-neutral-700 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export { Alert, Pagination };
