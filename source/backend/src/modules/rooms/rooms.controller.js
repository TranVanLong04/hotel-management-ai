import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendList } from '../../utils/response.js';
import * as roomsService from './rooms.service.js';

/**
 * Controller — HTTP handlers cho module Rooms.
 * Tham chiếu: docs/03-backend/phase4-room-management/README.md
 */

/**
 * GET /api/rooms
 * Public — không cần authenticate
 * Query: { page, limit, status, room_type_id, floor, is_active, search }
 */
export const listRooms = asyncHandler(async (req, res) => {
  const { data, pagination } = await roomsService.listRooms(req.query);

  sendList(res, data, pagination);
});

/**
 * GET /api/rooms/available
 * Public — không cần authenticate
 * Query: { check_in, check_out, guests, room_type_id }
 */
export const getAvailableRooms = asyncHandler(async (req, res) => {
  const rooms = await roomsService.findAvailableRooms(req.query);

  sendSuccess(res, rooms, 'Tìm phòng trống thành công');
});

/**
 * GET /api/rooms/:id
 * Public — không cần authenticate
 */
export const getRoom = asyncHandler(async (req, res) => {
  const room = await roomsService.getRoom(req.params.id);

  sendSuccess(res, room);
});

/**
 * POST /api/rooms
 * Admin only
 * Body: { room_number, room_type_id, floor, description }
 */
export const createRoom = asyncHandler(async (req, res) => {
  const room = await roomsService.createRoom(req.body, req.user.sub);

  sendCreated(res, room, 'Tạo phòng thành công');
});

/**
 * PATCH /api/rooms/:id
 * Admin only
 * Body: { room_number?, room_type_id?, floor?, description? }
 */
export const updateRoom = asyncHandler(async (req, res) => {
  const updatedRoom = await roomsService.updateRoom(
    req.params.id,
    req.body,
    req.user.sub
  );

  sendSuccess(res, updatedRoom, 'Cập nhật phòng thành công');
});

/**
 * PATCH /api/rooms/:id/status
 * Staff/Admin
 * Body: { status }
 */
export const updateRoomStatus = asyncHandler(async (req, res) => {
  const updatedRoom = await roomsService.updateRoomStatus(
    req.params.id,
    req.body.status,
    req.user.sub
  );

  sendSuccess(res, updatedRoom, 'Cập nhật trạng thái phòng thành công');
});

/**
 * DELETE /api/rooms/:id
 * Admin only — soft delete
 */
export const deleteRoom = asyncHandler(async (req, res) => {
  const deletedRoom = await roomsService.deleteRoom(
    req.params.id,
    req.user.sub
  );

  sendSuccess(res, deletedRoom, 'Xóa phòng thành công');
});
