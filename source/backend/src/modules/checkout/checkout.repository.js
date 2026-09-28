import { supabaseAdmin } from '../../config/supabase.js';
import { InternalError, ConflictError } from '../../utils/errors.js';
import { logger } from '../../config/logger.js';
import { INVOICE_STATUSES, PAYMENT_STATUSES } from '../../config/constants.js';

/**
 * Repository — truy vấn DB cho module Check-out (invoices, payments, service_usages).
 * Tham chiếu: docs/03-backend/phase7-checkin-checkout/README.md
 */

/**
 * Tính tổng tiền dịch vụ đã sử dụng cho 1 booking.
 * @param {string} bookingId - UUID
 * @returns {Promise<number>} Tổng tiền dịch vụ (VND)
 */
export const getServiceAmountByBookingId = async (bookingId) => {
  const { data, error } = await supabaseAdmin
    .from('service_usages')
    .select('total_amount')
    .eq('booking_id', bookingId);

  if (error) {
    logger.error({ err: error, bookingId }, 'CheckoutRepository: getServiceAmountByBookingId failed');
    throw new InternalError('Lỗi truy vấn tiền dịch vụ của đặt phòng');
  }

  const total = (data || []).reduce((sum, item) => sum + Number(item.total_amount || 0), 0);
  return total;
};

/**
 * Tìm hóa đơn theo booking_id (1 booking chỉ có 1 invoice).
 * @param {string} bookingId - UUID
 * @returns {Promise<Object|null>}
 */
export const findInvoiceByBookingId = async (bookingId) => {
  const { data, error } = await supabaseAdmin
    .from('invoices')
    .select('*')
    .eq('booking_id', bookingId)
    .maybeSingle();

  if (error) {
    logger.error({ err: error, bookingId }, 'CheckoutRepository: findInvoiceByBookingId failed');
    throw new InternalError('Lỗi truy vấn hóa đơn');
  }

  return data;
};

/**
 * Tạo mã hóa đơn — format: INV + YYYYMMDD + 3 chữ số sequence.
 * VD: INV20260928001, INV20260928002...
 * @returns {Promise<string>}
 */
export const generateInvoiceCode = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  const todayStart = new Date(year, now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
  const todayEnd = new Date(year, now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

  const { count, error } = await supabaseAdmin
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .gte('issued_at', todayStart)
    .lte('issued_at', todayEnd);

  if (error) {
    logger.error({ err: error }, 'CheckoutRepository: generateInvoiceCode count failed');
    throw new InternalError('Lỗi tạo mã hóa đơn');
  }

  const sequence = String((count || 0) + 1).padStart(3, '0');
  return `INV${dateStr}${sequence}`;
};

/**
 * Tạo hóa đơn mới.
 * CHÚ Ý: KHÔNG insert total_amount vì đây là generated column trong DB.
 * Đọc lại row sau insert để lấy total_amount do Postgres tự tính.
 *
 * @param {Object} invoiceData
 * @returns {Promise<Object>} Hóa đơn đã tạo kèm total_amount
 */
export const createInvoice = async (invoiceData) => {
  const { data, error } = await supabaseAdmin
    .from('invoices')
    .insert({
      invoice_code: invoiceData.invoice_code,
      booking_id: invoiceData.booking_id,
      customer_id: invoiceData.customer_id,
      room_amount: invoiceData.room_amount,
      service_amount: invoiceData.service_amount,
      discount_amount: invoiceData.discount_amount,
      tax_rate: invoiceData.tax_rate,
      tax_amount: invoiceData.tax_amount,
      status: INVOICE_STATUSES.UNPAID,
      issued_at: invoiceData.issued_at || new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new ConflictError('INVOICE_ALREADY_EXISTS', 'Hóa đơn cho đặt phòng này đã tồn tại');
    }
    logger.error({ err: error, invoiceData }, 'CheckoutRepository: createInvoice failed');
    throw new InternalError('Lỗi tạo hóa đơn');
  }

  return data;
};

/**
 * Xóa hóa đơn (dùng cho thủ công rollback khi chèn payments thất bại).
 * @param {string} invoiceId - UUID
 * @returns {Promise<void>}
 */
export const deleteInvoice = async (invoiceId) => {
  const { error } = await supabaseAdmin
    .from('invoices')
    .delete()
    .eq('id', invoiceId);

  if (error) {
    logger.error({ err: error, invoiceId }, 'CheckoutRepository: deleteInvoice rollback failed');
  }
};

/**
 * Tạo danh sách payments cho hóa đơn.
 * @param {Object[]} paymentsList - Danh sách payments cần chèn
 * @returns {Promise<Object[]>}
 */
export const createPayments = async (paymentsList) => {
  const now = new Date().toISOString();
  const rows = paymentsList.map((p) => ({
    invoice_id: p.invoice_id,
    amount: p.amount,
    method: p.method,
    status: PAYMENT_STATUSES.COMPLETED,
    paid_at: now,
    transaction_code: p.transaction_code || null,
    note: p.note || null,
  }));

  const { data, error } = await supabaseAdmin
    .from('payments')
    .insert(rows)
    .select('*');

  if (error) {
    logger.error({ err: error }, 'CheckoutRepository: createPayments failed');
    throw new InternalError('Lỗi ghi nhận thanh toán');
  }

  return data || [];
};

/**
 * Cập nhật trạng thái hóa đơn (paid hoặc partial).
 * @param {string} invoiceId - UUID
 * @param {string} status - Trạng thái hóa đơn mới
 * @returns {Promise<Object>}
 */
export const updateInvoiceStatus = async (invoiceId, status) => {
  const { data, error } = await supabaseAdmin
    .from('invoices')
    .update({ status })
    .eq('id', invoiceId)
    .select('*')
    .single();

  if (error) {
    logger.error({ err: error, invoiceId, status }, 'CheckoutRepository: updateInvoiceStatus failed');
    throw new InternalError('Lỗi cập nhật trạng thái hóa đơn');
  }

  return data;
};
