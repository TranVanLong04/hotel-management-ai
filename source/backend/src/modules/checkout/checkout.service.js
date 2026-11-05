import * as bookingsRepo from '../bookings/bookings.repository.js';
import * as roomsRepo from '../rooms/rooms.repository.js';
import * as checkoutRepo from './checkout.repository.js';
import { logger } from '../../config/logger.js';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../../utils/errors.js';
import {
  BOOKING_STATUSES,
  ROOM_STATUSES,
  INVOICE_STATUSES,
} from '../../config/constants.js';

/**
 * Service xử lý nghiệp vụ Check-out.
 * Tham chiếu: docs/03-backend/phase7-checkin-checkout/README.md & docs/08-features/06-checkout.md
 */

/**
 * Lấy thông tin xem trước chi phí thanh toán khi check-out (Preview Invoice).
 *
 * @param {string} bookingId - UUID của booking
 * @param {Object} query - { discount_amount, tax_rate }
 * @returns {Promise<Object>} Chi tiết booking, danh sách dịch vụ và bảng tính tổng tiền
 */
export const getCheckoutPreview = async (
  bookingId,
  { discount_amount = 0, tax_rate = 0.08 } = {}
) => {
  // 1. Tìm thông tin booking
  const booking = await bookingsRepo.findById(bookingId);
  if (!booking) {
    throw new NotFoundError('Booking');
  }

  // 2. Kiểm tra trạng thái booking
  if (booking.status === BOOKING_STATUSES.CHECKED_OUT) {
    throw new ConflictError('BOOKING_ALREADY_CHECKED_OUT', 'Đặt phòng đã được check-out trước đó');
  }
  if (booking.status !== BOOKING_STATUSES.CHECKED_IN) {
    throw new ConflictError('BOOKING_NOT_CHECKED_IN', 'Chỉ có thể check-out cho đặt phòng đang ở trạng thái checked_in');
  }

  // 3. Lấy danh sách chi tiết dịch vụ đã dùng
  const services = await checkoutRepo.getServiceUsagesWithDetails(bookingId);
  const service_amount = services.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);

  // 4. Lấy tiền phòng từ snapshot
  const room_amount = Number(booking.room_subtotal || 0);

  // 5. Kiểm tra và tính toán giảm giá, thuế
  const discountVal = Math.max(0, Number(discount_amount || 0));
  const taxRateVal = Number(tax_rate !== undefined ? tax_rate : 0.08);

  if (taxRateVal < 0 || taxRateVal > 1) {
    throw new BadRequestError('Thuế suất (tax_rate) phải nằm trong khoảng từ 0 đến 1 (0% - 100%)', 'VALIDATION_ERROR');
  }

  const taxable_amount = Math.max(0, room_amount + service_amount - discountVal);
  const tax_amount = Math.round(taxable_amount * taxRateVal * 100) / 100;
  const total_amount = taxable_amount + tax_amount;

  return {
    booking: {
      id: booking.id,
      booking_code: booking.booking_code,
      customer: booking.customers,
      room: booking.rooms,
      check_in_date: booking.check_in_date,
      check_out_date: booking.check_out_date,
      actual_check_in_at: booking.actual_check_in_at,
      status: booking.status,
      room_subtotal: room_amount,
    },
    services,
    summary: {
      room_amount,
      service_amount,
      discount_amount: discountVal,
      taxable_amount,
      tax_rate: taxRateVal,
      tax_amount,
      total_amount,
    },
  };
};

/**
 * Thực hiện check-out cho booking:
 * - Kiểm tra trạng thái booking (phải là checked_in)
 * - Tính tổng tiền phòng và tiền dịch vụ
 * - Áp dụng giảm giá, tính thuế và tạo hóa đơn
 * - Ghi nhận thanh toán (có rollback nguyên tử nếu lỗi)
 * - Cập nhật trạng thái booking -> checked_out, room -> cleaning
 *
 * @param {string} bookingId - UUID của booking
 * @param {Object} payload - { discount_amount, tax_rate, payments, note }
 * @param {string} staffUserId - UUID của nhân viên thực hiện
 * @returns {Promise<{ booking: Object, invoice: Object, payments: Object[] }>}
 */
