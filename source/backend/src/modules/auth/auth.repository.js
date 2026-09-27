import { supabaseAdmin } from '../../config/supabase.js';
import { ConflictError, InternalError } from '../../utils/errors.js';
import { logger } from '../../config/logger.js';

/**
 * Repository — truy vấn DB cho module Auth.
 * Dùng supabaseAdmin (bypass RLS) vì đây là server-side.
 * Tham chiếu: docs/03-backend/phase2-auth/README.md
 */

/**
 * Tìm user theo email — trả cả password_hash (dùng cho login).
 * @param {string} email
 * @returns {Promise<Object|null>} user hoặc null
 */
export const findByEmail = async (email) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    logger.error({ err: error }, 'Repository: findByEmail failed');
    throw new InternalError('Lỗi truy vấn database');
  }

  return data;
};

/**
 * Tìm user theo ID — KHÔNG trả password_hash (dùng cho getMe).
 * @param {string} id - UUID
 * @returns {Promise<Object|null>} user hoặc null
 */
export const findById = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    logger.error({ err: error }, 'Repository: findById failed');
    throw new InternalError('Lỗi truy vấn database');
  }

  // Loại bỏ password_hash trước khi trả về
  if (data) {
    const { password_hash: _, ...userWithoutPassword } = data;
    return userWithoutPassword;
  }

  return data;
};

/**
 * Tạo user mới — trả record (trừ password_hash).
 * Handle PG unique violation (23505) → ConflictError.
 * @param {Object} data - { email, username, password_hash, full_name, phone, role }
 * @returns {Promise<Object>} user đã tạo
 */
export const createUser = async (data) => {
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .insert(data)
    .select('id, email, username, full_name, phone, role, is_active, created_at')
    .single();

  if (error) {
    // PG error 23505 = unique_violation (email đã tồn tại)
    if (error.code === '23505') {
      throw new ConflictError('AUTH_EMAIL_EXISTS', 'Email đã được sử dụng');
    }
    logger.error({ err: error }, 'Repository: createUser failed');
    throw new InternalError('Lỗi tạo tài khoản');
  }

  return user;
};

/**
 * Tạo bản ghi customer liên kết với user_id.
 * @param {Object} data - { user_id, full_name, phone, email }
 * @returns {Promise<Object>} customer đã tạo
 */
export const createCustomer = async (data) => {
  const { data: customer, error } = await supabaseAdmin
    .from('customers')
    .insert(data)
    .select('id, user_id')
    .single();

  if (error) {
    logger.error({ err: error }, 'Repository: createCustomer failed');
    throw new InternalError('Lỗi tạo hồ sơ khách hàng');
  }

  return customer;
};
