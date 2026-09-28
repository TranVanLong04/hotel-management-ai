import { supabaseAdmin } from '../../config/supabase.js';
import { InternalError } from '../../utils/errors.js';
import { logger } from '../../config/logger.js';
import { BOOKING_STATUSES, PAYMENT_STATUSES } from '../../config/constants.js';

/**
 * Repository — truy vấn DB cho module Reports.
 * Tham chiếu: docs/03-backend/phase9-reporting/README.md
 */

/**
 * Thống kê số lượng phòng theo trạng thái (chỉ lấy is_active = true).
 * @returns {Promise<{ total: number, available: number, reserved: number, occupied: number, cleaning: number, maintenance: number }>}
 */
export const getRoomStats = async () => {
  const { data, error } = await supabaseAdmin
    .from('rooms')
    .select('status')
    .eq('is_active', true);

  if (error) {
    logger.error({ err: error }, 'ReportsRepository: getRoomStats failed');
    throw new InternalError('Lỗi thống kê trạng thái phòng');
  }

  const stats = {
    total: (data || []).length,
    available: 0,
    reserved: 0,
    occupied: 0,
    cleaning: 0,
    maintenance: 0,
  };

  for (const room of data || []) {
    if (stats[room.status] !== undefined) {
      stats[room.status]++;
    }
  }

  return stats;
};

/**
 * Thống kê số lượng booking tạo trong ngày hôm nay theo trạng thái.
 * @returns {Promise<{ total: number, pending: number, confirmed: number, checked_in: number, checked_out: number, cancelled: number }>}
 */
export const getBookingStatsToday = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStart = `${year}-${month}-${day}T00:00:00.000Z`;
  const todayEnd = `${year}-${month}-${day}T23:59:59.999Z`;

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('status')
    .gte('created_at', todayStart)
    .lte('created_at', todayEnd);

  if (error) {
    logger.error({ err: error }, 'ReportsRepository: getBookingStatsToday failed');
    throw new InternalError('Lỗi thống kê đặt phòng hôm nay');
  }

  const stats = {
    total: (data || []).length,
    pending: 0,
    confirmed: 0,
    checked_in: 0,
    checked_out: 0,
    cancelled: 0,
  };

  for (const b of data || []) {
    if (stats[b.status] !== undefined) {
      stats[b.status]++;
    }
  }

  return stats;
};

/**
 * Tính tổng doanh thu hôm nay: SUM(amount - refunded_amount) từ payments completed có paid_at hôm nay.
 * @returns {Promise<number>}
 */
export const getRevenueToday = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStart = `${year}-${month}-${day}T00:00:00.000Z`;
  const todayEnd = `${year}-${month}-${day}T23:59:59.999Z`;

  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('amount, refunded_amount')
    .eq('status', PAYMENT_STATUSES.COMPLETED)
    .gte('paid_at', todayStart)
    .lte('paid_at', todayEnd);

  if (error) {
    logger.error({ err: error }, 'ReportsRepository: getRevenueToday failed');
    throw new InternalError('Lỗi thống kê doanh thu hôm nay');
  }

  const revenue = (data || []).reduce(
    (sum, p) => sum + (Number(p.amount || 0) - Number(p.refunded_amount || 0)),
    0
  );

  return Math.max(0, revenue);
};

/**
 * Tính tổng doanh thu từ đầu tháng hiện tại đến nay: SUM(amount - refunded_amount).
 * @returns {Promise<number>}
 */
export const getRevenueThisMonth = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const monthStart = `${year}-${month}-01T00:00:00.000Z`;

  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('amount, refunded_amount')
    .eq('status', PAYMENT_STATUSES.COMPLETED)
    .gte('paid_at', monthStart);

  if (error) {
    logger.error({ err: error }, 'ReportsRepository: getRevenueThisMonth failed');
    throw new InternalError('Lỗi thống kê doanh thu tháng này');
  }

  const revenue = (data || []).reduce(
    (sum, p) => sum + (Number(p.amount || 0) - Number(p.refunded_amount || 0)),
    0
  );

  return Math.max(0, revenue);
};

/**
 * Đếm số lượng khách hàng mới tạo từ đầu tháng hiện tại.
 * @returns {Promise<number>}
 */
export const getNewCustomersThisMonth = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const monthStart = `${year}-${month}-01T00:00:00.000Z`;

  const { count, error } = await supabaseAdmin
    .from('customers')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', monthStart);

  if (error) {
    logger.error({ err: error }, 'ReportsRepository: getNewCustomersThisMonth failed');
    throw new InternalError('Lỗi thống kê khách hàng mới trong tháng');
  }

  return count || 0;
};

/**
 * Lấy báo cáo doanh thu theo ngày trong khoảng [from, to].
 * Thử gọi PostgreSQL function report_revenue trước, nếu chưa có thì fallback query bảng payments.
 * @param {string} from - YYYY-MM-DD
 * @param {string} to - YYYY-MM-DD
 * @returns {Promise<Array<{ report_date: string, revenue: number, payment_count: number }>>}
 */
