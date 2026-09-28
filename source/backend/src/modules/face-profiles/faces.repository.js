import { supabaseAdmin } from '../../config/supabase.js';
import { InternalError } from '../../utils/errors.js';
import { logger } from '../../config/logger.js';

/**
 * Repository — truy vấn DB cho module Face Profiles.
 * Tham chiếu: docs/03-backend/phase6-face-service/README.md
 * Lưu ý: KHÔNG bao giờ select face_embedding để trả về application layer.
 */

/**
 * Tìm hồ sơ khuôn mặt đang hoạt động (is_active = true) của khách hàng.
 * @param {string} customerId - UUID
 * @returns {Promise<Object|null>}
 */
export const findActiveByCustomerId = async (customerId) => {
  const { data, error } = await supabaseAdmin
    .from('face_profiles')
    .select('id, customer_id, face_image_url, model_version, is_active, created_at, updated_at')
    .eq('customer_id', customerId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    logger.error({ err: error, customerId }, 'FacesRepository: findActiveByCustomerId failed');
    throw new InternalError('Lỗi truy vấn hồ sơ khuôn mặt');
  }

  return data;
};

/**
 * Tìm hồ sơ khuôn mặt kèm face_embedding (chỉ sử dụng nội bộ BE để so khớp AI, KHÔNG trả về client).
 * @param {string} customerId - UUID
 * @returns {Promise<Object|null>}
 */
export const findActiveWithEmbeddingByCustomerId = async (customerId) => {
  const { data, error } = await supabaseAdmin
    .from('face_profiles')
    .select('id, customer_id, face_image_url, face_embedding, model_version, is_active, created_at, updated_at')
    .eq('customer_id', customerId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    logger.error({ err: error, customerId }, 'FacesRepository: findActiveWithEmbeddingByCustomerId failed');
    throw new InternalError('Lỗi truy vấn hồ sơ khuôn mặt');
  }

  return data;
};

/**
 * Lấy danh sách tất cả hồ sơ khuôn mặt của khách hàng (sắp xếp mới nhất trước).
 * @param {string} customerId - UUID
 * @returns {Promise<Object[]>}
 */
export const findAllByCustomerId = async (customerId) => {
  const { data, error } = await supabaseAdmin
    .from('face_profiles')
    .select('id, customer_id, face_image_url, model_version, is_active, created_at, updated_at')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error({ err: error, customerId }, 'FacesRepository: findAllByCustomerId failed');
    throw new InternalError('Lỗi truy vấn danh sách hồ sơ khuôn mặt');
  }

  return data || [];
};

/**
 * Đăng ký hồ sơ khuôn mặt mới.
 * Sử dụng RPC 'register_face_profile' để đảm bảo atomic (deactivate cũ + insert mới).
 * Có fallback sequential nếu RPC chưa được nạp trong schema cache.
 *
 * @param {Object} params - { customerId, faceImageUrl, faceEmbedding, modelVersion }
 * @returns {Promise<Object>} Hồ sơ khuôn mặt vừa tạo (không kèm embedding)
 */
export const registerProfile = async ({
  customerId,
  faceImageUrl,
  faceEmbedding,
  modelVersion,
}) => {
  // 1. Thử gọi RPC register_face_profile (atomic)
  const { data: rpcId, error: rpcError } = await supabaseAdmin.rpc('register_face_profile', {
    p_customer_id: customerId,
    p_face_image_url: faceImageUrl,
    p_face_embedding: faceEmbedding,
    p_model_version: modelVersion,
  });

  if (!rpcError && rpcId) {
    // Lấy bản ghi vừa tạo
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('face_profiles')
      .select('id, customer_id, face_image_url, model_version, is_active, created_at, updated_at')
      .eq('id', rpcId)
      .single();

    if (!fetchError && profile) {
      return profile;
    }
  }

  // 2. Fallback nếu RPC chưa tạo hoặc gặp lỗi schema
  if (rpcError) {
    logger.warn({ err: rpcError.message }, 'RPC register_face_profile not available, using sequential fallback');
  }

  // Deactivate hồ sơ cũ
  const { error: updateError } = await supabaseAdmin
    .from('face_profiles')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('customer_id', customerId)
    .eq('is_active', true);

  if (updateError) {
    logger.error({ err: updateError, customerId }, 'FacesRepository: deactivate old profiles failed');
    throw new InternalError('Lỗi cập nhật hồ sơ khuôn mặt cũ');
  }

  // Insert hồ sơ mới
  const { data: newProfile, error: insertError } = await supabaseAdmin
    .from('face_profiles')
    .insert({
      customer_id: customerId,
      face_image_url: faceImageUrl,
      face_embedding: faceEmbedding,
      model_version: modelVersion,
      is_active: true,
    })
    .select('id, customer_id, face_image_url, model_version, is_active, created_at, updated_at')
    .single();

  if (insertError) {
    logger.error({ err: insertError, customerId }, 'FacesRepository: insert profile failed');
    throw new InternalError('Lỗi lưu hồ sơ khuôn mặt mới');
  }

  return newProfile;
};
