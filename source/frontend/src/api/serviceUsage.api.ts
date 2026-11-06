import api from './axios';
import type { ApiResponse, ServiceUsageItem } from '@/types';

export interface AddServiceUsagePayload {
  service_id: string;
  quantity: number;
  note?: string | null;
}

/**
 * Service Usage API Client — Quản lý dịch vụ phát sinh của booking (Phase 8)
 * Tham chiếu: docs/04-frontend/phase8-checkout/README.md
 */
export const serviceUsageApi = {
  /**
   * Lấy danh sách dịch vụ đã sử dụng của một đơn đặt phòng
   * GET /api/bookings/:bookingId/services
   */
  listByBooking: async (bookingId: string): Promise<ApiResponse<ServiceUsageItem[]>> => {
    const res = await api.get<never, ApiResponse<ServiceUsageItem[]>>(
      `/bookings/${bookingId}/services`
    );
    return res;
  },

  /**
   * Thêm dịch vụ phát sinh cho đơn đặt phòng (khi đang checked_in)
   * POST /api/bookings/:bookingId/services
   */
  add: async (
    bookingId: string,
    data: AddServiceUsagePayload
  ): Promise<ApiResponse<ServiceUsageItem>> => {
    const res = await api.post<never, ApiResponse<ServiceUsageItem>>(
      `/bookings/${bookingId}/services`,
      data
    );
    return res;
  },

  /**
   * Xóa một lượt dịch vụ đã ghi nhận (khi chưa check-out)
   * DELETE /api/service-usages/:id
   */
  remove: async (id: string): Promise<ApiResponse<null>> => {
    const res = await api.delete<never, ApiResponse<null>>(`/service-usages/${id}`);
    return res;
  },
};

export const { listByBooking, add, remove } = serviceUsageApi;

