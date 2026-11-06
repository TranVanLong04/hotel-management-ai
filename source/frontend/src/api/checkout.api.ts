import api from './axios';
import type {
  ApiResponse,
  CheckoutPreviewData,
  CheckoutPayload,
  CheckoutResponseData,
} from '@/types';

/**
 * Checkout API Client — Giao tiếp với Backend cho luồng Trả phòng & Xuất hóa đơn
 * Tham chiếu: docs/04-frontend/phase8-checkout/README.md & docs/03-backend/phase7-checkin-checkout/README.md
 */
export const checkoutApi = {
  /**
   * Lấy chi phí tạm tính khi check-out (tiền phòng, dịch vụ, thuế, giảm giá)
   * GET /api/checkout/:bookingId/preview
   */
  getPreview: async (
    bookingId: string,
    params?: { discount_amount?: number; tax_rate?: number }
  ): Promise<ApiResponse<CheckoutPreviewData>> => {
    const res = await api.get<never, ApiResponse<CheckoutPreviewData>>(
      `/checkout/${bookingId}/preview`,
      { params }
    );
    return res;
  },

  /**
   * Thực hiện trả phòng, tạo hóa đơn và ghi nhận thanh toán
   * POST /api/checkout/:bookingId
   */
  checkout: async (
    bookingId: string,
    payload: CheckoutPayload
  ): Promise<ApiResponse<CheckoutResponseData>> => {
    const res = await api.post<never, ApiResponse<CheckoutResponseData>>(
      `/checkout/${bookingId}`,
      payload
    );
    return res;
  },
};

export const { getPreview, checkout } = checkoutApi;

