import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowRight, RotateCcw, ScanFace } from 'lucide-react';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { PATHS } from '@routes/paths';

interface PaymentResultCardProps {
  loading: boolean;
  success: boolean;
  gateway: 'momo' | 'vnpay';
  bookingId?: string;
  errorMessage?: string;
}

/**
 * Thẻ hiển thị kết quả giao dịch thanh toán trực tuyến
 * Tự động đếm ngược 3 giây để chuyển hướng sang bước quét khuôn mặt khi thành công
 */
export function PaymentResultCard({
  loading,
  success,
  gateway,
  bookingId,
  errorMessage,
}: PaymentResultCardProps) {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);

  const gatewayName = gateway === 'momo' ? 'MoMo' : 'VNPay';
  const faceRegisterUrl = bookingId
    ? `${PATHS.FACE_REGISTER}?bookingId=${bookingId}`
    : PATHS.FACE_REGISTER;

  // Đếm ngược 3s tự động chuyển sang trang Face Register
  useEffect(() => {
    if (!loading && success) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate(faceRegisterUrl);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [loading, success, navigate, faceRegisterUrl]);

  // Trạng thái Đang xác thực giao dịch
  if (loading) {
    return (
      <Card className="mx-auto max-w-lg rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-card dark:border-gray-800 dark:bg-gray-850">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Đang xác thực giao dịch {gatewayName}...
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Vui lòng đợi trong giây lát, hệ thống đang kiểm tra kết quả thanh toán từ cổng {gatewayName}.
        </p>
      </Card>
    );
  }

  // Trạng thái Thành công
  if (success) {
    return (
      <Card className="mx-auto max-w-lg rounded-3xl border border-success-200 bg-white p-8 text-center shadow-card dark:border-success-900/50 dark:bg-gray-850 animate-fade-in">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-success-50 text-success-600 dark:bg-success-950 dark:text-success-400">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Thanh toán thành công!
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Giao dịch qua <strong>{gatewayName}</strong> đã hoàn tất. Email xác nhận chi tiết đã được gửi đến bạn.
        </p>

        <div className="my-6 rounded-2xl bg-primary-50/50 p-4 text-xs text-primary-800 dark:bg-primary-950/40 dark:text-primary-300 border border-primary-100 dark:border-primary-900/40">
          <p className="font-semibold flex items-center justify-center gap-1.5 mb-1">
            <ScanFace className="h-4 w-4" />
            Bước tiếp theo: Đăng ký nhận diện khuôn mặt
          </p>
          <span>
            Tự động chuyển hướng sau <strong>{countdown} giây</strong>...
          </span>
        </div>

        <div className="space-y-3">
          <Link to={faceRegisterUrl} className="block w-full">
            <Button variant="primary" size="lg" className="w-full font-bold">
              <span>Đăng ký khuôn mặt ngay</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>

          <Link to={PATHS.MY_BOOKINGS} className="block w-full">
            <Button variant="outline" size="md" className="w-full">
              Bỏ qua và xem đơn đặt phòng
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  // Trạng thái Thất bại
  return (
    <Card className="mx-auto max-w-lg rounded-3xl border border-danger-200 bg-white p-8 text-center shadow-card dark:border-danger-900/50 dark:bg-gray-850 animate-fade-in">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-50 text-danger-600 dark:bg-danger-950 dark:text-danger-400">
        <XCircle className="h-10 w-10" />
      </div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Thanh toán không thành công
      </h2>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        {errorMessage || `Giao dịch qua ${gatewayName} đã bị hủy hoặc xảy ra lỗi trong quá trình xử lý.`}
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {bookingId && (
          <Link to={PATHS.PAYMENT.replace(':bookingId', bookingId)}>
            <Button variant="primary" size="md" className="w-full sm:w-auto">
              <RotateCcw className="mr-2 h-4 w-4" />
              Thử lại thanh toán
            </Button>
          </Link>
        )}

        <Link to={PATHS.MY_BOOKINGS}>
          <Button variant="outline" size="md" className="w-full sm:w-auto">
            Xem đơn của tôi
          </Button>
        </Link>
      </div>
    </Card>
  );
}
