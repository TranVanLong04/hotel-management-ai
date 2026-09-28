import * as servicesRepo from './services.repository.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { logger } from '../../config/logger.js';

/**
 * Service — xử lý nghiệp vụ module Services.
 * Tham chiếu: docs/03-backend/phase8-service-invoice/README.md
 */

/**
 * Lấy danh sách dịch vụ.
 * @param {Object} filters - { is_active, search }
 * @returns {Promise<Object[]>}
 */
export const listServices = async (filters = {}) => {
  return await servicesRepo.list(filters);
};

/**
 * Lấy chi tiết 1 dịch vụ theo ID.
 * @param {string} id - UUID
 * @returns {Promise<Object>}
 */
export const getServiceById = async (id) => {
  const service = await servicesRepo.findById(id);
  if (!service) {
    throw new NotFoundError('Service');
  }
  return service;
};

/**
 * Tạo dịch vụ mới (Admin).
 * @param {Object} data - { name, description, price, unit }
 * @param {string} userId - UUID admin
 * @returns {Promise<Object>}
 */
export const createService = async (data, userId) => {
  const existing = await servicesRepo.findByName(data.name);
  if (existing) {
    throw new ConflictError('SERVICE_NAME_EXISTS', 'Tên dịch vụ đã tồn tại');
  }

  const created = await servicesRepo.insert(data);
  logger.info({ serviceId: created.id, userId, name: created.name }, 'Service created successfully');

  return created;
};

/**
 * Cập nhật dịch vụ (Admin).
 * @param {string} id - UUID
 * @param {Object} updates
 * @param {string} userId - UUID admin
 * @returns {Promise<Object>}
 */
export const updateService = async (id, updates, userId) => {
  const service = await servicesRepo.findById(id);
  if (!service) {
    throw new NotFoundError('Service');
  }

  if (updates.name && updates.name.toLowerCase() !== service.name.toLowerCase()) {
    const existing = await servicesRepo.findByName(updates.name);
    if (existing && existing.id !== id) {
      throw new ConflictError('SERVICE_NAME_EXISTS', 'Tên dịch vụ đã tồn tại');
    }
  }

  const updated = await servicesRepo.update(id, updates);
  logger.info({ serviceId: id, userId, updates }, 'Service updated successfully');

  return updated;
};

/**
 * Soft delete dịch vụ (Admin).
 * @param {string} id - UUID
 * @param {string} userId - UUID admin
 * @returns {Promise<Object>}
 */
export const deleteService = async (id, userId) => {
  const service = await servicesRepo.findById(id);
  if (!service) {
    throw new NotFoundError('Service');
  }

  const deleted = await servicesRepo.softDelete(id);
  logger.info({ serviceId: id, userId }, 'Service soft-deleted successfully');

  return deleted;
};