export const checkout = async (
  bookingId,
  { discount_amount = 0, tax_rate = 0, payments = [], note },
  staffUserId
) => {
  // 1. Tìm thông tin booking
  const booking = await bookingsRepo.findById(bookingId);
  if (!booking) {
    throw new NotFoundError('Booking');
  }

  // 2. Kiểm tra trạng thái booking
  if (booking.status === BOOKING_STATUSES.CHECKED_OUT) {
    throw new ConflictError('BOOKING_ALREADY_CHECKED_OUT', 'Đặt phòng đã được check-out trước đó');
  }
  if (booking.status !== BOOKING_STATUSES.CHECKED_IN) {
    throw new ConflictError('BOOKING_NOT_CHECKED_IN', 'Chỉ có thể check-out cho đặt phòng đang ở trạng thái checked_in');
  }

  // Kiểm tra xem booking đã có invoice chưa (mỗi booking chỉ có 1 invoice duy nhất)
  const existingInvoice = await checkoutRepo.findInvoiceByBookingId(bookingId);
  if (existingInvoice) {
    throw new ConflictError('INVOICE_ALREADY_EXISTS', 'Hóa đơn cho đặt phòng này đã tồn tại');
  }

  // 3. Tổng hợp tiền dịch vụ từ bảng service_usages
  const service_amount = await checkoutRepo.getServiceAmountByBookingId(bookingId);

  // 4. Lấy tiền phòng từ snapshot của booking (room_subtotal)
  const room_amount = Number(booking.room_subtotal || 0);

  // 5. Kiểm tra và tính subtotal = room + service - discount
  const discountVal = Number(discount_amount || 0);
  if (discountVal < 0) {
    throw new BadRequestError('Số tiền giảm giá không được âm', 'VALIDATION_ERROR');
  }
  if (discountVal > room_amount + service_amount) {
    throw new BadRequestError('Số tiền giảm giá vượt quá tổng tiền phòng và dịch vụ', 'VALIDATION_ERROR');
  }
  const subtotal = room_amount + service_amount - discountVal;

  // 6. Tính thuế
  const taxRateVal = Number(tax_rate !== undefined ? tax_rate : 0);
  if (taxRateVal < 0 || taxRateVal > 1) {
    throw new BadRequestError('Thuế suất (tax_rate) phải nằm trong khoảng từ 0 đến 1 (0% - 100%)', 'VALIDATION_ERROR');
  }
  const tax_amount = Math.round(subtotal * taxRateVal * 100) / 100;
  const expectedTotalAmount = subtotal + tax_amount;

  // Kiểm tra danh sách thanh toán
  if (!payments || !Array.isArray(payments) || payments.length === 0) {
    throw new BadRequestError('Danh sách thanh toán phải có ít nhất 1 khoản thanh toán', 'VALIDATION_ERROR');
  }

  // Kiểm tra từng khoản thanh toán
  for (const p of payments) {
    if (!p.amount || Number(p.amount) <= 0) {
      throw new BadRequestError('Số tiền thanh toán phải lớn hơn 0', 'VALIDATION_ERROR');
    }
  }

  // Kiểm tra tổng thanh toán không vượt quá tổng hóa đơn
  const totalPaymentsAmount = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  if (totalPaymentsAmount > expectedTotalAmount + 0.01) {
    throw new BadRequestError(
      `Tổng số tiền thanh toán (${totalPaymentsAmount.toLocaleString('vi-VN')} VND) vượt quá tổng tiền hóa đơn (${expectedTotalAmount.toLocaleString('vi-VN')} VND)`,
      'PAYMENT_EXCEEDS_INVOICE'
    );
  }

  // 7. Sinh mã hóa đơn chuẩn INV + YYYYMMDD + 3 số
  const invoice_code = await checkoutRepo.generateInvoiceCode();
  const now = new Date().toISOString();

  // 8. Tạo hóa đơn mới (KHÔNG insert total_amount vì là generated column)
  const invoice = await checkoutRepo.createInvoice({
    invoice_code,
    booking_id: bookingId,
    customer_id: booking.customer_id,
    room_amount,
    service_amount,
    discount_amount: discountVal,
    tax_rate: taxRateVal,
    tax_amount,
    issued_at: now,
  });

  // 9. Ghi nhận payments & Cập nhật trạng thái trong chu trình nguyên tử
  let createdPayments = [];
  try {
    const paymentsPayload = payments.map((p) => ({
      ...p,
      invoice_id: invoice.id,
    }));
    createdPayments = await checkoutRepo.createPayments(paymentsPayload);

    // 10. Tính tổng tiền đã trả và so sánh với invoice.total_amount
    const invoiceTotal = Number(invoice.total_amount ?? expectedTotalAmount);
    const totalPaid = createdPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const invoiceStatus =
      totalPaid >= invoiceTotal - 0.01 ? INVOICE_STATUSES.PAID : INVOICE_STATUSES.PARTIAL;

    const updatedInvoice = await checkoutRepo.updateInvoiceStatus(invoice.id, invoiceStatus);

    // 11. Cập nhật booking sang checked_out
    const bookingNote = note ? (booking.note ? `${booking.note}\n${note}` : note) : booking.note;
    const updatedBooking = await bookingsRepo.updateStatus(
      bookingId,
      BOOKING_STATUSES.CHECKED_OUT,
      {
        actual_check_out_at: now,
        ...(note ? { note: bookingNote } : {}),
      }
    );

    // 12. Cập nhật phòng sang cleaning
    await roomsRepo.updateStatus(booking.room_id, ROOM_STATUSES.CLEANING);

    logger.info(
      {
        bookingId,
        invoiceId: invoice.id,
        staffUserId,
        totalAmount: invoiceTotal,
        totalPaid,
        invoiceStatus,
      },
      'Checkout completed successfully'
    );

    return {
      booking: updatedBooking,
      invoice: updatedInvoice,
      payments: createdPayments,
    };
  } catch (error) {
    logger.error({ err: error, invoiceId: invoice.id }, 'Checkout post-invoice step failed, executing rollback');
    await checkoutRepo.deletePaymentsByInvoiceId(invoice.id);
    await checkoutRepo.deleteInvoice(invoice.id);
    throw error;
  }
};
