import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from './useDebounce';
import type { PaginatedResponse } from '@/types';

interface UseDataTableOptions<T, F> {
  fetchFn: (params: F & { page: number; limit: number; search?: string }) => Promise<PaginatedResponse<T>>;
  initialFilters?: F;
  initialPage?: number;
  initialLimit?: number;
  debounceMs?: number;
  dependencies?: unknown[];
}

export function useDataTable<T, F extends Record<string, unknown>>({
  fetchFn,
  initialFilters = {} as F,
  initialPage = 1,
  initialLimit = 10,
  debounceMs = 400,
  dependencies = [],
}: UseDataTableOptions<T, F>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState<number>(initialPage);
  const [limit, setLimit] = useState<number>(initialLimit);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [search, setSearch] = useState<string>('');
  const debouncedSearch = useDebounce(search, debounceMs);

  const [filters, setFilters] = useState<F>(initialFilters);
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Loại bỏ các key rỗng '', null, undefined để không vi phạm Zod schema backend
      const rawParams: Record<string, unknown> = {
        ...filters,
        page,
        limit,
        search: debouncedSearch.trim(),
      };

      const cleanParams: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(rawParams)) {
        if (val !== undefined && val !== null && val !== '') {
          cleanParams[key] = val;
        }
      }

      const response = await fetchFnRef.current(
        cleanParams as F & { page: number; limit: number; search?: string }
      );
      setData(response.data ?? []);
      if (response.pagination) {
        setTotal(response.pagination.total);
        setTotalPages(response.pagination.totalPages);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi tải dữ liệu bảng';
      setError(msg);
      setData([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page, limit, debouncedSearch, ...dependencies]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Khi search thay đổi thì reset về trang 1
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Cập nhật từng filter
  const updateFilter = useCallback(<K extends keyof F>(key: K, value: F[K]) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (value === undefined || value === null || (value as unknown) === '') {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
    setPage(1);
  }, []);

  // Thay thế toàn bộ filters
  const setAllFilters = useCallback((newFilters: F) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  // Reset toàn bộ bộ lọc
  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setSearch('');
    setPage(1);
  }, [initialFilters]);

  return {
    data,
    loading,
    error,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      setPage,
      setLimit,
    },
    search,
    setSearch,
    filters,
    updateFilter,
    setAllFilters,
    resetFilters,
    refetch: fetchData,
  };
}
