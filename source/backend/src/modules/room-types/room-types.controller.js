import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendList } from '../../utils/response.js';
import * as roomTypesService from './room-types.service.js';

/**
 * Controller — HTTP handlers cho module Room Types.
 * Tham chiếu: docs/03-backend/phase4-room-management/README.md
 */

/**
 * GET /api/room-types
 * Public — không cần authenticate
 * Query: { page, limit, is_active, search }
 */
export const listRoomTypes = asyncHandler(async (req, res) => {
  const { data, pagination } = await roomTypesService.listRoomTypes(req.query);

  sendList(res, data, pagination);
});

/**
 * GET /api/room-types/:id
 * Public — không cần authenticate
 */
export const getRoomType = asyncHandler(async (req, res) => {
  const roomType = await roomTypesService.getRoomType(req.params.id);

  sendSuccess(res, roomType);
});

/**
 * POST /api/room-types
 * Admin only
 * Body: { name, description, max_guests, base_price, amenities, image_url }
 */
export const createRoomType = asyncHandler(async (req, res) => {
  const roomType = await roomTypesService.createRoomType(req.body, req.user.sub);

  sendCreated(res, roomType, 'Tạo loại phòng thành công');
});

/**
 * PATCH /api/room-types/:id
 * Admin only
 * Body: { name?, description?, max_guests?, base_price?, amenities?, image_url? }
 */
export const updateRoomType = asyncHandler(async (req, res) => {
  const updatedRoomType = await roomTypesService.updateRoomType(
    req.params.id,
    req.body,
    req.user.sub
  );

  sendSuccess(res, updatedRoomType, 'Cập nhật loại phòng thành công');
});

/**
 * DELETE /api/room-types/:id
 * Admin only — soft delete
 */
export const deleteRoomType = asyncHandler(async (req, res) => {
  const deletedRoomType = await roomTypesService.deleteRoomType(
    req.params.id,
    req.user.sub
  );

  sendSuccess(res, deletedRoomType, 'Xóa loại phòng thành công');
});
