import React, { useState } from 'react';
import { EmptyState } from './EmptyState';
import { Button } from './Button';

export interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  format?: (value: any) => string;
  render?: (row: any) => React.ReactNode;
  width?: string;
}

export interface DataTableProps {
  columns: Column[];
  data: any[];
  isLoading?: boolean;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  onRowClick?: (row: any) => void;
  emptyState?: {
    title: string;
    description: string;
    action?: { label: string; onClick: () => void };
  };
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  isLoading = false,
  onSort,
  onRowClick,
  emptyState,
  pagination,
}) => {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortDirection(newDirection);
    onSort?.(key, newDirection);
  };

  const renderSortIcon = (columnKey: string) => {
    if (sortKey !== columnKey) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const renderSkeletonRows = () => {
    return Array.from({ length: 5 }).map((_, idx) => (
      <tr key={`skeleton-${idx}`} className="border-b border-gray-200">
        {columns.map((col) => (
          <td key={col.key} className="px-6 py-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
          </td>
        ))}
      </tr>
    ));
  };

  const renderPagination = () => {
    if (!pagination) return null;

    const { page, pageSize, total, onPageChange } = pagination;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);

    return (
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">{start}</span> to <span className="font-medium">{end}</span> of{' '}
          <span className="font-medium">{total}</span> results
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  if (!isLoading && data.length === 0 && emptyState) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <EmptyState
          title={emptyState.title}
          description={emptyState.description}
          action={
            emptyState.action && (
              <Button variant="primary" onClick={emptyState.action.onClick}>
                {emptyState.action.label}
              </Button>
            )
          }
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer select-none hover:bg-gray-100' : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && renderSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              renderSkeletonRows()
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className={`${
                    onRowClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''
                  }`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {column.render
                        ? column.render(row)
                        : column.format
                        ? column.format(row[column.key])
                        : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {renderPagination()}
    </div>
  );
};

// ponytail: Skip column resizing, bulk actions, row selection - add when needed
