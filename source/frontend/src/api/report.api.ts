import api from './axios';
import type {
  ApiResponse,
  DashboardStats,
  RevenueReportResponse,
  RevenueReportParams,
  OccupancyReportResponse,
  OccupancyReportParams,
  BookingStats,
} from '@/types';

/**
 * Report & Analytics API Client — Dành cho Dashboard và Trang Báo cáo (Admin)
 */
export const reportApi = {
  /**
   * Lấy số liệu tổng quan Dashboard (phòng, booking hôm nay, doanh thu hôm nay/tháng này, khách mới)
   */
  getDashboard: (params?: { period?: string }): Promise<ApiResponse<DashboardStats>> =>
    api.get('/reports/dashboard', { params }),

  /**
   * Báo cáo doanh thu theo khoảng thời gian và gom nhóm (day, week, month)
   */
  getRevenue: (params: RevenueReportParams): Promise<ApiResponse<RevenueReportResponse>> =>
    api.get('/reports/revenue', { params }),

  /**
   * Báo cáo tỷ lệ lấp đầy phòng theo khoảng ngày
   */
  getOccupancy: (params: OccupancyReportParams): Promise<ApiResponse<OccupancyReportResponse>> =>
    api.get('/reports/occupancy', { params }),

  /**
   * Thống kê tổng số booking phân bổ theo tất cả trạng thái
   */
  getBookingsByStatus: (): Promise<ApiResponse<BookingStats>> =>
    api.get('/reports/bookings-by-status'),
};

