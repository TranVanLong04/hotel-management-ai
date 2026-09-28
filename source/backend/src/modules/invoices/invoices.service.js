import * as invoicesRepo from './invoices.repository.js';
import * as checkoutRepo from '../checkout/checkout.repository.js';
import * as bookingsRepo from '../bookings/bookings.repository.js';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from '../../utils/errors.js';
import { INVOICE_STATUSES, USER_ROLES, PAYMENT_STATUSES } from '../../config/constants.js';
import { logger } from '../../config/logger.js';

/**
 * Service — xử lý nghiệp vụ module Invoices.
 * Tham chiếu: docs/03-backend/phase8-service-invoice/README.md & docs/08-features/08-invoice-payment.md
 */

/**
 * Lấy danh sách hóa đơn theo phân quyền:
 * - Customer: chỉ xem hóa đơn của chính mình.
 * - Staff/Admin: xem tất cả hóa đơn có filter + phân trang.
 *
 * @param {Object} filters
 * @param {Object} user - { sub: userId, role }
 * @returns {Promise<{ data: Object[], pagination: Object }>}
 */
export const listInvoices = async (filters, user) => {
  const queryFilters = { ...filters };

  if (user.role === USER_ROLES.CUSTOMER) {
    const customer = await bookingsRepo.findCustomerByUserId(user.sub);
    if (!customer) {
      return {
        data: [],
        pagination: { page: 1, limit: queryFilters.limit || 20, total: 0, totalPages: 0 },
      };
    }
    queryFilters.customer_id = customer.id;
  }

  return await invoicesRepo.list(queryFilters);
};

/**
 * Lấy chi tiết hóa đơn theo ID:
 * - Customer: kiểm tra quyền sở hữu hóa đơn.
 * - Staff/Admin: có quyền xem toàn bộ.
 *
 * @param {string} id - UUID
 * @param {Object} user - { sub: userId, role }
 * @returns {Promise<Object>}
 */
export const getInvoice = async (id, user) => {
  const invoice = await invoicesRepo.findById(id);
  if (!invoice) {
    throw new NotFoundError('Invoice');
  }

  if (user.role === USER_ROLES.CUSTOMER) {
    const customer = await bookingsRepo.findCustomerByUserId(user.sub);
    if (!customer || invoice.customer_id !== customer.id) {
      throw new ForbiddenError('Không có quyền xem hóa đơn này');
    }
  }

  return invoice;
};

/**
 * Thêm khoản thanh toán bổ sung cho hóa đơn (Staff/Admin):
 * - Kiểm tra hóa đơn chưa hoàn tất (chưa 'paid').
 * - Tính toán số dư còn lại (remaining = total_amount - totalPaid).
 * - Chặn nếu số tiền thanh toán vượt quá số dư còn lại.
 * - Ghi nhận thanh toán và cập nhật lại trạng thái hóa đơn (tái sử dụng checkoutRepo.updateInvoiceStatus).
 *
 * @param {string} invoiceId - UUID
 * @param {Object} paymentData - { amount, method, transaction_code, note }
 * @param {string} staffUserId - UUID nhân viên thu tiền
 * @returns {Promise<{ invoice: Object, payment: Object }>}
 */
export const addPayment = async (invoiceId, paymentData, staffUserId) => {
  // 1. Kiểm tra hóa đơn tồn tại
  const invoice = await invoicesRepo.findById(invoiceId);
  if (!invoice) {
    throw new NotFoundError('Invoice');
  }

  // 2. Nếu đã trả đủ thì không cho thanh toán thêm
  if (invoice.status === INVOICE_STATUSES.PAID) {
    throw new BadRequestError('Hóa đơn đã được thanh toán đủ', 'INVOICE_ALREADY_PAID');
  }

  // 3. Tính tổng số tiền đã thanh toán thành công
  const totalPaid = (invoice.payments || [])
    .filter((p) => p.status === PAYMENT_STATUSES.COMPLETED)
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const totalAmount = Number(invoice.total_amount || 0);
  const remaining = Math.round((totalAmount - totalPaid) * 100) / 100;

  // 4. Kiểm tra số tiền thanh toán không vượt quá số còn lại
  const paymentAmount = Number(paymentData.amount || 0);
  if (paymentAmount > remaining + 0.01) {
    throw new BadRequestError(
      `Số tiền thanh toán (${paymentAmount.toLocaleString('vi-VN')} VND) vượt quá số còn lại (${remaining.toLocaleString('vi-VN')} VND)`,
      'PAYMENT_EXCEEDS_INVOICE'
    );
  }

  // 5. Ghi nhận thanh toán
  const payment = await invoicesRepo.insertPayment({
    invoice_id: invoiceId,
    amount: paymentAmount,
    method: paymentData.method,
    transaction_code: paymentData.transaction_code,
    note: paymentData.note,
  });

  // 6. Cập nhật trạng thái hóa đơn: tái sử dụng checkout.repository.js
  const newTotalPaid = totalPaid + paymentAmount;
  const newStatus =
    newTotalPaid >= totalAmount - 0.01 ? INVOICE_STATUSES.PAID : INVOICE_STATUSES.PARTIAL;

  const updatedInvoice = await checkoutRepo.updateInvoiceStatus(invoiceId, newStatus);

  logger.info(
    {
      invoiceId,
      paymentId: payment.id,
      amount: paymentAmount,
      totalAmount,
      newTotalPaid,
      newStatus,
      staffUserId,
    },
    'Additional payment added to invoice successfully'
  );

  return {
    invoice: updatedInvoice,
    payment,
  };
};
