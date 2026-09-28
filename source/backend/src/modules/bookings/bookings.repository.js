import { supabaseAdmin } from '../../config/supabase.js';
import { InternalError, ConflictError } from '../../utils/errors.js';
import { logger } from '../../config/logger.js';

/**
 * Repository — truy vấn DB cho module Bookings.
 * Tham chiếu: docs/03-backend/phase5-booking/README.md
 */

/**
 * Lấy thông tin phòng kèm loại phòng — dùng để check nghiệp vụ trước khi tạo booking.
 * @param {string} roomId - UUID
 * @returns {Promise<Object|null>} room kèm room_types (base_price, max_guests)
 */
export const findRoomWithType = async (roomId) => {
  const { data, error } = await supabaseAdmin
    .from('rooms')
    .select('id, room_number, floor, status, is_active, room_types(id, name, base_price, max_guests)')
    .eq('id', roomId)
    .maybeSingle();

  if (error) {
    logger.error({ err: error }, 'BookingsRepository: findRoomWithType failed');
    throw new InternalError('Lỗi truy vấn thông tin phòng');
  }

  return data;
};

/**
 * Tìm customer theo user_id — mỗi user role customer có 1 row trong bảng customers.
 * @param {string} userId - UUID (từ JWT sub)
 * @returns {Promise<Object|null>} customer row hoặc null
 */
export const findCustomerByUserId = async (userId) => {
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('id, user_id, full_name, phone, identity_number')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    logger.error({ err: error }, 'BookingsRepository: findCustomerByUserId failed');
    throw new InternalError('Lỗi truy vấn thông tin khách hàng');
  }

  return data;
};

/**
 * Tạo mã booking — format: BK + YYYYMMDD + 3 chữ số sequence.
 * Đếm số booking tạo trong ngày hôm nay + 1.
 * VD: BK20260928001, BK20260928002, ...
 * @returns {Promise<string>} booking_code
 */
export const generateBookingCode = async () => {
  // Lấy ngày hôm nay dạng YYYYMMDD
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  // Đếm booking tạo trong ngày hôm nay
  const todayStart = `${year}-${month}-${day}T00:00:00.000Z`;
  const todayEnd = `${year}-${month}-${day}T23:59:59.999Z`;

  const { count, error } = await supabaseAdmin
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', todayStart)
    .lte('created_at', todayEnd);

  if (error) {
    logger.error({ err: error }, 'BookingsRepository: generateBookingCode — count failed');
    throw new InternalError('Lỗi tạo mã booking');
  }

  // Sequence = số booking hôm nay + 1, padding 3 chữ số
  const sequence = String((count || 0) + 1).padStart(3, '0');

  return `BK${dateStr}${sequence}`;
};

/**
 * Thêm booking mới vào DB.
 * Handle PG 23P01 (exclusion violation) → BOOKING_OVERLAP.
 * @param {Object} data - { customer_id, room_id, booking_code, check_in_date, check_out_date, number_of_guests, room_price, status, note }
 * @returns {Promise<Object>} booking vừa tạo kèm thông tin JOIN
 */
export const insert = async (data) => {
  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .insert(data)
    .select(`
      *,
      customers(id, full_name, phone, identity_number),
      rooms(id, room_number, floor, room_types(id, name))
    `)
    .single();

  if (error) {
    // PG 23P01 — Exclusion constraint violation (booking overlap)
    if (error.code === '23P01') {
      throw new ConflictError('BOOKING_OVERLAP', 'Phòng đã được đặt trong khoảng thời gian này');
    }
    // PG 23503 — FK violation (room_id hoặc customer_id không tồn tại)
    if (error.code === '23503') {
      throw new InternalError('Dữ liệu tham chiếu không hợp lệ');
    }
    logger.error({ err: error }, 'BookingsRepository: insert failed');
    throw new InternalError('Lỗi tạo booking');
  }

  return booking;
};

