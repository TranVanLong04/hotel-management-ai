import { useState, useEffect, useCallback } from 'react';
import { bookingApi } from '@/api/booking.api';
import type { Booking, BookingFilterParams } from '@/types';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Hook quản lý việc tải danh sách booking của khách hàng kèm bộ lọc và phân trang
 * @param params Bộ lọc: status, page, limit, search...
 */
export function useMyBookings(params?: BookingFilterParams) {
  const [data, setData] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chuỗi hóa params để theo dõi dependency trong useEffect
  const paramsString = JSON.stringify(params);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await bookingApi.list(params);
      setData(response.data);
      setPagination(response.pagination);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Không thể tải danh sách đơn đặt phòng';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsString]);

  useEffect(() => {
    let isMounted = true;

    const loadBookings = async () => {
      try {
        const response = await bookingApi.list(params);
        if (isMounted) {
          setData(response.data);
          setPagination(response.pagination);
          setError(null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const errorMsg =
            err instanceof Error ? err.message : 'Không thể tải danh sách đơn đặt phòng';
          setError(errorMsg);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadBookings();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsString]);

  return {
    data,
    pagination,
    loading,
    error,
    refetch: fetchBookings,
  };
}
