import type { ReactNode } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { Pagination } from '@components/ui/Pagination';
import { EmptyState } from './EmptyState';
import type { Column, SortState } from '@/types';

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  rowKey: (row: T) => string;
  sort?: SortState;
  onSort?: (columnKey: string) => void;
  emptyState?: ReactNode;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    total?: number;
  };
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  rowKey,
  sort,
  onSort,
  emptyState,
  pagination,
}: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="relative overflow-x-auto">
        <table className="w-full text-left text-xs">
          {/* Table Header */}
          <thead className="border-b border-gray-200/80 bg-gray-50/75 text-gray-500 uppercase tracking-wider dark:border-gray-800 dark:bg-gray-950/50 dark:text-gray-400">
            <tr>
              {columns.map((col) => {
                const isSorted = sort?.column === col.key;
                const isAsc = isSorted && sort?.order === 'asc';

                return (
                  <th
                    key={col.key}
                    scope="col"
                    style={{ width: col.width }}
                    className={`px-4 py-3.5 font-semibold ${
                      col.align === 'center'
                        ? 'text-center'
                        : col.align === 'right'
                        ? 'text-right'
                        : 'text-left'
                    } ${col.sortable ? 'cursor-pointer select-none hover:text-gray-900 dark:hover:text-white' : ''}`}
                    onClick={() => {
                      if (col.sortable && onSort) {
                        onSort(col.key);
                      }
                    }}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        col.align === 'center'
                          ? 'justify-center'
                          : col.align === 'right'
                          ? 'justify-end'
                          : 'justify-start'
                      }`}
                    >
                      <span>{col.label}</span>
                      {col.sortable && (
                        <span className="text-gray-400">
                          {isSorted ? (
                            isAsc ? (
                              <ArrowUp className="h-3 w-3 text-primary-600 dark:text-primary-400" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-primary-600 dark:text-primary-400" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin text-primary-600 dark:text-primary-400" />
                    <span className="text-xs">Đang tải dữ liệu...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-8">
                  {emptyState ?? (
                    <EmptyState
                      title="Không có dữ liệu"
                      description="Chưa có dữ liệu nào phù hợp với bộ lọc hiện tại."
                    />
                  )}
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const key = rowKey(row);
                return (
                  <tr
                    key={key}
                    className="transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3.5 text-gray-700 dark:text-gray-300 ${
                          col.align === 'center'
                            ? 'text-center'
                            : col.align === 'right'
                            ? 'text-right'
                            : 'text-left'
                        }`}
                      >
                        {col.render
                          ? col.render(row)
                          : ((row as Record<string, unknown>)[col.key] as ReactNode) ?? '—'}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200/80 px-4 py-3.5 sm:flex-row dark:border-gray-800">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {pagination.total !== undefined && (
              <span>
                Tổng cộng <strong className="font-semibold text-gray-900 dark:text-white">{pagination.total}</strong> kết quả
              </span>
            )}
          </div>
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.onPageChange}
          />
        </div>
      )}
    </div>
  );
}

