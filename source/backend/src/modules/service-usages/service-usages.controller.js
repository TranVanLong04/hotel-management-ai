import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';
import * as serviceUsagesService from './service-usages.service.js';

/**
 * Controller — HTTP handlers cho module Service Usages.
 * Tham chiếu: docs/03-backend/phase8-service-invoice/README.md
 */

/**
 * POST /api/bookings/:bookingId/services
 * Staff thêm dịch vụ vào booking.
 */
export const addService = asyncHandler(async (req, res) => {
  const usage = await serviceUsagesService.addService(
    req.params.bookingId,
    req.body,
    req.user.sub
  );

  sendCreated(res, usage, 'Thêm dịch vụ vào đặt phòng thành công');
});

/**
 * GET /api/bookings/:bookingId/services
 * Lấy danh sách dịch vụ của 1 booking.
 */
export const listBookingServices = asyncHandler(async (req, res) => {
  const usages = await serviceUsagesService.listBookingServices(
    req.params.bookingId,
    req.user
  );

  sendSuccess(res, usages);
});

/**
 * DELETE /api/service-usages/:id
 * Staff xóa dịch vụ đã dùng khỏi booking (chỉ khi chưa check-out).
 */
export const removeServiceUsage = asyncHandler(async (req, res) => {
  const removed = await serviceUsagesService.removeServiceUsage(
    req.params.id,
    req.user.sub
  );

  sendSuccess(res, removed, 'Xóa dịch vụ khỏi đặt phòng thành công');
});
