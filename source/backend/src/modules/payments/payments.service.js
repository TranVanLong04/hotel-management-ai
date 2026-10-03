import * as paymentsRepo from './payments.repository.js';
import * as momoGateway from './gateways/momo.gateway.js';
import * as vnpayGateway from './gateways/vnpay.gateway.js';
import { sendBookingConfirmation } from '../../services/email/email.service.js';
import { BOOKING_STATUSES, PAYMENT_STATUSES, PAYMENT_METHODS } from '../../config/constants.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../utils/errors.js';
import { logger } from '../../config/logger.js';
import { env } from '../../config/env.js';
import { supabaseAdmin } from '../../config/supabase.js';

/**
 * Service — Xử lý logic nghiệp vụ thanh toán trực tuyến
 */

/**
 * Lấy danh sách cổng thanh toán khả dụng trên hệ thống
 * @returns {{ momo: boolean, vnpay: boolean, gateways: Array<{ id: string, name: string, available: boolean }>, available: Array<string> }}
 */
export const getAvailableGateways = () => {
  const vnpayConfigured = vnpayGateway.isVnpayConfigured();

  const available = ['momo'];
  if (vnpayConfigured) {
    available.push('vnpay');
  }

  return {
    momo: true,
    vnpay: vnpayConfigured,
    gateways: [
      {
        id: 'momo',
        name: 'Ví MoMo',
        available: true,
      },
      {
        id: 'vnpay',
        name: 'VNPAY-QR / Thẻ ATM',
        available: vnpayConfigured,
      },
    ],
    available,
  };
};

/**
 * Tạo yêu cầu thanh toán trực tuyến (MoMo hoặc VNPay)
 *
 * @param {string} userId - UUID khách hàng đăng nhập
 * @param {Object} payload - { booking_id, gateway }
 * @param {string} ipAddr - Địa chỉ IP client
 */
export const createPayment = async (userId, { booking_id, gateway }, ipAddr = '127.0.0.1') => {
  // 1. Kiểm tra đơn đặt phòng
  const booking = await paymentsRepo.findBookingById(booking_id);
  if (!booking) {
    throw new NotFoundError('Booking');
  }

  // 2. Kiểm tra quyền sở hữu (Customer chỉ thanh toán đơn của mình)
  if (booking.customers?.user_id !== userId) {
    throw new ForbiddenError('Bạn không có quyền thanh toán cho đơn đặt phòng này');
  }

  // 3. Kiểm tra trạng thái booking — chỉ cho phép thanh toán khi 'pending_payment'
  if (booking.status !== BOOKING_STATUSES.PENDING_PAYMENT) {
    throw new BadRequestError(
      `Đơn đặt phòng đang ở trạng thái "${booking.status}", không thể thực hiện thanh toán`
    );
  }

  const amount =
    booking.room_subtotal > 0
      ? booking.room_subtotal
      : (booking.room_price || 0) * (booking.number_of_nights || 1);

  const orderInfo = `Thanh toan don dat phong ${booking.booking_code}`;

  // 4. Khởi tạo thanh toán qua Gateway tương ứng
  if (gateway === 'momo') {
    const momoResult = await momoGateway.createMomoPayment({
      bookingId: booking.id,
      bookingCode: booking.booking_code,
      amount,
      orderInfo,
    });

    await paymentsRepo.createPaymentLog({
      booking_id: booking.id,
      gateway: 'momo',
      event_type: 'create_payment',
      request_payload: { booking_id, amount, gateway },
      response_payload: momoResult,
      ip_address: ipAddr,
    });

    return {
      gateway: 'momo',
      payUrl: momoResult.payUrl,
      orderId: momoResult.orderId,
      nextStep: 'payment',
    };
  }

  if (gateway === 'vnpay') {
    if (!vnpayGateway.isVnpayConfigured()) {
      throw new BadRequestError(
        'Cổng thanh toán VNPay chưa được cấu hình. Vui lòng chọn Ví MoMo.'
      );
    }

    const vnpayResult = await vnpayGateway.createVnpayPayment({
      bookingId: booking.id,
      bookingCode: booking.booking_code,
      amount,
      orderInfo,
      ipAddr,
    });

    await paymentsRepo.createPaymentLog({
      booking_id: booking.id,
      gateway: 'vnpay',
      event_type: 'create_payment',
      request_payload: { booking_id, amount, gateway },
      response_payload: vnpayResult,
      ip_address: ipAddr,
    });

    return {
      gateway: 'vnpay',
      paymentUrl: vnpayResult.paymentUrl,
      orderId: vnpayResult.txnRef,
      nextStep: 'payment',
    };
  }

  throw new BadRequestError('Cổng thanh toán không được hỗ trợ');
};

