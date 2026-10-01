import api from './axios';
import type { ApiResponse, PaginatedResponse, RoomType, PaginationParams } from '@/types';

export interface RoomTypeFilterParams extends PaginationParams {
  search?: string;
  is_active?: boolean;
}

/**
 * Room Type API Client — Gọi các endpoints liên quan đến hạng / loại phòng
 */
export const roomTypeApi = {
  /**
   * Lấy danh sách các loại phòng (public)
   * @param params search, page, limit
   */
  list: (params?: RoomTypeFilterParams): Promise<PaginatedResponse<RoomType>> =>
    api.get('/room-types', { params }),

  /**
   * Lấy chi tiết một loại phòng theo ID (public)
   * @param id UUID của loại phòng
   */
  getById: (id: string): Promise<ApiResponse<RoomType>> =>
    api.get(`/room-types/${id}`),
};
