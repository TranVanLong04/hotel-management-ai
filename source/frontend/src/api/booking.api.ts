import api from './axios';
import type {
  ApiResponse,
  PaginatedResponse,
  Booking,
  BookingFilterParams,
  CreateBookingPayload,
  CreatePaymentPayload,
  PaymentResponse,
  PaymentCallbackResult,
  Payment,
} from '@/types';

/**
 * Booking API Client — Các API liên quan đến Đặt phòng và Thanh toán trực tuyến
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
   * Khách hàng tạo booking mới (trạng thái pending_payment)
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

  // ========== THANH TOÁN TRỰC TUYẾN (MOMO & VNPAY) ==========

  /**
   * Lấy danh sách các cổng thanh toán đang khả dụng trên hệ thống
   */
  getAvailableGateways: (): Promise<
    ApiResponse<{
      gateways: Array<{ id: string; name: string; available: boolean }>;
      available: string[];
    }>
  > => api.get('/payments/gateways'),

  /**
   * Tạo yêu cầu thanh toán trực tuyến qua MoMo hoặc VNPay
   * @param payload { booking_id, gateway: 'momo' | 'vnpay' }
   */
  createPayment: (payload: CreatePaymentPayload): Promise<ApiResponse<PaymentResponse>> =>
    api.post('/payments', payload),

  /**
   * Lấy danh sách các giao dịch thanh toán của 1 đơn đặt phòng
   * @param bookingId UUID booking
   */
  getPaymentsByBooking: (bookingId: string): Promise<ApiResponse<Payment[]>> =>
    api.get(`/payments/booking/${bookingId}`),

  /**
   * Xác thực kết quả giao dịch sau khi redirect từ MoMo
   * @param queryString Query string từ URL callback
   */
  verifyMomoReturn: (queryString: string): Promise<ApiResponse<PaymentCallbackResult>> =>
    api.get(`/payments/momo/return${queryString}`),

  /**
   * Xác thực kết quả giao dịch sau khi redirect từ VNPay
   * @param queryString Query string từ URL callback
   */
  verifyVnpayReturn: (queryString: string): Promise<ApiResponse<PaymentCallbackResult>> =>
    api.get(`/payments/vnpay/return${queryString}`),
};
