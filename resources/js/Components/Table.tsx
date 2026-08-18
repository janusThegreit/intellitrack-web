import React from 'react';
import clsx from 'clsx';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
  width?: string;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  sortBy?: keyof T;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: keyof T, order: 'asc' | 'desc') => void;
  onRowClick?: (row: T) => void;
  rowKey?: keyof T;
  hoverable?: boolean;
  striped?: boolean;
  compact?: boolean;
}

const Table = React.forwardRef<HTMLDivElement, TableProps<any>>(
  ({
    columns,
    data,
    loading = false,
    error = null,
    empty = false,
    emptyMessage = 'No data found',
    sortBy,
    sortOrder = 'asc',
    onSort,
    onRowClick,
    rowKey = 'id',
    hoverable = true,
    striped = true,
    compact = false,
  }, ref) => {
    const handleSort = (column: any) => {
      if (!column.sortable || !onSort) return;
      
      const newOrder = sortBy === column.key && sortOrder === 'asc' ? 'desc' : 'asc';
      onSort(column.key, newOrder);
    };

    const renderSortIcon = (column: any) => {
      if (sortBy !== column.key) return null;
      return sortOrder === 'asc' ? (
        <ChevronUp className="w-4 h-4 inline ml-1" />
      ) : (
        <ChevronDown className="w-4 h-4 inline ml-1" />
      );
    };

    return (
      <div ref={ref} className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-white/10">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200 dark:border-white/10 dark:bg-[#202020]">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  onClick={() => handleSort(column)}
                  className={clsx(
                    'px-6 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-200',
                    column.sortable && 'cursor-pointer hover:bg-neutral-100 dark:hover:bg-white/8',
                    column.className
                  )}
                  style={column.width ? { width: column.width } : undefined}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && renderSortIcon(column)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center">
                  <div className="flex justify-center items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-neutral-600 dark:text-neutral-400">Loading...</span>
                  </div>
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center">
                  <p className="text-error-600">{error}</p>
                </td>
              </tr>
            )}
            {!loading && !error && (data.length === 0 || empty) && (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <p className="text-neutral-500 dark:text-neutral-400">{emptyMessage}</p>
                </td>
              </tr>
            )}
            {!loading && !error && data.length > 0 && data.map((row, idx) => (
              <tr
                key={String(row[rowKey as keyof typeof row] || idx)}
                onClick={() => onRowClick?.(row)}
                className={clsx(
                  'border-b border-neutral-200 transition-colors dark:border-white/8',
                  striped && idx % 2 === 0 && 'bg-neutral-50 dark:bg-white/3',
                  hoverable && 'hover:bg-primary-50 dark:hover:bg-white/8 cursor-pointer'
                )}
              >
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className={clsx(
                      'px-6 text-sm text-neutral-700 dark:text-neutral-300',
                      compact ? 'py-2' : 'py-4',
                      column.className
                    )}
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : String(row[column.key] ?? '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
);

Table.displayName = 'Table';

export default Table;
