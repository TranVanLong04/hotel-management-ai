import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';
import * as servicesService from './services.service.js';

/**
 * Controller — HTTP handlers cho module Services.
 * Tham chiếu: docs/03-backend/phase8-service-invoice/README.md
 */

/**
 * GET /api/services — Public
 * Lấy danh sách dịch vụ (mặc định cho public: is_active = true nếu không truyền).
 */
export const listServices = asyncHandler(async (req, res) => {
  const filters = { ...req.query };
  // Nếu là client chưa đăng nhập hoặc không truyền is_active, mặc định chỉ lấy dịch vụ active
  if (filters.is_active === undefined && !req.user) {
    filters.is_active = true;
  }

  const services = await servicesService.listServices(filters);
  sendSuccess(res, services);
});

/**
 * GET /api/services/:id — Public
 * Lấy chi tiết 1 dịch vụ.
 */
export const getService = asyncHandler(async (req, res) => {
  const service = await servicesService.getServiceById(req.params.id);
  sendSuccess(res, service);
});

/**
 * POST /api/services — Admin
 * Tạo mới dịch vụ.
 */
export const createService = asyncHandler(async (req, res) => {
  const created = await servicesService.createService(req.body, req.user.sub);
  sendCreated(res, created, 'Tạo dịch vụ thành công');
});

/**
 * PATCH /api/services/:id — Admin
 * Cập nhật dịch vụ.
 */
export const updateService = asyncHandler(async (req, res) => {
  const updated = await servicesService.updateService(req.params.id, req.body, req.user.sub);
  sendSuccess(res, updated, 'Cập nhật dịch vụ thành công');
});

/**
 * DELETE /api/services/:id — Admin
 * Soft delete dịch vụ.
 */
export const deleteService = asyncHandler(async (req, res) => {
  const deleted = await servicesService.deleteService(req.params.id, req.user.sub);
  sendSuccess(res, deleted, 'Xóa dịch vụ thành công');
});
