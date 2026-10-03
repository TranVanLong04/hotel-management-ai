import api from './axios';
import type {
  ApiResponse,
  CreatePaymentPayload,
  PaymentResponse,
  PaymentCallbackResult,
  Payment,
} from '@/types';

export interface AvailableGatewaysResponse {
  momo: boolean;
  vnpay: boolean;
  gateways?: Array<{ id: string; name: string; available: boolean }>;
  available?: string[];
}

/**
 * Payment API Client — Các API liên quan đến Cổng thanh toán trực tuyến
 */
export const paymentApi = {
  /**
   * Lấy danh sách cổng thanh toán đang khả dụng (MoMo, VNPay)
   */
  getAvailableGateways: (): Promise<ApiResponse<AvailableGatewaysResponse>> =>
    api.get('/payments/gateways'),

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