export const getRevenueReport = async (from, to) => {
  try {
    const { data, error } = await supabaseAdmin.rpc('report_revenue', {
      p_from: from,
      p_to: to,
    });

    if (!error && data) {
      return data.map((row) => ({
        report_date: row.report_date,
        revenue: Number(row.revenue || 0),
        payment_count: Number(row.payment_count || 0),
      }));
    }

    if (error) {
      logger.warn({ err: error }, 'RPC report_revenue không khả dụng, sử dụng fallback query');
    }
  } catch (err) {
    logger.warn({ err }, 'Gọi RPC report_revenue thất bại, sử dụng fallback query');
  }

  // Fallback query trực tiếp từ payments
  const fromIso = `${from}T00:00:00.000Z`;
  const toIso = `${to}T23:59:59.999Z`;

  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('amount, refunded_amount, paid_at')
    .eq('status', PAYMENT_STATUSES.COMPLETED)
    .gte('paid_at', fromIso)
    .lte('paid_at', toIso);

  if (error) {
    logger.error({ err: error }, 'ReportsRepository: getRevenueReport fallback failed');
    throw new InternalError('Lỗi tạo báo cáo doanh thu');
  }

  const map = new Map();
  for (const p of data || []) {
    if (!p.paid_at) continue;
    const dateStr = p.paid_at.substring(0, 10);
    const existing = map.get(dateStr) || { report_date: dateStr, revenue: 0, payment_count: 0 };
    const netAmount = Number(p.amount || 0) - Number(p.refunded_amount || 0);
    existing.revenue += netAmount;
    existing.payment_count += 1;
    map.set(dateStr, existing);
  }

  return Array.from(map.values()).sort((a, b) => a.report_date.localeCompare(b.report_date));
};

/**
 * Lấy báo cáo công suất phòng theo ngày trong khoảng [from, to].
 * Thử gọi PostgreSQL function report_occupancy trước, nếu chưa có thì fallback query tính toán.
 * @param {string} from - YYYY-MM-DD
 * @param {string} to - YYYY-MM-DD
 * @returns {Promise<Array<{ report_date: string, total_rooms: number, occupied_rooms: number, occupancy_rate: number }>>}
 */
export const getOccupancyReport = async (from, to) => {
  try {
    const { data, error } = await supabaseAdmin.rpc('report_occupancy', {
      p_from: from,
      p_to: to,
    });

    if (!error && data) {
      return data.map((row) => ({
        report_date: row.report_date,
        total_rooms: Number(row.total_rooms || 0),
        occupied_rooms: Number(row.occupied_rooms || 0),
        occupancy_rate: Number(row.occupancy_rate || 0),
      }));
    }

    if (error) {
      logger.warn({ err: error }, 'RPC report_occupancy không khả dụng, sử dụng fallback query');
    }
  } catch (err) {
    logger.warn({ err }, 'Gọi RPC report_occupancy thất bại, sử dụng fallback query');
  }

  // Fallback query trực tiếp
  // 1. Đếm tổng số phòng đang active
  const { count: totalRoomsCount, error: roomsError } = await supabaseAdmin
    .from('rooms')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);

  if (roomsError) {
    logger.error({ err: roomsError }, 'ReportsRepository: getOccupancyReport rooms count failed');
    throw new InternalError('Lỗi đếm số lượng phòng');
  }

  const totalRooms = totalRoomsCount || 0;

  // 2. Lấy các booking checked_in hoặc checked_out có khả năng overlap
  const { data: bookings, error: bookingsError } = await supabaseAdmin
    .from('bookings')
    .select('room_id, check_in_date, check_out_date, status')
    .in('status', [BOOKING_STATUSES.CHECKED_IN, BOOKING_STATUSES.CHECKED_OUT])
    .lte('check_in_date', to)
    .gt('check_out_date', from);

  if (bookingsError) {
    logger.error({ err: bookingsError }, 'ReportsRepository: getOccupancyReport bookings query failed');
    throw new InternalError('Lỗi truy vấn booking cho báo cáo lấp đầy');
  }

  // Tạo chuỗi ngày từ from đến to
  const result = [];
  const currentDate = new Date(`${from}T00:00:00Z`);
  const endDate = new Date(`${to}T00:00:00Z`);

  while (currentDate <= endDate) {
    const dStr = currentDate.toISOString().substring(0, 10);

    // Overlap: check_in_date <= dStr AND check_out_date > dStr
    const occupiedRoomSet = new Set();
    for (const b of bookings || []) {
      if (b.check_in_date <= dStr && b.check_out_date > dStr && b.room_id) {
        occupiedRoomSet.add(b.room_id);
      }
    }

    const occupiedRooms = occupiedRoomSet.size;
    const occupancyRate = totalRooms > 0
      ? Math.round((occupiedRooms / totalRooms) * 100 * 100) / 100
      : 0;

    result.push({
      report_date: dStr,
      total_rooms: totalRooms,
      occupied_rooms: occupiedRooms,
      occupancy_rate: occupancyRate,
    });

    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return result;
};

/**
 * Thống kê tất cả bookings theo trạng thái.
 * @returns {Promise<{ total: number, pending: number, confirmed: number, checked_in: number, checked_out: number, cancelled: number }>}
 */
export const getBookingsByStatus = async () => {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('status');

  if (error) {
    logger.error({ err: error }, 'ReportsRepository: getBookingsByStatus failed');
    throw new InternalError('Lỗi thống kê trạng thái đặt phòng');
  }

  const stats = {
    total: (data || []).length,
    pending: 0,
    confirmed: 0,
    checked_in: 0,
    checked_out: 0,
    cancelled: 0,
  };

  for (const b of data || []) {
    if (stats[b.status] !== undefined) {
      stats[b.status]++;
    }
  }

  return stats;
};
