import React from 'react';
import clsx from 'clsx';
import { ChevronUp, ChevronDown, Inbox } from 'lucide-react';

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
  width?: string;
  stickyRight?: boolean;
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
    emptyMessage = 'No records found matching your criteria',
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
        <ChevronUp className="w-3.5 h-3.5 text-amber-500" />
      ) : (
        <ChevronDown className="w-3.5 h-3.5 text-amber-500" />
      );
    };

    return (
      <div ref={ref} className="overflow-hidden rounded-2xl border border-border-default/70 bg-surface-card/90 shadow-sm backdrop-blur-md transition-all">
        <div className="overflow-x-auto relative">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="bg-surface-app/90 backdrop-blur-sm">
              <tr>
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    onClick={() => handleSort(column)}
                    className={clsx(
                      compact ? 'px-3 py-2.5 text-[11px]' : 'px-4 py-3 text-xs',
                      'font-bold uppercase tracking-wider text-content-secondary select-none border-b border-border-subtle/80',
                      column.sortable && 'cursor-pointer hover:text-amber-500 transition-colors',
                      column.stickyRight && 'sticky right-0 z-20 bg-surface-card border-l border-border-default shadow-[-6px_0_12px_-2px_rgba(0,0,0,0.35)]',
                      column.className
                    )}
                    style={column.width ? { width: column.width } : undefined}
                  >
                    <div className="flex items-center gap-1.5">
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
                  <td colSpan={columns.length} className="px-6 py-16 text-center border-b border-border-subtle/60">
                    <div className="flex flex-col justify-center items-center gap-3">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent shadow-sm shadow-amber-500/30" />
                      <span className="text-xs font-medium text-content-secondary">Fetching real-time records...</span>
                    </div>
                  </td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center border-b border-border-subtle/60">
                    <p className="text-sm font-semibold text-rose-500">{error}</p>
                  </td>
                </tr>
              )}
              {!loading && !error && (data.length === 0 || empty) && (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-16 text-center border-b border-border-subtle/60">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-input border border-border-default text-content-secondary">
                        <Inbox className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-medium text-content-secondary">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && !error && data.length > 0 && data.map((row, idx) => (
                <tr
                  key={String(row[rowKey as keyof typeof row] || idx)}
                  onClick={() => onRowClick?.(row)}
                  className={clsx(
                    'group transition-colors duration-150',
                    striped && idx % 2 === 0 ? 'bg-surface-card' : 'bg-surface-app/40',
                    hoverable && 'cursor-pointer hover:bg-amber-500/5 dark:hover:bg-amber-500/10'
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={clsx(
                        compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm',
                        'text-content-primary border-b border-border-subtle/60',
                        column.stickyRight && clsx(
                          'sticky right-0 z-10 border-l border-border-default shadow-[-6px_0_12px_-2px_rgba(0,0,0,0.35)]',
                          striped && idx % 2 === 0 ? 'bg-surface-card' : 'bg-[#0e1626] dark:bg-[#0e1626]',
                          'group-hover:bg-amber-500/10'
                        ),
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
      </div>
    );
  }
);

Table.displayName = 'Table';

export default Table;
