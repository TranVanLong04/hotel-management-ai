import type { RefObject } from 'react';
import { Camera, CameraOff, RefreshCw, AlertTriangle, Lightbulb, Sparkles } from 'lucide-react';
import { Button } from '@components/ui/Button';

interface FaceCameraProps {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef?: RefObject<HTMLCanvasElement>;
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
  onCapture: () => void;
}

/**
 * Component hiển thị màn hình Camera quét khuôn mặt AI
 */
export function FaceCamera({
  videoRef,
  canvasRef,
  isActive,
  isLoading,
  error,
  onStart,
  onStop,
  onCapture,
}: FaceCameraProps) {
  return (
    <div className="w-full space-y-6">
      {/* Khung Camera Viewport */}
      <div className="relative mx-auto aspect-[4/3] max-w-lg overflow-hidden rounded-3xl bg-gray-950 shadow-2xl border-2 border-gray-800 dark:border-gray-700 flex items-center justify-center">
        {/* Video stream với hiệu ứng lật gương scaleX(-1) */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ transform: 'scaleX(-1)' }}
          className={`h-full w-full object-cover transition-opacity duration-300 ${
            isActive ? 'opacity-100' : 'opacity-0 hidden'
          }`}
        />

        {/* Canvas ẩn để chụp ảnh */}
        {canvasRef && <canvas ref={canvasRef} className="hidden" />}

        {/* Khung ngắm oval nhận diện khuôn mặt AI (chỉ hiện khi camera đang hoạt động) */}
        {isActive && !isLoading && !error && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {/* Lớp mờ xung quanh */}
            <div className="relative h-64 w-48 sm:h-72 sm:w-56 rounded-[50%] border-2 border-dashed border-primary-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] animate-pulse">
              {/* Điểm ngắm 4 góc */}
              <div className="absolute -top-1 -left-1 h-4 w-4 border-t-2 border-l-2 border-primary-400" />
              <div className="absolute -top-1 -right-1 h-4 w-4 border-t-2 border-r-2 border-primary-400" />
              <div className="absolute -bottom-1 -left-1 h-4 w-4 border-b-2 border-l-2 border-primary-400" />
              <div className="absolute -bottom-1 -right-1 h-4 w-4 border-b-2 border-r-2 border-primary-400" />
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/80 p-4 text-center text-white backdrop-blur-sm">
            <RefreshCw className="h-10 w-10 animate-spin text-primary-400 mb-3" />
            <p className="text-sm font-medium text-gray-200">Đang kết nối camera...</p>
          </div>
        )}

        {/* Error Overlay */}
        {error && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/90 p-6 text-center text-white">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-500/20 text-danger-400">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <p className="text-sm font-semibold text-danger-300 max-w-xs mb-4">{error}</p>
            <Button variant="primary" size="sm" onClick={onStart}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Thử lại
            </Button>
          </div>
        )}

        {/* Trạng thái chưa bật camera */}
        {!isActive && !isLoading && !error && (
          <div className="flex flex-col items-center justify-center p-6 text-center text-gray-400">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-gray-900 border border-gray-800 text-gray-400">
              <Camera className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium text-gray-300">Camera chưa được kích hoạt</p>
            <p className="mt-1 text-xs text-gray-500">Nhấn nút bên dưới để mở camera thiết bị</p>
          </div>
        )}
      </div>

      {/* Box ghi chú hướng dẫn */}
      <div className="rounded-2xl border border-primary-100 bg-primary-50/60 p-4 dark:border-primary-900/40 dark:bg-primary-950/30">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
            <span className="font-semibold text-gray-900 dark:text-white">Lưu ý khi chụp ảnh:</span>
            <p>
              Đảm bảo đủ sáng, nhìn thẳng vào camera, không đeo khẩu trang hoặc kính râm, giữ khoảng cách 40-60cm.
            </p>
          </div>
        </div>
      </div>

      {/* Thanh điều khiển nút bấm */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {!isActive ? (
          <Button
            variant="primary"
            size="lg"
            onClick={onStart}
            loading={isLoading}
            className="w-full sm:w-auto font-semibold shadow-lg cursor-pointer"
          >
            <Camera className="mr-2 h-5 w-5" />
            Bật camera
          </Button>
        ) : (
          <>
            <Button
              variant="primary"
              size="lg"
              onClick={onCapture}
              disabled={isLoading || !!error}
              className="w-full sm:w-auto font-semibold shadow-lg cursor-pointer"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Chụp ảnh
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={onStop}
              className="w-full sm:w-auto font-semibold cursor-pointer"
            >
              <CameraOff className="mr-2 h-5 w-5" />
              Tắt camera
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
