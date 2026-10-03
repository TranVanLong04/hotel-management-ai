import { z } from 'zod';

/**
 * Validation schema cho Module Payments
 */

// Schema tạo thanh toán mới
export const createPaymentSchema = {
  body: z.object({
    booking_id: z
      .string({ required_error: 'booking_id là bắt buộc' })
      .uuid('booking_id phải là UUID hợp lệ'),
    gateway: z.enum(['momo', 'vnpay'], {
      required_error: 'Cổng thanh toán là bắt buộc',
      invalid_type_error: 'Cổng thanh toán chỉ chấp nhận "momo" hoặc "vnpay"',
    }),
  }),
};

// Schema kiểm tra query callback từ MoMo
export const momoCallbackSchema = {
  query: z.object({
    partnerCode: z.string().optional(),
    orderId: z.string().optional(),
    requestId: z.string().optional(),
    amount: z.coerce.number().optional(),
    orderInfo: z.string().optional(),
    orderType: z.string().optional(),
    transId: z.coerce.string().optional(),
    resultCode: z.coerce.number().optional(),
    message: z.string().optional(),
    payType: z.string().optional(),
    responseTime: z.coerce.number().optional(),
    extraData: z.string().optional(),
    signature: z.string().optional(),
  }),
};

// Schema kiểm tra query callback từ VNPay
export const vnpayCallbackSchema = {
  query: z.object({
    vnp_Amount: z.coerce.string().optional(),
    vnp_BankCode: z.string().optional(),
    vnp_BankTranNo: z.string().optional(),
    vnp_CardType: z.string().optional(),
    vnp_OrderInfo: z.string().optional(),
    vnp_PayDate: z.string().optional(),
    vnp_ResponseCode: z.string().optional(),
    vnp_TmnCode: z.string().optional(),
    vnp_TransactionNo: z.string().optional(),
    vnp_TransactionStatus: z.string().optional(),
    vnp_TxnRef: z.string().optional(),
    vnp_SecureHash: z.string().optional(),
    vnp_SecureHashType: z.string().optional(),
  }),
};

// Schema params bookingId
export const bookingIdParamSchema = {
  params: z.object({
    bookingId: z.string().uuid('bookingId phải là UUID hợp lệ'),
  }),
};
