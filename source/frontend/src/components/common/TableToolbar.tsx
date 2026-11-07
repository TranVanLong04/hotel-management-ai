import type { ReactNode } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { Button } from '@components/ui/Button';

interface TableToolbarProps {
  search?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  children?: ReactNode; // Slot cho dropdown filters
  hasActiveFilters?: boolean;
  onResetFilters?: () => void;
  actions?: ReactNode; // Slot cho buttons (Thêm mới, Export, ...)
}

export function TableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm nhanh...',
  children,
  hasActiveFilters = false,
  onResetFilters,
  actions,
}: TableToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Search & Filters */}
      <div className="flex flex-1 flex-wrap items-center gap-2.5">
        {onSearchChange !== undefined && (
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-xs text-gray-900 transition-colors placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            />
          </div>
        )}

        {children}

        {hasActiveFilters && onResetFilters && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="h-9 gap-1.5 px-2.5 text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            title="Đặt lại bộ lọc"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Xóa lọc</span>
          </Button>
        )}
      </div>

      {/* Action Buttons */}
      {actions && (
        <div className="flex shrink-0 items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

