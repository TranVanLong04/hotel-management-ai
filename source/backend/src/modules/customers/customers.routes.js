import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireStaff, requireCustomer } from '../../middlewares/role.middleware.js';
import {
  updateProfileSchema,
  listCustomersSchema,
  idParamSchema,
} from './customers.validation.js';
import * as customersController from './customers.controller.js';

/**
 * Routes — Customers module.
 * Tham chiếu: docs/03-backend/phase3-user-management/README.md
 *
 * LƯU Ý: /me PHẢI đặt TRƯỚC /:id
 * Nếu đặt ngược, Express parse "me" thành req.params.id → lỗi.
 *
 * GET   /api/customers/me   → authenticate → getMyProfile
 * PATCH /api/customers/me   → authenticate + requireCustomer → updateMyProfile
 * GET   /api/customers      → authenticate + requireStaff → listCustomers
 * GET   /api/customers/:id  → authenticate + requireStaff → getCustomerById
 */
const router = Router();

// Tất cả routes cần authenticate
router.use(authenticate);

// === /me routes — PHẢI đặt trước /:id ===
router.get('/me', customersController.getMyProfile);
router.patch('/me', requireCustomer, validate(updateProfileSchema), customersController.updateMyProfile);

// === Staff/Admin routes ===
router.get('/', requireStaff, validate(listCustomersSchema), customersController.listCustomers);
router.get('/:id', requireStaff, validate(idParamSchema), customersController.getCustomerById);

export default router;
