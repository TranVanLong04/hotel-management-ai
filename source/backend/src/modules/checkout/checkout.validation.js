import { z } from 'zod';
import { PAYMENT_METHODS } from '../../config/constants.js';

/**
 * Zod schemas cho module Check-out.
 * Tham chiếu: docs/03-backend/phase7-checkin-checkout/README.md
 */

const paymentMethodValues = Object.values(PAYMENT_METHODS);

// === Payment item schema ===
const paymentItemSchema = z.object({
  amount: z
    .number({ required_error: 'Số tiền thanh toán là bắt buộc' })
    .positive('Số tiền thanh toán phải lớn hơn 0'),
  method: z.enum(paymentMethodValues, {
    errorMap: () => ({
      message: `Phương thức thanh toán không hợp lệ. Cho phép: ${paymentMethodValues.join(', ')}`,
    }),
  }),
  transaction_code: z
    .string()
    .trim()
    .max(100, 'Mã giao dịch không được vượt quá 100 ký tự')
    .optional(),
  note: z
    .string()
    .trim()
    .max(255, 'Ghi chú thanh toán không được vượt quá 255 ký tự')
    .optional(),
});

// === Params & Body cho POST /api/checkout/:bookingId ===
export const checkoutSchema = {
  params: z.object({
    bookingId: z
      .string({ required_error: 'bookingId là bắt buộc' })
      .uuid('bookingId phải là UUID hợp lệ'),
  }),
  body: z.object({
    discount_amount: z
      .number()
      .nonnegative('Số tiền giảm giá không được âm')
      .default(0),
    tax_rate: z
      .number({ required_error: 'Thuế suất (tax_rate) là bắt buộc' })
      .min(0, 'Thuế suất không được nhỏ hơn 0')
      .max(1, 'Thuế suất không được lớn hơn 1 (100%)'),
    payments: z
      .array(paymentItemSchema)
      .min(1, 'Danh sách thanh toán phải có ít nhất 1 khoản thanh toán'),
    note: z
      .string()
      .trim()
      .max(500, 'Ghi chú không được vượt quá 500 ký tự')
      .optional(),
  }),
};
