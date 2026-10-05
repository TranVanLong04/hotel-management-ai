import { z } from 'zod';

/**
 * Zod schemas cho module Customers.
 * Tham chiếu: docs/03-backend/phase3-user-management/README.md & docs/08-features/02-customer-profile.md
 */

// === Params — validate UUID ===
export const idParamSchema = {
  params: z.object({
    id: z.string().uuid('ID phải là UUID hợp lệ'),
  }),
};

// === Body — customer tự cập nhật profile ===
export const updateProfileSchema = {
  body: z
    .object({
      full_name: z
        .string()
        .min(2, 'Họ tên phải có ít nhất 2 ký tự')
        .max(100, 'Họ tên không được quá 100 ký tự')
        .trim()
        .optional(),
      phone: z
        .string()
        .regex(/^[0-9]{10,11}$/, 'Số điện thoại phải có 10-11 chữ số')
        .optional(),
      identity_number: z
        .string()
        .regex(/^[0-9]{9,12}$/, 'Số CCCD phải có 9-12 chữ số')
        .optional()
        .nullable(),
      date_of_birth: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày sinh phải có định dạng YYYY-MM-DD')
        .refine(
          (dob) => {
            const today = new Date().toISOString().split('T')[0];
            return dob <= today;
          },
          { message: 'Ngày sinh không được ở tương lai' }
        )
        .optional()
        .nullable(),
      gender: z
        .union([z.literal('male'), z.literal('female'), z.literal('other')], {
          errorMap: () => ({ message: 'Giới tính phải là male, female hoặc other' }),
        })
        .optional()
        .nullable(),
      address: z
        .string()
        .max(500, 'Địa chỉ không được quá 500 ký tự')
        .trim()
        .optional()
        .nullable(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Cần ít nhất 1 field để cập nhật',
    }),
};

// === Query — list customers (staff/admin) ===
export const listCustomersSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().trim().max(100).optional(),
  }),
};

