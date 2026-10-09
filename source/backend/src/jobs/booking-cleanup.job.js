import { supabaseAdmin } from '../config/supabase.js';
import { logger } from '../config/logger.js';
import { BOOKING_STATUSES } from '../config/constants.js';

let intervalId = null;

/**
 * Hàm thực hiện quét và dọn dẹp các đơn đặt phòng pending_payment quá 15 phút.
 * Được export để có thể gọi trực tiếp trong test script hoặc chạy theo interval.
 *
 * @returns {Promise<{ count: number, bookingCodes: string[] }>}
 */
export const runCleanup = async () => {
  try {
    const expiredThreshold = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    // 1. Tìm tối đa 100 booking pending_payment đã quá 15 phút
    const { data: expiredBookings, error: findError } = await supabaseAdmin
      .from('bookings')
      .select('id, booking_code, note')
      .eq('status', BOOKING_STATUSES.PENDING_PAYMENT)
      .lt('created_at', expiredThreshold)
      .limit(100);

    if (findError) {
      logger.error({ err: findError }, 'BookingCleanupJob: Lỗi tìm booking quá hạn');
      return { count: 0, bookingCodes: [] };
    }

    if (!expiredBookings || expiredBookings.length === 0) {
      return { count: 0, bookingCodes: [] };
    }

    const expiredIds = expiredBookings.map((b) => b.id);
    const bookingCodes = expiredBookings.map((b) => b.booking_code);

    // 2. Cập nhật trạng thái thành CANCELLED atomic
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        status: BOOKING_STATUSES.CANCELLED,
        note: '[Tự động hủy] Quá thời gian thanh toán 15 phút',
        updated_at: new Date().toISOString(),
      })
      .in('id', expiredIds);

    if (updateError) {
      logger.error({ err: updateError }, 'BookingCleanupJob: Lỗi cập nhật hủy booking quá hạn');
      return { count: 0, bookingCodes: [] };
    }

    const count = expiredIds.length;
    logger.info({ count, bookingCodes }, 'Cron cleanup: hủy đơn hết hạn');

    if (count === 100) {
      logger.warn('Còn nhiều đơn quá hạn, sẽ xử lý tiếp ở chu kỳ sau');
    }

    return { count, bookingCodes };
  } catch (err) {
    logger.error({ err }, 'BookingCleanupJob: Exception trong quá trình cleanup');
    return { count: 0, bookingCodes: [] };
  }
};

/**
 * Khởi động cron job chạy định kỳ mỗi 5 phút.
 */
export const start = () => {
  if (intervalId) {
    return;
  }

  const INTERVAL_MS = 5 * 60 * 1000; // 5 phút

  // Chạy chu kỳ định kỳ
  intervalId = setInterval(async () => {
    await runCleanup();
  }, INTERVAL_MS);

  // Không block Node.js process exit nếu chỉ còn timer
  if (intervalId.unref) {
    intervalId.unref();
  }

  logger.info('Booking cleanup cron started, interval 5m');
};

/**
 * Dừng cron job khi shutdown server.
 */
export const stop = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('Booking cleanup cron stopped');
  }
};

export default {
  start,
  stop,
  runCleanup,
};
