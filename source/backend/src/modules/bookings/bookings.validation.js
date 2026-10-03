import { z } from 'zod';
import { BOOKING_STATUSES } from '../../config/constants.js';

/**
 * Zod schemas cho module Bookings.
 * Tham chiếu: docs/03-backend/phase5-booking/README.md
 */

// === Params — validate UUID ===
export const idParamSchema = {
  params: z.object({
    id: z.string().uuid('ID phải là UUID hợp lệ'),
  }),
};

// === Body — tạo booking ===
export const createBookingSchema = {
  body: z
    .object({
      room_id: z
        .string({ required_error: 'Phòng là bắt buộc' })
        .uuid('room_id phải là UUID hợp lệ'),
      check_in_date: z
        .string({ required_error: 'Ngày nhận phòng là bắt buộc' })
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày nhận phòng phải có format YYYY-MM-DD'),
      check_out_date: z
        .string({ required_error: 'Ngày trả phòng là bắt buộc' })
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày trả phòng phải có format YYYY-MM-DD'),
      number_of_guests: z
        .number({ required_error: 'Số khách là bắt buộc' })
        .int('Số khách phải là số nguyên')
        .positive('Số khách phải lớn hơn 0')
        .max(20, 'Số khách không được vượt quá 20'),
      note: z
        .string()
        .max(500, 'Ghi chú không được quá 500 ký tự')
        .trim()
        .optional(),
    })
    // Refine 1: check_out phải sau check_in
    .refine(
      (data) => new Date(data.check_out_date) > new Date(data.check_in_date),
      { message: 'Ngày trả phòng phải sau ngày nhận phòng', path: ['check_out_date'] }
    )
    // Refine 2: check_in phải >= hôm nay (so sánh date, bỏ giờ)
    .refine(
      (data) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkIn = new Date(data.check_in_date);
        checkIn.setHours(0, 0, 0, 0);
        return checkIn >= today;
      },
      { message: 'Ngày nhận phòng không được ở quá khứ', path: ['check_in_date'] }
    ),
};

// === Query — danh sách bookings với filter + phân trang ===
export const listBookingsSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: z
      .enum([
        BOOKING_STATUSES.PENDING_PAYMENT,
        BOOKING_STATUSES.PENDING,
        BOOKING_STATUSES.CONFIRMED,
        BOOKING_STATUSES.CHECKED_IN,
        BOOKING_STATUSES.CHECKED_OUT,
        BOOKING_STATUSES.CANCELLED,
        BOOKING_STATUSES.NO_SHOW,
      ])
      .optional(),
    customer_id: z.string().uuid().optional(),
    room_id: z.string().uuid().optional(),
    from: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'from phải có format YYYY-MM-DD')
      .optional(),
    to: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'to phải có format YYYY-MM-DD')
      .optional(),
    search: z.string().trim().max(100).optional(),
  }),
};

// === Body — hủy booking ===
export const cancelBookingSchema = {
  params: z.object({
    id: z.string().uuid('ID phải là UUID hợp lệ'),
  }),
  body: z.object({
    reason: z
      .string()
      .max(500, 'Lý do hủy không được quá 500 ký tự')
      .trim()
      .optional(),
  }),
};
