import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireStaff } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { idParamSchema } from './service-usages.validation.js';
import * as serviceUsagesController from './service-usages.controller.js';

const router = Router();

/**
 * Routes cho module Service Usages.
 * Tham chiếu: docs/03-backend/phase8-service-invoice/README.md
 */

// DELETE /api/service-usages/:id — Staff xóa dịch vụ (khi chưa checkout)
router.delete(
  '/:id',
  authenticate,
  requireStaff,
  validate(idParamSchema),
  serviceUsagesController.removeServiceUsage
);

export default router;
