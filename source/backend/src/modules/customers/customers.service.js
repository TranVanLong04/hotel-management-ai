import { logger } from '../../config/logger.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import * as customersRepo from './customers.repository.js';
import * as usersRepo from '../users/users.repository.js';

/**
 * Service — business logic cho module Customers.
 * Tham chiếu: docs/03-backend/phase3-user-management/README.md & docs/08-features/02-customer-profile.md
 */

/**
 * Lấy profile của customer hiện tại.
 * Nếu chưa có VÀ role === 'customer' → tự động tạo record từ thông tin users.
 * Nếu role !== 'customer' → throw 404 CUSTOMER_NOT_FOUND.
 *
 * @param {string} userId - UUID từ JWT (req.user.sub)
 * @param {Object} [currentUser] - Thông tin user từ JWT { sub, email, role }
 * @returns {Promise<Object>} customer profile
 */
export const getMyProfile = async (userId, currentUser) => {
  const customer = await customersRepo.findByUserId(userId);

  if (customer) {
    return customer;
  }

  // Nếu không có customer record, kiểm tra role
  const user = await usersRepo.findById(userId);
  const role = currentUser?.role || user?.role;

  if (role === 'customer' && user) {
    logger.info({ userId }, 'Customer record chưa tồn tại, tự động tạo mới');
    const newCustomer = await customersRepo.createCustomer({
      user_id: user.id,
      full_name: user.full_name || 'Khách hàng',
      phone: user.phone || null,
      email: user.email,
    });
    return newCustomer;
  }

  throw new NotFoundError('Customer');
};

/**
 * Cập nhật profile của customer hiện tại.
 * Check unique identity_number (CCCD) nếu update field này và khác giá trị hiện tại.
 * Email là readonly (không cho update).
 *
 * @param {string} userId - UUID từ JWT
 * @param {Object} updates - { full_name?, phone?, identity_number?, date_of_birth?, gender?, address? }
 * @returns {Promise<Object>} customer đã cập nhật
 */
export const updateMyProfile = async (userId, updates) => {
  // Kiểm tra customer tồn tại
  const existingCustomer = await customersRepo.findByUserId(userId);
  if (!existingCustomer) {
    throw new NotFoundError('Customer');
  }

  // Loại bỏ email nếu client cố tình gửi (email là readonly)
  const safeUpdates = { ...updates };
  delete safeUpdates.email;

  // Check unique identity_number (CCCD) nếu có update và khác giá trị hiện tại
  if (
    safeUpdates.identity_number &&
    safeUpdates.identity_number !== existingCustomer.identity_number
  ) {
    const duplicate = await customersRepo.findByIdentityNumber(
      safeUpdates.identity_number,
      userId
    );
    if (duplicate) {
      throw new ConflictError(
        'CUSTOMER_IDENTITY_EXISTS',
        'Số CCCD đã được sử dụng bởi người khác'
      );
    }
  }

  const updatedCustomer = await customersRepo.updateByUserId(userId, safeUpdates);

  logger.info({ userId }, 'Customer cập nhật profile');

  return updatedCustomer;
};

/**
 * Lấy danh sách customers (staff/admin).
 * @param {Object} filters - { page, limit, search }
 * @returns {Promise<{ data: Object[], pagination: Object }>}
 */
export const listCustomers = async (filters) => {
  return customersRepo.list(filters);
};

/**
 * Lấy chi tiết customer theo ID — có bookings gần đây (staff/admin).
 * @param {string} id - UUID (customer id)
 * @returns {Promise<Object>} customer + bookings
 */
export const getCustomerById = async (id) => {
  const customer = await customersRepo.findById(id);

  if (!customer) {
    throw new NotFoundError('Customer');
  }

  return customer;
};

