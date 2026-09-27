import { supabaseAdmin } from '../../config/supabase.js';
import { InternalError } from '../../utils/errors.js';
import { logger } from '../../config/logger.js';

/**
 * Repository — truy vấn DB cho module Users (admin).
 * Tham chiếu: docs/03-backend/phase3-user-management/README.md
 */

/**
 * Lấy danh sách users có phân trang, filter, search.
 * @param {Object} filters - { page, limit, role, is_active, search }
 * @returns {Promise<{ data: Object[], pagination: Object }>}
 */
export const list = async ({ page = 1, limit = 20, role, is_active, search }) => {
  let query = supabaseAdmin
    .from('users')
    .select('*', { count: 'exact' });

  // Filter theo role
  if (role) {
    query = query.eq('role', role);
  }

  // Filter theo trạng thái
  if (is_active !== undefined) {
    query = query.eq('is_active', is_active);
  }

  // Search theo tên hoặc email (case-insensitive)
  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  // Phân trang
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Sắp xếp theo ngày tạo mới nhất
  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;

  if (error) {
    logger.error({ err: error }, 'UsersRepository: list failed');
    throw new InternalError('Lỗi truy vấn danh sách users');
  }

  // Loại bỏ password_hash khỏi mỗi user
  const safeData = (data || []).map(({ password_hash: _, ...user }) => user);

  return {
    data: safeData,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  };
};

/**
 * Tìm user theo ID — KHÔNG trả password_hash.
 * @param {string} id - UUID
 * @returns {Promise<Object|null>}
 */
export const findById = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    logger.error({ err: error }, 'UsersRepository: findById failed');
    throw new InternalError('Lỗi truy vấn database');
  }

  if (data) {
    const { password_hash: _, ...userWithoutPassword } = data;
    return userWithoutPassword;
  }

  return data;
};

/**
 * Cập nhật user theo ID.
 * @param {string} id - UUID
 * @param {Object} updates - { full_name?, phone?, role? }
 * @returns {Promise<Object>} user đã cập nhật (không có password_hash)
 */
export const update = async (id, updates) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    logger.error({ err: error }, 'UsersRepository: update failed');
    throw new InternalError('Lỗi cập nhật user');
  }

  const { password_hash: _, ...userWithoutPassword } = data;
  return userWithoutPassword;
};

/**
 * Soft delete — set is_active = false.
 * @param {string} id - UUID
 * @returns {Promise<Object>} user đã soft delete
 */
export const softDelete = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    logger.error({ err: error }, 'UsersRepository: softDelete failed');
    throw new InternalError('Lỗi xóa user');
  }

  const { password_hash: _, ...userWithoutPassword } = data;
  return userWithoutPassword;
};
