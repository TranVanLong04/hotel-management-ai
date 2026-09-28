import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireStaff } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  idParamSchema,
  listInvoicesSchema,
  addPaymentSchema,
} from './invoices.validation.js';
import * as invoicesController from './invoices.controller.js';

const router = Router();

/**
 * Routes cho module Invoices.
 * Tham chiếu: docs/03-backend/phase8-service-invoice/README.md
 */

// GET /api/invoices — Danh sách hóa đơn (Customer xem của mình, Staff/Admin xem tất cả)
router.get(
  '/',
  authenticate,
  validate(listInvoicesSchema),
  invoicesController.listInvoices
);

// GET /api/invoices/:id — Chi tiết hóa đơn
router.get(
  '/:id',
  authenticate,
  validate(idParamSchema),
  invoicesController.getInvoice
);

// POST /api/invoices/:id/payments — Staff thêm khoản thanh toán bổ sung
router.post(
  '/:id/payments',
  authenticate,
  requireStaff,
  validate(addPaymentSchema),
  invoicesController.addPayment
);

export default router;
