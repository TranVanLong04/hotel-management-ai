import { logger } from '../../config/logger.js';
import { NotFoundError, ForbiddenError } from '../../utils/errors.js';
import * as usersRepo from './users.repository.js';

/**
 * Service — business logic cho module Users (admin).
 * Tham chiếu: docs/03-backend/phase3-user-management/README.md
 *
 * Self-protection: admin KHÔNG được phép:
 * - Tự đổi role của mình
 * - Tự khóa mình
 * - Tự xóa mình
 */

/**
 * Lấy danh sách users (admin).
 * @param {Object} filters - { page, limit, role, is_active, search }
 * @returns {Promise<{ data: Object[], pagination: Object }>}
 */
export const listUsers = async (filters) => {
  return usersRepo.list(filters);
};

/**
 * Lấy chi tiết user theo ID.
 * @param {string} id - UUID
 * @returns {Promise<Object>} user
 */
export const getUser = async (id) => {
  const user = await usersRepo.findById(id);

  if (!user) {
    throw new NotFoundError('User');
  }

  return user;
};

/**
 * Cập nhật user (admin).
 * Không cho admin tự đổi role của chính mình.
 *
 * @param {string} id - UUID user cần update
 * @param {Object} updates - { full_name?, phone?, role? }
 * @param {string} currentUserId - UUID admin đang thao tác
 * @returns {Promise<Object>} user đã cập nhật
 */
export const updateUser = async (id, updates, currentUserId) => {
  // Self-protection: không cho admin tự đổi role của mình
  if (id === currentUserId && updates.role) {
    throw new ForbiddenError('Không thể tự thay đổi role của chính mình');
  }

  // Kiểm tra user tồn tại
  const existingUser = await usersRepo.findById(id);
  if (!existingUser) {
    throw new NotFoundError('User');
  }

  const updatedUser = await usersRepo.update(id, updates);

  logger.info({ userId: id, updatedBy: currentUserId }, 'Admin cập nhật user');

  return updatedUser;
};

/**
 * Cập nhật trạng thái user (khóa/mở).
 * Không cho admin tự khóa chính mình.
 *
 * @param {string} id - UUID user cần update
 * @param {boolean} isActive - trạng thái mới
 * @param {string} currentUserId - UUID admin đang thao tác
 * @returns {Promise<Object>} user đã cập nhật
 */
export const updateStatus = async (id, isActive, currentUserId) => {
  // Self-protection: không cho admin tự khóa mình
  if (id === currentUserId) {
    throw new ForbiddenError('Không thể tự thay đổi trạng thái của chính mình');
  }

  // Kiểm tra user tồn tại
  const existingUser = await usersRepo.findById(id);
  if (!existingUser) {
    throw new NotFoundError('User');
  }

  const updatedUser = await usersRepo.update(id, { is_active: isActive });

  logger.info(
    { userId: id, isActive, updatedBy: currentUserId },
    'Admin cập nhật trạng thái user'
  );

  return updatedUser;
};

/**
 * Soft delete user.
 * Không cho admin tự xóa chính mình.
 *
 * @param {string} id - UUID user cần xóa
 * @param {string} currentUserId - UUID admin đang thao tác
 * @returns {Promise<Object>} user đã soft delete
 */
export const deleteUser = async (id, currentUserId) => {
  // Self-protection: không cho admin tự xóa mình
  if (id === currentUserId) {
    throw new ForbiddenError('Không thể tự xóa tài khoản của chính mình');
  }

  // Kiểm tra user tồn tại
  const existingUser = await usersRepo.findById(id);
  if (!existingUser) {
    throw new NotFoundError('User');
  }

  const deletedUser = await usersRepo.softDelete(id);

  logger.info({ userId: id, deletedBy: currentUserId }, 'Admin soft delete user');

  return deletedUser;
};
