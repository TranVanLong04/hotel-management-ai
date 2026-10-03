import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ScanFace,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { PATHS } from '@routes/paths';
import { useCamera } from '../hooks/useCamera';
import { useFaceProfile } from '../hooks/useFaceProfile';
import { FaceCamera } from '../components/FaceCamera';
import { FacePreview } from '../components/FacePreview';
import { FaceStatusCard } from '../components/FaceStatusCard';
import { faceApi } from '@/api/face.api';
import type { FaceCaptureResult } from '@/types/face';
import { getErrorCode, getErrorMessage } from '@/utils/errorHandler';
import { logger } from '@/utils/logger';

/**
 * Trang Đăng ký Nhận diện Khuôn mặt (/face-register)
 * Hỗ trợ quét và đăng ký khuôn mặt liên kết với tài khoản / đơn đặt phòng để Check-in tự động
 */
export function FaceRegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get('bookingId');

  // Lấy hồ sơ khuôn mặt hiện tại
  const { profile, isLoading: isLoadingProfile, refetch: refetchProfile } = useFaceProfile();

  // Custom hook camera
  const camera = useCamera();

  // Trạng thái chụp và gửi dữ liệu
  const [isRegisteringMode, setIsRegisteringMode] = useState<boolean>(false);
  const [captured, setCaptured] = useState<FaceCaptureResult | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Nếu người dùng vào từ flow đặt phòng (có bookingId), mặc định kích hoạt chế độ đăng ký
  useEffect(() => {
    if (bookingId) {
      setIsRegisteringMode(true);
    }
  }, [bookingId]);

  // Tự động bật camera khi chuyển sang chế độ đăng ký / chưa có ảnh chụp
  useEffect(() => {
    if (isRegisteringMode && !captured && !camera.isActive && !camera.error) {
      camera.start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRegisteringMode, captured]);

  // Xử lý chụp ảnh từ camera
  const handleCapture = async () => {
    const result = await camera.capture();
    if (result) {
      setCaptured(result);
      camera.stop();
    } else {
      toast.error('Không thể chụp ảnh từ camera. Vui lòng thử lại.');
    }
  };

  // Xử lý khi nhấn chụp lại
  const handleRetake = () => {
    setCaptured(null);
    camera.start();
  };

  // Xử lý xác nhận upload ảnh đăng ký
  const handleConfirm = async () => {
    if (!captured) return;

    setSubmitting(true);
    try {
      // Chuyển đổi blob thành File để upload multipart/form-data
      const file = new File([captured.blob], `face_${Date.now()}.jpg`, {
        type: 'image/jpeg',
      });

      await faceApi.registerFace(file);

      // Phân nhánh thông báo và điều hướng theo ngữ cảnh (có bookingId hay không)
      if (bookingId) {
        toast.success(
          'Đặt phòng hoàn tất! Đơn đang chờ khách sạn xác nhận (dự kiến 15 phút). Bạn sẽ nhận email khi đơn được xác nhận.'
        );
        navigate(`/my-bookings/${bookingId}`);
      } else {
        toast.success('Đăng ký khuôn mặt thành công!');
        setCaptured(null);
        setIsRegisteringMode(false);
        await refetchProfile();
      }
    } catch (err: unknown) {
      logger.error('Lỗi khi đăng ký khuôn mặt:', err);

      const code = getErrorCode(err);
      const message = getErrorMessage(err);
      const lowerMsg = message.toLowerCase();

      if (
        code === 'FACE_NOT_DETECTED' ||
        code === 'AI_NO_FACE_DETECTED' ||
        lowerMsg.includes('không phát hiện') ||
        lowerMsg.includes('không thể trích xuất')
      ) {
        toast.error('Không phát hiện khuôn mặt. Vui lòng chụp lại.');
      } else if (code === 'MULTIPLE_FACES' || lowerMsg.includes('nhiều khuôn mặt')) {
        toast.error('Phát hiện nhiều khuôn mặt. Vui lòng chỉ để 1 người trong khung hình.');
      } else if (code === 'LOW_QUALITY' || lowerMsg.includes('chất lượng thấp')) {
        toast.error('Ảnh chất lượng thấp. Vui lòng chụp lại nơi đủ sáng.');
      } else {
        toast.error(message || 'Đăng ký thất bại. Vui lòng thử lại.');
      }

      // Quay lại camera để chụp lại
      setCaptured(null);
      camera.start();
    } finally {
      setSubmitting(false);
    }
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
          <div className="mt-3 inline-flex items-center rounded-full bg-primary-100 px-3.5 py-1 text-xs font-semibold text-primary-800 dark:bg-primary-900/60 dark:text-primary-300">
            Mã đơn đặt phòng liên kết: {bookingId}
          </div>
        )}
      </div>

      {/* Hiển thị Card trạng thái nếu không trong mode chụp hoặc đã có profile */}
      {isLoadingProfile ? (
        <Card className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin text-primary-500 mr-2" />
          <span className="text-sm text-gray-500">Đang kiểm tra hồ sơ khuôn mặt...</span>
        </Card>
      ) : (
        !isRegisteringMode && (
          <FaceStatusCard
            profile={profile}
            onRegisterNew={() => {
              setIsRegisteringMode(true);
              setCaptured(null);
              camera.start();
            }}
          />
        )
      )}

      {/* Khung đăng ký / Camera / Preview */}
      {(isRegisteringMode || (!profile && !isLoadingProfile)) && (
        <Card className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-card dark:border-gray-800 dark:bg-gray-850">
          {captured ? (
            <FacePreview
              dataUrl={captured.dataUrl}
              submitting={submitting}
              onRetake={handleRetake}
              onConfirm={handleConfirm}
            />
          ) : (
            <FaceCamera
              videoRef={camera.videoRef}
              canvasRef={camera.canvasRef}
              isActive={camera.isActive}
              isLoading={camera.isLoading}
              error={camera.error}
              onStart={camera.start}
              onStop={camera.stop}
              onCapture={handleCapture}
            />
          )}

          {/* Nút hành động phụ */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 border-t border-gray-100 pt-6 dark:border-gray-800">
            {profile && isRegisteringMode && (
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  camera.stop();
                  setIsRegisteringMode(false);
                  setCaptured(null);
                }}
                disabled={submitting}
              >
                Hủy cập nhật
              </Button>
            )}

            {bookingId && (
              <Link to={`/my-bookings/${bookingId}`}>
                <Button variant="outline" size="md" className="cursor-pointer">
                  Bỏ qua bước này
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>

          {/* Bảo mật cam kết */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            <ShieldCheck className="h-4 w-4 text-success-500" />
            <span>Hình ảnh khuôn mặt được mã hóa vector pgvector và tuân thủ tiêu chuẩn bảo mật</span>
          </div>
        </Card>
      )}
    </div>
  );
}
