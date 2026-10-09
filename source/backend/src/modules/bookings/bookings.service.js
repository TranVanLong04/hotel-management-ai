import { logger } from '../../config/logger.js';
import { NotFoundError, BadRequestError, ConflictError, ForbiddenError } from '../../utils/errors.js';
import { BOOKING_STATUSES } from '../../config/constants.js';
import * as bookingsRepo from './bookings.repository.js';

/**
 * Service — business logic cho module Bookings.
 * Tham chiếu: docs/03-backend/phase5-booking/README.md
 *
 * Business rules:
 * - Chỉ customer mới tạo booking
 * - Snapshot giá tại thời điểm đặt (room_price = base_price)
 * - Overlap do DB exclusion constraint chặn (PG 23P01)
 * - State machine: pending → confirmed/cancelled, confirmed → cancelled
 * - Customer chỉ xem/hủy booking của mình
 */

/**
 * Tạo booking mới.
 * Flow:
 * 1. Gọi repository createBookingWithLock (thực hiện RPC nguyên tử kèm lock & DB constraint)
 * 2. Log thông tin tạo booking
 *
 * @param {string} userId - UUID (từ JWT sub)
 * @param {Object} data - { room_id, check_in_date, check_out_date, number_of_guests, note }
 * @returns {Promise<Object>} booking vừa tạo
 */
export const createBooking = async (userId, data) => {
  const booking = await bookingsRepo.createBookingWithLock({
    userId,
    roomId: data.room_id,
    checkInDate: data.check_in_date,
    checkOutDate: data.check_out_date,
    numberOfGuests: data.number_of_guests,
    note: data.note || null,
  });

  logger.info(
    {
      bookingId: booking.id,
      bookingCode: booking.booking_code,
      customerId: booking.customer_id,
      roomId: data.room_id,
    },
    'Customer tạo booking mới (chờ thanh toán)'
  );

  return booking;
};

/**
 * Danh sách booking của customer hiện tại.
 * @param {string} userId - UUID (từ JWT sub)
 * @param {Object} filters - { page, limit, status }
 * @returns {Promise<{ data: Object[], pagination: Object }>}
 */
export const listMyBookings = async (userId, filters) => {
  // Tìm customer từ userId
  const customer = await bookingsRepo.findCustomerByUserId(userId);
  if (!customer) {
    throw new NotFoundError('Customer');
  }

  return bookingsRepo.listByCustomer(customer.id, filters);
};

/**
 * Danh sách tất cả bookings — cho staff/admin.
 * @param {Object} filters - { page, limit, status, customer_id, room_id, from, to, search }
 * @returns {Promise<{ data: Object[], pagination: Object }>}
 */
export const listAllBookings = async (filters) => {
  return bookingsRepo.listAll(filters);
};

/**
 * Xem chi tiết booking.
 * Customer chỉ được xem booking của mình.
 *
 * @param {string} id - UUID booking
 * @param {Object} user - { sub, role } từ JWT
 * @returns {Promise<Object>} booking chi tiết
 */
export const getBooking = async (id, user) => {
  const booking = await bookingsRepo.findById(id);
  if (!booking) {
    throw new NotFoundError('Booking');
  }

  // Ownership check — customer chỉ xem booking của mình
  if (user.role === 'customer') {
    if (booking.customers.user_id !== user.sub) {
      throw new ForbiddenError('Không có quyền xem booking này');
    }
  }

  return booking;
};

/**
 * Staff xác nhận booking — chỉ từ trạng thái pending.
 * State: pending → confirmed
 *
 * @param {string} id - UUID booking
 * @param {string} userId - UUID staff thực hiện
 * @returns {Promise<Object>} booking đã confirmed
 */
export const confirmBooking = async (id, userId) => {
  const booking = await bookingsRepo.findById(id);
  if (!booking) {
    throw new NotFoundError('Booking');
  }

  // Kiểm tra trạng thái — chỉ pending mới được confirm
  if (booking.status !== BOOKING_STATUSES.PENDING) {
    throw new ConflictError(
      'BOOKING_CANNOT_CONFIRM',
      `Không thể xác nhận booking ở trạng thái "${booking.status}"`
    );
  }

  const updatedBooking = await bookingsRepo.updateStatus(id, BOOKING_STATUSES.CONFIRMED);

  logger.info(
    { bookingId: id, confirmedBy: userId },
    'Staff xác nhận booking'
  );

  return updatedBooking;
};

/**
 * Hủy booking — customer (chỉ booking mình) hoặc staff.
 * State: pending_payment/pending/confirmed → cancelled
 *
 * @param {string} id - UUID booking
 * @param {Object} user - { sub, role } từ JWT
 * @param {string} [reason] - lý do hủy
 * @returns {Promise<Object>} booking đã cancelled
 */
export const cancelBooking = async (id, user, reason) => {
  const booking = await bookingsRepo.findById(id);
  if (!booking) {
    throw new NotFoundError('Booking');
  }

  // Ownership check — customer chỉ hủy booking của mình
  if (user.role === 'customer') {
    if (booking.customers.user_id !== user.sub) {
      throw new ForbiddenError('Không có quyền hủy booking này');
    }
  }

  // Kiểm tra trạng thái — pending_payment, pending, confirmed mới được cancel
  const cancellableStatuses = [
    BOOKING_STATUSES.PENDING_PAYMENT,
    BOOKING_STATUSES.PENDING,
    BOOKING_STATUSES.CONFIRMED,
  ];
  if (!cancellableStatuses.includes(booking.status)) {
    throw new ConflictError(
      'BOOKING_CANNOT_CANCEL',
      `Không thể hủy booking ở trạng thái "${booking.status}"`
    );
  }

  // Nối lý do hủy vào note (giữ lại note cũ nếu có)
  const cancelNote = reason
    ? [booking.note, `[Hủy] ${reason}`].filter(Boolean).join(' | ')
    : booking.note;

  const updatedBooking = await bookingsRepo.updateStatus(
    id,
    BOOKING_STATUSES.CANCELLED,
    { note: cancelNote }
  );

  logger.info(
    { bookingId: id, cancelledBy: user.sub, reason: reason || null },
    'Booking đã bị hủy'
  );

  return updatedBooking;
};
