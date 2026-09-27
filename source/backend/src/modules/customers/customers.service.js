import { logger } from '../../config/logger.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import * as customersRepo from './customers.repository.js';

/**
 * Service — business logic cho module Customers.
 * Tham chiếu: docs/03-backend/phase3-user-management/README.md
 */

/**
 * Lấy profile của customer hiện tại.
 * @param {string} userId - UUID từ JWT (req.user.sub)
 * @returns {Promise<Object>} customer profile
 */
export const getMyProfile = async (userId) => {
  const customer = await customersRepo.findByUserId(userId);

  if (!customer) {
    throw new NotFoundError('Customer');
  }

  return customer;
};

/**
 * Cập nhật profile của customer hiện tại.
 * Check unique identity_number (CCCD) nếu update field này.
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

  // Check unique identity_number (CCCD) nếu có update
  if (updates.identity_number) {
    const duplicate = await customersRepo.findByIdentityNumber(
      updates.identity_number,
      userId
    );
    if (duplicate) {
      throw new ConflictError(
        'CUSTOMER_IDENTITY_EXISTS',
        'Số CCCD đã được sử dụng bởi người khác'
      );
    }
  }

  const updatedCustomer = await customersRepo.updateByUserId(userId, updates);

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
