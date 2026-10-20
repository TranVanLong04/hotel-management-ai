import { useState, useCallback } from 'react';
import axios from 'axios';
import { checkinApi, type VerifyCheckinResponse, type ManualCheckinPayload } from '@/api/checkin.api';
import type { Booking } from '@/types';
import toast from 'react-hot-toast';

export const MAX_ATTEMPTS = 3;

export interface VerifyResultState {
  success: boolean;
  data?: VerifyCheckinResponse;
  code?: string;
  message?: string;
  attempts: number;
  canRetry: boolean;
}

export function useCheckin() {
  const [verifying, setVerifying] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0);
  const [lastResult, setLastResult] = useState<VerifyCheckinResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Xác thực khuôn mặt qua AI Service
   */
  const verify = useCallback(
    async (bookingId: string, image: File | Blob): Promise<VerifyResultState> => {
      setVerifying(true);
      setError(null);

      try {
        const result = await checkinApi.verifyCheckin(bookingId, image);
        setVerifying(false);
        setLastResult(result);
        setAttempts(0);
        return {
          success: true,
          data: result,
          attempts: 0,
          canRetry: false,
        };
      } catch (err: unknown) {
        setVerifying(false);
        let errorCode = 'UNKNOWN_ERROR';
        let errorMessage = 'Xác thực khuôn mặt thất bại';

        if (axios.isAxiosError(err)) {
          const resData = err.response?.data as { error?: { code?: string; message?: string } } | undefined;
          errorCode = resData?.error?.code || err.code || 'API_ERROR';
          errorMessage = resData?.error?.message || err.message;
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }

        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);
        setError(errorMessage);

        const canRetry = nextAttempts < MAX_ATTEMPTS;

        return {
          success: false,
          code: errorCode,
          message: errorMessage,
          attempts: nextAttempts,
          canRetry,
        };
      }
    },
    [attempts]
  );

  /**
   * Xác nhận check-in qua giấy tờ trực tiếp (Bỏ qua AI)
   */
  const confirm = useCallback(async (bookingId: string): Promise<Booking> => {
    setVerifying(true);
    try {
      const updatedBooking = await checkinApi.confirmCheckin(bookingId);
      setVerifying(false);
      setAttempts(0);
      toast.success('Xác nhận Check-in thành công!');
      return updatedBooking;
    } catch (err) {
      setVerifying(false);
      throw err;
    }
  }, []);

  /**
   * Check-in thủ công (Security Event: ghi nhận CCCD & lý do)
   */
  const manual = useCallback(async (bookingId: string, data: ManualCheckinPayload): Promise<Booking> => {
    setVerifying(true);
    try {
      const updatedBooking = await checkinApi.manualCheckin(bookingId, data);
      setVerifying(false);
      setAttempts(0);
      toast.success('Check-in thủ công thành công!');
      return updatedBooking;
    } catch (err) {
      setVerifying(false);
      throw err;
    }
  }, []);

  /**
   * Reset trạng thái để tiếp tục phục vụ khách tiếp theo
   */
  const reset = useCallback(() => {
    setAttempts(0);
    setVerifying(false);
    setLastResult(null);
    setError(null);
  }, []);

  return {
    verifying,
    attempts,
    lastResult,
    error,
    maxAttempts: MAX_ATTEMPTS,
    canRetry: attempts < MAX_ATTEMPTS,
    verify,
    confirm,
    manual,
    reset,
  };
}
