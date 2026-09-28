import { z } from 'zod';

/**
 * Zod schemas cho module Check-in.
 * Tham chiếu: docs/03-backend/phase7-checkin-checkout/README.md
 */

// === Params — validate bookingId UUID ===
export const bookingIdParamSchema = {
  params: z.object({
    bookingId: z.string({ required_error: 'bookingId là bắt buộc' }).uuid('bookingId phải là UUID hợp lệ'),
  }),
};

// === Body — manual check-in schema ===
export const manualCheckinSchema = {
  params: z.object({
    bookingId: z.string({ required_error: 'bookingId là bắt buộc' }).uuid('bookingId phải là UUID hợp lệ'),
  }),
  body: z.object({
    reason: z
      .string({ required_error: 'Lý do check-in thủ công là bắt buộc' })
      .trim()
      .min(10, 'Lý do check-in thủ công phải có ít nhất 10 ký tự'),
    identity_number: z
      .string({ required_error: 'Số CMND/CCCD là bắt buộc' })
      .trim()
      .regex(/^\d{9,12}$/, 'Số CMND/CCCD phải có độ dài từ 9 đến 12 chữ số'),
  }),
};
