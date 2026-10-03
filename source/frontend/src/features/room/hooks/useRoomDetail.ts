import { useState, useEffect, useCallback } from 'react';
import { roomApi } from '@/api/room.api';
import type { Room } from '@/types';

/**
 * Hook tải thông tin chi tiết của một phòng theo ID
 * @param id UUID của phòng
 */
export function useRoomDetail(id: string | undefined) {
  const [data, setData] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoomDetail = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setError('Mã phòng không hợp lệ');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await roomApi.getById(id);
      const roomData = response.data;
      if (roomData) {
        roomData.room_type = roomData.room_type || roomData.room_types;
      }
      setData(roomData);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Không thể tải thông tin phòng';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let isMounted = true;

    const loadDetail = async () => {
      if (!id) {
        if (isMounted) {
          setLoading(false);
          setError('Mã phòng không hợp lệ');
        }
        return;
      }

      try {
        const response = await roomApi.getById(id);
        if (isMounted) {
          const roomData = response.data;
          if (roomData) {
            roomData.room_type = roomData.room_type || roomData.room_types;
          }
          setData(roomData);
          setError(null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const errorMsg =
            err instanceof Error ? err.message : 'Không thể tải thông tin phòng';
          setError(errorMsg);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDetail();

    return () => {
      isMounted = false;
    };
  }, [id]);

  return {
    data,
    loading,
    error,
    refetch: fetchRoomDetail,
  };
}
