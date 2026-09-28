import { supabaseAdmin } from '../../config/supabase.js';
import { InternalError, ConflictError, BadRequestError } from '../../utils/errors.js';
import { logger } from '../../config/logger.js';

/**
 * Repository — truy vấn DB cho module Rooms.
 * Tham chiếu: docs/03-backend/phase4-room-management/README.md
 */

/**
 * Lấy danh sách phòng có phân trang, filter, search.
 * JOIN room_types để lấy thêm thông tin loại phòng.
 * @param {Object} filters - { page, limit, status, room_type_id, floor, is_active, search }
 * @returns {Promise<{ data: Object[], pagination: Object }>}
 */
export const list = async ({ page = 1, limit = 20, status, room_type_id, floor, is_active, search }) => {
  let query = supabaseAdmin
    .from('rooms')
    .select('*, room_types(id, name, base_price, max_guests)', { count: 'exact' });

  // Filter trạng thái phòng
  if (status) {
    query = query.eq('status', status);
  }

  // Filter theo loại phòng
  if (room_type_id) {
    query = query.eq('room_type_id', room_type_id);
  }

  // Filter theo tầng
  if (floor) {
    query = query.eq('floor', floor);
  }

  // Filter is_active
  if (is_active !== undefined) {
    query = query.eq('is_active', is_active);
  }

  // Search theo số phòng (case-insensitive)
  if (search) {
    query = query.ilike('room_number', `%${search}%`);
  }

  // Phân trang
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  query = query.order('room_number', { ascending: true }).range(from, to);

  const { data, count, error } = await query;

  if (error) {
    logger.error({ err: error }, 'RoomsRepository: list failed');
    throw new InternalError('Lỗi truy vấn danh sách phòng');
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
 * Tìm phòng theo ID — JOIN room_types.
 * @param {string} id - UUID
 * @returns {Promise<Object|null>}
 */
export const findById = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('rooms')
    .select('*, room_types(id, name, base_price, max_guests, description, amenities, image_url)')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    logger.error({ err: error }, 'RoomsRepository: findById failed');
    throw new InternalError('Lỗi truy vấn database');
  }

  return data;
};

/**
 * Tìm phòng theo room_number — dùng để check unique.
 * @param {string} roomNumber - số phòng
 * @returns {Promise<Object|null>}
 */
export const findByRoomNumber = async (roomNumber) => {
  const { data, error } = await supabaseAdmin
    .from('rooms')
    .select('id, room_number')
    .eq('room_number', roomNumber)
    .maybeSingle();

  if (error) {
    logger.error({ err: error }, 'RoomsRepository: findByRoomNumber failed');
    throw new InternalError('Lỗi truy vấn database');
  }

  return data;
};

/**
 * Tạo phòng mới.
 * Handle PG 23505 → ROOM_NUMBER_EXISTS, 23503 → BadRequestError.
 * @param {Object} data - { room_number, room_type_id, floor, description }
 * @returns {Promise<Object>} phòng mới kèm room_types
 */
export const insert = async (data) => {
  const { data: room, error } = await supabaseAdmin
    .from('rooms')
    .insert(data)
    .select('*, room_types(id, name, base_price, max_guests)')
    .single();

  if (error) {
    // PG 23505 — UNIQUE violation (số phòng trùng)
    if (error.code === '23505') {
      throw new ConflictError('ROOM_NUMBER_EXISTS', 'Số phòng đã tồn tại');
    }
    // PG 23503 — FK violation (loại phòng không tồn tại)
    if (error.code === '23503') {
      throw new BadRequestError('Loại phòng không tồn tại');
    }
    logger.error({ err: error }, 'RoomsRepository: insert failed');
    throw new InternalError('Lỗi tạo phòng');
  }

  return room;
};

/**
 * Cập nhật phòng theo ID.
 * @param {string} id - UUID
 * @param {Object} updates - fields cần cập nhật
 * @returns {Promise<Object>} phòng đã cập nhật kèm room_types
 */
export const update = async (id, updates) => {
  const { data, error } = await supabaseAdmin
    .from('rooms')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, room_types(id, name, base_price, max_guests)')
    .single();

  if (error) {
    // PG 23505 — UNIQUE violation (số phòng trùng khi update)
    if (error.code === '23505') {
      throw new ConflictError('ROOM_NUMBER_EXISTS', 'Số phòng đã tồn tại');
    }
    // PG 23503 — FK violation (loại phòng không tồn tại)
    if (error.code === '23503') {
      throw new BadRequestError('Loại phòng không tồn tại');
    }
    logger.error({ err: error }, 'RoomsRepository: update failed');
    throw new InternalError('Lỗi cập nhật phòng');
  }

  return data;
};

