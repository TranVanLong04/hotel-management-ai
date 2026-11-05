import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireStaff } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { checkoutSchema, checkoutPreviewSchema } from './checkout.validation.js';
import * as checkoutController from './checkout.controller.js';

const router = Router();

/**
 * Routes cho module Check-out.
 * Tham chiếu: docs/03-backend/phase7-checkin-checkout/README.md & docs/08-features/06-checkout.md
 */

// GET /api/checkout/:bookingId/preview — Staff xem trước chi phí hóa đơn
router.get(
  '/:bookingId/preview',
  authenticate,
  requireStaff,
  validate(checkoutPreviewSchema),
  checkoutController.previewCheckout
);

// POST /api/checkout/:bookingId — Staff check-out & generate invoice
router.post(
  '/:bookingId',
  authenticate,
  requireStaff,
  validate(checkoutSchema),
  checkoutController.checkout
);

export default router;
