import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { bookingApi } from '@/api/booking.api';
import { getErrorMessage } from '@utils/errorHandler';
import type { PaymentGateway } from '@/types';

interface UseCreatePaymentResult {
  initiatePayment: (bookingId: string, gateway: PaymentGateway) => Promise<void>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook khởi tạo thanh toán trực tuyến và điều hướng sang trang thanh toán của MoMo hoặc VNPay
 */
export function useCreatePayment(): UseCreatePaymentResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiatePayment = useCallback(
    async (bookingId: string, gateway: PaymentGateway) => {
      setLoading(true);
      setError(null);

      try {
        const response = await bookingApi.createPayment({
          booking_id: bookingId,
          gateway,
        });

        const data = response.data;

        // Nếu MoMo -> Chuyển hướng sang trang thanh toán MoMo
        if (gateway === 'momo' && data.payUrl) {
          window.location.href = data.payUrl;
          return;
        }

        // Nếu VNPay -> Chuyển hướng sang trang thanh toán VNPay
        if (gateway === 'vnpay' && data.paymentUrl) {
          window.location.href = data.paymentUrl;
          return;
        }

        throw new Error('Không nhận được liên kết thanh toán từ cổng thanh toán');
      } catch (err: unknown) {
        const msg = getErrorMessage(err, 'Không thể khởi tạo thanh toán trực tuyến');
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    initiatePayment,
    loading,
    error,
  };
}
