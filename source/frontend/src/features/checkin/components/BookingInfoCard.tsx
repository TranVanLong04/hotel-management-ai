import React from 'react';
import {
  User,
  Phone,
  BedDouble,
  Calendar,
  Users,
  CreditCard,
  ScanFace,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import type { Booking } from '@/types';

interface BookingInfoCardProps {
  booking: Booking;
  hasFaceProfile?: boolean;
  onResetBooking?: () => void;
  onSwitchManual?: () => void;
}

export const BookingInfoCard: React.FC<BookingInfoCardProps> = ({
  booking,
  hasFaceProfile = true,
  onResetBooking,
  onSwitchManual,
}) => {
  const customerName = booking.customers?.full_name || booking.customer?.full_name || 'Khách hàng';
  const customerPhone = booking.customers?.phone || booking.customer?.phone || 'Chưa có SĐT';
  const roomNumber = booking.rooms?.room_number || booking.room?.room_number || '---';
  const roomTypeName =
    booking.rooms?.room_types?.name ||
    booking.room?.room_type?.name ||
    booking.room?.room_types?.name ||
    'Phòng tiêu chuẩn';

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
      {/* Header card */}
      <div className="p-5 bg-gradient-to-r from-indigo-50/80 via-blue-50/50 to-white dark:from-gray-800 dark:via-gray-800 dark:to-gray-800/80 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
              ĐƠN ĐẶT PHÒNG
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-white tracking-wide">
              #{booking.booking_code}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Mã định danh hệ thống: {booking.id.slice(0, 8)}...
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasFaceProfile ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle className="w-3.5 h-3.5" />
              Đã có Hồ sơ AI
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="w-3.5 h-3.5" />
              Chưa có Hồ sơ AI
            </span>
          )}

          {onResetBooking && (
            <button
              onClick={onResetBooking}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              title="Tìm mã khác"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Thông báo nếu khách chưa đăng ký mặt */}
      {!hasFaceProfile && (
        <div className="mx-5 mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between gap-3 text-amber-800 dark:text-amber-300 text-sm">
          <div className="flex items-center gap-2">
            <ScanFace className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>Khách hàng chưa đăng ký nhận diện khuôn mặt. Vui lòng chuyển sang Check-in thủ công.</span>
          </div>
          {onSwitchManual && (
            <button
              onClick={onSwitchManual}
              className="shrink-0 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition"
            >
              Check-in thủ công
            </button>
          )}
        </div>
      )}

      {/* Grid thông tin chi tiết */}
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        {/* Khách hàng */}
        <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
            <User className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Khách hàng</div>
            <div className="font-semibold text-gray-900 dark:text-white mt-0.5">{customerName}</div>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
              <Phone className="w-3 h-3" />
              <span>{customerPhone}</span>
            </div>
          </div>
        </div>

        {/* Thông tin phòng */}
        <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
            <BedDouble className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Phòng chỉ định</div>
            <div className="font-semibold text-gray-900 dark:text-white mt-0.5">
              Phòng {roomNumber} — <span className="font-normal text-xs text-gray-500 dark:text-gray-400">{roomTypeName}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
              <Users className="w-3 h-3" />
              <span>{booking.number_of_guests} khách</span>
            </div>
          </div>
        </div>

        {/* Thời gian lưu trú */}
        <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Lịch lưu trú ({booking.number_of_nights} đêm)</div>
            <div className="font-medium text-gray-900 dark:text-white mt-0.5">
              {booking.check_in_date} &rarr; {booking.check_out_date}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Trạng thái: <span className="text-indigo-600 dark:text-indigo-400 font-semibold uppercase">{booking.status}</span>
            </div>
          </div>
        </div>

        {/* Tiền phòng */}
        <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Tổng tiền phòng</div>
            <div className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 text-base">
              {formatCurrency(booking.room_subtotal || booking.room_price || 0)}
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
              Đã xác nhận giữ chỗ
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
