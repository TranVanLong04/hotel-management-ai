import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as checkoutService from './checkout.service.js';

/**
 * Controller — HTTP handlers cho module Check-out.
 * Tham chiếu: docs/03-backend/phase7-checkin-checkout/README.md
 */

/**
 * POST /api/checkout/:bookingId
 * Check-out, tính toán hóa đơn, thanh toán và chuyển trạng thái phòng.
 */
export const checkout = asyncHandler(async (req, res) => {
  const result = await checkoutService.checkout(
    req.params.bookingId,
    req.body,
    req.user.sub
  );

  sendSuccess(res, result, 'Check-out và lập hóa đơn thành công');
});
