import * as serviceUsagesRepo from './service-usages.repository.js';
import * as servicesRepo from '../services/services.repository.js';
import * as bookingsRepo from '../bookings/bookings.repository.js';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from '../../utils/errors.js';
import { BOOKING_STATUSES, USER_ROLES } from '../../config/constants.js';
import { logger } from '../../config/logger.js';

/**
 * Service — xử lý nghiệp vụ module Service Usages.
 * Tham chiếu: docs/03-backend/phase8-service-invoice/README.md
 */

/**
 * Thêm dịch vụ vào booking đang lưu trú.
 *
 * @param {string} bookingId - UUID
 * @param {Object} data - { service_id, quantity, note }
 * @param {string} userId - UUID nhân viên
 * @returns {Promise<Object>} Bản ghi service usage
 */
export const addService = async (bookingId, data, userId) => {
  // 1. Kiểm tra booking tồn tại
  const booking = await bookingsRepo.findById(bookingId);
  if (!booking) {
    throw new NotFoundError('Booking');
  }

  // 2. Kiểm tra trạng thái booking: PHẢI là checked_in
  if (booking.status !== BOOKING_STATUSES.CHECKED_IN) {
    throw new BadRequestError('Chỉ có thể thêm dịch vụ khi khách đang ở');
  }

  // 3. Kiểm tra dịch vụ tồn tại
  const service = await servicesRepo.findById(data.service_id);
  if (!service) {
    throw new NotFoundError('Service');
  }

  // 4. Kiểm tra dịch vụ có đang hoạt động không
  if (!service.is_active) {
    throw new BadRequestError('Dịch vụ đã ngừng cung cấp', 'SERVICE_NOT_ACTIVE');
  }

  // 5. Ghi nhận với SNAPSHOT unit_price tại thời điểm dùng
  const usage = await serviceUsagesRepo.insert({
    booking_id: bookingId,
    service_id: data.service_id,
    quantity: data.quantity,
    unit_price: service.price,
    note: data.note,
  });

  logger.info(
    {
      usageId: usage.id,
      bookingId,
      serviceId: service.id,
      quantity: data.quantity,
      unitPrice: service.price,
      userId,
    },
    'Service added to booking successfully'
  );

  return usage;
};

/**
 * Lấy danh sách dịch vụ của 1 booking kèm kiểm tra quyền sở hữu.
 *
 * @param {string} bookingId - UUID
 * @param {Object} user - { sub: userId, role }
 * @returns {Promise<Object[]>}
 */
export const listBookingServices = async (bookingId, user) => {
  const booking = await bookingsRepo.findById(bookingId);
  if (!booking) {
    throw new NotFoundError('Booking');
  }

  // Kiểm tra quyền: nếu là customer, chỉ được xem booking của chính mình
  if (user.role === USER_ROLES.CUSTOMER) {
    const customer = await bookingsRepo.findCustomerByUserId(user.sub);
    if (!customer || booking.customer_id !== customer.id) {
      throw new ForbiddenError('Không có quyền xem dịch vụ của đặt phòng này');
    }
  }

  return await serviceUsagesRepo.listByBooking(bookingId);
};

/**
 * Xóa dịch vụ đã ghi nhận vào booking.
 * Không cho xóa nếu booking đã check-out.
 *
 * @param {string} id - UUID bản ghi service usage
 * @param {string} userId - UUID nhân viên
 * @returns {Promise<Object>}
 */
export const removeServiceUsage = async (id, userId) => {
  // 1. Kiểm tra usage tồn tại
  const usage = await serviceUsagesRepo.findById(id);
  if (!usage) {
    throw new NotFoundError('ServiceUsage');
  }

  // 2. Kiểm tra trạng thái booking
  const booking = await bookingsRepo.findById(usage.booking_id);
  if (!booking) {
    throw new NotFoundError('Booking');
  }

  // 3. Không cho xóa nếu đã check-out
  if (booking.status === BOOKING_STATUSES.CHECKED_OUT) {
    throw new BadRequestError('Không thể xóa dịch vụ sau khi đã check-out');
  }

  const removed = await serviceUsagesRepo.remove(id);

  logger.info({ usageId: id, bookingId: usage.booking_id, userId }, 'Service usage removed successfully');

  return removed;
};
