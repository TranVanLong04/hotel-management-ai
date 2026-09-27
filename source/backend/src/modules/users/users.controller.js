import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, sendList } from '../../utils/response.js';
import * as usersService from './users.service.js';

/**
 * Controller — HTTP handlers cho module Users (admin).
 * Tham chiếu: docs/03-backend/phase3-user-management/README.md
 */

/**
 * GET /api/users
 * Query: { page, limit, role, is_active, search }
 */
export const listUsers = asyncHandler(async (req, res) => {
  const { data, pagination } = await usersService.listUsers(req.query);

  sendList(res, data, pagination);
});

/**
 * GET /api/users/:id
 */
export const getUser = asyncHandler(async (req, res) => {
  const user = await usersService.getUser(req.params.id);

  sendSuccess(res, user);
});

/**
 * PATCH /api/users/:id
 * Body: { full_name?, phone?, role? }
 */
export const updateUser = asyncHandler(async (req, res) => {
  const updatedUser = await usersService.updateUser(
    req.params.id,
    req.body,
    req.user.sub // currentUserId — từ JWT
  );

  sendSuccess(res, updatedUser, 'Cập nhật user thành công');
});

/**
 * PATCH /api/users/:id/status
 * Body: { is_active: boolean }
 */
export const updateStatus = asyncHandler(async (req, res) => {
  const updatedUser = await usersService.updateStatus(
    req.params.id,
    req.body.is_active,
    req.user.sub
  );

  sendSuccess(res, updatedUser, 'Cập nhật trạng thái thành công');
});

/**
 * DELETE /api/users/:id
 * Soft delete — set is_active = false
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const deletedUser = await usersService.deleteUser(
    req.params.id,
    req.user.sub
  );

  sendSuccess(res, deletedUser, 'Xóa user thành công');
});
