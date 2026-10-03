import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { supabaseAdmin } from '../../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Khởi tạo SMTP Transporter qua nodemailer
 */
const createTransporter = () => {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    logger.warn('SMTP_USER hoặc SMTP_PASS chưa được cấu hình, email sẽ chạy ở chế độ log mô phỏng');
    return null;
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
};

const transporter = createTransporter();

/**
 * Ghi log email vào bảng email_logs trong Supabase
 */
const logEmailStatus = async ({
  userId = null,
  bookingId = null,
  emailTo,
  subject,
  template,
  status,
  errorMessage = null,
}) => {
  try {
    await supabaseAdmin.from('email_logs').insert({
      user_id: userId,
      booking_id: bookingId,
      email_to: emailTo,
      subject,
      template,
      status,
      error_message: errorMessage,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
    });
  } catch (err) {
    logger.error({ err }, 'EmailService: Không thể ghi log vào email_logs');
  }
};

/**
 * Format số tiền sang định dạng có dấu chấm phân cách
 */
const formatPrice = (amount) => {
  return new Intl.NumberFormat('vi-VN').format(amount || 0);
};

/**
 * Format ngày YYYY-MM-DD sang DD/MM/YYYY
 */
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

/**
 * Gửi email xác nhận đặt phòng sau khi thanh toán thành công
 * Không ném lỗi ra ngoài để tránh làm gián đoạn luồng thanh toán chính
 *
 * @param {Object} params
 * @param {string} params.to - Địa chỉ email người nhận
 * @param {Object} params.booking - Thông tin booking
 * @param {Object} params.customer - Thông tin khách hàng
 * @param {Object} params.room - Thông tin phòng & loại phòng
 * @param {string} [params.userId] - UUID của user (nếu có)
 */
export const sendBookingConfirmation = async ({
  to,
  booking,
  customer,
  room,
  userId = null,
}) => {
  const subject = `[Hotel AI] Xác nhận đặt phòng thành công - ${booking.booking_code}`;
  const templateName = 'booking-confirmation';

  if (!to) {
    logger.warn({ bookingId: booking.id }, 'EmailService: Không có email người nhận');
    return;
  }

  try {
    // Đọc HTML template
    const templatePath = path.join(__dirname, 'templates', 'booking-confirmation.html');
    let htmlContent = await fs.readFile(templatePath, 'utf8');

    const customerName = customer?.full_name || 'Quý khách';
    const roomNumber = room?.room_number || booking.room?.room_number || '---';
    const roomTypeName =
      room?.room_types?.name ||
      room?.room_type?.name ||
      booking.room?.room_type?.name ||
      'Phòng tiêu chuẩn';
    const checkIn = formatDate(booking.check_in_date);
    const checkOut = formatDate(booking.check_out_date);
    const totalAmount = formatPrice(booking.room_subtotal || booking.room_price * (booking.number_of_nights || 1));
    const myBookingsUrl = `${env.FRONTEND_URL}/my-bookings`;

    // Thay thế các placeholder
    htmlContent = htmlContent
      .replace(/{{customer_name}}/g, customerName)
      .replace(/{{booking_code}}/g, booking.booking_code)
      .replace(/{{room_number}}/g, roomNumber)
      .replace(/{{room_type_name}}/g, roomTypeName)
      .replace(/{{check_in_date}}/g, checkIn)
      .replace(/{{check_out_date}}/g, checkOut)
      .replace(/{{number_of_nights}}/g, String(booking.number_of_nights || 1))
      .replace(/{{number_of_guests}}/g, String(booking.number_of_guests || 1))
      .replace(/{{total}}/g, totalAmount)
      .replace(/{{my_bookings_url}}/g, myBookingsUrl);

    if (!transporter) {
      logger.info(
        { to, bookingCode: booking.booking_code },
        'EmailService (Mô phỏng): Đã kích hoạt gửi email xác nhận đặt phòng'
      );
      await logEmailStatus({
        userId,
        bookingId: booking.id,
        emailTo: to,
        subject,
        template: templateName,
        status: 'sent',
      });
      return;
    }

    // Gửi email thật qua SMTP
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      html: htmlContent,
    });

    logger.info(
      { to, bookingId: booking.id, bookingCode: booking.booking_code },
      'EmailService: Đã gửi email xác nhận đặt phòng thành công'
    );

    await logEmailStatus({
      userId,
      bookingId: booking.id,
      emailTo: to,
      subject,
      template: templateName,
      status: 'sent',
    });

    // Cập nhật timestamp email_sent_at vào bookings
    await supabaseAdmin
      .from('bookings')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('id', booking.id);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(
      { err: error, bookingId: booking.id, to },
      'EmailService: Gửi email thất bại'
    );

    await logEmailStatus({
      userId,
      bookingId: booking.id,
      emailTo: to,
      subject,
      template: templateName,
      status: 'failed',
      errorMessage: errorMsg,
    });
  }
};
