import { z } from 'zod';

/**
 * Zod schemas cho module Service Usages.
 * Tham chiếu: docs/03-backend/phase8-service-invoice/README.md
 */

// === Params — validate ID ===
export const idParamSchema = {
  params: z.object({
    id: z.string({ required_error: 'id là bắt buộc' }).uuid('id phải là UUID hợp lệ'),
  }),
};

// === Params — validate bookingId ===
export const bookingIdParamSchema = {
  params: z.object({
    bookingId: z.string({ required_error: 'bookingId là bắt buộc' }).uuid('bookingId phải là UUID hợp lệ'),
  }),
};

// === Body — thêm dịch vụ vào booking ===
export const addServiceUsageSchema = {
  params: z.object({
    bookingId: z.string({ required_error: 'bookingId là bắt buộc' }).uuid('bookingId phải là UUID hợp lệ'),
  }),
  body: z.object({
    service_id: z
      .string({ required_error: 'service_id là bắt buộc' })
      .uuid('service_id phải là UUID hợp lệ'),
    quantity: z
      .number({ required_error: 'Số lượng là bắt buộc' })
      .int('Số lượng phải là số nguyên')
      .positive('Số lượng phải lớn hơn 0')
      .max(100, 'Số lượng không được vượt quá 100'),
    note: z
      .string()
      .trim()
      .max(500, 'Ghi chú không được quá 500 ký tự')
      .optional()
      .nullable(),
  }),
};
