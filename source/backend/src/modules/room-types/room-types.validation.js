import { z } from 'zod';

/**
 * Zod schemas cho module Room Types.
 * Tham chiếu: docs/03-backend/phase4-room-management/README.md
 */

// === Params — validate UUID ===
export const idParamSchema = {
  params: z.object({
    id: z.string().uuid('ID phải là UUID hợp lệ'),
  }),
};

// === Query — list room types với filter + phân trang ===
export const listRoomTypesSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    is_active: z
      .enum(['true', 'false'])
      .transform((val) => val === 'true')
      .optional(),
    search: z.string().trim().max(100).optional(),
  }),
};

// === Body — tạo loại phòng ===
export const createRoomTypeSchema = {
  body: z.object({
    name: z
      .string({ required_error: 'Tên loại phòng là bắt buộc' })
      .min(2, 'Tên loại phòng phải có ít nhất 2 ký tự')
      .max(100, 'Tên loại phòng không được quá 100 ký tự')
      .trim(),
    description: z
      .string()
      .max(1000, 'Mô tả không được quá 1000 ký tự')
      .trim()
      .optional(),
    max_guests: z
      .number({ required_error: 'Số khách tối đa là bắt buộc' })
      .int('Số khách phải là số nguyên')
      .positive('Số khách phải lớn hơn 0')
      .max(20, 'Số khách tối đa là 20'),
    base_price: z
      .number({ required_error: 'Giá cơ bản là bắt buộc' })
      .min(0, 'Giá không được âm'),
    amenities: z
      .array(z.string().trim())
      .optional(),
    image_url: z
      .string()
      .url('URL ảnh không hợp lệ')
      .optional(),
  }),
};

// === Body — cập nhật loại phòng ===
export const updateRoomTypeSchema = {
  params: z.object({
    id: z.string().uuid('ID phải là UUID hợp lệ'),
  }),
  body: z.object({
    name: z
      .string()
      .min(2, 'Tên loại phòng phải có ít nhất 2 ký tự')
      .max(100, 'Tên loại phòng không được quá 100 ký tự')
      .trim()
      .optional(),
    description: z
      .string()
      .max(1000, 'Mô tả không được quá 1000 ký tự')
      .trim()
      .optional(),
    max_guests: z
      .number()
      .int('Số khách phải là số nguyên')
      .positive('Số khách phải lớn hơn 0')
      .max(20, 'Số khách tối đa là 20')
      .optional(),
    base_price: z
      .number()
      .min(0, 'Giá không được âm')
      .optional(),
    amenities: z
      .array(z.string().trim())
      .optional(),
    image_url: z
      .string()
      .url('URL ảnh không hợp lệ')
      .nullable()
      .optional(),
  }).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Cần ít nhất 1 field để cập nhật' }
  ),
};
