import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, Sparkles, AlertCircle, ScanFace } from 'lucide-react';
import { PaymentMethodSelector } from '../components/PaymentMethodSelector';
import { PaymentSummary } from '../components/PaymentSummary';
import { Button } from '@components/ui/Button';
import { Loading } from '@components/feedback/Loading';
import { useCreatePayment } from '../hooks/useCreatePayment';
import { bookingApi } from '@/api/booking.api';
import { paymentApi } from '@/api/payment.api';
import { PATHS } from '@routes/paths';
import type { Booking, PaymentGateway } from '@/types';

/**
 * Trang Chọn cổng thanh toán trực tuyến (/payment/:bookingId)
 * Layout 2 cột: Cột trái chọn MoMo/VNPay + xác nhận, Cột phải tóm tắt chi phí Sticky
 */
export function PaymentPage() {
  const { bookingId } = useParams<{ bookingId: string }>();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [errorBooking, setErrorBooking] = useState<string | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>('momo');
  const [availableGateways, setAvailableGateways] = useState<string[]>(['momo']);

  const { initiatePayment, loading: paying } = useCreatePayment();

  // Tải danh sách cổng thanh toán khả dụng & chi tiết đơn đặt phòng
  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      // 1. Lấy danh sách cổng thanh toán khả dụng
      try {
        const gwRes = await paymentApi.getAvailableGateways();
        if (isMounted && gwRes.data) {
          const resData = gwRes.data;
          const list: string[] = [];
          if (resData.momo) list.push('momo');
          if (resData.vnpay) list.push('vnpay');

          const finalAvailable = list.length > 0 ? list : ['momo'];
          setAvailableGateways(finalAvailable);
          if (!finalAvailable.includes(selectedGateway)) {
            setSelectedGateway(finalAvailable[0] as PaymentGateway);
          }
        }
      } catch {
        // Fallback về MoMo nếu lỗi
        if (isMounted) {
          setAvailableGateways(['momo']);
        }
      }

      // 2. Lấy thông tin đơn đặt phòng
      if (!bookingId) {
        if (isMounted) {
          setLoadingBooking(false);
          setErrorBooking('Mã đơn đặt phòng không hợp lệ');
        }
        return;
      }

      setLoadingBooking(true);
      try {
        const response = await bookingApi.getById(bookingId);
        if (isMounted) {
          setBooking(response.data);
          setErrorBooking(null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Không thể tải thông tin đơn đặt phòng';
          setErrorBooking(msg);
        }
      } finally {
        if (isMounted) {
          setLoadingBooking(false);
        }
      }
    };

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  // Trạng thái Loading
  if (loadingBooking) {
    return (
      <div className="py-24">
        <Loading fullScreen={false} size="lg" />
      </div>
    );
  }

  // Trạng thái Lỗi hoặc Không tìm thấy đơn
  if (errorBooking || !booking) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center animate-fade-in">
        <div className="mb-4 inline-flex rounded-2xl bg-danger-50 p-4 text-danger-600 dark:bg-danger-950 dark:text-danger-400">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
          Không tìm thấy đơn đặt phòng
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {errorBooking ?? 'Đơn đặt phòng này không tồn tại hoặc bạn không có quyền truy cập.'}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to={PATHS.MY_BOOKINGS}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Xem đơn đặt phòng của tôi
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Nếu đơn đã thanh toán hoặc ở trạng thái khác 'pending_payment'
  if (booking.status !== 'pending_payment') {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center animate-fade-in">
        <div className="mb-4 inline-flex rounded-2xl bg-primary-50 p-4 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
          Đơn đặt phòng đã được xử lý
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Đơn đặt phòng <strong>{booking.booking_code}</strong> hiện ở trạng thái{' '}
          <strong className="text-primary-600 dark:text-primary-400">{booking.status}</strong> và không cần thanh toán thêm.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to={`${PATHS.FACE_REGISTER}?bookingId=${booking.id}`}>
            <Button variant="primary" size="md">
              <ScanFace className="mr-2 h-4 w-4" />
              Đăng ký nhận diện khuôn mặt
            </Button>
          </Link>
          <Link to={PATHS.MY_BOOKINGS}>
            <Button variant="outline" size="md">
              Xem đơn của tôi
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Xử lý xác nhận thanh toán
  const handleConfirmPayment = () => {
    if (bookingId && selectedGateway) {
      initiatePayment(bookingId, selectedGateway);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      {/* Nút quay lại */}
      <div>
        <Link
          to={PATHS.MY_BOOKINGS}
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-primary-600 transition-colors dark:text-gray-400 dark:hover:text-primary-400"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Về danh sách đặt phòng</span>
        </Link>
      </div>

      {/* Header trang */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
          Thanh toán đơn đặt phòng
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Vui lòng chọn cổng thanh toán trực tuyến để hoàn tất xác nhận đặt phòng.
        </p>
      </div>

      {/* Grid 2 cột */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* CỘT TRÁI: Chọn phương thức & Nút xác nhận (Chiếm 7 cột) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-card dark:border-gray-800 dark:bg-gray-850">
            <PaymentMethodSelector
              selectedGateway={selectedGateway}
              onSelect={setSelectedGateway}
              disabled={paying}
              availableGateways={availableGateways}
            />

            <div className="mt-8 border-t border-gray-100 pt-6 dark:border-gray-800">
              <Button
                variant="primary"
                size="lg"
                loading={paying}
                onClick={handleConfirmPayment}
                className="w-full font-bold shadow-md cursor-pointer"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                <span>
                  Thanh toán qua {selectedGateway === 'momo' ? 'MoMo' : 'VNPay'} ngay
                </span>
              </Button>
              <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">
                Bạn sẽ được chuyển hướng an toàn đến cổng thanh toán {selectedGateway === 'momo' ? 'MoMo' : 'VNPay'} để thực hiện giao dịch.
              </p>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: Tóm tắt đơn Sticky (Chiếm 5 cột) */}
        <div className="lg:col-span-5">
          <div className="sticky top-24">
            <PaymentSummary booking={booking} />
          </div>
        </div>
      </div>
    </div>
  );
}
