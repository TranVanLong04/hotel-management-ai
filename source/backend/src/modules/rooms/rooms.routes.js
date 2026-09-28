import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin, requireStaff } from '../../middlewares/role.middleware.js';
import {
  listRoomsSchema,
  idParamSchema,
  createRoomSchema,
  updateRoomSchema,
  updateStatusSchema,
  availableRoomsSchema,
} from './rooms.validation.js';
import * as roomsController from './rooms.controller.js';

/**
 * Routes — Rooms module.
 * Tham chiếu: docs/03-backend/phase4-room-management/README.md
 *
 * QUAN TRỌNG: /available PHẢI đặt TRƯỚC /:id
 *
 * GET    /api/rooms            → public list (filter, search, pagination)
 * GET    /api/rooms/available  → public tìm phòng trống
 * GET    /api/rooms/:id        → public detail
 * POST   /api/rooms            → admin create
 * PATCH  /api/rooms/:id        → admin update
 * PATCH  /api/rooms/:id/status → staff/admin update status
 * DELETE /api/rooms/:id        → admin delete
 */
const router = Router();

// === Public routes — không cần authenticate ===
router.get('/', validate(listRoomsSchema), roomsController.listRooms);
router.get('/available', validate(availableRoomsSchema), roomsController.getAvailableRooms);  // TRƯỚC /:id
router.get('/:id', validate(idParamSchema), roomsController.getRoom);

// === Admin routes ===
router.post('/', authenticate, requireAdmin, validate(createRoomSchema), roomsController.createRoom);
router.patch('/:id', authenticate, requireAdmin, validate(updateRoomSchema), roomsController.updateRoom);

// === Staff/Admin route ===
router.patch('/:id/status', authenticate, requireStaff, validate(updateStatusSchema), roomsController.updateRoomStatus);

// === Admin delete ===
router.delete('/:id', authenticate, requireAdmin, validate(idParamSchema), roomsController.deleteRoom);

export default router;
