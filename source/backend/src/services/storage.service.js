import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { InternalError, ServiceUnavailableError } from '../utils/errors.js';

/**
 * Service lưu trữ hình ảnh trên Supabase Storage.
 * Bucket 'faces' là private.
 */

const BUCKET_NAME = 'faces';
const DEFAULT_SIGNED_URL_EXPIRES_IN = 7 * 24 * 60 * 60; // 7 ngày (giây)

// TẠO CLIENT RIÊNG CHO STORAGE: 
// Đảm bảo không bị dính session của user (tránh lỗi RLS)
const supabaseStorageAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false, // Bắt buộc phải false
      detectSessionInUrl: false,
    },
  }
);

const getExtension = (mimeType) => {
  if (mimeType === 'image/png') return 'png';
  return 'jpg';
};

export const uploadFaceImage = async (buffer, userId, mimeType = 'image/jpeg') => {
  const ext = getExtension(mimeType);
  const filePath = `${userId}/${Date.now()}.${ext}`;

  // 1. Upload buffer lên bucket faces (dùng supabaseStorageAdmin thay vì supabaseAdmin)
  const { error: uploadError } = await supabaseStorageAdmin.storage
    .from(BUCKET_NAME)
    .upload(filePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    logger.error({ err: uploadError.message, filePath }, 'StorageService: Upload ảnh thất bại');
    throw new ServiceUnavailableError('Không thể lưu ảnh khuôn mặt lên hệ thống. Vui lòng thử lại sau.');
  }

  // 2. Tạo signed URL (dùng supabaseStorageAdmin)
  const { data: signedData, error: signedError } = await supabaseStorageAdmin.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, DEFAULT_SIGNED_URL_EXPIRES_IN);

  if (signedError || !signedData?.signedUrl) {
    logger.error({ err: signedError?.message, filePath }, 'StorageService: Tạo signed URL thất bại');
    throw new InternalError('Không thể tạo liên kết truy cập ảnh');
  }

  return {
    path: filePath,
    url: signedData.signedUrl,
  };
};

export const getSignedUrl = async (path, expiresIn = 3600) => {
  const { data, error } = await supabaseStorageAdmin.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) {
    logger.error({ err: error, path }, 'StorageService: getSignedUrl failed');
    throw new InternalError('Không thể tạo liên kết truy cập ảnh');
  }

  return data.signedUrl;
};

export const deleteFaceImage = async (path) => {
  if (!path) return;

  try {
    const { error } = await supabaseStorageAdmin.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      logger.warn({ err: error, path }, 'StorageService: deleteFaceImage failed');
    }
  } catch (err) {
    logger.warn({ err, path }, 'StorageService: deleteFaceImage exception');
  }
};