import React, { useEffect } from 'react';
import {
  Camera,
  CameraOff,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { useCamera } from '@/features/face/hooks/useCamera';

interface FaceVerifyCameraProps {
  onVerify: (file: Blob) => void;
  isVerifying: boolean;
  attempts: number;
  maxAttempts: number;
  onSwitchManual?: () => void;
}

export const FaceVerifyCamera: React.FC<FaceVerifyCameraProps> = ({
  onVerify,
  isVerifying,
  attempts,
  maxAttempts,
  onSwitchManual,
}) => {
  const { videoRef, canvasRef, isActive, isLoading, error, start, stop, capture } = useCamera();

  // Tự động mở camera khi component mount, dừng khi unmount
  useEffect(() => {
    start();
    return () => {
      stop();
    };
  }, [start, stop]);

  const handleCaptureAndVerify = async () => {
    if (isVerifying || !isActive) return;

    const captureResult = await capture();
    if (!captureResult || !captureResult.blob) {
      return;
    }

    onVerify(captureResult.blob);
  };

  const remainingAttempts = Math.max(0, maxAttempts - attempts);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">
              Camera Xác thực Khuôn mặt AI
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Yêu cầu khách hàng nhìn thẳng vào ống kính và giữ yên trong 2 giây
            </p>
          </div>
        </div>

        {/* Badge số lần thử */}
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              attempts === 0
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                : attempts < maxAttempts
                ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
            }`}
          >
            Lần thử: {attempts}/{maxAttempts} {attempts > 0 && `(Còn ${remainingAttempts} lượt)`}
          </span>
        </div>
      </div>

      {/* Cảnh báo khi đã thử thất bại */}
      {attempts > 0 && (
        <div className="mb-4 p-3.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3 text-amber-800 dark:text-amber-300 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Nhận diện chưa khớp (Lần thử {attempts}/{maxAttempts})</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Vui lòng nhắc khách hàng cởi khẩu trang, kính râm, đảm bảo đủ ánh sáng và nhìn thẳng góc vào camera.
            </p>
          </div>
          {remainingAttempts === 0 && onSwitchManual && (
            <button
              onClick={onSwitchManual}
              className="shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow transition"
            >
              Chuyển Check-in thủ công
            </button>
          )}
        </div>
      )}

      {/* Khung Camera Viewport */}
      <div className="relative w-full aspect-[4/3] max-w-lg mx-auto bg-gray-900 rounded-2xl overflow-hidden shadow-inner border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isActive ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Khung hướng dẫn khuôn mặt (Oval guide) */}
        {isActive && !isVerifying && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
            <div className="w-48 h-64 sm:w-56 sm:h-72 border-2 border-dashed border-indigo-400/80 rounded-[50%] shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] flex items-center justify-center relative animate-pulse">
              <div className="w-full h-0.5 bg-indigo-400/50 absolute top-1/2 -translate-y-1/2" />
              <div className="h-full w-0.5 bg-indigo-400/50 absolute left-1/2 -translate-x-1/2" />
            </div>
            <span className="mt-3 px-3 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-full shadow">
              Canh khuôn mặt vào hình bầu dục
            </span>
          </div>
        )}

        {/* Trạng thái Loading hoặc Lỗi camera */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 text-white gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            <p className="text-sm font-medium">Đang khởi tạo camera...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/95 text-white p-6 text-center gap-3">
            <CameraOff className="w-10 h-10 text-red-400" />
            <p className="text-sm text-red-200 font-medium">{error}</p>
            <button
              onClick={start}
              className="mt-2 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Thử lại kết nối
            </button>
          </div>
        )}

        {/* Overlay khi đang xác thực AI */}
        {isVerifying && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-950/80 backdrop-blur-sm text-white gap-3">
            <div className="relative">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-300" />
              <Sparkles className="w-5 h-5 text-amber-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
            </div>
            <div className="text-center">
              <p className="font-bold text-base">Đang đối soát khuôn mặt với AI Service...</p>
              <p className="text-xs text-indigo-200 mt-1">Trích xuất vector 512D & tính độ tương đồng Cosine</p>
            </div>
          </div>
        )}
      </div>

      {/* Thanh nút bấm hành động */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleCaptureAndVerify}
          disabled={!isActive || isVerifying || remainingAttempts === 0}
          className="flex-1 max-w-sm flex items-center justify-center gap-2.5 py-3 px-6 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-semibold shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Đang nhận diện...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>Chụp & Xác thực Check-in</span>
            </>
          )}
        </button>

        {onSwitchManual && (
          <button
            type="button"
            onClick={onSwitchManual}
            disabled={isVerifying}
            className="flex items-center gap-1.5 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-medium text-sm transition"
          >
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span>Check-in thủ công</span>
          </button>
        )}
      </div>
    </div>
  );
};