/**
 * Xử lý hoàn tất giao dịch thanh toán thành công (Cập nhật DB + Gửi email)
 * Đảm bảo Idempotency (chỉ chạy 1 lần cho mỗi orderId)
 */
const finalizeSuccessfulPayment = async ({
  bookingId,
  gateway,
  orderId,
  transactionId,
  amount,
  rawResponse,
}) => {
  // 1. Kiểm tra xem giao dịch này đã được ghi nhận trước đó chưa (Idempotency)
  const existingPayment = await paymentsRepo.findPaymentByGatewayOrderId(gateway, orderId);
  if (existingPayment) {
    logger.info({ gateway, orderId }, 'Giao dịch đã được xử lý trước đó (Idempotent)');
    return { alreadyProcessed: true, payment: existingPayment };
  }

  // 2. Lấy thông tin booking chi tiết
  const booking = await paymentsRepo.findBookingById(bookingId);
  if (!booking) {
    throw new NotFoundError('Booking');
  }

  // Nếu booking đã được xử lý sang pending hoặc confirmed, không cập nhật lại trạng thái
  if (booking.status !== BOOKING_STATUSES.PENDING_PAYMENT) {
    logger.info({ bookingId, status: booking.status }, 'Booking đã được chuyển trạng thái trước đó');
    return { alreadyProcessed: true, booking };
  }

  // 3. Cập nhật trạng thái booking sang 'pending' (Chờ khách sạn xác nhận)
  const updatedBooking = await paymentsRepo.updateBookingStatus(bookingId, BOOKING_STATUSES.PENDING);

  // 4. Tạo hoặc lấy hóa đơn (Invoice)
  const invoice = await paymentsRepo.findOrCreateInvoiceForBooking(booking);

  // 5. Thêm bản ghi vào bảng payments
  const paymentRecord = await paymentsRepo.createPayment({
    invoice_id: invoice.id,
    amount: amount || booking.room_subtotal,
    refunded_amount: 0,
    method: PAYMENT_METHODS.ONLINE,
    status: PAYMENT_STATUSES.COMPLETED,
    transaction_code: String(transactionId || orderId),
    gateway,
    gateway_order_id: String(orderId),
    gateway_transaction_id: String(transactionId || ''),
    gateway_response: rawResponse || null,
    paid_at: new Date().toISOString(),
  });

  logger.info(
    { bookingId, bookingCode: booking.booking_code, gateway, orderId },
    'Thanh toán trực tuyến thành công — Đã chuyển trạng thái booking sang pending'
  );

  // 6. Gửi email xác nhận bất đồng bộ (Không chờ kết quả để tăng tốc độ phản hồi)
  const customerEmail = booking.customers?.email;
  if (customerEmail) {
    sendBookingConfirmation({
      to: customerEmail,
      booking: updatedBooking,
      customer: updatedBooking.customers,
      room: updatedBooking.rooms,
      userId: updatedBooking.customers?.user_id,
    }).catch((err) => {
      logger.error({ err, bookingId }, 'Lỗi gửi email xác nhận đặt phòng');
    });
  }

  return { alreadyProcessed: false, payment: paymentRecord, booking: updatedBooking };
};

/**
 * Xử lý Return URL từ MoMo (sau khi khách redirect về từ MoMo)
 * Hoàn toàn Idempotent: Nếu đã xử lý trước đó qua IPN thì trả về success ngay.
 */
