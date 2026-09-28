import { logger } from '../../config/logger.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import * as roomsRepo from './rooms.repository.js';

/**
 * Service — business logic cho module Rooms.
 * Tham chiếu: docs/03-backend/phase4-room-management/README.md
 *
 * Business rules:
 * - Số phòng phải unique
 * - room_type_id phải tồn tại (FK)
 * - Không xóa phòng nếu có active booking (confirmed/checked_in)
 */

/**
 * Lấy danh sách phòng.
 * @param {Object} filters - { page, limit, status, room_type_id, floor, is_active, search }
 * @returns {Promise<{ data: Object[], pagination: Object }>}
 */
export const listRooms = async (filters) => {
  return roomsRepo.list(filters);
};

/**
 * Lấy chi tiết phòng theo ID.
 * @param {string} id - UUID
 * @returns {Promise<Object>}
 */
export const getRoom = async (id) => {
  const room = await roomsRepo.findById(id);

  if (!room) {
    throw new NotFoundError('Room');
  }

  return room;
};

/**
 * Tạo phòng mới.
 * Check room_number unique trước.
 *
 * @param {Object} data - { room_number, room_type_id, floor, description }
 * @param {string} userId - UUID admin thực hiện
 * @returns {Promise<Object>} phòng vừa tạo
 */
export const createRoom = async (data, userId) => {
  // Check số phòng unique
  const existing = await roomsRepo.findByRoomNumber(data.room_number);
  if (existing) {
    throw new ConflictError('ROOM_NUMBER_EXISTS', 'Số phòng đã tồn tại');
  }

  // Insert — PG sẽ check FK (room_type_id) tự động
  const room = await roomsRepo.insert(data);

  logger.info({ roomId: room.id, createdBy: userId }, 'Admin tạo phòng mới');

  return room;
};

/**
 * Cập nhật phòng.
 * Nếu đổi room_number → check unique lại.
 *
 * @param {string} id - UUID
 * @param {Object} updates - fields cần cập nhật
 * @param {string} userId - UUID admin thực hiện
 * @returns {Promise<Object>} phòng đã cập nhật
 */
export const updateRoom = async (id, updates, userId) => {
  // Kiểm tra phòng tồn tại
  const existing = await roomsRepo.findById(id);
  if (!existing) {
    throw new NotFoundError('Room');
  }

  // Nếu đổi room_number → check unique
  if (updates.room_number && updates.room_number !== existing.room_number) {
    const duplicate = await roomsRepo.findByRoomNumber(updates.room_number);
    if (duplicate && duplicate.id !== id) {
      throw new ConflictError('ROOM_NUMBER_EXISTS', 'Số phòng đã tồn tại');
    }
  }

  const updatedRoom = await roomsRepo.update(id, updates);

  logger.info({ roomId: id, updatedBy: userId }, 'Admin cập nhật phòng');

  return updatedRoom;
};

/**
 * Cập nhật trạng thái phòng.
 * Dùng cho staff đổi available/cleaning/maintenance.
 *
 * @param {string} id - UUID
 * @param {string} status - trạng thái mới
 * @param {string} userId - UUID staff/admin thực hiện
 * @returns {Promise<Object>} phòng đã cập nhật
 */
export const updateRoomStatus = async (id, status, userId) => {
  // Kiểm tra phòng tồn tại
  const existing = await roomsRepo.findById(id);
  if (!existing) {
    throw new NotFoundError('Room');
  }

  const updatedRoom = await roomsRepo.updateStatus(id, status);

  logger.info(
    { roomId: id, oldStatus: existing.status, newStatus: status, updatedBy: userId },
    'Staff/Admin cập nhật trạng thái phòng'
  );

  return updatedRoom;
};

/**
 * Xóa phòng (soft delete).
 * KHÔNG cho xóa nếu có active booking (confirmed/checked_in).
 *
 * @param {string} id - UUID
 * @param {string} userId - UUID admin thực hiện
 * @returns {Promise<Object>} phòng đã soft delete
 */
export const deleteRoom = async (id, userId) => {
  // Kiểm tra phòng tồn tại
  const existing = await roomsRepo.findById(id);
  if (!existing) {
    throw new NotFoundError('Room');
  }

  // Business rule: không xóa nếu có active booking
  const hasBooking = await roomsRepo.hasActiveBooking(id);
  if (hasBooking) {
    throw new ConflictError(
      'ROOM_HAS_ACTIVE_BOOKING',
      'Không thể xóa phòng vì còn booking đang hoạt động'
    );
  }

  const deletedRoom = await roomsRepo.softDelete(id);

  logger.info({ roomId: id, deletedBy: userId }, 'Admin xóa phòng');

  return deletedRoom;
};

/**
 * Tìm phòng trống trong khoảng thời gian.
 * @param {Object} params - { check_in, check_out, guests, room_type_id }
 * @returns {Promise<Object[]>} danh sách phòng trống
 */
export const findAvailableRooms = async ({ check_in, check_out, guests, room_type_id }) => {
  return roomsRepo.findAvailable({
    checkIn: check_in,
    checkOut: check_out,
    guests,
    roomTypeId: room_type_id,
  });
};
