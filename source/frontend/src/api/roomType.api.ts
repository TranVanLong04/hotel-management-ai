import api from './axios';
import type {
  ApiResponse,
  PaginatedResponse,
  RoomType,
  PaginationParams,
  CreateRoomTypePayload,
  UpdateRoomTypePayload,
} from '@/types';

export interface RoomTypeFilterParams extends PaginationParams {
  search?: string;
  is_active?: boolean;
}

/**
 * Room Type API Client — Gọi các endpoints liên quan đến hạng / loại phòng
 */
export const roomTypeApi = {
  /**
   * Lấy danh sách các loại phòng (public / admin)
   * @param params search, page, limit, is_active
   */
  list: (params?: RoomTypeFilterParams): Promise<PaginatedResponse<RoomType>> =>
    api.get('/room-types', { params }),

  /**
   * Lấy chi tiết một loại phòng theo ID (public)
   * @param id UUID của loại phòng
   */
  getById: (id: string): Promise<ApiResponse<RoomType>> =>
    api.get(`/room-types/${id}`),

  /**
   * Tạo loại phòng mới (Admin)
   */
  create: (payload: CreateRoomTypePayload): Promise<ApiResponse<RoomType>> =>
    api.post('/room-types', payload),

  /**
   * Cập nhật loại phòng (Admin)
   */
  update: (id: string, payload: UpdateRoomTypePayload): Promise<ApiResponse<RoomType>> =>
    api.patch(`/room-types/${id}`, payload),

  /**
   * Xóa mềm loại phòng (Admin — is_active = false)
   */
  delete: (id: string): Promise<ApiResponse<null>> =>
    api.delete(`/room-types/${id}`),
};
