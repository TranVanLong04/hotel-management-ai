import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireCustomer } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createPaymentSchema,
  momoCallbackSchema,
  vnpayCallbackSchema,
  bookingIdParamSchema,
} from './payments.validation.js';
import * as paymentsController from './payments.controller.js';

const router = Router();

/**
 * Routes cho Module Payments:
 * - POST /api/payments                 -> Tạo link thanh toán trực tuyến (Customer)
 * - GET  /api/payments/momo/return     -> Return URL từ MoMo (Public)
 * - POST /api/payments/momo/ipn        -> IPN Webhook từ MoMo (Public)
 * - GET  /api/payments/vnpay/return    -> Return URL từ VNPay (Public)
 * - GET  /api/payments/vnpay/ipn       -> IPN Webhook từ VNPay (Public)
 * - GET  /api/payments/booking/:bookingId -> Xem lịch sử thanh toán (Auth)
 */

// 0. Lấy danh sách cổng thanh toán khả dụng (Public)
router.get(
  '/gateways',
  paymentsController.getGateways
);

// 1. Tạo thanh toán trực tuyến
router.post(
  '/',
  authenticate,
  requireCustomer,
  validate(createPaymentSchema),
  paymentsController.createPayment
);

// 2. MoMo Callbacks
router.get(
  '/momo/return',
  validate(momoCallbackSchema),
  paymentsController.momoReturn
);

router.post(
  '/momo/ipn',
  paymentsController.momoIpn
);

// 3. VNPay Callbacks
router.get(
  '/vnpay/return',
  validate(vnpayCallbackSchema),
  paymentsController.vnpayReturn
);

router.get(
  '/vnpay/ipn',
  validate(vnpayCallbackSchema),
  paymentsController.vnpayIpn
);

// 4. Lịch sử thanh toán theo booking
router.get(
  '/booking/:bookingId',
  authenticate,
  validate(bookingIdParamSchema),
  paymentsController.getByBookingId
);

export default router;
