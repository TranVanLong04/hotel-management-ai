import { z } from 'zod';
import { ROOM_STATUSES } from '../../config/constants.js';

/**
 * Zod schemas cho module Rooms.
 * Tham chiếu: docs/03-backend/phase4-room-management/README.md
 */

// === Params — validate UUID ===
export const idParamSchema = {
  params: z.object({
    id: z.string().uuid('ID phải là UUID hợp lệ'),
  }),
};

// === Query — list rooms với filter + phân trang ===
export const listRoomsSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: z
      .enum([
        ROOM_STATUSES.AVAILABLE,
        ROOM_STATUSES.RESERVED,
        ROOM_STATUSES.OCCUPIED,
        ROOM_STATUSES.CLEANING,
        ROOM_STATUSES.MAINTENANCE,
      ])
      .optional(),
    room_type_id: z.string().uuid().optional(),
    floor: z.coerce.number().int().positive().optional(),
    is_active: z
      .enum(['true', 'false'])
      .transform((val) => val === 'true')
      .optional(),
    search: z.string().trim().max(100).optional(),
  }),
};

// === Body — tạo phòng ===
export const createRoomSchema = {
  body: z.object({
    room_number: z
      .string({ required_error: 'Số phòng là bắt buộc' })
      .min(1, 'Số phòng phải có ít nhất 1 ký tự')
      .max(20, 'Số phòng không được quá 20 ký tự')
      .regex(/^[a-zA-Z0-9-]+$/, 'Số phòng chỉ gồm chữ, số và dấu gạch ngang')
      .trim(),
    room_type_id: z
      .string({ required_error: 'Loại phòng là bắt buộc' })
      .uuid('room_type_id phải là UUID hợp lệ'),
    floor: z
      .number({ required_error: 'Tầng là bắt buộc' })
      .int('Tầng phải là số nguyên')
      .positive('Tầng phải lớn hơn 0'),
    description: z
      .string()
      .max(500, 'Mô tả không được quá 500 ký tự')
      .trim()
      .optional(),
  }),
};

// === Body — cập nhật phòng ===
export const updateRoomSchema = {
  params: z.object({
    id: z.string().uuid('ID phải là UUID hợp lệ'),
  }),
  body: z.object({
    room_number: z
      .string()
      .min(1, 'Số phòng phải có ít nhất 1 ký tự')
      .max(20, 'Số phòng không được quá 20 ký tự')
      .regex(/^[a-zA-Z0-9-]+$/, 'Số phòng chỉ gồm chữ, số và dấu gạch ngang')
      .trim()
      .optional(),
    room_type_id: z
      .string()
      .uuid('room_type_id phải là UUID hợp lệ')
      .optional(),
    floor: z
      .number()
      .int('Tầng phải là số nguyên')
      .positive('Tầng phải lớn hơn 0')
      .optional(),
    description: z
      .string()
      .max(500, 'Mô tả không được quá 500 ký tự')
      .trim()
      .optional(),
  }).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Cần ít nhất 1 field để cập nhật' }
  ),
};

// === Body — cập nhật trạng thái phòng ===
export const updateStatusSchema = {
  params: z.object({
    id: z.string().uuid('ID phải là UUID hợp lệ'),
  }),
  body: z.object({
    status: z.enum(
      [
        ROOM_STATUSES.AVAILABLE,
        ROOM_STATUSES.RESERVED,
        ROOM_STATUSES.OCCUPIED,
        ROOM_STATUSES.CLEANING,
        ROOM_STATUSES.MAINTENANCE,
      ],
      {
        errorMap: () => ({
          message: 'Trạng thái phải là available, reserved, occupied, cleaning hoặc maintenance',
        }),
      }
    ),
  }),
};

// === Query — tìm phòng trống ===
export const availableRoomsSchema = {
  query: z.object({
    check_in: z.string({ required_error: 'Ngày nhận phòng là bắt buộc' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày nhận phòng phải có format YYYY-MM-DD'),
    check_out: z.string({ required_error: 'Ngày trả phòng là bắt buộc' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày trả phòng phải có format YYYY-MM-DD'),
    guests: z.coerce.number().int().positive().default(1),
    room_type_id: z.string().uuid().optional(),
  }).refine(
    (data) => new Date(data.check_out) > new Date(data.check_in),
    { message: 'Ngày trả phòng phải sau ngày nhận phòng', path: ['check_out'] }
  ),
};
