import api from './axios';
import type {
  ApiResponse,
  PaginatedResponse,
  User,
  UserFilterParams,
  UpdateUserPayload,
  UpdateUserStatusPayload,
} from '@/types';

/**
 * User API Client — Quản lý tài khoản và người dùng hệ thống (Admin)
 */
export const userApi = {
  /**
   * Danh sách người dùng có phân trang, lọc và tìm kiếm (Admin only)
   */
  list: (params?: UserFilterParams): Promise<PaginatedResponse<User>> =>
    api.get('/users', { params }),

  /**
   * Chi tiết người dùng theo ID (Admin only)
   */
  getById: (id: string): Promise<ApiResponse<User>> =>
    api.get(`/users/${id}`),

  /**
   * Cập nhật thông tin / vai trò của người dùng (Admin only)
   */
  update: (id: string, payload: UpdateUserPayload): Promise<ApiResponse<User>> =>
    api.patch(`/users/${id}`, payload),

  /**
   * Khóa hoặc mở khóa tài khoản (Admin only)
   */
  updateStatus: (id: string, payload: UpdateUserStatusPayload): Promise<ApiResponse<User>> =>
    api.patch(`/users/${id}/status`, payload),

  /**
   * Xóa mềm người dùng (Admin only — is_active = false)
   */
  delete: (id: string): Promise<ApiResponse<null>> =>
    api.delete(`/users/${id}`),
};

