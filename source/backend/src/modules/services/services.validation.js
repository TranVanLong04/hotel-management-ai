import { z } from 'zod';

/**
 * Zod schemas cho module Services.
 * Tham chiếu: docs/03-backend/phase8-service-invoice/README.md
 */

// === Params — validate UUID ===
export const idParamSchema = {
  params: z.object({
    id: z.string({ required_error: 'id là bắt buộc' }).uuid('id phải là UUID hợp lệ'),
  }),
};

// === Query — list services ===
export const listServicesSchema = {
  query: z.object({
    is_active: z
      .enum(['true', 'false'])
      .transform((val) => val === 'true')
      .optional(),
    search: z.string().trim().max(100).optional(),
  }),
};

// === Body — tạo dịch vụ ===
export const createServiceSchema = {
  body: z.object({
    name: z
      .string({ required_error: 'Tên dịch vụ là bắt buộc' })
      .trim()
      .min(2, 'Tên dịch vụ phải có ít nhất 2 ký tự')
      .max(100, 'Tên dịch vụ không được quá 100 ký tự'),
    description: z
      .string()
      .trim()
      .max(500, 'Mô tả dịch vụ không được quá 500 ký tự')
      .optional()
      .nullable(),
    price: z
      .number({ required_error: 'Giá dịch vụ là bắt buộc' })
      .nonnegative('Giá dịch vụ không được âm'),
    unit: z
      .string({ required_error: 'Đơn vị tính là bắt buộc' })
      .trim()
      .min(1, 'Đơn vị tính không được để trống')
      .max(30, 'Đơn vị tính không được quá 30 ký tự'),
  }),
};

// === Body — cập nhật dịch vụ ===
export const updateServiceSchema = {
  params: z.object({
    id: z.string({ required_error: 'id là bắt buộc' }).uuid('id phải là UUID hợp lệ'),
  }),
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, 'Tên dịch vụ phải có ít nhất 2 ký tự')
        .max(100, 'Tên dịch vụ không được quá 100 ký tự')
        .optional(),
      description: z
        .string()
        .trim()
        .max(500, 'Mô tả dịch vụ không được quá 500 ký tự')
        .optional()
        .nullable(),
      price: z
        .number()
        .nonnegative('Giá dịch vụ không được âm')
        .optional(),
      unit: z
        .string()
        .trim()
        .min(1, 'Đơn vị tính không được để trống')
        .max(30, 'Đơn vị tính không được quá 30 ký tự')
        .optional(),
      is_active: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Phải cung cấp ít nhất một trường để cập nhật',
    }),
};
