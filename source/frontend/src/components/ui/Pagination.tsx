import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Component phân trang linh hoạt hỗ trợ chuyển trang,
 * tự động tính toán dải trang (range) và hỗ trợ Dark Mode
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}: PaginationProps) {
  // Nếu chỉ có 1 trang hoặc không có trang nào thì không cần render
  if (totalPages <= 1) {
    return null;
  }

  /**
   * Tạo danh sách số trang hiển thị (kèm dấu ...)
   */
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Luôn hiện trang 1
      pages.push(1);

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      if (start > 2) {
        pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push('...');
      }

      // Luôn hiện trang cuối
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <nav
      className={`flex items-center justify-center gap-1.5 ${className}`}
      aria-label="Phân trang"
    >
      {/* Nút trang trước */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200/80 bg-white text-gray-600 shadow-xs transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
        aria-label="Trang trước"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Danh sách các số trang */}
      {pages.map((page, index) => {
        if (typeof page === 'string') {
          return (
            <span
              key={`ellipsis-${index}`}
              className="flex h-9 w-9 items-center justify-center text-xs font-semibold text-gray-400 dark:text-gray-500"
            >
              ...
            </span>
          );
        }

        const isActive = page === currentPage;

        return (
          <button
            key={`page-${page}`}
            type="button"
            onClick={() => onPageChange(page)}
            className={`flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-xs font-semibold transition-all duration-200 ${
              isActive
                ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/30'
                : 'border border-gray-200/80 bg-white text-gray-700 shadow-xs hover:bg-gray-100 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            {page}
          </button>
        );
      })}

      {/* Nút trang kế tiếp */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200/80 bg-white text-gray-600 shadow-xs transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
        aria-label="Trang tiếp theo"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
