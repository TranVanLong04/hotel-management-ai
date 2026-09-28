import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireCustomer, requireStaff } from '../../middlewares/role.middleware.js';
import {
  createBookingSchema,
  listBookingsSchema,
  idParamSchema,
  cancelBookingSchema,
} from './bookings.validation.js';
import * as bookingsController from './bookings.controller.js';
import * as serviceUsagesController from '../service-usages/service-usages.controller.js';
import {
  bookingIdParamSchema,
  addServiceUsageSchema,
} from '../service-usages/service-usages.validation.js';

/**
 * Routes — Bookings module.
 * Tham chiếu: docs/03-backend/phase5-booking/README.md
 *
 * POST /api/bookings              → customer tạo booking
 * GET  /api/bookings              → list (customer: own, staff: all)
 * GET  /api/bookings/:id          → detail (ownership check)
 * POST /api/bookings/:id/confirm  → staff xác nhận
 * POST /api/bookings/:id/cancel   → customer/staff hủy
 */
const router = Router();

// === Customer tạo booking ===
router.post(
  '/',
  authenticate,
  requireCustomer,
  validate(createBookingSchema),
  bookingsController.createBooking
);

// === List bookings — phân luồng theo role trong controller ===
router.get(
  '/',
  authenticate,
  validate(listBookingsSchema),
  bookingsController.listBookings
);

// === Chi tiết booking — ownership check trong service ===
router.get(
  '/:id',
  authenticate,
  validate(idParamSchema),
  bookingsController.getBooking
);

// === Staff xác nhận booking ===
router.post(
  '/:id/confirm',
  authenticate,
  requireStaff,
  validate(idParamSchema),
  bookingsController.confirmBooking
);

// === Customer/Staff hủy booking ===
router.post(
  '/:id/cancel',
  authenticate,
  validate(cancelBookingSchema),
  bookingsController.cancelBooking
);

// === Dịch vụ của booking (Phase 8: Service Usages) ===
// GET /api/bookings/:bookingId/services — Xem danh sách dịch vụ của booking (Customer: own, Staff: all)
router.get(
  '/:bookingId/services',
  authenticate,
  validate(bookingIdParamSchema),
  serviceUsagesController.listBookingServices
);

// POST /api/bookings/:bookingId/services — Staff thêm dịch vụ cho booking (khi checked_in)
router.post(
  '/:bookingId/services',
  authenticate,
  requireStaff,
  validate(addServiceUsageSchema),
  serviceUsagesController.addService
);

export default router;
