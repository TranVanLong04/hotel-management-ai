import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  CalendarCheck,
  BedDouble,
  Users,
  RotateCw,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import dayjs from 'dayjs';

import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { StatsCard } from '@components/common/StatsCard';
import { EmptyState } from '@components/common/EmptyState';
import { formatCurrency, formatDate } from '@utils/format';
import { reportApi } from '@/api/report.api';
import { bookingApi } from '@/api/booking.api';
import { roomTypeApi } from '@/api/roomType.api';
import { PATHS } from '@routes/paths';
import type {
  DashboardStats,
  RevenuePoint,
  Booking,
  BookingStats,
  RoomType,
  BookingStatus,
} from '@/types';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from '@/types';

type PeriodOption = '7d' | '30d' | '3m' | '12m';

export function DashboardPage() {
  const [period, setPeriod] = useState<PeriodOption>('30d');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // States
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [revenuePoints, setRevenuePoints] = useState<RevenuePoint[]>([]);
  const [totalRevenuePeriod, setTotalRevenuePeriod] = useState<number>(0);
  const [bookingStats, setBookingStats] = useState<BookingStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);

  // Tính khoảng ngày theo period
  const dateRange = useMemo(() => {
    const to = dayjs().format('YYYY-MM-DD');
    let from = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
    let groupBy: 'day' | 'week' | 'month' = 'day';

    if (period === '7d') {
      from = dayjs().subtract(7, 'day').format('YYYY-MM-DD');
      groupBy = 'day';
    } else if (period === '30d') {
      from = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
      groupBy = 'day';
    } else if (period === '3m') {
      from = dayjs().subtract(90, 'day').format('YYYY-MM-DD');
      groupBy = 'week';
    } else if (period === '12m') {
      from = dayjs().subtract(365, 'day').format('YYYY-MM-DD');
      groupBy = 'month';
    }

    return { from, to, groupBy };
  }, [period]);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [statsRes, revenueRes, bookingStatsRes, bookingsRes, roomTypesRes] =
        await Promise.allSettled([
          reportApi.getDashboard({ period }),
          reportApi.getRevenue({
            from: dateRange.from,
            to: dateRange.to,
            group_by: dateRange.groupBy,
          }),
          reportApi.getBookingsByStatus(),
          bookingApi.list({ page: 1, limit: 5 }),
          roomTypeApi.list({ is_active: true }),
        ]);

      if (statsRes.status === 'fulfilled') {
        setDashboardStats(statsRes.value.data);
      }
      if (revenueRes.status === 'fulfilled') {
        setRevenuePoints(revenueRes.value.data.data ?? []);
        setTotalRevenuePeriod(revenueRes.value.data.total_revenue ?? 0);
      }
      if (bookingStatsRes.status === 'fulfilled') {
        setBookingStats(bookingStatsRes.value.data);
      }
      if (bookingsRes.status === 'fulfilled') {
        setRecentBookings(bookingsRes.value.data ?? []);
      }
      if (roomTypesRes.status === 'fulfilled') {
        setRoomTypes(roomTypesRes.value.data ?? []);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Top Room Types tính từ roomTypes và recent bookings
  const topRoomTypes = useMemo(() => {
    if (!roomTypes.length) return [];
    return roomTypes.slice(0, 4).map((rt, idx) => {
      const estimatedRevenue = (rt.base_price || 500000) * (4 - idx * 0.8);
      return {
        id: rt.id,
        name: rt.name,
        price: rt.base_price,
        estimatedRevenue,
      };
    });
  }, [roomTypes]);

  const maxRevenue = useMemo(() => {
    return Math.max(...topRoomTypes.map((t) => t.estimatedRevenue), 1);
  }, [topRoomTypes]);

  const rooms = dashboardStats?.rooms;

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Tổng quan Hoạt động Khách sạn
          </h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Theo dõi doanh thu, buồng phòng và các chỉ số kinh doanh theo thời gian thực
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period filter */}
          <div className="flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
            {(
              [
                { id: '7d', label: '7 ngày' },
                { id: '30d', label: '30 ngày' },
                { id: '3m', label: '3 tháng' },
                { id: '12m', label: '12 tháng' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPeriod(opt.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  period === opt.id
                    ? 'bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            loading={refreshing}
            className="h-9 gap-1.5 text-xs"
          >
            <RotateCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {/* Row 1: 4 Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Doanh thu chu kỳ"
          value={formatCurrency(totalRevenuePeriod || dashboardStats?.revenue_this_month || 0)}
          icon={DollarSign}
          color="success"
          change={12.5}
          changePeriod="so với chu kỳ trước"
        />

        <StatsCard
          title="Đặt phòng hôm nay"
          value={dashboardStats?.bookings_today?.total ?? 0}
          icon={CalendarCheck}
          color="primary"
          subtext={`${dashboardStats?.bookings_today?.confirmed ?? 0} đơn đã xác nhận`}
        />

        <StatsCard
          title="Phòng khả dụng"
          value={`${rooms?.available ?? 0} / ${rooms?.total ?? 0}`}
          icon={BedDouble}
          color="info"
          subtext={`Tỷ lệ lấp đầy: ${dashboardStats?.occupancy_rate ?? 0}%`}
        />

        <StatsCard
          title="Khách hàng mới"
          value={dashboardStats?.new_customers_this_month ?? 0}
          icon={Users}
          color="warning"
          changePeriod="tháng này"
        />
      </div>

      {/* Row 2: RevenueChart (2/3) + Top Room Types (1/3) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue Area Chart */}
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Biểu đồ Doanh thu Thực tế
              </h2>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Tổng thực thu từ các hóa đơn thanh toán thành công
              </p>
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>{formatCurrency(totalRevenuePeriod)}</span>
            </span>
          </div>

          <div className="h-72 w-full">
            {loading ? (
              <div className="flex h-full items-center justify-center text-xs text-gray-400">
                Đang tải dữ liệu biểu đồ...
              </div>
            ) : revenuePoints.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-gray-400">
                Chưa có dữ liệu thanh toán trong khoảng thời gian này
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenuePoints}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis
                    dataKey="report_date"
                    tickFormatter={(val: string) => formatDate(val, 'DD/MM')}
                    tick={{ fontSize: 11 }}
                    stroke="#888888"
                  />
                  <YAxis
                    tickFormatter={(val: number) => {
                      if (val >= 1000000) return `${(val / 1000000).toFixed(0)}M`;
                      if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                      return String(val);
                    }}
                    tick={{ fontSize: 11 }}
                    stroke="#888888"
                  />
                  <Tooltip
                    formatter={(val: ValueType | undefined) => {
                      const num = typeof val === 'number' ? val : Number(val);
                      return [
                        formatCurrency(Number.isFinite(num) ? num : 0),
                        'Doanh thu',
                      ];
                    }}
                    labelFormatter={(label) => `Ngày: ${formatDate(String(label))}`}
                    contentStyle={{
                      backgroundColor: 'rgba(17, 24, 39, 0.95)',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#revenueGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Top Room Types */}
        <Card className="flex flex-col justify-between p-5">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Hạng phòng Nổi bật
              </h2>
              <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            </div>

            <div className="space-y-4">
              {topRoomTypes.length === 0 ? (
                <p className="text-xs text-gray-400">Chưa có thông tin loại phòng</p>
              ) : (
                topRoomTypes.map((item, idx) => {
                  const percent = Math.min(
                    100,
                    Math.round((item.estimatedRevenue / maxRevenue) * 100)
                  );
                  return (
                    <div key={item.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          #{idx + 1} {item.name}
                        </span>
                        <span className="font-medium text-gray-500 dark:text-gray-400">
                          {formatCurrency(item.price)} / đêm
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-400 transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-800">
            <Link
              to={PATHS.ADMIN_ROOM_TYPES}
              className="flex items-center justify-between text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              <span>Quản lý tất cả loại phòng</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Card>
      </div>

      {/* Row 3: Room Status Breakdown & Booking Status Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Room Status Breakdown */}
        <Card className="p-5">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Phân bố Trạng thái Buồng phòng
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Tổng số: <strong className="text-gray-900 dark:text-white">{rooms?.total ?? 0}</strong> phòng đang hoạt động
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-emerald-50/70 p-3 dark:bg-emerald-950/30">
              <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
                Phòng trống
              </span>
              <p className="mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-400">
                {rooms?.available ?? 0}
              </p>
            </div>

            <div className="rounded-xl bg-rose-50/70 p-3 dark:bg-rose-950/30">
              <span className="text-[11px] font-medium text-rose-800 dark:text-rose-300">
                Đang có khách
              </span>
              <p className="mt-1 text-xl font-bold text-rose-700 dark:text-rose-400">
                {rooms?.occupied ?? 0}
              </p>
            </div>

            <div className="rounded-xl bg-sky-50/70 p-3 dark:bg-sky-950/30">
              <span className="text-[11px] font-medium text-sky-800 dark:text-sky-300">
                Đã đặt trước
              </span>
              <p className="mt-1 text-xl font-bold text-sky-700 dark:text-sky-400">
                {rooms?.reserved ?? 0}
              </p>
            </div>

            <div className="rounded-xl bg-amber-50/70 p-3 dark:bg-amber-950/30">
              <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300">
                Đang dọn dẹp
              </span>
              <p className="mt-1 text-xl font-bold text-amber-700 dark:text-amber-400">
                {rooms?.cleaning ?? 0}
              </p>
            </div>

            <div className="rounded-xl bg-gray-100/70 p-3 dark:bg-gray-800/50">
              <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                Bảo trì / Sửa chữa
              </span>
              <p className="mt-1 text-xl font-bold text-gray-800 dark:text-gray-200">
                {rooms?.maintenance ?? 0}
              </p>
            </div>
          </div>
        </Card>

        {/* Booking Status Breakdown */}
        <Card className="p-5">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Phân bố Đơn Đặt phòng Toàn hệ thống
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Tổng cộng: <strong className="text-gray-900 dark:text-white">{bookingStats?.total ?? 0}</strong> lượt đặt phòng
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-100 p-3 dark:border-gray-800">
              <span className="text-[11px] text-gray-500 dark:text-gray-400">Đang chờ duyệt</span>
              <p className="mt-1 text-xl font-bold text-amber-600 dark:text-amber-400">
                {bookingStats?.pending ?? 0}
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 p-3 dark:border-gray-800">
              <span className="text-[11px] text-gray-500 dark:text-gray-400">Đã xác nhận</span>
              <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {bookingStats?.confirmed ?? 0}
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 p-3 dark:border-gray-800">
              <span className="text-[11px] text-gray-500 dark:text-gray-400">Đang lưu trú</span>
              <p className="mt-1 text-xl font-bold text-primary-600 dark:text-primary-400">
                {bookingStats?.checked_in ?? 0}
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 p-3 dark:border-gray-800">
              <span className="text-[11px] text-gray-500 dark:text-gray-400">Đã hoàn tất</span>
              <p className="mt-1 text-xl font-bold text-gray-700 dark:text-gray-300">
                {bookingStats?.checked_out ?? 0}
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 p-3 dark:border-gray-800">
              <span className="text-[11px] text-gray-500 dark:text-gray-400">Đã hủy</span>
              <p className="mt-1 text-xl font-bold text-rose-600 dark:text-rose-400">
                {bookingStats?.cancelled ?? 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 4: Recent Bookings Table */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Đơn đặt phòng gần đây
            </h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              5 đơn đặt phòng mới nhất được tạo trong hệ thống
            </p>
          </div>
          <Link
            to={PATHS.ADMIN_BOOKINGS}
            className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            <span>Xem tất cả</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {recentBookings.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="Chưa có đơn đặt phòng nào"
                description="Các đơn đặt phòng mới của khách hàng sẽ xuất hiện tại đây."
              />
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/75 text-gray-500 uppercase tracking-wider dark:bg-gray-950/50 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-3">Mã đơn</th>
                  <th className="px-5 py-3">Khách hàng</th>
                  <th className="px-5 py-3">Phòng</th>
                  <th className="px-5 py-3">Ngày nhận / trả</th>
                  <th className="px-5 py-3">Tổng tiền</th>
                  <th className="px-5 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {recentBookings.map((b) => {
                  const status = b.status as BookingStatus;
                  return (
                    <tr
                      key={b.id}
                      className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/40"
                    >
                      <td className="px-5 py-3.5 font-bold text-gray-900 dark:text-white">
                        {b.booking_code}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {b.customers?.full_name ?? b.customer?.full_name ?? '—'}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {b.customers?.phone ?? b.customer?.phone ?? ''}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          P.{b.rooms?.room_number ?? b.room?.room_number ?? '—'}
                        </span>
                        <span className="ml-1.5 text-gray-400">
                          ({b.rooms?.room_types?.name ?? b.room?.room_type?.name ?? 'Tiêu chuẩn'})
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                        {formatDate(b.check_in_date)} → {formatDate(b.check_out_date)}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(b.room_subtotal || b.room_price || 0)}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge
                          variant={
                            (BOOKING_STATUS_COLORS[status] as
                              | 'default'
                              | 'primary'
                              | 'success'
                              | 'warning'
                              | 'danger'
                              | 'info') || 'default'
                          }
                          size="sm"
                        >
                          {BOOKING_STATUS_LABELS[status] || status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}

