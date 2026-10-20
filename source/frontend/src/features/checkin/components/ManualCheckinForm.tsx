import React, { useState } from 'react';
import {
  ShieldAlert,
  CreditCard,
  FileText,
  Loader2,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react';
import type { Booking } from '@/types';
import toast from 'react-hot-toast';

interface ManualCheckinFormProps {
  booking: Booking;
  onSubmit: (data: { reason: string; identity_number: string }) => Promise<void>;
  onBackToAI: () => void;
  isSubmitting?: boolean;
}

export const ManualCheckinForm: React.FC<ManualCheckinFormProps> = ({
  booking,
  onSubmit,
  onBackToAI,
  isSubmitting = false,
}) => {
  const initialIdentity =
    booking.customers?.identity_number || booking.customer?.identity_number || '';
  const [identityNumber, setIdentityNumber] = useState(initialIdentity);
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<{ identity?: string; reason?: string }>({});

  const validate = () => {
    const newErrors: { identity?: string; reason?: string } = {};

    const cleanIdentity = identityNumber.trim();
    if (!cleanIdentity) {
      newErrors.identity = 'Vui lòng nhập số CMND / CCCD của khách';
    } else if (!/^[0-9]{9,12}$/.test(cleanIdentity)) {
      newErrors.identity = 'Số CMND / CCCD phải gồm từ 9 đến 12 chữ số';
    }

    const cleanReason = reason.trim();
    if (!cleanReason) {
      newErrors.reason = 'Vui lòng cung cấp lý do thực hiện check-in thủ công';
    } else if (cleanReason.length < 10) {
      newErrors.reason = 'Lý do phải có độ dài tối thiểu 10 ký tự để lưu vết kiểm toán';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    try {
      await onSubmit({
        identity_number: identityNumber.trim(),
        reason: reason.trim(),
      });
    } catch (err) {
      toast.error('Check-in thủ công không thành công. Vui lòng kiểm tra lại.');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-amber-200 dark:border-amber-900/60 p-6 sm:p-8 max-w-xl mx-auto transition-colors">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-3 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-2xl">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Check-in Thủ công
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Dành cho trường hợp khách chưa đăng ký AI hoặc AI không nhận diện được
          </p>
        </div>
      </div>

      {/* Security Warning Banner */}
      <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-500 rounded-r-xl text-xs text-amber-900 dark:text-amber-300 space-y-1">
        <p className="font-bold flex items-center gap-1.5 text-sm text-amber-800 dark:text-amber-200">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          SỰ KIỆN AN NINH (Security Event)
        </p>
        <p>
          Thao tác Check-in thủ công sẽ được hệ thống ghi nhận vào nhật ký kiểm toán an ninh (Audit Log) kèm định danh nhân viên thực hiện.
        </p>
        <p className="text-amber-700 dark:text-amber-400">
          Vui lòng đối chiếu kỹ giấy tờ tùy thân bản gốc của khách trước khi xác nhận.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Số CMND / CCCD */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Số CMND / Thẻ CCCD đối chiếu <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={identityNumber}
              onChange={(e) => {
                setIdentityNumber(e.target.value);
                if (errors.identity) setErrors((prev) => ({ ...prev, identity: undefined }));
              }}
              placeholder="VD: 048094001234 (9 - 12 số)"
              maxLength={12}
              className={`w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                errors.identity
                  ? 'border-red-500 focus:ring-red-400'
                  : 'border-gray-200 dark:border-gray-700 focus:ring-indigo-500'
              }`}
              disabled={isSubmitting}
            />
            <CreditCard className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
          {errors.identity && (
            <p className="text-xs text-red-500 mt-1.5">{errors.identity}</p>
          )}
        </div>

        {/* Lý do thực hiện */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Lý do Check-in thủ công <span className="text-red-500">* (Tối thiểu 10 ký tự)</span>
          </label>
          <div className="relative">
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errors.reason) setErrors((prev) => ({ ...prev, reason: undefined }));
              }}
              placeholder="VD: Khách chưa đăng ký khuôn mặt, đã đối chiếu CCCD và xác nhận trực tiếp..."
              className={`w-full p-3.5 bg-gray-50 dark:bg-gray-900/50 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all text-sm ${
                errors.reason
                  ? 'border-red-500 focus:ring-red-400'
                  : 'border-gray-200 dark:border-gray-700 focus:ring-indigo-500'
              }`}
              disabled={isSubmitting}
            />
          </div>
          <div className="flex justify-between items-center mt-1">
            {errors.reason ? (
              <p className="text-xs text-red-500">{errors.reason}</p>
            ) : (
              <span className="text-[11px] text-gray-400">Ghi rõ tình huống đối soát giấy tờ</span>
            )}
            <span
              className={`text-xs ${
                reason.trim().length >= 10
                  ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                  : 'text-gray-400'
              }`}
            >
              {reason.trim().length}/10 ký tự
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={onBackToAI}
            disabled={isSubmitting}
            className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-medium text-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại camera AI</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3.5 px-6 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl font-semibold shadow-lg shadow-amber-600/30 disabled:opacity-50 transition"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Đang xử lý check-in...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Xác nhận Check-in thủ công</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
