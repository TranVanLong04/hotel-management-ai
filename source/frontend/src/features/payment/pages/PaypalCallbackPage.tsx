import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PaymentResultCard } from '../components/PaymentResultCard';
import { paymentApi } from '@/api/payment.api';
import { bookingApi } from '@/api/booking.api';

/**
 * Trang xử lý kết quả chuyển hướng từ cổng thanh toán PayPal (/payment/callback/paypal)
 */
export function PaypalCallbackPage() {
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [bookingId, setBookingId] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;

    const captureAndVerify = async () => {
      setLoading(true);

      const searchParams = new URLSearchParams(location.search);
      // PayPal return URL truyền token (chính là PayPal Order ID) và PayerID
      const token = searchParams.get('token');
      let resolvedBookingId = searchParams.get('bookingId') || undefined;

      if (!token) {
        if (isMounted) {
          setSuccess(false);
          setErrorMessage('Không tìm thấy token đơn hàng PayPal trong URL callback.');
          setLoading(false);
        }
        return;
      }

      let captureSuccess = false;
      let captureReason: string | undefined;

      try {
        const response = await paymentApi.capturePaypalPayment({
          orderId: token,
          bookingId: resolvedBookingId,
        });

        if (response.data) {
          const res = response.data;
          captureSuccess = Boolean(res.success);
          if (res.bookingId) {
            resolvedBookingId = res.bookingId;
          }
          captureReason = res.reason;
        }
      } catch (err: unknown) {
        captureSuccess = false;
        captureReason = err instanceof Error ? err.message : 'Không thể xác nhận giao dịch PayPal';
      }

      // Tra cứu trạng thái thực tế từ cơ sở dữ liệu nếu có resolvedBookingId
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
              toast.success('Thanh toán PayPal thành công! Đang chuyển sang đăng ký khuôn mặt...');
              setLoading(false);
              return;
            }
          }
        } catch {
          // Bỏ qua lỗi getById nếu có
        }
      }

      if (isMounted) {
        if (captureSuccess) {
          setSuccess(true);
          setBookingId(resolvedBookingId);
          toast.success('Thanh toán PayPal thành công! Đang chuyển sang đăng ký khuôn mặt...');
        } else {
          setSuccess(false);
          setBookingId(resolvedBookingId);
          setErrorMessage(captureReason || 'Giao dịch thanh toán PayPal không thành công hoặc bị hủy');
        }
        setLoading(false);
      }
    };

    captureAndVerify();

    return () => {
      isMounted = false;
    };
  }, [location.search]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <PaymentResultCard
        loading={loading}
        success={success}
        gateway="paypal"
        bookingId={bookingId}
        errorMessage={errorMessage}
      />
    </div>
  );
}

