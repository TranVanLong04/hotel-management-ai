import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ScanFace,
  Camera,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { PATHS } from '@routes/paths';

/**
 * Trang Đăng ký Nhận diện Khuôn mặt (/face-register)
 * Hỗ trợ quét khuôn mặt liên kết với đơn đặt phòng để phục vụ Check-in tự động
 */
export function FaceRegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const bookingId = searchParams.get('bookingId');

  const [scanning, setScanning] = useState(false);
  const [captured, setCaptured] = useState(false);

  // Xử lý quét / đăng ký khuôn mặt
  const handleScanFace = () => {
    setScanning(true);
    // Giả lập quét khuôn mặt qua camera AI
    setTimeout(() => {
      setScanning(false);
      setCaptured(true);
      toast.success('Đăng ký khuôn mặt thành công!');
    }, 1500);
  };

  // Hoàn tất luồng đặt phòng và chuyển hướng
  const handleFinish = () => {
    toast.success(
      'Đặt phòng hoàn tất! Đơn đang chờ khách sạn xác nhận (dự kiến 15 phút). Bạn sẽ nhận email khi đơn được xác nhận.'
    );
    navigate(PATHS.MY_BOOKINGS);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
          <ScanFace className="h-8 w-8" />
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
          Đăng ký Nhận diện Khuôn mặt
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Đăng ký khuôn mặt giúp bạn nhận phòng (Check-in) tức thì tại quầy lễ tân AI mà không cần chờ đợi làm thủ tục thủ công.
        </p>
        {bookingId && (
          <div className="mt-2 inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-800 dark:bg-primary-900/60 dark:text-primary-300">
            Đơn đặt phòng: {bookingId}
          </div>
        )}
      </div>

      {/* Main Card */}
      <Card className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-card dark:border-gray-800 dark:bg-gray-850">
        {/* Khung Camera AI Scanner */}
        <div className="relative mx-auto aspect-video max-w-md overflow-hidden rounded-2xl bg-gray-900 flex flex-col items-center justify-center text-white border-2 border-dashed border-gray-700">
          {captured ? (
            <div className="flex flex-col items-center gap-3 animate-fade-in text-center p-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-500/20 text-success-400">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <span className="font-bold text-base text-white">Khuôn mặt hợp lệ</span>
              <span className="text-xs text-gray-300">Dữ liệu khuôn mặt đã được mã hóa an toàn</span>
            </div>
          ) : scanning ? (
            <div className="flex flex-col items-center gap-3 animate-pulse">
              <RefreshCw className="h-10 w-10 animate-spin text-primary-400" />
              <span className="text-sm font-semibold text-primary-300">Đang quét và mã hóa embedding...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <Camera className="h-12 w-12 text-gray-500" />
              <span className="text-xs font-medium text-gray-400">Đặt khuôn mặt vào giữa khung hình</span>
            </div>
          )}

          {/* Hiệu ứng tia quét */}
          {scanning && (
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary-400 to-transparent animate-bounce" />
          )}
        </div>

        {/* Hướng dẫn chụp ảnh */}
        <div className="mt-6 rounded-2xl bg-gray-50 p-4 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-300 space-y-2">
          <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            Lưu ý khi quét khuôn mặt:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-500 dark:text-gray-400 pl-1">
            <li>Đảm bảo môi trường đủ ánh sáng rõ ràng, không bị chói sáng phía sau.</li>
            <li>Nhìn thẳng vào camera, không đeo kính râm, khẩu trang hoặc che mặt.</li>
            <li>Giữ khoảng cách khoảng 40 - 60cm so với camera thiết bị.</li>
          </ul>
        </div>

        {/* Nút thao tác */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {!captured ? (
            <Button
              variant="primary"
              size="lg"
              loading={scanning}
              onClick={handleScanFace}
              className="w-full sm:w-auto font-bold shadow-md cursor-pointer"
            >
              <Camera className="mr-2 h-5 w-5" />
              Bắt đầu quét khuôn mặt
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              onClick={handleFinish}
              className="w-full sm:w-auto font-bold shadow-md cursor-pointer"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Hoàn tất đặt phòng
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          )}

          <Link to={PATHS.MY_BOOKINGS}>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Bỏ qua bước này
            </Button>
          </Link>
        </div>

        {/* Bảo mật cam kết */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          <ShieldCheck className="h-4 w-4 text-success-500" />
          <span>Hình ảnh khuôn mặt được mã hóa vector pgvector và tuân thủ tiêu chuẩn bảo mật</span>
        </div>
      </Card>
    </div>
  );
}
