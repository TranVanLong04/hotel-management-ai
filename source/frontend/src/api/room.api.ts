import api from './axios';
import type {
  ApiResponse,
  PaginatedResponse,
  Room,
  RoomFilterParams,
  RoomStatus,
  CreateRoomPayload,
  UpdateRoomPayload,
} from '@/types';

/**
 * Room API Client — Gọi các endpoints liên quan đến phòng
 */
export const roomApi = {
  /**
   * Lấy danh sách phòng có phân trang và bộ lọc (public / admin)
   * @param params Bộ lọc: room_type_id, status, floor, search, page, limit
   */
  list: (params?: RoomFilterParams): Promise<PaginatedResponse<Room>> =>
    api.get('/rooms', { params }),

  /**
   * Lấy thông tin chi tiết một phòng theo ID (public)
   * @param id UUID của phòng
   */
  getById: (id: string): Promise<ApiResponse<Room>> =>
    api.get(`/rooms/${id}`),

  /**
   * Tìm kiếm phòng còn trống theo ngày nhận, trả phòng và số khách (public)
   * @param params check_in, check_out, guests
   */
  getAvailable: (params: {
    check_in: string;
    check_out: string;
    guests?: number;
  }): Promise<ApiResponse<Room[]>> =>
    api.get('/rooms/available', { params }),

  /**
   * Tạo phòng mới (Admin)
   */
  create: (payload: CreateRoomPayload): Promise<ApiResponse<Room>> =>
    api.post('/rooms', payload),

  /**
   * Cập nhật thông tin phòng (Admin)
   */
  update: (id: string, payload: UpdateRoomPayload): Promise<ApiResponse<Room>> =>
    api.patch(`/rooms/${id}`, payload),

  /**
   * Cập nhật trạng thái phòng (Staff / Admin)
   */
  updateStatus: (id: string, status: RoomStatus): Promise<ApiResponse<Room>> =>
    api.patch(`/rooms/${id}/status`, { status }),

  /**
   * Xóa mềm phòng (Admin — is_active = false)
   */
  delete: (id: string): Promise<ApiResponse<null>> =>
    api.delete(`/rooms/${id}`),
};
