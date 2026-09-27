import { supabaseAdmin } from '../../config/supabase.js';
import { InternalError } from '../../utils/errors.js';
import { logger } from '../../config/logger.js';

/**
 * Repository — truy vấn DB cho module Customers.
 * Tham chiếu: docs/03-backend/phase3-user-management/README.md
 */

/**
 * Tìm customer theo user_id.
 * @param {string} userId - UUID
 * @returns {Promise<Object|null>} customer hoặc null
 */
export const findByUserId = async (userId) => {
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    logger.error({ err: error }, 'CustomersRepository: findByUserId failed');
    throw new InternalError('Lỗi truy vấn database');
  }

  return data;
};

/**
 * Cập nhật customer theo user_id.
 * @param {string} userId - UUID
 * @param {Object} updates - fields cần update
 * @returns {Promise<Object>} customer đã cập nhật
 */
export const updateByUserId = async (userId, updates) => {
  const { data, error } = await supabaseAdmin
    .from('customers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) {
    logger.error({ err: error }, 'CustomersRepository: updateByUserId failed');
    throw new InternalError('Lỗi cập nhật hồ sơ khách hàng');
  }

  return data;
};

/**
 * Lấy danh sách customers có phân trang + search.
 * @param {Object} filters - { page, limit, search }
 * @returns {Promise<{ data: Object[], pagination: Object }>}
 */
export const list = async ({ page = 1, limit = 20, search }) => {
  let query = supabaseAdmin
    .from('customers')
    .select('*', { count: 'exact' });

  // Search theo tên, email hoặc SĐT
  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  // Phân trang
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;

  if (error) {
    logger.error({ err: error }, 'CustomersRepository: list failed');
    throw new InternalError('Lỗi truy vấn danh sách khách hàng');
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
 * Tìm customer theo ID — JOIN bookings gần đây.
 * @param {string} id - UUID (customer id)
 * @returns {Promise<Object|null>} customer + bookings
 */
export const findById = async (id) => {
  // Query 1: Lấy customer data
  const { data: customer, error: customerError } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (customerError) {
    logger.error({ err: customerError }, 'CustomersRepository: findById failed');
    throw new InternalError('Lỗi truy vấn chi tiết khách hàng');
  }

  if (!customer) return null;

  // Query 2: Lấy bookings gần đây (5 booking mới nhất)
  const { data: bookings, error: bookingsError } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('customer_id', id)
    .order('created_at', { ascending: false })
    .limit(5);

  if (bookingsError) {
    // Nếu lỗi bookings (VD: bảng chưa có data) → trả customer không có bookings
    logger.warn({ err: bookingsError }, 'CustomersRepository: findById bookings query failed');
    return { ...customer, bookings: [] };
  }

  return { ...customer, bookings: bookings || [] };
};

/**
 * Tìm customer theo identity_number — dùng cho check unique CCCD.
 * @param {string} identityNumber
 * @param {string} excludeUserId - loại trừ user hiện tại
 * @returns {Promise<Object|null>}
 */
export const findByIdentityNumber = async (identityNumber, excludeUserId) => {
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('id, user_id, identity_number')
    .eq('identity_number', identityNumber)
    .neq('user_id', excludeUserId)
    .maybeSingle();

  if (error) {
    logger.error({ err: error }, 'CustomersRepository: findByIdentityNumber failed');
    throw new InternalError('Lỗi truy vấn database');
  }

  return data;
};
