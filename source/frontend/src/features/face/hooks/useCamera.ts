import { useState, useRef, useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';
import type { FaceCaptureResult } from '@/types/face';

/**
 * Custom hook quản lý thiết bị Webcam và chụp ảnh frame
 */
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isActive, setIsActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Dừng camera và giải phóng tài nguyên media stream
   */
  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsActive(false);
    setIsLoading(false);
  }, []);

  /**
   * Khởi động camera người dùng
   */
  const start = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      // Dừng stream cũ nếu đang chạy
      if (streamRef.current) {
        stop();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsActive(true);
      setIsLoading(false);
    } catch (err: unknown) {
      logger.error('Lỗi khi mở camera:', err);

      let errorMessage = 'Không thể khởi động camera. Vui lòng thử lại.';
      if (err instanceof DOMException) {
        switch (err.name) {
          case 'NotAllowedError':
          case 'PermissionDeniedError':
            errorMessage = 'Bạn cần cấp quyền truy cập camera để đăng ký khuôn mặt.';
            break;
          case 'NotFoundError':
          case 'DevicesNotFoundError':
            errorMessage = 'Không tìm thấy camera. Vui lòng kiểm tra thiết bị.';
            break;
          case 'NotReadableError':
          case 'TrackStartError':
            errorMessage = 'Camera đang được sử dụng bởi ứng dụng khác.';
            break;
          default:
            errorMessage = 'Không thể khởi động camera. Vui lòng thử lại.';
            break;
        }
      }

      setError(errorMessage);
      setIsActive(false);
      setIsLoading(false);
    }
  }, [stop]);

  /**
   * Chụp frame hiện tại từ video và trả về Blob + dataUrl
   */
  const capture = useCallback((): Promise<FaceCaptureResult | null> => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      if (!video || !isActive) {
        resolve(null);
        return;
      }

      // Tạo canvas nếu chưa có sẵn ref
      let canvas = canvasRef.current;
      if (!canvas) {
        canvas = document.createElement('canvas');
      }

      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      // Vẽ hình không lật (ảnh gốc trực diện)
      ctx.drawImage(video, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          resolve({
            blob,
            dataUrl,
          });
        },
        'image/jpeg',
        0.95
      );
    });
  }, [isActive]);

  // Tự động giải phóng camera khi component unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        streamRef.current = null;
      }
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    isActive,
    isLoading,
    error,
    start,
    stop,
    capture,
  };
}
