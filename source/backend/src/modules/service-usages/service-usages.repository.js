import { supabaseAdmin } from '../../config/supabase.js';
import { InternalError } from '../../utils/errors.js';
import { logger } from '../../config/logger.js';

/**
 * Repository — truy vấn DB cho bảng service_usages.
 * Tham chiếu: docs/03-backend/phase8-service-invoice/README.md
 */

/**
 * Lấy danh sách dịch vụ đã dùng của 1 booking (JOIN bảng services).
 * @param {string} bookingId - UUID
 * @returns {Promise<Object[]>}
 */
export const listByBooking = async (bookingId) => {
  const { data, error } = await supabaseAdmin
    .from('service_usages')
    .select('*, services(id, name, unit, price)')
    .eq('booking_id', bookingId)
    .order('used_at', { ascending: false });

  if (error) {
    logger.error({ err: error, bookingId }, 'ServiceUsagesRepository: listByBooking failed');
    throw new InternalError('Lỗi truy vấn danh sách dịch vụ của đặt phòng');
  }

  return data || [];
};

/**
 * Tìm bản ghi sử dụng dịch vụ theo ID.
 * @param {string} id - UUID
 * @returns {Promise<Object|null>}
 */
export const findById = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('service_usages')
    .select('*, services(id, name, unit)')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    logger.error({ err: error, id }, 'ServiceUsagesRepository: findById failed');
    throw new InternalError('Lỗi truy vấn bản ghi sử dụng dịch vụ');
  }

  return data;
};

/**
 * Thêm dịch vụ sử dụng cho booking.
 * Lưu ý: unit_price là snapshot giá dịch vụ tại thời điểm dùng, total_amount là generated column.
 *
 * @param {Object} data - { booking_id, service_id, quantity, unit_price, note }
 * @returns {Promise<Object>} Bản ghi đã tạo kèm total_amount
 */
export const insert = async (data) => {
  const { data: created, error } = await supabaseAdmin
    .from('service_usages')
    .insert({
      booking_id: data.booking_id,
      service_id: data.service_id,
      quantity: data.quantity,
      unit_price: data.unit_price,
      note: data.note || null,
      used_at: new Date().toISOString(),
    })
    .select('*, services(id, name, unit)')
    .single();

  if (error) {
    logger.error({ err: error, data }, 'ServiceUsagesRepository: insert failed');
    throw new InternalError('Lỗi ghi nhận sử dụng dịch vụ');
  }

  return created;
};

/**
 * Xóa bản ghi sử dụng dịch vụ (Hard delete vì chưa phát sinh thanh toán).
 * @param {string} id - UUID
 * @returns {Promise<Object>} Bản ghi đã xóa
 */
export const remove = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('service_usages')
    .delete()
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    logger.error({ err: error, id }, 'ServiceUsagesRepository: remove failed');
    throw new InternalError('Lỗi xóa bản ghi dịch vụ');
  }

  return data;
};
