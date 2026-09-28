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
 * Thực hiện check-out cho booking:
 * - Kiểm tra trạng thái booking (phải là checked_in)
 * - Tính tổng tiền phòng và tiền dịch vụ
 * - Áp dụng giảm giá, tính thuế và tạo hóa đơn
 * - Ghi nhận thanh toán (có rollback nếu lỗi)
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

  // 5. Tính subtotal = room + service - discount
  const discountVal = Number(discount_amount || 0);
  const subtotal = room_amount + service_amount - discountVal;

  if (subtotal < 0) {
    throw new BadRequestError('Số tiền giảm giá vượt quá tổng tiền phòng và dịch vụ', 'VALIDATION_ERROR');
  }

  // 6. Tính thuế
  const taxRateVal = Number(tax_rate || 0);
  const tax_amount = Math.round(subtotal * taxRateVal * 100) / 100;
  const expectedTotalAmount = subtotal + tax_amount;

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

  // 9. Ghi nhận payments — nếu lỗi thì rollback xóa invoice thủ công
  let createdPayments = [];
  try {
    const paymentsPayload = payments.map((p) => ({
      ...p,
      invoice_id: invoice.id,
    }));
    createdPayments = await checkoutRepo.createPayments(paymentsPayload);
  } catch (paymentError) {
    logger.error({ err: paymentError, invoiceId: invoice.id }, 'Payment creation failed, rolling back invoice');
    await checkoutRepo.deleteInvoice(invoice.id);
    throw paymentError;
  }

  // 10. Tính tổng tiền đã trả và so sánh với invoice.total_amount
  const invoiceTotal = Number(invoice.total_amount ?? expectedTotalAmount);
  const totalPaid = createdPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const invoiceStatus =
    totalPaid >= invoiceTotal ? INVOICE_STATUSES.PAID : INVOICE_STATUSES.PARTIAL;

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
};
