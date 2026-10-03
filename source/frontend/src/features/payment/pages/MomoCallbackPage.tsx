import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PaymentResultCard } from '../components/PaymentResultCard';
import { paymentApi } from '@/api/payment.api';
import { bookingApi } from '@/api/booking.api';

/**
 * Trang xử lý kết quả chuyển hướng từ cổng thanh toán MoMo (/payment/callback/momo)
 */
export function MomoCallbackPage() {
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [bookingId, setBookingId] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;

    const verifyPayment = async () => {
      setLoading(true);

      // 1. Trích xuất bookingId từ search params nếu có
      const searchParams = new URLSearchParams(location.search);
      let resolvedBookingId = searchParams.get('bookingId') || undefined;

      let verifySuccess = false;
      let verifyReason: string | undefined;

      // 2. Gọi API verify return từ MoMo
      try {
        const response = await paymentApi.verifyMomoReturn(location.search);
        if (response.data) {
          const res = response.data;
          verifySuccess = Boolean(res.success);
          if (res.bookingId) {
            resolvedBookingId = res.bookingId;
          }
          verifyReason = res.reason;
        }
      } catch (err: unknown) {
        verifySuccess = false;
        verifyReason = err instanceof Error ? err.message : 'Không thể xác thực giao dịch MoMo';
      }

      // 3. LUÔN tra cứu trạng thái thực tế từ cơ sở dữ liệu nếu có resolvedBookingId
      if (resolvedBookingId) {
        try {
          const bookingRes = await bookingApi.getById(resolvedBookingId);
          if (isMounted && bookingRes.data) {
            const booking = bookingRes.data;
            const isPaid =
              booking.status === 'pending' ||
              booking.status === 'confirmed' ||
              booking.status === 'checked_in';

            if (isPaid) {
              setSuccess(true);
              setBookingId(booking.id);
              toast.success('Thanh toán thành công! Đang chuyển sang đăng ký khuôn mặt...');
              setLoading(false);
              return;
            }
          }
        } catch {
          // Bỏ qua lỗi getById nếu có
        }
      }

      // 4. Nếu không thể lấy status từ DB hoặc đơn vẫn pending_payment
      if (isMounted) {
        if (verifySuccess) {
          setSuccess(true);
          setBookingId(resolvedBookingId);
          toast.success('Thanh toán thành công! Đang chuyển sang đăng ký khuôn mặt...');
        } else {
          setSuccess(false);
          setBookingId(resolvedBookingId);
          setErrorMessage(verifyReason || 'Giao dịch thanh toán MoMo không thành công');
        }
        setLoading(false);
      }
    };

    verifyPayment();

    return () => {
      isMounted = false;
    };
  }, [location.search]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <PaymentResultCard
        loading={loading}
        success={success}
        gateway="momo"
        bookingId={bookingId}
        errorMessage={errorMessage}
      />
    </div>
  );
}
