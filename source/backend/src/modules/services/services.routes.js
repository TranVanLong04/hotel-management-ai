import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  idParamSchema,
  listServicesSchema,
  createServiceSchema,
  updateServiceSchema,
} from './services.validation.js';
import * as servicesController from './services.controller.js';

const router = Router();

/**
 * Routes cho module Services.
 * Tham chiếu: docs/03-backend/phase8-service-invoice/README.md
 */

// GET /api/services — Public
router.get(
  '/',
  validate(listServicesSchema),
  servicesController.listServices
);

// GET /api/services/:id — Public
router.get(
  '/:id',
  validate(idParamSchema),
  servicesController.getService
);

// POST /api/services — Admin
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate(createServiceSchema),
  servicesController.createService
);

// PATCH /api/services/:id — Admin
router.patch(
  '/:id',
  authenticate,
  requireAdmin,
  validate(updateServiceSchema),
  servicesController.updateService
);

// DELETE /api/services/:id — Admin (Soft delete)
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  validate(idParamSchema),
  servicesController.deleteService
);

export default router;