/**
 * Tìm booking theo ID — JOIN đầy đủ customer + room + room_type.
 * @param {string} id - UUID
 * @returns {Promise<Object|null>}
 */
export const findById = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select(`
      *,
      customers(id, user_id, full_name, phone, identity_number),
      rooms(id, room_number, floor, room_types(id, name, base_price, max_guests))
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    logger.error({ err: error }, 'BookingsRepository: findById failed');
    throw new InternalError('Lỗi truy vấn booking');
  }

  return data;
};

/**
 * Danh sách booking của 1 customer — có phân trang + filter status.
 * @param {string} customerId - UUID
 * @param {Object} filters - { page, limit, status }
 * @returns {Promise<{ data: Object[], pagination: Object }>}
 */
export const listByCustomer = async (customerId, { page = 1, limit = 20, status }) => {
  let query = supabaseAdmin
    .from('bookings')
    .select(`
      *,
      rooms(id, room_number, floor, room_types(id, name))
    `, { count: 'exact' })
    .eq('customer_id', customerId);

  // Filter trạng thái
  if (status) {
    query = query.eq('status', status);
  }

  // Phân trang
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;

  if (error) {
    logger.error({ err: error }, 'BookingsRepository: listByCustomer failed');
    throw new InternalError('Lỗi truy vấn danh sách booking');
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
 * Danh sách tất cả bookings — cho staff/admin.
 * Có filter: status, customer_id, room_id, date range (from/to), search (booking_code).
 * @param {Object} filters - { page, limit, status, customer_id, room_id, from, to, search }
 * @returns {Promise<{ data: Object[], pagination: Object }>}
 */
export const listAll = async ({ page = 1, limit = 20, status, customer_id, room_id, from, to, search }) => {
  let query = supabaseAdmin
    .from('bookings')
    .select(`
      *,
      customers(id, full_name, phone),
      rooms(id, room_number, floor, room_types(id, name))
    `, { count: 'exact' });

  // Filter trạng thái
  if (status) {
    query = query.eq('status', status);
  }

  // Filter theo khách hàng
  if (customer_id) {
    query = query.eq('customer_id', customer_id);
  }

  // Filter theo phòng
  if (room_id) {
    query = query.eq('room_id', room_id);
  }

  // Filter theo khoảng ngày (check_in_date)
  if (from) {
    query = query.gte('check_in_date', from);
  }
  if (to) {
    query = query.lte('check_in_date', to);
  }

  // Tìm kiếm theo booking_code (case-insensitive)
  if (search) {
    query = query.ilike('booking_code', `%${search}%`);
  }

  // Phân trang
  const offset = (page - 1) * limit;
  const end = offset + limit - 1;

  query = query.order('created_at', { ascending: false }).range(offset, end);

  const { data, count, error } = await query;

  if (error) {
    logger.error({ err: error }, 'BookingsRepository: listAll failed');
    throw new InternalError('Lỗi truy vấn danh sách booking');
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
 * Cập nhật trạng thái booking + extra fields (VD: note khi cancel).
 * @param {string} id - UUID
 * @param {string} status - trạng thái mới
 * @param {Object} [extra={}] - fields bổ sung (VD: { note })
 * @returns {Promise<Object>} booking đã cập nhật
 */
export const updateStatus = async (id, status, extra = {}) => {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .update({ status, ...extra, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`
      *,
      customers(id, user_id, full_name, phone),
      rooms(id, room_number, floor, room_types(id, name))
    `)
    .single();

  if (error) {
    // PG 23P01 — Exclusion constraint violation (booking overlap khi confirm)
    if (error.code === '23P01') {
      throw new ConflictError('BOOKING_OVERLAP', 'Phòng đã được đặt trong khoảng thời gian này');
    }
    logger.error({ err: error }, 'BookingsRepository: updateStatus failed');
    throw new InternalError('Lỗi cập nhật trạng thái booking');
  }

  return data;
};
