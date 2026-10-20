import React from 'react';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  BedDouble,
  User,
  Clock,
  QrCode,
} from 'lucide-react';
import type { Booking } from '@/types';

interface VerificationResultProps {
  success: boolean;
  similarity?: number;
  message?: string;
  booking?: Booking;
  attempts: number;
  maxAttempts: number;
  canRetry: boolean;
  onReset: () => void;
  onRetry: () => void;
  onManual: () => void;
}

export const VerificationResult: React.FC<VerificationResultProps> = ({
  success,
  similarity,
  message,
  booking,
  attempts,
  maxAttempts,
  canRetry,
  onReset,
  onRetry,
  onManual,
}) => {
  const similarityPercent = similarity !== undefined ? (similarity * 100).toFixed(1) : null;

  if (success) {
    const customerName = booking?.customers?.full_name || booking?.customer?.full_name || 'Khách hàng';
    const roomNumber = booking?.rooms?.room_number || booking?.room?.room_number || '---';

    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-emerald-100 dark:border-emerald-900/50 p-8 max-w-xl mx-auto text-center transition-colors">
        {/* Success Icon */}
        <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 bg-emerald-500/20 dark:bg-emerald-500/30 rounded-full animate-ping" />
          <div className="relative w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40">
            <CheckCircle2 className="w-10 h-10" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          XÁC THỰC AI THÀNH CÔNG
        </div>

        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
          Check-in Hoàn tất!
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Hệ thống đã tự động kích hoạt phòng và cập nhật trạng thái Check-in.
        </p>

        {/* Điểm tương đồng */}
        {similarityPercent && (
          <div className="mt-4 inline-block px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
            <span className="text-xs text-gray-500 dark:text-gray-400">Độ tương đồng khuôn mặt: </span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              {similarityPercent}%
            </span>
            <span className="text-xs text-gray-400 ml-1.5">(Ngưỡng: &ge; 75%)</span>
          </div>
        )}

        {/* Card tóm tắt booking */}
        {booking && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700 text-left space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <QrCode className="w-4 h-4" /> Mã đặt phòng:
              </span>
              <span className="font-bold text-gray-900 dark:text-white">#{booking.booking_code}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <User className="w-4 h-4" /> Khách hàng:
              </span>
              <span className="font-medium text-gray-900 dark:text-white">{customerName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <BedDouble className="w-4 h-4" /> Phòng nhận:
              </span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">Phòng {roomNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Thời điểm check-in:
              </span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })},{' '}
                {new Date().toLocaleDateString('vi-VN')}
              </span>
            </div>
          </div>
        )}

        {/* Nút hành động tiếp tục */}
        <button
          onClick={onReset}
          className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-600/30 transition"
        >
          <span>Check-in khách tiếp theo</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // Failed Case
  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-red-100 dark:border-red-900/50 p-8 max-w-xl mx-auto text-center transition-colors">
      <div className="w-20 h-20 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center shadow-lg shadow-red-500/20">
        <XCircle className="w-10 h-10" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 mb-3">
        XÁC THỰC KHUÔN MẶT THẤT BẠI
      </div>

      <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
        Không khớp với Hồ sơ khách hàng
      </h2>

      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 max-w-md mx-auto">
        {message || 'Khuôn mặt chụp được không trùng khớp với dữ liệu đăng ký hoặc không phát hiện khuôn mặt.'}
      </p>

      {similarityPercent && (
        <div className="mt-3 inline-block px-4 py-1.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-sm">
          <span className="text-gray-500 dark:text-gray-400">Độ khớp: </span>
          <span className="font-bold text-red-600 dark:text-red-400">{similarityPercent}%</span>
          <span className="text-xs text-gray-400 ml-1.5">(Yêu cầu: &ge; 75%)</span>
        </div>
      )}

      {/* Thông tin số lần thử */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Số lần thử hiện tại: <span className="font-semibold text-gray-700 dark:text-gray-200">{attempts}/{maxAttempts}</span>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        {canRetry ? (
          <>
            <button
              onClick={onRetry}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Thử lại camera ({maxAttempts - attempts} lượt còn lại)</span>
            </button>
            <button
              onClick={onManual}
              className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-5 border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 hover:bg-amber-100 rounded-xl font-medium text-sm transition"
            >
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Chuyển Check-in thủ công</span>
            </button>
          </>
        ) : (
          <div className="w-full space-y-3">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300">
              Đã vượt quá {maxAttempts} lần thử xác thực AI. Theo quy chuẩn bảo mật, vui lòng đối chiếu giấy tờ tùy thân và thực hiện Check-in thủ công.
            </div>
            <button
              onClick={onManual}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold shadow-lg shadow-amber-600/30 transition"
            >
              <ShieldAlert className="w-5 h-5" />
              <span>Chuyển sang Check-in thủ công ngay</span>
            </button>
            <button
              onClick={onReset}
              className="w-full text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition py-1"
            >
              Hủy bỏ và tìm kiếm đơn đặt phòng khác
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
