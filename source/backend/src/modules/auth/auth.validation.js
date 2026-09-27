import { z } from 'zod';

/**
 * Zod schemas cho module Auth.
 * Tham chiếu: docs/03-backend/phase2-auth/README.md
 *
 * Mỗi schema có key `body` / `params` / `query`
 * để validate middleware tự tách source tương ứng.
 */

// === Register ===
export const registerSchema = {
  body: z.object({
    // Email — bắt buộc, format email hợp lệ
    email: z
      .string({ required_error: 'Email là bắt buộc' })
      .email('Email không đúng định dạng')
      .transform((val) => val.toLowerCase().trim()),

    // Password — min 8, phải có chữ hoa và số
    password: z
      .string({ required_error: 'Mật khẩu là bắt buộc' })
      .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
      .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
      .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 số'),

    // Họ tên — 2-100 ký tự
    full_name: z
      .string({ required_error: 'Họ tên là bắt buộc' })
      .min(2, 'Họ tên phải có ít nhất 2 ký tự')
      .max(100, 'Họ tên không được quá 100 ký tự')
      .trim(),

    // SĐT — regex 10-11 số (format VN)
    phone: z
      .string({ required_error: 'Số điện thoại là bắt buộc' })
      .regex(/^[0-9]{10,11}$/, 'Số điện thoại phải có 10-11 chữ số'),
  }),
};

// === Login ===
export const loginSchema = {
  body: z.object({
    email: z
      .string({ required_error: 'Email là bắt buộc' })
      .min(1, 'Email không được rỗng')
      .transform((val) => val.toLowerCase().trim()),

    password: z
      .string({ required_error: 'Mật khẩu là bắt buộc' })
      .min(1, 'Mật khẩu không được rỗng'),
  }),
};
