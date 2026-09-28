import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/role.middleware.js';
import {
  listRoomTypesSchema,
  idParamSchema,
  createRoomTypeSchema,
  updateRoomTypeSchema,
} from './room-types.validation.js';
import * as roomTypesController from './room-types.controller.js';

/**
 * Routes — Room Types module.
 * Tham chiếu: docs/03-backend/phase4-room-management/README.md
 *
 * GET    /api/room-types      → public list
 * GET    /api/room-types/:id  → public detail
 * POST   /api/room-types      → admin create
 * PATCH  /api/room-types/:id  → admin update
 * DELETE /api/room-types/:id  → admin delete
 */
const router = Router();

// === Public routes — không cần authenticate ===
router.get('/', validate(listRoomTypesSchema), roomTypesController.listRoomTypes);
router.get('/:id', validate(idParamSchema), roomTypesController.getRoomType);

// === Admin routes — require authenticate + requireAdmin ===
router.post('/', authenticate, requireAdmin, validate(createRoomTypeSchema), roomTypesController.createRoomType);
router.patch('/:id', authenticate, requireAdmin, validate(updateRoomTypeSchema), roomTypesController.updateRoomType);
router.delete('/:id', authenticate, requireAdmin, validate(idParamSchema), roomTypesController.deleteRoomType);

export default router;
