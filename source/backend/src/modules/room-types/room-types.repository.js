import { supabaseAdmin } from '../../config/supabase.js';
import { InternalError, ConflictError, BadRequestError } from '../../utils/errors.js';
import { logger } from '../../config/logger.js';

/**
 * Repository — truy vấn DB cho module Room Types.
 * Tham chiếu: docs/03-backend/phase4-room-management/README.md
 */

/**
 * Lấy danh sách loại phòng có phân trang, filter, search.
 * @param {Object} filters - { page, limit, is_active, search }
 * @returns {Promise<{ data: Object[], pagination: Object }>}
 */
export const list = async ({ page = 1, limit = 20, is_active, search }) => {
  let query = supabaseAdmin
    .from('room_types')
    .select('*', { count: 'exact' });

  // Filter is_active — mặc định chỉ lấy active
  if (is_active !== undefined) {
    query = query.eq('is_active', is_active);
  }

  // Search theo tên loại phòng (case-insensitive)
  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  // Phân trang
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;

  if (error) {
    logger.error({ err: error }, 'RoomTypesRepository: list failed');
    throw new InternalError('Lỗi truy vấn danh sách loại phòng');
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
 * Tìm loại phòng theo ID.
 * @param {string} id - UUID
 * @returns {Promise<Object|null>}
 */
export const findById = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('room_types')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    logger.error({ err: error }, 'RoomTypesRepository: findById failed');
    throw new InternalError('Lỗi truy vấn database');
  }

  return data;
};

/**
 * Tìm loại phòng theo tên — dùng để check unique.
 * @param {string} name - tên loại phòng
 * @returns {Promise<Object|null>}
 */
export const findByName = async (name) => {
  const { data, error } = await supabaseAdmin
    .from('room_types')
    .select('id, name')
    .ilike('name', name)
    .maybeSingle();

  if (error) {
    logger.error({ err: error }, 'RoomTypesRepository: findByName failed');
    throw new InternalError('Lỗi truy vấn database');
  }

  return data;
};

/**
 * Tạo loại phòng mới.
 * Handle PG 23505 → ROOM_TYPE_NAME_EXISTS.
 * @param {Object} data - { name, description, max_guests, base_price, amenities, image_url }
 * @returns {Promise<Object>}
 */
export const insert = async (data) => {
  const { data: roomType, error } = await supabaseAdmin
    .from('room_types')
    .insert(data)
    .select('*')
    .single();

  if (error) {
    // PG 23505 — UNIQUE violation (tên trùng)
    if (error.code === '23505') {
      throw new ConflictError('ROOM_TYPE_NAME_EXISTS', 'Tên loại phòng đã tồn tại');
    }
    logger.error({ err: error }, 'RoomTypesRepository: insert failed');
    throw new InternalError('Lỗi tạo loại phòng');
  }

  return roomType;
};

/**
 * Cập nhật loại phòng theo ID.
 * @param {string} id - UUID
 * @param {Object} updates - fields cần cập nhật
 * @returns {Promise<Object>}
 */
export const update = async (id, updates) => {
  const { data, error } = await supabaseAdmin
    .from('room_types')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    // PG 23505 — UNIQUE violation (tên trùng khi update)
    if (error.code === '23505') {
      throw new ConflictError('ROOM_TYPE_NAME_EXISTS', 'Tên loại phòng đã tồn tại');
    }
    logger.error({ err: error }, 'RoomTypesRepository: update failed');
    throw new InternalError('Lỗi cập nhật loại phòng');
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
    .from('room_types')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    logger.error({ err: error }, 'RoomTypesRepository: softDelete failed');
    throw new InternalError('Lỗi xóa loại phòng');
  }

  return data;
};

/**
 * Đếm số phòng active đang dùng loại phòng này.
 * Dùng để check trước khi xóa loại phòng.
 * @param {string} roomTypeId - UUID
 * @returns {Promise<number>}
 */
export const countActiveRooms = async (roomTypeId) => {
  const { count, error } = await supabaseAdmin
    .from('rooms')
    .select('id', { count: 'exact', head: true })
    .eq('room_type_id', roomTypeId)
    .eq('is_active', true);

  if (error) {
    logger.error({ err: error }, 'RoomTypesRepository: countActiveRooms failed');
    throw new InternalError('Lỗi kiểm tra phòng liên quan');
  }

  return count || 0;
};