export const handleMomoReturn = async (query, ipAddress = '127.0.0.1') => {
  const verifyResult = momoGateway.verifyMomoReturn(query);

  let bookingId = verifyResult.bookingId;

  // Nếu không có trong extraData, tìm booking theo orderInfo (chứa booking_code BK...)
  if (!bookingId && query.orderInfo) {
    const match = query.orderInfo.match(/BK\d+/);
    if (match) {
      const { data } = await supabaseAdmin
        .from('bookings')
        .select('id, status')
        .eq('booking_code', match[0])
        .maybeSingle();
      if (data) {
        bookingId = data.id;
      }
    }
  }

  // Nếu vẫn chưa có, tra cứu từ payment_logs dựa vào orderId
  if (!bookingId && query.orderId) {
    const { data: logData } = await supabaseAdmin
      .from('payment_logs')
      .select('booking_id')
      .eq('gateway', 'momo')
      .contains('request_payload', { orderId: query.orderId })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (logData?.booking_id) {
      bookingId = logData.booking_id;
    }
  }

  // Ghi log callback
  await paymentsRepo.createPaymentLog({
    booking_id: bookingId,
    gateway: 'momo',
    event_type: 'return_callback',
    request_payload: query,
    response_payload: verifyResult,
    signature_valid: verifyResult.valid,
    ip_address: ipAddress,
  });

  if (!bookingId) {
    logger.warn({ query }, 'Momo Return: Không tìm thấy thông tin đơn đặt phòng');
    return { success: false, reason: 'Không tìm thấy thông tin đơn đặt phòng' };
  }

  // Lấy thông tin booking trong DB để kiểm tra trạng thái thực tế
  const booking = await paymentsRepo.findBookingById(bookingId);
  if (!booking) {
    return { success: false, reason: 'Đơn đặt phòng không tồn tại' };
  }

  // IDEMPOTENCY: Nếu đơn đã được xác nhận (pending / confirmed) bởi IPN hoặc lượt gọi trước
  if (
    booking.status === BOOKING_STATUSES.PENDING ||
    booking.status === BOOKING_STATUSES.CONFIRMED ||
    booking.status === BOOKING_STATUSES.CHECKED_IN
  ) {
    logger.info(
      { bookingId, bookingCode: booking.booking_code, status: booking.status },
      'Momo Return: Đơn hàng đã ở trạng thái đã thanh toán/xác nhận (Idempotent success)'
    );
    return {
      success: true,
      bookingId,
      status: booking.status,
      alreadyProcessed: true,
      nextStep: 'face_register',
    };
  }

  // Nếu người dùng hủy hoặc MoMo báo lỗi
  if (verifyResult.data.resultCode !== 0) {
    logger.warn({ query, resultCode: verifyResult.data.resultCode }, 'Momo Return: Giao dịch không thành công');
    return {
      success: false,
      bookingId,
      status: booking.status,
      reason: verifyResult.data.message || 'Giao dịch thanh toán MoMo không thành công hoặc đã bị hủy',
    };
  }

  // Nếu booking vẫn đang ở trạng thái pending_payment và giao dịch thành công
  await finalizeSuccessfulPayment({
    bookingId,
    gateway: 'momo',
    orderId: verifyResult.data.orderId || query.orderId,
    transactionId: verifyResult.data.transId || query.transId || query.orderId,
    amount: verifyResult.data.amount || booking.room_subtotal,
    rawResponse: query,
  });

  return {
    success: true,
    bookingId,
    status: BOOKING_STATUSES.PENDING,
    nextStep: 'face_register',
  };
};

/**
 * Xử lý IPN Webhook từ MoMo (Strict verification)
 */
export const handleMomoIpn = async (query, ipAddress = '127.0.0.1') => {
  const verifyResult = momoGateway.verifyMomoIpn(query);

  let bookingId = verifyResult.bookingId;
  if (!bookingId && query.orderInfo) {
    const match = query.orderInfo.match(/BK\d+/);
    if (match) {
      const { data } = await supabaseAdmin
        .from('bookings')
        .select('id')
        .eq('booking_code', match[0])
        .maybeSingle();
      if (data) bookingId = data.id;
    }
  }

  await paymentsRepo.createPaymentLog({
    booking_id: bookingId,
    gateway: 'momo',
    event_type: 'ipn_webhook',
    request_payload: query,
    response_payload: verifyResult,
    signature_valid: verifyResult.valid,
    ip_address: ipAddress,
  });

  if (!verifyResult.valid || verifyResult.data.resultCode !== 0) {
    logger.warn({ query, valid: verifyResult.valid }, 'Momo IPN: Chữ ký không hợp lệ hoặc giao dịch thất bại');
    return { success: false };
  }

  if (bookingId) {
    await finalizeSuccessfulPayment({
      bookingId,
      gateway: 'momo',
      orderId: verifyResult.data.orderId,
      transactionId: verifyResult.data.transId,
      amount: verifyResult.data.amount,
      rawResponse: query,
    });
  }

  return { success: true };
};

