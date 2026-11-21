import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as chatService from './chat.service.js';
import * as paymentsService from '../payments/payments.service.js';
import * as checkinService from '../checkin/checkin.service.js';
import * as bookingsRepo from '../bookings/bookings.repository.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../utils/errors.js';

export const sendMessage = asyncHandler(async (req, res) => {
  const { message, conversation_id, history } = req.body;
  const userId = req.user?.sub;
  const role = req.user?.role || 'customer';
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : null;

  const result = await chatService.processChatMessage({
    userId,
    role,
    token,
    message,
    conversationId: conversation_id,
    history,
  });

  return sendSuccess(res, result, 'Gửi tin nhắn thành công');
});

export const getConversationMessages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.sub;
  const role = req.user?.role || 'customer';

  const result = await chatService.getConversationHistory(id, userId, role);
  return sendSuccess(res, result, 'Lấy lịch sử hội thoại thành công');
});

/**
 * POST /api/chat/paypal/capture
 * Xác nhận giao dịch PayPal cho đơn đặt phòng từ Chatbot.
 */
export const capturePaypalPayment = asyncHandler(async (req, res) => {
  const { orderId, order_id, bookingId, booking_id } = req.body;
  const targetOrderId = orderId || order_id;
  const targetBookingId = bookingId || booking_id;

  if (!targetOrderId) {
    throw new BadRequestError('Vui lòng cung cấp orderId');
  }

  const result = await paymentsService.capturePaypalPayment({
    orderId: targetOrderId,
    bookingId: targetBookingId,
    ipAddress: req.ip,
  });

  return sendSuccess(res, result, 'Xác nhận thanh toán PayPal thành công');
});

/**
 * POST /api/chat/verify-face
 * Nhận ảnh khuôn mặt và thực hiện check-in AI cho khách hàng qua Chatbot.
 */
export const verifyFace = asyncHandler(async (req, res) => {
  const bookingId = req.body.booking_id || req.body.bookingId;
  const file = req.file;
  const userId = req.user?.sub;

  if (!bookingId) {
    throw new BadRequestError('Vui lòng cung cấp booking_id');
  }

  if (!file || !file.buffer) {
    throw new BadRequestError('Vui lòng tải lên ảnh khuôn mặt để xác thực');
  }

  // Tìm booking để kiểm tra quyền sở hữu
  const booking = await bookingsRepo.findById(bookingId);
  if (!booking) {
    throw new NotFoundError('Booking');
  }

  // Khách hàng chỉ được check-in cho booking của chính mình
  if (req.user?.role === 'customer') {
    if (booking.customers?.user_id !== userId) {
      throw new ForbiddenError('Bạn không có quyền check-in cho đơn đặt phòng này');
    }
  }

  const result = await checkinService.verifyCheckin(bookingId, file, userId);

  return sendSuccess(
    res,
    result,
    result.is_match
      ? 'Xác thực khuôn mặt nhận phòng thành công'
      : 'Khuôn mặt không khớp với hồ sơ đã đăng ký'
  );
});


