import { supabaseAdmin } from '../../config/supabase.js';
import { InternalError } from '../../utils/errors.js';
import { logger } from '../../config/logger.js';
import { INVOICE_STATUSES } from '../../config/constants.js';

/**
 * Repository — Thao tác cơ sở dữ liệu cho module Payments
 */

/**
 * Tìm thông tin booking chi tiết theo ID (kèm thông tin customer và phòng)
 * @param {string} bookingId - UUID
 */
export const findBookingById = async (bookingId) => {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select(`
      *,
      customers(id, user_id, full_name, phone, email, identity_number),
      rooms(id, room_number, floor, status, room_types(id, name, base_price, max_guests))
    `)
    .eq('id', bookingId)
    .maybeSingle();

  if (error) {
    logger.error({ err: error, bookingId }, 'PaymentsRepository: findBookingById failed');
    throw new InternalError('Lỗi truy vấn thông tin đơn đặt phòng');
  }

  return data;
};

/**
 * Tìm khách hàng theo user_id
 * @param {string} userId - UUID
 */
export const findCustomerByUserId = async (userId) => {
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('id, user_id, full_name, phone, email')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    logger.error({ err: error, userId }, 'PaymentsRepository: findCustomerByUserId failed');
    throw new InternalError('Lỗi truy vấn thông tin khách hàng');
  }

  return data;
};

/**
 * Kiểm tra payment đã tồn tại theo gateway và orderId (Idempotency)
 * @param {string} gateway - 'momo' | 'vnpay'
 * @param {string} gatewayOrderId
 */
export const findPaymentByGatewayOrderId = async (gateway, gatewayOrderId) => {
  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('gateway', gateway)
    .eq('gateway_order_id', gatewayOrderId)
    .maybeSingle();

  if (error) {
    logger.error({ err: error, gateway, gatewayOrderId }, 'PaymentsRepository: findPaymentByGatewayOrderId failed');
    throw new InternalError('Lỗi kiểm tra trùng lặp thanh toán');
  }

  return data;
};

/**
 * Tạo mã hóa đơn — INV + YYYYMMDD + 3 số sequence
 */
export const generateInvoiceCode = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  const todayStart = `${year}-${month}-${day}T00:00:00.000Z`;
  const todayEnd = `${year}-${month}-${day}T23:59:59.999Z`;

  const { count, error } = await supabaseAdmin
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', todayStart)
    .lte('created_at', todayEnd);

  if (error) {
    logger.error({ err: error }, 'PaymentsRepository: generateInvoiceCode failed');
    throw new InternalError('Lỗi tạo mã hóa đơn');
  }

  const sequence = String((count || 0) + 1).padStart(3, '0');
  return `INV${dateStr}${sequence}`;
};

/**
 * Tìm hoặc tạo mới hóa đơn (Invoice) cho booking
 * @param {Object} booking
 */
export const findOrCreateInvoiceForBooking = async (booking) => {
  // 1. Kiểm tra hóa đơn đã tồn tại cho booking này chưa
  const { data: existingInvoice, error: findError } = await supabaseAdmin
    .from('invoices')
    .select('*')
    .eq('booking_id', booking.id)
    .maybeSingle();

  if (findError) {
    logger.error({ err: findError, bookingId: booking.id }, 'PaymentsRepository: find invoice failed');
    throw new InternalError('Lỗi truy vấn hóa đơn');
  }

  if (existingInvoice) {
    return existingInvoice;
  }

  // 2. Tạo hóa đơn mới
  const invoiceCode = await generateInvoiceCode();
  const roomAmount = booking.room_subtotal || (booking.room_price * (booking.number_of_nights || 1));

  const { data: newInvoice, error: createError } = await supabaseAdmin
    .from('invoices')
    .insert({
      invoice_code: invoiceCode,
      booking_id: booking.id,
      customer_id: booking.customer_id,
      room_amount: roomAmount,
      service_amount: 0,
      discount_rate: 0,
      discount_amount: 0,
      tax_rate: 0,
      tax_amount: 0,
      total_amount: roomAmount,
      status: INVOICE_STATUSES.PAID,
      issued_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (createError) {
    logger.error({ err: createError, bookingId: booking.id }, 'PaymentsRepository: create invoice failed');
    throw new InternalError('Lỗi tạo hóa đơn thanh toán');
  }

  return newInvoice;
};

/**
 * Thêm bản ghi thanh toán vào bảng payments
 * @param {Object} paymentData
 */
export const createPayment = async (paymentData) => {
  const { data, error } = await supabaseAdmin
    .from('payments')
    .insert(paymentData)
    .select()
    .single();

  if (error) {
    logger.error({ err: error, paymentData }, 'PaymentsRepository: createPayment failed');
    throw new InternalError('Lỗi lưu thông tin thanh toán');
  }

  return data;
};

/**
 * Ghi log giao dịch cổng thanh toán vào bảng payment_logs
 * @param {Object} logData
 */
export const createPaymentLog = async (logData) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('payment_logs')
      .insert({
        booking_id: logData.booking_id || null,
        gateway: logData.gateway,
        event_type: logData.event_type,
        request_payload: logData.request_payload || null,
        response_payload: logData.response_payload || null,
        signature_valid: logData.signature_valid !== undefined ? logData.signature_valid : null,
        ip_address: logData.ip_address || null,
      })
      .select()
      .single();

    if (error) {
      logger.error({ err: error }, 'PaymentsRepository: createPaymentLog insert failed');
    }

    return data;
  } catch (err) {
    logger.error({ err }, 'PaymentsRepository: createPaymentLog error');
    return null;
  }
};

/**
 * Cập nhật trạng thái booking
 * @param {string} bookingId - UUID
 * @param {string} status
 */
export const updateBookingStatus = async (bookingId, status) => {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', bookingId)
    .select(`
      *,
      customers(id, user_id, full_name, phone, email),
      rooms(id, room_number, floor, status, room_types(id, name, base_price, max_guests))
    `)
    .single();

  if (error) {
    logger.error({ err: error, bookingId, status }, 'PaymentsRepository: updateBookingStatus failed');
    throw new InternalError('Lỗi cập nhật trạng thái đơn đặt phòng');
  }

  return data;
};

/**
 * Lấy danh sách payment theo booking ID
 * @param {string} bookingId - UUID
 */
export const listPaymentsByBooking = async (bookingId) => {
  const { data, error } = await supabaseAdmin
    .from('invoices')
    .select(`
      id,
      invoice_code,
      total_amount,
      status,
      payments (
        id,
        amount,
        method,
        status,
        gateway,
        gateway_order_id,
        gateway_transaction_id,
        paid_at
      )
    `)
    .eq('booking_id', bookingId)
    .maybeSingle();

  if (error) {
    logger.error({ err: error, bookingId }, 'PaymentsRepository: listPaymentsByBooking failed');
    throw new InternalError('Lỗi lấy lịch sử thanh toán');
  }

  return data?.payments || [];
};