/**
 * Cập nhật trạng thái phòng.
 * @param {string} id - UUID
 * @param {string} status - trạng thái mới
 * @returns {Promise<Object>} phòng đã cập nhật
 */
export const updateStatus = async (id, status) => {
  const { data, error } = await supabaseAdmin
    .from('rooms')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, room_types(id, name, base_price, max_guests)')
    .single();

  if (error) {
    logger.error({ err: error }, 'RoomsRepository: updateStatus failed');
    throw new InternalError('Lỗi cập nhật trạng thái phòng');
  }

  return data;
};

/**
 * Soft delete — set is_active = false.
 * @param {string} id - UUID
 * @returns {Promise<Object>}
 */
export const softDelete = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('rooms')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, room_types(id, name, base_price, max_guests)')
    .single();

  if (error) {
    logger.error({ err: error }, 'RoomsRepository: softDelete failed');
    throw new InternalError('Lỗi xóa phòng');
  }

  return data;
};

/**
 * Kiểm tra phòng có active booking không.
 * Active booking = status IN ('confirmed', 'checked_in').
 * @param {string} roomId - UUID
 * @returns {Promise<boolean>}
 */
export const hasActiveBooking = async (roomId) => {
  const { count, error } = await supabaseAdmin
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', roomId)
    .in('status', ['confirmed', 'checked_in']);

  if (error) {
    logger.error({ err: error }, 'RoomsRepository: hasActiveBooking failed');
    throw new InternalError('Lỗi kiểm tra booking liên quan');
  }

  return (count || 0) > 0;
};

/**
 * Tìm phòng trống trong khoảng thời gian.
 * Logic:
 * 1. Query tất cả room_id có booking overlap: check_in_date < checkOut AND check_out_date > checkIn
 * 2. Query rooms is_active=true, status IN ('available','reserved'), NOT IN danh sách bị đặt
 * 3. Filter theo guests <= max_guests (sau khi JOIN)
 *
 * @param {Object} params - { checkIn, checkOut, guests, roomTypeId }
 * @returns {Promise<Object[]>} danh sách phòng trống
 */
export const findAvailable = async ({ checkIn, checkOut, guests = 1, roomTypeId }) => {
  // Bước 1: Tìm tất cả room_id có booking overlap trong khoảng thời gian
  const { data: overlappingBookings, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .select('room_id')
    .lt('check_in_date', checkOut)   // check_in_date < checkOut
    .gt('check_out_date', checkIn)   // check_out_date > checkIn
    .in('status', ['confirmed', 'checked_in']);

  if (bookingError) {
    logger.error({ err: bookingError }, 'RoomsRepository: findAvailable — booking query failed');
    throw new InternalError('Lỗi tìm phòng trống');
  }

  // Lấy danh sách room_id bị đặt
  const bookedRoomIds = [...new Set((overlappingBookings || []).map((b) => b.room_id))];

  // Bước 2: Query phòng available
  let query = supabaseAdmin
    .from('rooms')
    .select('*, room_types(id, name, base_price, max_guests, description, amenities, image_url)')
    .eq('is_active', true)
    .in('status', ['available', 'reserved']);

  // Loại trừ phòng đã được đặt
  if (bookedRoomIds.length > 0) {
    query = query.not('id', 'in', `(${bookedRoomIds.join(',')})`);
  }

  // Filter theo loại phòng nếu có
  if (roomTypeId) {
    query = query.eq('room_type_id', roomTypeId);
  }

  query = query.order('room_number', { ascending: true });

  const { data: rooms, error: roomError } = await query;

  if (roomError) {
    logger.error({ err: roomError }, 'RoomsRepository: findAvailable — rooms query failed');
    throw new InternalError('Lỗi tìm phòng trống');
  }

  // Bước 3: Filter theo số khách <= max_guests (ở JS sau JOIN)
  const availableRooms = (rooms || []).filter(
    (room) => room.room_types && room.room_types.max_guests >= guests
  );

  return availableRooms;
};
