import { asyncHandler } from '../../utils/asyncHandler.js';
import * as paymentsService from './payments.service.js';

/**
 * Controller cho Module Payments
 */

/**
 * Lấy danh sách cổng thanh toán khả dụng
 * GET /api/payments/gateways
 */
export const getGateways = asyncHandler(async (req, res) => {
  const data = paymentsService.getAvailableGateways();
  res.status(200).json({
    success: true,
    data,
  });
});

/**
 * Tạo yêu cầu thanh toán (MoMo / VNPay)
 * POST /api/payments
 */
export const createPayment = asyncHandler(async (req, res) => {
  const result = await paymentsService.createPayment(
    req.user.sub,
    req.body,
    req.ip || req.connection.remoteAddress
  );

  res.status(200).json({
    success: true,
    data: result,
    message: 'Tạo yêu cầu thanh toán thành công',
  });
});

/**
 * Xử lý Return URL từ MoMo
 * GET /api/payments/momo/return
 */
export const momoReturn = asyncHandler(async (req, res) => {
  const result = await paymentsService.handleMomoReturn(
    req.query,
    req.ip || req.connection.remoteAddress
  );

  res.status(200).json({
    success: result.success,
    data: result,
    message: result.success
      ? 'Xác thực thanh toán MoMo thành công'
      : result.reason || 'Thanh toán MoMo thất bại',
  });
});

/**
 * Xử lý Webhook IPN từ MoMo
 * POST /api/payments/momo/ipn
 */
export const momoIpn = asyncHandler(async (req, res) => {
  const payload = Object.keys(req.body || {}).length > 0 ? req.body : req.query;
  await paymentsService.handleMomoIpn(
    payload,
    req.ip || req.connection.remoteAddress
  );

  // MoMo yêu cầu phản hồi HTTP 204 No Content cho IPN
  res.status(204).end();
});

/**
 * Xử lý Return URL từ VNPay
 * GET /api/payments/vnpay/return
 */
export const vnpayReturn = asyncHandler(async (req, res) => {
  const result = await paymentsService.handleVnpayReturn(
    req.query,
    req.ip || req.connection.remoteAddress
  );

  res.status(200).json({
    success: result.success,
    data: result,
    message: result.success
      ? 'Xác thực thanh toán VNPay thành công'
      : result.reason || 'Thanh toán VNPay thất bại',
  });
});

/**
 * Xử lý Webhook IPN từ VNPay
 * GET /api/payments/vnpay/ipn
 */
export const vnpayIpn = asyncHandler(async (req, res) => {
  const result = await paymentsService.handleVnpayIpn(
    req.query,
    req.ip || req.connection.remoteAddress
  );

  // VNPay yêu cầu định dạng response { RspCode, Message }
  res.status(200).json(result);
});

/**
 * Lấy danh sách giao dịch thanh toán của một đơn đặt phòng
 * GET /api/payments/booking/:bookingId
 */
export const getByBookingId = asyncHandler(async (req, res) => {
  const payments = await paymentsService.getPaymentsByBooking(
    req.user.sub,
    req.user.role,
    req.params.bookingId
  );

  res.status(200).json({
    success: true,
    data: payments,
  });
});
