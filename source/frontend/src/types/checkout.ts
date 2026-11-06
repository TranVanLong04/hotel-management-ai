import type { Booking, Customer, Room, InvoiceStatus } from './index';

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
  booking: Booking & {
    customer?: Customer;
    room?: Room & {
      room_types?: {
        name: string;
        base_price: number;
      };
    };
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

export type CheckoutPaymentMethod =
  | 'cash'
  | 'bank_transfer'
  | 'credit_card'
  | 'online'
  | 'other';

export interface PaymentItemPayload {
  amount: number;
  method: CheckoutPaymentMethod;
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
  status: InvoiceStatus;
  issued_at: string;
}

export interface CheckoutResponseData {
  booking: Booking;
  invoice: InvoiceDetail;
  payments: any[];
}

export interface CalculatedFinancials {
  room_amount: number;
  service_amount: number;
  subtotal: number;
  discount_amount: number;
  taxable_amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
}

