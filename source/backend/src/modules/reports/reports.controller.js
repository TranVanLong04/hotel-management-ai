import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as reportsService from './reports.service.js';

/**
 * Controller — HTTP handlers cho module Reports.
 * Tham chiếu: docs/03-backend/phase9-reporting/README.md
 */

/**
 * GET /api/reports/dashboard
 * Số liệu tổng quan Dashboard Admin (5 chỉ số song song).
 */
export const getDashboard = asyncHandler(async (_req, res) => {
  const data = await reportsService.getDashboard();
  sendSuccess(res, data);
});

/**
 * GET /api/reports/revenue?from=&to=&group_by=
 * Báo cáo doanh thu theo khoảng thời gian và gom nhóm (day, week, month).
 */
export const getRevenue = asyncHandler(async (req, res) => {
  const { from, to, group_by } = req.query;
  const data = await reportsService.getRevenue(from, to, group_by);
  sendSuccess(res, data);
});

/**
 * GET /api/reports/occupancy?from=&to=
 * Báo cáo công suất / tỷ lệ lấp đầy phòng theo khoảng thời gian.
 */
export const getOccupancy = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const data = await reportsService.getOccupancy(from, to);
  sendSuccess(res, data);
});

/**
 * GET /api/reports/bookings-by-status
 * Thống kê đặt phòng phân bổ theo các trạng thái.
 */
export const getBookingStats = asyncHandler(async (_req, res) => {
  const data = await reportsService.getBookingStats();
  sendSuccess(res, data);
});
