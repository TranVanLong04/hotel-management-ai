import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  dashboardSchema,
  revenueReportSchema,
  occupancyReportSchema,
} from './reports.validation.js';
import * as reportsController from './reports.controller.js';

const router = Router();

/**
 * Routes cho module Reports.
 * Tất cả endpoints chỉ dành cho Admin (authenticate + requireAdmin).
 * Tham chiếu: docs/03-backend/phase9-reporting/README.md
 */
router.use(authenticate, requireAdmin);

// GET /api/reports/dashboard — Tổng quan dashboard 5 số liệu
router.get(
  '/dashboard',
  validate(dashboardSchema),
  reportsController.getDashboard
);

// GET /api/reports/revenue?from=&to=&group_by= — Báo cáo doanh thu
router.get(
  '/revenue',
  validate(revenueReportSchema),
  reportsController.getRevenue
);

// GET /api/reports/occupancy?from=&to= — Báo cáo công suất phòng
router.get(
  '/occupancy',
  validate(occupancyReportSchema),
  reportsController.getOccupancy
);

// GET /api/reports/bookings-by-status — Thống kê booking theo trạng thái
router.get(
  '/bookings-by-status',
  reportsController.getBookingStats
);

export default router;
