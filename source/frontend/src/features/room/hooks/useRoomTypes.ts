import { useState, useEffect, useCallback } from 'react';
import { roomTypeApi } from '@/api/roomType.api';
import type { RoomType } from '@/types';

/**
 * Hook tải danh sách các loại phòng (để hiển thị trong dropdown bộ lọc)
 */
export function useRoomTypes() {
  const [data, setData] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoomTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await roomTypeApi.list({ limit: 100 });
      const items = Array.isArray(response.data) ? response.data : [];
      setData(items);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Không thể tải danh sách loại phòng';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadTypes = async () => {
      try {
        const response = await roomTypeApi.list({ limit: 100 });
        if (isMounted) {
          const items = Array.isArray(response.data) ? response.data : [];
          setData(items);
          setError(null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const errorMsg =
            err instanceof Error ? err.message : 'Không thể tải danh sách loại phòng';
          setError(errorMsg);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadTypes();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchRoomTypes,
  };
}
