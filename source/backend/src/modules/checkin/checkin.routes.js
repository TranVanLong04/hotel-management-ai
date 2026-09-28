import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireStaff } from '../../middlewares/role.middleware.js';
import { uploadImage } from '../../middlewares/upload.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  bookingIdParamSchema,
  manualCheckinSchema,
} from './checkin.validation.js';
import * as checkinController from './checkin.controller.js';

const router = Router();

/**
 * Routes cho module Check-in.
 * Tất cả routes yêu cầu đăng nhập và có quyền staff hoặc admin.
 * Tham chiếu: docs/03-backend/phase7-checkin-checkout/README.md
 */

// POST /api/checkin/:bookingId/verify — AI face verification check-in
router.post(
  '/:bookingId/verify',
  authenticate,
  requireStaff,
  uploadImage,
  validate(bookingIdParamSchema),
  checkinController.verifyCheckin
);

// POST /api/checkin/:bookingId/confirm — Regular staff confirmation check-in
router.post(
  '/:bookingId/confirm',
  authenticate,
  requireStaff,
  validate(bookingIdParamSchema),
  checkinController.confirmCheckin
);

// POST /api/checkin/:bookingId/manual — Manual check-in with reason & ID number
router.post(
  '/:bookingId/manual',
  authenticate,
  requireStaff,
  validate(manualCheckinSchema),
  checkinController.manualCheckin
);

export default router;
