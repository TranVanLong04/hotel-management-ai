import React from 'react';
import { Calendar, CheckCircle2, Clock, CreditCard, ShieldCheck } from 'lucide-react';

export interface BookingPreviewData {
  room_id: string;
  room_name: string;
  check_in_date: string;
  check_out_date: string;
  number_of_nights: number;
  number_of_guests: number;
  price_per_night: number;
  total_amount: number;
  formatted_total?: string;
  note?: string;
}

export interface BookingConfirmedData {
  id: string;
  booking_code: string;
  status: string;
  room_id?: string;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  number_of_nights?: number;
  room_subtotal?: number;
  room_price?: number;
}

interface BookingCardProps {
  type: 'preview' | 'confirmed';
  previewData?: BookingPreviewData;
  confirmedData?: BookingConfirmedData;
  onConfirmBooking?: (data: BookingPreviewData) => void;
  onPayNow?: (bookingCode: string) => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  type,
  previewData,
  confirmedData,
  onConfirmBooking,
  onPayNow,
}) => {
  if (type === 'preview' && previewData) {
    const formattedTotal =
      previewData.formatted_total ||
      new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
        previewData.total_amount
      );

    return (
      <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-amber-300 dark:border-amber-700/60 p-3.5 shadow-sm my-2">
        <div className="flex items-center gap-2 pb-2 mb-2.5 border-b border-gray-100 dark:border-gray-700">
          <div className="p-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-lg">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-gray-900 dark:text-gray-100">
              Xác nhận thông tin đặt phòng
            </h4>
            <p className="text-[10px] text-gray-500">Vui lòng kiểm tra kỹ trước khi chốt đơn</p>
          </div>
        </div>

        <div className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300 mb-3">
          <div className="flex justify-between">
            <span className="text-gray-500">Phòng đã chọn:</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[180px]">
              {previewData.room_name}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Ngày lưu trú:</span>
            <span className="font-medium">
              {previewData.check_in_date} → {previewData.check_out_date} ({previewData.number_of_nights} đêm)
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Số lượng khách:</span>
            <span className="font-medium">{previewData.number_of_guests} người</span>
          </div>

          {previewData.note && previewData.note !== 'Không có' && (
            <div className="flex justify-between">
              <span className="text-gray-500">Ghi chú:</span>
              <span className="font-medium italic truncate max-w-[180px]">{previewData.note}</span>
            </div>
          )}

          <div className="pt-2 border-t border-dashed border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <span className="font-bold text-gray-900 dark:text-gray-100">Tổng thanh toán:</span>
            <span className="font-extrabold text-sm text-amber-600 dark:text-amber-400">
              {formattedTotal}
            </span>
          </div>
        </div>

        {onConfirmBooking && (
          <button
            type="button"
            onClick={() => onConfirmBooking(previewData)}
            className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 active:scale-98"
          >
            <ShieldCheck className="w-4 h-4" />
            Xác nhận đặt phòng ngay
          </button>
        )}
      </div>
    );
  }

  if (type === 'confirmed' && confirmedData) {
    const totalAmount =
      confirmedData.room_subtotal ||
      (confirmedData.room_price || 0) * (confirmedData.number_of_nights || 1);

    const formattedTotal = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(totalAmount);

    return (
      <div className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-300 dark:border-emerald-700/60 p-3.5 shadow-sm my-2">
        <div className="flex items-center gap-2 pb-2 mb-2 border-b border-emerald-200 dark:border-emerald-800/50">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <h4 className="font-bold text-xs text-emerald-900 dark:text-emerald-200">
              Đơn đặt phòng đã được tạo thành công!
            </h4>
            <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
              Mã đơn: <strong className="font-mono">{confirmedData.booking_code}</strong>
            </p>
          </div>
        </div>

        <div className="space-y-1 text-xs text-gray-700 dark:text-gray-300 mb-3">
          <div className="flex justify-between">
            <span className="text-gray-500">Trạng thái:</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
              <Clock className="w-3 h-3" /> Chờ thanh toán
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Thời gian:</span>
            <span>
              {confirmedData.check_in_date} → {confirmedData.check_out_date}
            </span>
          </div>

          <div className="flex justify-between font-bold pt-1">
            <span>Tổng tiền:</span>
            <span className="text-amber-600 dark:text-amber-400">{formattedTotal}</span>
          </div>
        </div>

        {onPayNow && (
          <button
            type="button"
            onClick={() => onPayNow(confirmedData.booking_code)}
            className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 active:scale-98"
          >
            <CreditCard className="w-4 h-4" />
            Thanh toán MoMo ngay
          </button>
        )}
      </div>
    );
  }

  return null;
};

