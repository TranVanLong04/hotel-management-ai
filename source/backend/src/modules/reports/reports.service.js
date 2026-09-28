import * as reportsRepository from './reports.repository.js';
import { REPORT_GROUP_BY } from './reports.validation.js';

/**
 * Service — xử lý nghiệp vụ cho module Reports.
 * Tham chiếu: docs/03-backend/phase9-reporting/README.md
 */

/**
 * Lấy dữ liệu tổng quan Admin Dashboard bằng 5 queries song song qua Promise.all.
 * @returns {Promise<Object>}
 */
export const getDashboard = async () => {
  const [
    rooms,
    bookingsToday,
    revenueToday,
    revenueThisMonth,
    newCustomersThisMonth,
  ] = await Promise.all([
    reportsRepository.getRoomStats(),
    reportsRepository.getBookingStatsToday(),
    reportsRepository.getRevenueToday(),
    reportsRepository.getRevenueThisMonth(),
    reportsRepository.getNewCustomersThisMonth(),
  ]);

  // Tính tỷ lệ lấp đầy hiện tại (tránh chia 0)
  const occupancyRate = rooms.total > 0
    ? Math.round((rooms.occupied / rooms.total) * 100 * 100) / 100
    : 0;

  return {
    rooms,
    bookings_today: bookingsToday,
    revenue_today: revenueToday,
    revenue_this_month: revenueThisMonth,
    new_customers_this_month: newCustomersThisMonth,
    occupancy_rate: occupancyRate,
  };
};

/**
 * Báo cáo doanh thu theo khoảng thời gian và gom nhóm (day/week/month).
 * @param {string} from - YYYY-MM-DD
 * @param {string} to - YYYY-MM-DD
 * @param {string} groupBy - 'day' | 'week' | 'month'
 * @returns {Promise<Object>}
 */
export const getRevenue = async (from, to, groupBy = REPORT_GROUP_BY.DAY) => {
  const dailyData = await reportsRepository.getRevenueReport(from, to);

  let formattedData = dailyData;

  if (groupBy === REPORT_GROUP_BY.WEEK) {
    const weekMap = new Map();
    for (const item of dailyData) {
      const d = new Date(`${item.report_date}T00:00:00Z`);
      const day = d.getUTCDay();
      // Tính ngày Thứ 2 của tuần đó
      const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      const weekKey = monday.toISOString().substring(0, 10);

      const existing = weekMap.get(weekKey) || {
        report_date: weekKey,
        revenue: 0,
        payment_count: 0,
      };
      existing.revenue += Number(item.revenue || 0);
      existing.payment_count += Number(item.payment_count || 0);
      weekMap.set(weekKey, existing);
    }
    formattedData = Array.from(weekMap.values()).sort((a, b) =>
      a.report_date.localeCompare(b.report_date)
    );
  } else if (groupBy === REPORT_GROUP_BY.MONTH) {
    const monthMap = new Map();
    for (const item of dailyData) {
      const monthKey = item.report_date.substring(0, 7); // YYYY-MM
      const existing = monthMap.get(monthKey) || {
        report_date: monthKey,
        revenue: 0,
        payment_count: 0,
      };
      existing.revenue += Number(item.revenue || 0);
      existing.payment_count += Number(item.payment_count || 0);
      monthMap.set(monthKey, existing);
    }
    formattedData = Array.from(monthMap.values()).sort((a, b) =>
      a.report_date.localeCompare(b.report_date)
    );
  }

  const totalRevenue = formattedData.reduce(
    (sum, item) => sum + Number(item.revenue || 0),
    0
  );

  return {
    period: {
      from,
      to,
      group_by: groupBy,
    },
    total_revenue: totalRevenue,
    data: formattedData,
  };
};

/**
 * Báo cáo tỷ lệ lấp đầy theo khoảng thời gian.
 * @param {string} from - YYYY-MM-DD
 * @param {string} to - YYYY-MM-DD
 * @returns {Promise<Object>}
 */
export const getOccupancy = async (from, to) => {
  const data = await reportsRepository.getOccupancyReport(from, to);

  const averageOccupancy = data.length > 0
    ? Math.round(
        (data.reduce((sum, item) => sum + Number(item.occupancy_rate || 0), 0) /
          data.length) *
          100
      ) / 100
    : 0;

  return {
    period: {
      from,
      to,
    },
    average_occupancy: averageOccupancy,
    data,
  };
};

/**
 * Thống kê đặt phòng phân bổ theo trạng thái.
 * @returns {Promise<Object>}
 */
export const getBookingStats = async () => {
  return await reportsRepository.getBookingsByStatus();
};
