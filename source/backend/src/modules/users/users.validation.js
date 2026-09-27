import { z } from 'zod';
import { USER_ROLES } from '../../config/constants.js';

/**
 * Zod schemas cho module Users (admin).
 * Tham chiếu: docs/03-backend/phase3-user-management/README.md
 */

// === Params — validate UUID ===
export const idParamSchema = {
  params: z.object({
    id: z.string().uuid('ID phải là UUID hợp lệ'),
  }),
};

// === Query — list users với filter + phân trang ===
export const listUsersSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    role: z
      .enum([USER_ROLES.ADMIN, USER_ROLES.STAFF, USER_ROLES.CUSTOMER])
      .optional(),
    is_active: z
      .enum(['true', 'false'])
      .transform((val) => val === 'true')
      .optional(),
    search: z.string().trim().max(100).optional(),
  }),
};

// === Body — update user (admin) ===
export const updateUserSchema = {
  params: z.object({
    id: z.string().uuid('ID phải là UUID hợp lệ'),
  }),
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
    role: z
      .enum([USER_ROLES.ADMIN, USER_ROLES.STAFF, USER_ROLES.CUSTOMER], {
        errorMap: () => ({ message: 'Role phải là admin, staff hoặc customer' }),
      })
      .optional(),
  }).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Cần ít nhất 1 field để cập nhật' }
  ),
};

// === Body — update status (khóa/mở tài khoản) ===
export const updateStatusSchema = {
  params: z.object({
    id: z.string().uuid('ID phải là UUID hợp lệ'),
  }),
  body: z.object({
    is_active: z.boolean({ required_error: 'is_active là bắt buộc' }),
  }),
};
