import { useState, useEffect, useCallback } from 'react';
import { roomApi } from '@/api/room.api';
import type { Room, RoomFilterParams } from '@/types';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Hook quản lý việc fetch danh sách phòng kèm bộ lọc và phân trang
 * @param params Tham số lọc: room_type_id, status, floor, search, page, limit
 */
export function useRooms(params?: RoomFilterParams) {
  const [data, setData] = useState<Room[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chuỗi hóa params để so sánh dependency ổn định trong useEffect
  const paramsString = JSON.stringify(params);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await roomApi.list(params);
      setData(response.data);
      setPagination(response.pagination);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Không thể tải danh sách phòng';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsString]);

  useEffect(() => {
    let isMounted = true;

    const loadRooms = async () => {
      try {
        const response = await roomApi.list(params);
        if (isMounted) {
          setData(response.data);
          setPagination(response.pagination);
          setError(null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const errorMsg =
            err instanceof Error ? err.message : 'Không thể tải danh sách phòng';
          setError(errorMsg);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadRooms();

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
    refetch: fetchRooms,
  };
}
