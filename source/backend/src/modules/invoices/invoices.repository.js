import { supabaseAdmin } from '../../config/supabase.js';
import { InternalError } from '../../utils/errors.js';
import { logger } from '../../config/logger.js';
import { PAYMENT_STATUSES } from '../../config/constants.js';

/**
 * Repository — truy vấn DB cho module Invoices.
 * Tham chiếu: docs/03-backend/phase8-service-invoice/README.md
 * Lưu ý: Tái sử dụng checkout.repository.js cho createInvoice, createPayments, updateInvoiceStatus.
 */

/**
 * Danh sách hóa đơn có phân trang, filter, search.
 * JOIN bảng customers, bookings, payments.
 *
 * @param {Object} filters - { page, limit, status, customer_id, booking_id, from, to, search }
 * @returns {Promise<{ data: Object[], pagination: Object }>}
 */
export const list = async ({
  page = 1,
  limit = 20,
  status,
  customer_id,
  booking_id,
  from,
  to,
  search,
} = {}) => {
  let query = supabaseAdmin
    .from('invoices')
    .select(
      `
      *,
      customers(id, full_name, phone, identity_number),
      bookings(id, booking_code, room_id, rooms(id, room_number)),
      payments(id, amount, method, status, paid_at, transaction_code)
    `,
      { count: 'exact' }
    );

  if (status) {
    query = query.eq('status', status);
  }

  if (customer_id) {
    query = query.eq('customer_id', customer_id);
  }

  if (booking_id) {
    query = query.eq('booking_id', booking_id);
  }

  if (from) {
    query = query.gte('issued_at', from);
  }

  if (to) {
    query = query.lte('issued_at', to);
  }

  if (search) {
    query = query.ilike('invoice_code', `%${search}%`);
  }

  const offset = (page - 1) * limit;
  const end = offset + limit - 1;

  query = query.order('issued_at', { ascending: false }).range(offset, end);

  const { data, count, error } = await query;

  if (error) {
    logger.error({ err: error }, 'InvoicesRepository: list failed');
    throw new InternalError('Lỗi truy vấn danh sách hóa đơn');
  }

  return {
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  };
};

/**
 * Tìm hóa đơn chi tiết theo ID kèm đầy đủ customer, booking, room, payments.
 *
 * @param {string} id - UUID
 * @returns {Promise<Object|null>}
 */
export const findById = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('invoices')
    .select(
      `
      *,
      customers(id, full_name, phone, identity_number, email),
      bookings(
        id,
        booking_code,
        check_in_date,
        check_out_date,
        room_id,
        rooms(id, room_number, floor, room_types(id, name))
      ),
      payments(*)
    `
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    logger.error({ err: error, id }, 'InvoicesRepository: findById failed');
    throw new InternalError('Lỗi truy vấn chi tiết hóa đơn');
  }

  return data;
};

/**
 * Thêm 1 bản ghi thanh toán bổ sung cho hóa đơn.
 *
 * @param {Object} paymentData - { invoice_id, amount, method, transaction_code, note }
 * @returns {Promise<Object>}
 */
export const insertPayment = async (paymentData) => {
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('payments')
    .insert({
      invoice_id: paymentData.invoice_id,
      amount: paymentData.amount,
      method: paymentData.method,
      status: PAYMENT_STATUSES.COMPLETED,
      paid_at: now,
      transaction_code: paymentData.transaction_code || null,
      note: paymentData.note || null,
    })
    .select('*')
    .single();

  if (error) {
    logger.error({ err: error, paymentData }, 'InvoicesRepository: insertPayment failed');
    throw new InternalError('Lỗi ghi nhận thanh toán bổ sung');
  }

  return data;
};
