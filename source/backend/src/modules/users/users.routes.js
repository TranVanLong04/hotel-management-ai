import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/role.middleware.js';
import {
  listUsersSchema,
  idParamSchema,
  updateUserSchema,
  updateStatusSchema,
} from './users.validation.js';
import * as usersController from './users.controller.js';

/**
 * Routes — Users module (admin only).
 * Tham chiếu: docs/03-backend/phase3-user-management/README.md
 *
 * Tất cả routes đều require authenticate + requireAdmin.
 *
 * GET    /api/users          → list (filter, search, pagination)
 * GET    /api/users/:id      → detail
 * PATCH  /api/users/:id      → update
 * PATCH  /api/users/:id/status → update status
 * DELETE /api/users/:id      → soft delete
 */
const router = Router();

// Tất cả routes trong module này require admin
router.use(authenticate, requireAdmin);

router.get('/', validate(listUsersSchema), usersController.listUsers);
router.get('/:id', validate(idParamSchema), usersController.getUser);
router.patch('/:id', validate(updateUserSchema), usersController.updateUser);
router.patch('/:id/status', validate(updateStatusSchema), usersController.updateStatus);
router.delete('/:id', validate(idParamSchema), usersController.deleteUser);

export default router;
