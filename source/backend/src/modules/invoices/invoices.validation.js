import { z } from 'zod';
import { INVOICE_STATUSES, PAYMENT_METHODS } from '../../config/constants.js';

/**
 * Zod schemas cho module Invoices.
 * Tham chiếu: docs/03-backend/phase8-service-invoice/README.md
 */

const invoiceStatusValues = Object.values(INVOICE_STATUSES);
const paymentMethodValues = Object.values(PAYMENT_METHODS);

// === Params — validate ID ===
export const idParamSchema = {
  params: z.object({
    id: z.string({ required_error: 'id là bắt buộc' }).uuid('id phải là UUID hợp lệ'),
  }),
};

// === Query — list invoices ===
export const listInvoicesSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum(invoiceStatusValues).optional(),
    customer_id: z.string().uuid().optional(),
    booking_id: z.string().uuid().optional(),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'from phải có dạng YYYY-MM-DD').optional(),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'to phải có dạng YYYY-MM-DD').optional(),
    search: z.string().trim().max(100).optional(),
  }),
};

// === Body — thêm thanh toán bổ sung cho invoice ===
export const addPaymentSchema = {
  params: z.object({
    id: z.string({ required_error: 'id là bắt buộc' }).uuid('id phải là UUID hợp lệ'),
  }),
  body: z.object({
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
      .max(100, 'Mã giao dịch không được quá 100 ký tự')
      .optional()
      .nullable(),
    note: z
      .string()
      .trim()
      .max(255, 'Ghi chú không được quá 255 ký tự')
      .optional()
      .nullable(),
  }),
};
