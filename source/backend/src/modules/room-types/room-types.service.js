import { logger } from '../../config/logger.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import * as roomTypesRepo from './room-types.repository.js';

/**
 * Service — business logic cho module Room Types.
 * Tham chiếu: docs/03-backend/phase4-room-management/README.md
 *
 * Business rules:
 * - Tên loại phòng phải unique
 * - Không xóa loại phòng nếu còn phòng active đang dùng
 */

/**
 * Lấy danh sách loại phòng.
 * @param {Object} filters - { page, limit, is_active, search }
 * @returns {Promise<{ data: Object[], pagination: Object }>}
 */
export const listRoomTypes = async (filters) => {
  return roomTypesRepo.list(filters);
};

/**
 * Lấy chi tiết loại phòng theo ID.
 * @param {string} id - UUID
 * @returns {Promise<Object>}
 */
export const getRoomType = async (id) => {
  const roomType = await roomTypesRepo.findById(id);

  if (!roomType) {
    throw new NotFoundError('Room type');
  }

  return roomType;
};

/**
 * Tạo loại phòng mới.
 * Check tên unique trước khi insert.
 *
 * @param {Object} data - { name, description, max_guests, base_price, amenities, image_url }
 * @param {string} userId - UUID admin thực hiện
 * @returns {Promise<Object>} room type vừa tạo
 */
export const createRoomType = async (data, userId) => {
  // Check tên unique
  const existing = await roomTypesRepo.findByName(data.name);
  if (existing) {
    throw new ConflictError('ROOM_TYPE_NAME_EXISTS', 'Tên loại phòng đã tồn tại');
  }

  const roomType = await roomTypesRepo.insert(data);

  logger.info({ roomTypeId: roomType.id, createdBy: userId }, 'Admin tạo loại phòng mới');

  return roomType;
};

/**
 * Cập nhật loại phòng.
 * Nếu đổi tên → check unique lại.
 *
 * @param {string} id - UUID
 * @param {Object} updates - fields cần cập nhật
 * @param {string} userId - UUID admin thực hiện
 * @returns {Promise<Object>} room type đã cập nhật
 */
export const updateRoomType = async (id, updates, userId) => {
  // Kiểm tra loại phòng tồn tại
  const existing = await roomTypesRepo.findById(id);
  if (!existing) {
    throw new NotFoundError('Room type');
  }

  // Nếu đổi tên → check unique (so với tên khác, không so với chính mình)
  if (updates.name && updates.name !== existing.name) {
    const duplicate = await roomTypesRepo.findByName(updates.name);
    if (duplicate && duplicate.id !== id) {
      throw new ConflictError('ROOM_TYPE_NAME_EXISTS', 'Tên loại phòng đã tồn tại');
    }
  }

  const updatedRoomType = await roomTypesRepo.update(id, updates);

  logger.info({ roomTypeId: id, updatedBy: userId }, 'Admin cập nhật loại phòng');

  return updatedRoomType;
};

/**
 * Xóa loại phòng (soft delete).
 * KHÔNG cho xóa nếu còn phòng active dùng loại này.
 *
 * @param {string} id - UUID
 * @param {string} userId - UUID admin thực hiện
 * @returns {Promise<Object>} room type đã soft delete
 */
export const deleteRoomType = async (id, userId) => {
  // Kiểm tra loại phòng tồn tại
  const existing = await roomTypesRepo.findById(id);
  if (!existing) {
    throw new NotFoundError('Room type');
  }

  // Business rule: không xóa nếu còn phòng active đang dùng
  const activeRooms = await roomTypesRepo.countActiveRooms(id);
  if (activeRooms > 0) {
    throw new ConflictError(
      'ROOM_TYPE_IN_USE',
      `Không thể xóa loại phòng vì còn ${activeRooms} phòng đang sử dụng`
    );
  }

  const deletedRoomType = await roomTypesRepo.softDelete(id);

  logger.info({ roomTypeId: id, deletedBy: userId }, 'Admin xóa loại phòng');

  return deletedRoomType;
};
