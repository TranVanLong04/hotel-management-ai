import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle2, AlertCircle, RefreshCw, Sparkles, UserCheck, PhoneCall } from 'lucide-react';
import { useCamera } from '@/features/face/hooks/useCamera';
import { chatApi } from '@/api/chat.api';

export interface CheckinCardPayload {
  booking_id?: string;
  bookingId?: string;
  booking_code?: string;
  room_number?: string;
  room_type?: string;
}

interface CheckinCardProps {
  payload?: CheckinCardPayload;
  data?: CheckinCardPayload;
  onAction?: (actionText: string) => void;
}

export const CheckinCard: React.FC<CheckinCardProps> = ({ payload, data, onAction }) => {
  const currentPayload = data || payload || {};
  const bookingId = currentPayload.booking_id || currentPayload.bookingId || '';
  const bookingCode = currentPayload.booking_code || 'BK-CURRENT';
  const roomNumber = currentPayload.room_number || '';
  const roomType = currentPayload.room_type || '';

  const { videoRef, canvasRef, isActive, isLoading: isCameraLoading, error: cameraError, start, stop, capture } = useCamera();

  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    isMatch?: boolean;
    similarity?: number;
    message?: string;
  } | null>(null);

  // Auto-start camera when component mounts
  useEffect(() => {
    start();
    return () => {
      stop();
    };
  }, [start, stop]);

  const handleCaptureAndVerify = async () => {
    if (!bookingId) {
      setVerificationResult({
        success: false,
        message: 'Không tìm thấy mã đơn đặt phòng để thực hiện check-in.',
      });
      return;
    }

    try {
      setIsVerifying(true);
      setVerificationResult(null);

      const captureRes = await capture();
      if (!captureRes || !captureRes.blob) {
        setVerificationResult({
          success: false,
          message: 'Không thể chụp ảnh từ camera. Vui lòng thử lại.',
        });
        setIsVerifying(false);
        return;
      }

      const formData = new FormData();
      formData.append('image', captureRes.blob, 'face_checkin.jpg');
      formData.append('booking_id', bookingId);

      const resp = await chatApi.verifyFaceCheckin(formData);
      const resData = resp.data;

      if (resData?.is_match) {
        stop(); // Stop camera on success
        setVerificationResult({
          success: true,
          isMatch: true,
          similarity: resData.similarity,
          message: 'Xác thực khuôn mặt thành công! Hệ thống đã ghi nhận thủ tục nhận phòng.',
        });
      } else {
        setVerificationResult({
          success: false,
          isMatch: false,
          similarity: resData?.similarity,
          message: resData?.message || 'Khuôn mặt không khớp với hồ sơ đã đăng ký.',
        });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Xác thực check-in thất bại';
      setVerificationResult({
        success: false,
        message: msg,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRetry = () => {
    setVerificationResult(null);
    start();
  };

  return (
    <div className="w-full bg-gradient-to-b from-white to-emerald-50/30 dark:from-gray-800 dark:to-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/50 p-3.5 shadow-sm my-2 text-left">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-emerald-100 dark:border-emerald-900/40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
              Check-in AI Khuôn Mặt
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-white bg-emerald-600 px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                <Sparkles className="w-2.5 h-2.5" /> AI
              </span>
            </h4>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Mã đơn: <strong className="font-mono text-gray-800 dark:text-gray-200">{bookingCode}</strong>
              {roomNumber ? ` • Phòng ${roomNumber}` : ''}
              {roomType ? ` (${roomType})` : ''}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
          <UserCheck className="w-2.5 h-2.5" /> Tự phục vụ
        </span>
      </div>

      {/* Success State */}
      {verificationResult?.success && verificationResult.isMatch ? (
        <div className="py-4 text-center space-y-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800/60">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-7 h-7 animate-in zoom-in" />
          </div>
          <div>
            <h5 className="font-bold text-sm text-emerald-800 dark:text-emerald-300">
              Nhận phòng thành công!
            </h5>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
              Độ tương đồng khuôn mặt:{' '}
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                {verificationResult.similarity ? `${(verificationResult.similarity * 100).toFixed(1)}%` : 'Đạt'}
              </strong>
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              Phòng của Quý khách đã sẵn sàng. Chúc Quý khách một kỳ nghỉ tuyệt vời!
            </p>
          </div>
          {onAction && (
            <button
              type="button"
              onClick={() => onAction('Xem dịch vụ khách sạn')}
              className="text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 hover:bg-emerald-200/80 dark:bg-emerald-900/40 px-3 py-1.5 rounded-lg transition-colors"
            >
              Xem tiện ích & dịch vụ phòng
            </button>
          )}
        </div>
      ) : (
        /* Camera Active or Retrying */
        <div className="space-y-3">
          {cameraError ? (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 rounded-lg text-xs text-amber-800 dark:text-amber-300">
              <p className="font-semibold mb-1">Không thể mở camera:</p>
              <p>{cameraError}</p>
              <button
                type="button"
                onClick={start}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Thử bật lại
              </button>
            </div>
          ) : (
            <div className="relative w-full aspect-4/3 max-w-sm mx-auto bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-inner flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transform scale-x-[-1] ${
                  isActive ? 'block' : 'hidden'
                }`}
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Face Target Guide Oval Overlay */}
              {isActive && !isVerifying && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-40 h-52 border-2 border-dashed border-emerald-400/80 rounded-[50%] shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse" />
                  <span className="absolute bottom-2 text-[10px] text-white/90 bg-black/60 px-2 py-0.5 rounded-full font-medium">
                    Hướng khuôn mặt vào giữa khung
                  </span>
                </div>
              )}

              {/* Loading / Verifying State */}
              {(isCameraLoading || isVerifying) && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white gap-2 p-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                  <p className="text-xs font-medium">
                    {isVerifying ? 'Đang phân tích khuôn mặt & đối sánh AI...' : 'Đang khởi động camera...'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Verification Error/Mismatch feedback */}
          {verificationResult && !verificationResult.isMatch && (
            <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 rounded-lg text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <div className="flex-1">
                <p className="font-medium">{verificationResult.message}</p>
                {verificationResult.similarity !== undefined && (
                  <p className="text-[11px] text-red-600/80 dark:text-red-400/80 mt-0.5">
                    Độ tương đồng: {(verificationResult.similarity * 100).toFixed(1)}% (Yêu cầu ≥ 55%)
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              disabled={!isActive || isVerifying}
              onClick={handleCaptureAndVerify}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-sm transition-all active:scale-[0.98]"
            >
              <Camera className="w-3.5 h-3.5" />
              {isVerifying ? 'Đang xác thực...' : 'Chụp & Xác thực'}
            </button>

            {verificationResult && !verificationResult.isMatch && (
              <button
                type="button"
                onClick={handleRetry}
                className="py-2 px-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium text-xs rounded-lg transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Thử lại
              </button>
            )}

            {onAction && (
              <button
                type="button"
                onClick={() => onAction('Tôi cần gặp Lễ tân hỗ trợ')}
                className="p-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-400 rounded-lg transition-colors"
                title="Gọi hỗ trợ Lễ tân"
              >
                <PhoneCall className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