/**
 * Xử lý Return URL từ VNPay (sau khi khách thanh toán trên VNPay)
 */
export const handleVnpayReturn = async (query, ipAddress = '127.0.0.1') => {
  const verifyResult = vnpayGateway.verifyVnpayCallback(query);

  const txnRef = verifyResult.txnRef;
  const bookingCode = txnRef.includes('-') ? txnRef.split('-')[0] : txnRef;

  // Tìm booking theo bookingCode
  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('booking_code', bookingCode)
    .maybeSingle();

  const bookingId = booking?.id || null;

  await paymentsRepo.createPaymentLog({
    booking_id: bookingId,
    gateway: 'vnpay',
    event_type: 'return_callback',
    request_payload: query,
    response_payload: verifyResult,
    signature_valid: verifyResult.valid,
    ip_address: ipAddress,
  });

  if (!verifyResult.valid) {
    logger.warn({ query }, 'VNPay Return: Chữ ký không hợp lệ');
    return { success: false, reason: 'Chữ ký giao dịch VNPay không hợp lệ' };
  }

  if (!verifyResult.isSuccess) {
    logger.warn({ query }, 'VNPay Return: Giao dịch không thành công');
    return {
      success: false,
      reason: 'Giao dịch thanh toán qua VNPay không thành công hoặc đã bị hủy',
    };
  }

  if (!bookingId) {
    return { success: false, reason: 'Không tìm thấy đơn đặt phòng tương ứng' };
  }

  await finalizeSuccessfulPayment({
    bookingId,
    gateway: 'vnpay',
    orderId: txnRef,
    transactionId: verifyResult.data.transactionNo,
    amount: verifyResult.data.amount,
    rawResponse: query,
  });

  return {
    success: true,
    bookingId,
    nextStep: 'face_register',
  };
};

/**
 * Xử lý IPN Webhook từ VNPay
 */
export const handleVnpayIpn = async (query, ipAddress = '127.0.0.1') => {
  const verifyResult = vnpayGateway.verifyVnpayCallback(query);

  const txnRef = verifyResult.txnRef;
  const bookingCode = txnRef.includes('-') ? txnRef.split('-')[0] : txnRef;

  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('booking_code', bookingCode)
    .maybeSingle();

  const bookingId = booking?.id || null;

  await paymentsRepo.createPaymentLog({
    booking_id: bookingId,
    gateway: 'vnpay',
    event_type: 'ipn_webhook',
    request_payload: query,
    response_payload: verifyResult,
    signature_valid: verifyResult.valid,
    ip_address: ipAddress,
  });

  if (!verifyResult.valid) {
    return { RspCode: '97', Message: 'Checksum failed' };
  }

  if (!bookingId) {
    return { RspCode: '01', Message: 'Order not found' };
  }

  // Check đã xử lý chưa
  const existingPayment = await paymentsRepo.findPaymentByGatewayOrderId('vnpay', txnRef);
  if (existingPayment) {
    return { RspCode: '02', Message: 'Order already confirmed' };
  }

  if (verifyResult.isSuccess) {
    await finalizeSuccessfulPayment({
      bookingId,
      gateway: 'vnpay',
      orderId: txnRef,
      transactionId: verifyResult.data.transactionNo,
      amount: verifyResult.data.amount,
      rawResponse: query,
    });
    return { RspCode: '00', Message: 'Confirm Success' };
  }

  return { RspCode: '00', Message: 'Confirm Success' };
};

/**
 * Xem lịch sử thanh toán của một đơn đặt phòng
 */
export const getPaymentsByBooking = async (userId, userRole, bookingId) => {
  const booking = await paymentsRepo.findBookingById(bookingId);
  if (!booking) {
    throw new NotFoundError('Booking');
  }

  if (userRole === 'customer' && booking.customers?.user_id !== userId) {
    throw new ForbiddenError('Không có quyền xem thông tin thanh toán này');
  }

  return paymentsRepo.listPaymentsByBooking(bookingId);
};
