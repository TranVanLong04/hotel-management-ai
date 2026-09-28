import { supabaseAdmin } from '../../config/supabase.js';
import { InternalError, ConflictError } from '../../utils/errors.js';
import { logger } from '../../config/logger.js';

/**
 * Repository — truy vấn DB cho module Services.
 * Tham chiếu: docs/03-backend/phase8-service-invoice/README.md
 */

/**
 * Danh sách dịch vụ (có filter is_active và search).
 * @param {Object} filters - { is_active, search }
 * @returns {Promise<Object[]>}
 */
export const list = async ({ is_active, search } = {}) => {
  let query = supabaseAdmin
    .from('services')
    .select('*')
    .order('name', { ascending: true });

  if (is_active !== undefined) {
    query = query.eq('is_active', is_active);
  }

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    logger.error({ err: error }, 'ServicesRepository: list failed');
    throw new InternalError('Lỗi truy vấn danh sách dịch vụ');
  }

  return data || [];
};

/**
 * Tìm dịch vụ theo ID.
 * @param {string} id - UUID
 * @returns {Promise<Object|null>}
 */
export const findById = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('services')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    logger.error({ err: error, id }, 'ServicesRepository: findById failed');
    throw new InternalError('Lỗi truy vấn dịch vụ');
  }

  return data;
};

/**
 * Tìm dịch vụ theo tên.
 * @param {string} name
 * @returns {Promise<Object|null>}
 */
export const findByName = async (name) => {
  const { data, error } = await supabaseAdmin
    .from('services')
    .select('*')
    .ilike('name', name)
    .maybeSingle();

  if (error) {
    logger.error({ err: error, name }, 'ServicesRepository: findByName failed');
    throw new InternalError('Lỗi kiểm tra tên dịch vụ');
  }

  return data;
};

/**
 * Tạo dịch vụ mới.
 * @param {Object} data - { name, description, price, unit }
 * @returns {Promise<Object>}
 */
export const insert = async (data) => {
  const { data: created, error } = await supabaseAdmin
    .from('services')
    .insert({
      name: data.name,
      description: data.description || null,
      price: data.price,
      unit: data.unit,
      is_active: true,
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new ConflictError('SERVICE_NAME_EXISTS', 'Tên dịch vụ đã tồn tại');
    }
    logger.error({ err: error, data }, 'ServicesRepository: insert failed');
    throw new InternalError('Lỗi tạo dịch vụ');
  }

  return created;
};

/**
 * Cập nhật thông tin dịch vụ.
 * @param {string} id - UUID
 * @param {Object} updates - Các trường cập nhật
 * @returns {Promise<Object>}
 */
export const update = async (id, updates) => {
  const { data, error } = await supabaseAdmin
    .from('services')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new ConflictError('SERVICE_NAME_EXISTS', 'Tên dịch vụ đã tồn tại');
    }
    logger.error({ err: error, id, updates }, 'ServicesRepository: update failed');
    throw new InternalError('Lỗi cập nhật dịch vụ');
  }

  return data;
};

/**
 * Soft delete dịch vụ (chuyển is_active = false).
 * @param {string} id - UUID
 * @returns {Promise<Object>}
 */
export const softDelete = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('services')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    logger.error({ err: error, id }, 'ServicesRepository: softDelete failed');
    throw new InternalError('Lỗi xóa dịch vụ');
  }

  return data;
};
