import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as checkinService from './checkin.service.js';

/**
 * Controller — HTTP handlers cho module Check-in.
 * Tham chiếu: docs/03-backend/phase7-checkin-checkout/README.md
 */

/**
 * POST /api/checkin/:bookingId/verify
 * Xác thực khuôn mặt AI và tự động check-in.
 */
export const verifyCheckin = asyncHandler(async (req, res) => {
  const result = await checkinService.verifyCheckin(
    req.params.bookingId,
    req.file,
    req.user.sub
  );

  sendSuccess(res, result, 'Xác thực khuôn mặt và check-in thành công');
});

/**
 * POST /api/checkin/:bookingId/confirm
 * Xác nhận check-in thông thường bởi nhân viên.
 */
export const confirmCheckin = asyncHandler(async (req, res) => {
  const booking = await checkinService.confirmCheckin(
    req.params.bookingId,
    req.user.sub
  );

  sendSuccess(res, booking, 'Xác nhận check-in thành công');
});

/**
 * POST /api/checkin/:bookingId/manual
 * Check-in thủ công kèm lý do và số CMND/CCCD (Security event).
 */
export const manualCheckin = asyncHandler(async (req, res) => {
  const booking = await checkinService.manualCheckin(
    req.params.bookingId,
    req.body,
    req.user.sub
  );

  sendSuccess(res, booking, 'Check-in thủ công thành công');
});
