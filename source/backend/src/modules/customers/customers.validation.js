import { z } from 'zod';
import { GENDERS } from '../../config/constants.js';

/**
 * Zod schemas cho module Customers.
 * Tham chiếu: docs/03-backend/phase3-user-management/README.md
 */

// === Params — validate UUID ===
export const idParamSchema = {
  params: z.object({
    id: z.string().uuid('ID phải là UUID hợp lệ'),
  }),
};

// === Body — customer tự cập nhật profile ===
export const updateProfileSchema = {
  body: z.object({
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
      .optional(),
    date_of_birth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày sinh phải có định dạng YYYY-MM-DD')
      .optional(),
    gender: z
      .enum([GENDERS.MALE, GENDERS.FEMALE, GENDERS.OTHER], {
        errorMap: () => ({ message: 'Giới tính phải là male, female hoặc other' }),
      })
      .optional(),
    address: z
      .string()
      .max(500, 'Địa chỉ không được quá 500 ký tự')
      .trim()
      .optional(),
  }).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Cần ít nhất 1 field để cập nhật' }
  ),
};

// === Query — list customers (staff/admin) ===
export const listCustomersSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().trim().max(100).optional(),
  }),
};
