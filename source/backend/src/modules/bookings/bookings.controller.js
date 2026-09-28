import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendList } from '../../utils/response.js';
import * as bookingsService from './bookings.service.js';

/**
 * Controller — HTTP handlers cho module Bookings.
 * Tham chiếu: docs/03-backend/phase5-booking/README.md
 */

/**
 * POST /api/bookings
 * Customer only — tạo booking mới
 * Body: { room_id, check_in_date, check_out_date, number_of_guests, note }
 */
export const createBooking = asyncHandler(async (req, res) => {
  const booking = await bookingsService.createBooking(req.user.sub, req.body);

  sendCreated(res, booking, 'Đặt phòng thành công');
});

/**
 * GET /api/bookings
 * Authenticate — phân luồng theo role:
 * - Customer: chỉ thấy booking của mình
 * - Staff/Admin: thấy tất cả, có filter
 */
export const listBookings = asyncHandler(async (req, res) => {
  let result;

  if (req.user.role === 'customer') {
    // Customer chỉ xem booking của mình
    result = await bookingsService.listMyBookings(req.user.sub, req.query);
  } else {
    // Staff/Admin xem tất cả
    result = await bookingsService.listAllBookings(req.query);
  }

  sendList(res, result.data, result.pagination);
});

/**
 * GET /api/bookings/:id
 * Authenticate — ownership check cho customer
 */
export const getBooking = asyncHandler(async (req, res) => {
  const booking = await bookingsService.getBooking(req.params.id, req.user);

  sendSuccess(res, booking);
});

/**
 * POST /api/bookings/:id/confirm
 * Staff only — xác nhận booking (pending → confirmed)
 */
export const confirmBooking = asyncHandler(async (req, res) => {
  const booking = await bookingsService.confirmBooking(req.params.id, req.user.sub);

  sendSuccess(res, booking, 'Xác nhận booking thành công');
});

/**
 * POST /api/bookings/:id/cancel
 * Authenticate — customer (owner) hoặc staff
 * Body: { reason }
 */
export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await bookingsService.cancelBooking(
    req.params.id,
    req.user,
    req.body.reason
  );

  sendSuccess(res, booking, 'Hủy booking thành công');
});
