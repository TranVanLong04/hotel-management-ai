import api from '@/api/axios';
import type { ApiResponse } from '@/types';

export interface ServiceUsageItem {
  id: string;
  service_id: string;
  service_name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  note?: string | null;
  used_at: string;
}

export interface CheckoutPreviewData {
  booking: {
    id: string;
    booking_code: string;
    customer?: {
      id: string;
      full_name: string;
      phone: string;
      identity_number?: string;
    };
    room?: {
      id: string;
      room_number: string;
      floor?: number;
      room_types?: {
        name: string;
        base_price: number;
      };
    };
    check_in_date: string;
    check_out_date: string;
    actual_check_in_at?: string;
    status: string;
    room_subtotal: number;
  };
  services: ServiceUsageItem[];
  summary: {
    room_amount: number;
    service_amount: number;
    discount_amount: number;
    taxable_amount: number;
    tax_rate: number;
    tax_amount: number;
    total_amount: number;
  };
}

export type PaymentMethod =
  | 'cash'
  | 'credit_card'
  | 'bank_transfer'
  | 'momo'
  | 'vnpay'
  | 'zalopay';

export interface PaymentItemPayload {
  amount: number;
  method: PaymentMethod;
  transaction_code?: string;
  note?: string;
}

export interface CheckoutPayload {
  discount_amount: number;
  tax_rate: number;
  payments: PaymentItemPayload[];
  note?: string;
}

export interface InvoiceDetail {
  id: string;
  invoice_code: string;
  booking_id: string;
  customer_id: string;
  room_amount: number;
  service_amount: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  status: 'paid' | 'partial' | 'unpaid' | 'cancelled';
  issued_at: string;
}

export interface CheckoutResponseData {
  booking: any;
  invoice: InvoiceDetail;
  payments: any[];
}

export const checkoutApi = {
  /**
   * Lấy chi phí tạm tính khi check-out (tiền phòng, dịch vụ, thuế, giảm giá)
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
   * Thực hiện trả phòng, tạo hóa đơn và thanh toán
   */
  confirmCheckout: async (
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

