import api from './axios';
import type {
  ApiResponse,
  PaginatedResponse,
  Booking,
  BookingFilterParams,
  CreateBookingPayload,
} from '@/types';

/**
 * Booking API Client — Các API liên quan đến Đặt phòng
 */
export const bookingApi = {
  /**
   * Lấy danh sách booking (khách hàng lấy danh sách của mình, staff/admin lấy toàn bộ)
   * @param params page, limit, status, search, ...
   */
  list: (params?: BookingFilterParams): Promise<PaginatedResponse<Booking>> =>
    api.get('/bookings', { params }),

  /**
   * Lấy chi tiết booking theo ID
   * @param id UUID booking
   */
  getById: (id: string): Promise<ApiResponse<Booking>> =>
    api.get(`/bookings/${id}`),

  /**
   * Khách hàng tạo booking mới
   * @param data room_id, check_in_date, check_out_date, number_of_guests, note
   */
  create: (data: CreateBookingPayload): Promise<ApiResponse<Booking>> =>
    api.post('/bookings', data),

  /**
   * Hủy booking (dành cho khách hàng hoặc nhân viên)
   * @param id UUID booking
   * @param reason Lý do hủy
   */
  cancel: (id: string, reason?: string): Promise<ApiResponse<Booking>> =>
    api.post(`/bookings/${id}/cancel`, { reason }),

  /**
   * Nhân viên xác nhận booking
   * @param id UUID booking
   */
  confirm: (id: string): Promise<ApiResponse<Booking>> =>
    api.post(`/bookings/${id}/confirm`),
};
