import { useState, useCallback } from 'react';
import { bookingApi } from '@/api/booking.api';
import { getErrorMessage, getErrorCode } from '@utils/errorHandler';
import type { Booking, CreateBookingPayload } from '@/types';

interface UseCreateBookingResult {
  createBooking: (payload: CreateBookingPayload) => Promise<Booking>;
  loading: boolean;
  error: string | null;
  errorCode: string | null;
  resetError: () => void;
}

/**
 * Hook xử lý tạo mới đơn đặt phòng và quản lý trạng thái/mã lỗi tương ứng
 */
export function useCreateBooking(): UseCreateBookingResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const resetError = useCallback(() => {
    setError(null);
    setErrorCode(null);
  }, []);

  const createBooking = useCallback(async (payload: CreateBookingPayload): Promise<Booking> => {
    setLoading(true);
    setError(null);
    setErrorCode(null);

    try {
      const response = await bookingApi.create(payload);
      return response.data;
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Đặt phòng thất bại, vui lòng thử lại');
      const code = getErrorCode(err) ?? null;

      setError(msg);
      setErrorCode(code);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createBooking,
    loading,
    error,
    errorCode,
    resetError,
  };
}
