import React from 'react';
import { DollarSign, BedDouble, CalendarCheck, TrendingUp, Users, CheckCircle2, Clock, CheckCircle, LogIn, LogOut, XCircle } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface AdminStatsCardProps {
  data: any;
  payload?: any;
}

export const AdminStatsCard: React.FC<AdminStatsCardProps> = ({ data, payload }) => {
  const stats = payload || data || {};
  const rooms = stats.rooms || {};
  const revenueToday = typeof stats.revenue_today === 'number' ? stats.revenue_today : Number(stats.revenue_today || 0);
  const revenueThisMonth = typeof stats.revenue_this_month === 'number' ? stats.revenue_this_month : Number(stats.revenue_this_month || 0);
  const occupancyRate = typeof stats.occupancy_rate === 'number' ? stats.occupancy_rate : Number(stats.occupancy_rate || 0);
  const newCustomers = typeof stats.new_customers_this_month === 'number' ? stats.new_customers_this_month : Number(stats.new_customers_this_month || 0);

  // Xử lý an toàn cho bookings_today: có thể là số nguyên hoặc object { total, pending, confirmed, checked_in, checked_out, cancelled }
  const rawBookings = stats.bookings_by_status || stats.bookings_today || {};
  const isBookingObj = typeof rawBookings === 'object' && rawBookings !== null;

  const totalBookingsToday: number = isBookingObj
    ? Number(rawBookings.total ?? 0)
    : Number(stats.bookings_today ?? 0);

  const pendingBookings: number = isBookingObj ? Number(rawBookings.pending ?? 0) : 0;
  const confirmedBookings: number = isBookingObj ? Number(rawBookings.confirmed ?? 0) : 0;
  const checkedInBookings: number = isBookingObj ? Number(rawBookings.checked_in ?? 0) : 0;
  const checkedOutBookings: number = isBookingObj ? Number(rawBookings.checked_out ?? 0) : 0;
  const cancelledBookings: number = isBookingObj ? Number(rawBookings.cancelled ?? 0) : 0;

  const totalRooms = Number(rooms.total || 0);
  const occupiedRooms = Number(rooms.occupied || 0);
  const availableRooms = Number(rooms.available || 0);
  const reservedRooms = Number(rooms.reserved || 0);
  const maintenanceRooms = Number((rooms.cleaning || 0) + (rooms.maintenance || 0));

  return (
    <div className="w-full max-w-xl rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/50 via-white to-amber-100/30 p-4 shadow-sm dark:border-amber-900/40 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900/80">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between border-b border-amber-200/60 pb-2 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
              Báo cáo Tổng quan Kinh doanh
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Số liệu thời gian thực từ hệ thống Quản trị Khách sạn
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          <CheckCircle2 className="h-3 w-3" /> Trực tiếp
        </span>
      </div>

      {/* Grid KPI Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {/* Doanh thu hôm nay */}
        <div className="rounded-xl border border-gray-100 bg-white/90 p-2.5 shadow-xs dark:border-gray-700/60 dark:bg-gray-800">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <span className="text-[11px] font-medium">Doanh thu hôm nay</span>
            <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div className="mt-1 text-sm font-extrabold text-gray-900 dark:text-white">
            {formatCurrency(revenueToday)}
          </div>
          <div className="mt-0.5 text-[10px] text-gray-400">Đã thanh toán</div>
        </div>

        {/* Doanh thu tháng này */}
        <div className="rounded-xl border border-gray-100 bg-white/90 p-2.5 shadow-xs dark:border-gray-700/60 dark:bg-gray-800">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <span className="text-[11px] font-medium">Doanh thu tháng này</span>
            <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <div className="mt-1 text-sm font-extrabold text-amber-600 dark:text-amber-400">
            {formatCurrency(revenueThisMonth)}
          </div>
          <div className="mt-0.5 text-[10px] text-gray-400">Tháng hiện tại</div>
        </div>

        {/* Công suất lấp đầy */}
        <div className="rounded-xl border border-gray-100 bg-white/90 p-2.5 shadow-xs dark:border-gray-700/60 dark:bg-gray-800">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <span className="text-[11px] font-medium">Công suất phòng</span>
            <BedDouble className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <div className="mt-1 text-sm font-extrabold text-blue-600 dark:text-blue-400">
            {occupancyRate}%
          </div>
          <div className="mt-0.5 text-[10px] text-gray-400">
            {occupiedRooms}/{totalRooms} phòng đang ở
          </div>
        </div>

        {/* Đơn đặt hôm nay */}
        <div className="rounded-xl border border-gray-100 bg-white/90 p-2.5 shadow-xs dark:border-gray-700/60 dark:bg-gray-800">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <span className="text-[11px] font-medium">Đặt phòng hôm nay</span>
            <CalendarCheck className="h-3.5 w-3.5 text-purple-500" />
          </div>
          <div className="mt-1 text-sm font-extrabold text-purple-600 dark:text-purple-400">
            {totalBookingsToday} đơn
          </div>
          <div className="mt-0.5 text-[10px] text-gray-400">Tạo trong ngày</div>
        </div>

        {/* Khách hàng mới */}
        <div className="rounded-xl border border-gray-100 bg-white/90 p-2.5 shadow-xs dark:border-gray-700/60 dark:bg-gray-800">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <span className="text-[11px] font-medium">Khách hàng mới</span>
            <Users className="h-3.5 w-3.5 text-indigo-500" />
          </div>
          <div className="mt-1 text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
            +{newCustomers}
          </div>
          <div className="mt-0.5 text-[10px] text-gray-400">Trong tháng này</div>
        </div>

        {/* Phòng trống */}
        <div className="rounded-xl border border-gray-100 bg-white/90 p-2.5 shadow-xs dark:border-gray-700/60 dark:bg-gray-800">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <span className="text-[11px] font-medium">Phòng sẵn sàng</span>
            <BedDouble className="h-3.5 w-3.5 text-teal-500" />
          </div>
          <div className="mt-1 text-sm font-extrabold text-teal-600 dark:text-teal-400">
            {availableRooms} phòng
          </div>
          <div className="mt-0.5 text-[10px] text-gray-400">Đã dọn dẹp sạch</div>
        </div>
      </div>

      {/* Chi tiết phân bổ trạng thái đặt phòng hôm nay */}
      <div className="mt-3 rounded-xl border border-purple-100 bg-purple-50/40 p-2.5 dark:border-purple-900/30 dark:bg-purple-950/20">
        <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-purple-900 dark:text-purple-300">
          <span className="flex items-center gap-1.5">
            <CalendarCheck className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            Trạng thái đơn hôm nay (Tổng: {totalBookingsToday} đơn)
          </span>
          <span className="text-[10px] font-normal text-purple-700 dark:text-purple-400">
            {confirmedBookings} xác nhận • {pendingBookings} chờ xử lý
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
          <div className="flex items-center gap-1.5 rounded-lg bg-white/80 px-2 py-1 shadow-2xs dark:bg-gray-800">
            <Clock className="h-3 w-3 text-amber-500" />
            <span className="text-[10px] text-gray-500 dark:text-gray-400">Chờ:</span>
            <strong className="text-gray-900 dark:text-white">{pendingBookings}</strong>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-white/80 px-2 py-1 shadow-2xs dark:bg-gray-800">
            <CheckCircle className="h-3 w-3 text-blue-500" />
            <span className="text-[10px] text-gray-500 dark:text-gray-400">Xác nhận:</span>
            <strong className="text-gray-900 dark:text-white">{confirmedBookings}</strong>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-white/80 px-2 py-1 shadow-2xs dark:bg-gray-800">
            <LogIn className="h-3 w-3 text-emerald-500" />
            <span className="text-[10px] text-gray-500 dark:text-gray-400">Đang ở:</span>
            <strong className="text-gray-900 dark:text-white">{checkedInBookings}</strong>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-white/80 px-2 py-1 shadow-2xs dark:bg-gray-800">
            <LogOut className="h-3 w-3 text-indigo-500" />
            <span className="text-[10px] text-gray-500 dark:text-gray-400">Đã trả:</span>
            <strong className="text-gray-900 dark:text-white">{checkedOutBookings}</strong>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-white/80 px-2 py-1 shadow-2xs dark:bg-gray-800">
            <XCircle className="h-3 w-3 text-rose-500" />
            <span className="text-[10px] text-gray-500 dark:text-gray-400">Hủy:</span>
            <strong className="text-gray-900 dark:text-white">{cancelledBookings}</strong>
          </div>
        </div>
      </div>

      {/* Tình trạng chi tiết buồng phòng */}
      <div className="mt-3 rounded-xl bg-gray-50 p-2.5 dark:bg-gray-800/60">
        <div className="flex items-center justify-between text-[11px] text-gray-600 dark:text-gray-300">
          <span className="font-semibold">Phân bổ buồng phòng ({totalRooms} phòng):</span>
          <span>{occupiedRooms} đang ở • {reservedRooms} giữ chỗ • {availableRooms} trống</span>
        </div>
        {/* Progress bar */}
        <div className="mt-1.5 flex h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            style={{ width: `${totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0}%` }}
            className="bg-blue-600"
            title={`Đang ở: ${occupiedRooms}`}
          />
          <div
            style={{ width: `${totalRooms > 0 ? (reservedRooms / totalRooms) * 100 : 0}%` }}
            className="bg-amber-500"
            title={`Đã đặt: ${reservedRooms}`}
          />
          <div
            style={{ width: `${totalRooms > 0 ? (availableRooms / totalRooms) * 100 : 0}%` }}
            className="bg-emerald-500"
            title={`Trống: ${availableRooms}`}
          />
          <div
            style={{ width: `${totalRooms > 0 ? (maintenanceRooms / totalRooms) * 100 : 0}%` }}
            className="bg-rose-500"
            title={`Bảo trì/Dọn dẹp: ${maintenanceRooms}`}
          />
        </div>
      </div>
    </div>
  );
};
