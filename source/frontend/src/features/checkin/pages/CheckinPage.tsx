import React, { useState } from 'react';
import {
  ScanFace,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  UserCheck,
} from 'lucide-react';
import type { Booking } from '@/types';
import { useCheckin } from '../hooks/useCheckin';
import { BookingSearch } from '../components/BookingSearch';
import { BookingInfoCard } from '../components/BookingInfoCard';
import { FaceVerifyCamera } from '../components/FaceVerifyCamera';
import { VerificationResult } from '../components/VerificationResult';
import { ManualCheckinForm } from '../components/ManualCheckinForm';

type CheckinViewMode = 'search' | 'verify' | 'result' | 'manual';

export const CheckinPage: React.FC = () => {
  const [mode, setMode] = useState<CheckinViewMode>('search');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const {
    verifying,
    attempts,
    maxAttempts,
    canRetry,
    verify,
    manual,
    reset: resetCheckinState,
  } = useCheckin();

  // Lưu trữ kết quả verify cuối cùng để render sang VerificationResult
  const [resultState, setResultState] = useState<{
    success: boolean;
    similarity?: number;
    message?: string;
    booking?: Booking;
  } | null>(null);

  // Khi tìm thấy booking
  const handleBookingFound = (booking: Booking) => {
    setSelectedBooking(booking);
    resetCheckinState();
    setResultState(null);
    setMode('verify');
  };

  // Xử lý xác thực khuôn mặt từ camera
  const handleFaceVerify = async (imageBlob: Blob) => {
    if (!selectedBooking) return;

    const res = await verify(selectedBooking.id, imageBlob);

    if (res.success && res.data) {
      setResultState({
        success: true,
        similarity: res.data.similarity,
        booking: res.data.booking,
      });
      setSelectedBooking(res.data.booking);
      setMode('result');
    } else {
      setResultState({
        success: false,
        similarity: undefined,
        message: res.message || 'Xác thực khuôn mặt không đạt ngưỡng tối thiểu',
      });
      setMode('result');
    }
  };

  // Check-in thủ công
  const handleManualSubmit = async (data: { reason: string; identity_number: string }) => {
    if (!selectedBooking) return;

    const updatedBooking = await manual(selectedBooking.id, data);
    setSelectedBooking(updatedBooking);
    setResultState({
      success: true,
      similarity: undefined,
      booking: updatedBooking,
    });
    setMode('result');
  };

  // Reset về màn hình ban đầu
  const handleResetAll = () => {
    setSelectedBooking(null);
    setResultState(null);
    resetCheckinState();
    setMode('search');
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header trang */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <ScanFace className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  Lễ tân Check-in AI
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Đồ án AI
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Nhận diện khuôn mặt khách hàng tự động và bàn giao phòng tức thì
              </p>
            </div>
          </div>

          {selectedBooking && mode !== 'search' && (
            <button
              onClick={handleResetAll}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl text-sm font-medium shadow-sm transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Đổi đơn đặt phòng</span>
            </button>
          )}
        </div>

        {/* Màn hình 1: Tra cứu đơn đặt phòng */}
        {mode === 'search' && (
          <div className="pt-4">
            <BookingSearch onFound={handleBookingFound} />
          </div>
        )}

        {/* Màn hình 2, 3, 4: Khi đã có Booking */}
        {selectedBooking && mode !== 'search' && (
          <div className="space-y-6">
            {/* Thông tin đặt phòng tóm tắt */}
            <BookingInfoCard
              booking={selectedBooking}
              onResetBooking={handleResetAll}
              onSwitchManual={() => setMode('manual')}
            />

            {/* Màn hình Xác thực Camera */}
            {mode === 'verify' && (
              <FaceVerifyCamera
                onVerify={handleFaceVerify}
                isVerifying={verifying}
                attempts={attempts}
                maxAttempts={maxAttempts}
                onSwitchManual={() => setMode('manual')}
              />
            )}

            {/* Màn hình Kết quả */}
            {mode === 'result' && resultState && (
              <VerificationResult
                success={resultState.success}
                similarity={resultState.similarity}
                message={resultState.message}
                booking={resultState.booking || selectedBooking}
                attempts={attempts}
                maxAttempts={maxAttempts}
                canRetry={canRetry}
                onReset={handleResetAll}
                onRetry={() => setMode('verify')}
                onManual={() => setMode('manual')}
              />
            )}

            {/* Màn hình Check-in Thủ công */}
            {mode === 'manual' && (
              <ManualCheckinForm
                booking={selectedBooking}
                onSubmit={handleManualSubmit}
                onBackToAI={() => setMode('verify')}
                isSubmitting={verifying}
              />
            )}
          </div>
        )}

        {/* Footer bảo mật & tiêu chuẩn */}
        <div className="pt-6 border-t border-gray-100 dark:border-gray-800/60 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-400 dark:text-gray-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Tiêu chuẩn bảo mật: Mã hóa vector pgvector 512D &bull; Ngưỡng tương đồng Cosine &ge; 0.75</span>
          </div>
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-indigo-400" />
            <span>Chỉ dành cho tài khoản nhân viên Lễ tân & Quản trị</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckinPage;
