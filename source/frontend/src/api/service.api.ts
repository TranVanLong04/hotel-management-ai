import api from './axios';
import type {
  ApiResponse,
  Service,
  CreateServicePayload,
  UpdateServicePayload,
  ServiceQueryParams,
} from '@/types';

/**
 * Service API Client — Quản lý danh mục dịch vụ khách sạn (Phase 7 / Feature 07)
 * Tham chiếu: docs/08-features/07-service-management.md
 */
export const serviceApi = {
  /**
   * Lấy danh sách dịch vụ (có thể lọc theo is_active, search)
   * GET /api/services
   */
  list: async (params?: ServiceQueryParams): Promise<ApiResponse<Service[]>> => {
    return api.get('/services', { params });
  },

  /**
   * Lấy chi tiết 1 dịch vụ theo ID
   * GET /api/services/:id
   */
  getById: async (id: string): Promise<ApiResponse<Service>> => {
    return api.get(`/services/${id}`);
  },

  /**
   * Tạo dịch vụ mới (Admin)
   * POST /api/services
   */
  create: async (data: CreateServicePayload): Promise<ApiResponse<Service>> => {
    return api.post('/services', data);
  },

  /**
   * Cập nhật thông tin dịch vụ / Bật tắt is_active (Admin)
   * PATCH /api/services/:id
   */
  update: async (id: string, data: UpdateServicePayload): Promise<ApiResponse<Service>> => {
    return api.patch(`/services/${id}`, data);
  },

  /**
   * Xóa mềm dịch vụ (Admin - is_active = false)
   * DELETE /api/services/:id
   */
  delete: async (id: string): Promise<ApiResponse<Service>> => {
    return api.delete(`/services/${id}`);
  },
};

