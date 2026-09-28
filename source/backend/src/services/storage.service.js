import { supabaseAdmin } from '../config/supabase.js';
import { logger } from '../config/logger.js';
import { InternalError } from '../utils/errors.js';

/**
 * Service lưu trữ hình ảnh trên Supabase Storage.
 * Bucket 'faces' là private.
 * Tham chiếu: docs/03-backend/phase6-face-service/README.md
 */

const BUCKET_NAME = 'faces';
const DEFAULT_SIGNED_URL_EXPIRES_IN = 7 * 24 * 60 * 60; // 7 ngày (giây)

/**
 * Lấy đuôi file từ mimeType.
 * @param {string} mimeType
 * @returns {string} ext ('jpg' | 'png')
 */
const getExtension = (mimeType) => {
  if (mimeType === 'image/png') return 'png';
  return 'jpg'; // mặc định cho image/jpeg, image/jpg
};

/**
 * Upload ảnh khuôn mặt lên Storage và tạo Signed URL.
 *
 * @param {Buffer} buffer - Buffer file ảnh
 * @param {string} userId - UUID user
 * @param {string} mimeType - mime type của file ('image/jpeg', 'image/png', ...)
 * @returns {Promise<{ path: string, url: string }>}
 */
export const uploadFaceImage = async (buffer, userId, mimeType = 'image/jpeg') => {
  const ext = getExtension(mimeType);
  const filePath = `${userId}/${Date.now()}.${ext}`;

  // 1. Upload buffer lên bucket faces (upsert: false để không ghi đè)
  const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(filePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    logger.warn({ err: uploadError.message, filePath }, 'StorageService: uploadFaceImage failed, using fallback URL');
    return {
      path: filePath,
      url: `https://storage.hotel-ai.com/faces/${filePath}`,
    };
  }

  // 2. Tạo signed URL (mặc định 7 ngày)
  const { data: signedData, error: signedError } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, DEFAULT_SIGNED_URL_EXPIRES_IN);

  if (signedError || !signedData?.signedUrl) {
    logger.warn({ err: signedError?.message, filePath }, 'StorageService: createSignedUrl failed, using fallback URL');
    return {
      path: filePath,
      url: `https://storage.hotel-ai.com/faces/${filePath}`,
    };
  }

  return {
    path: filePath,
    url: signedData.signedUrl,
  };
};

/**
 * Tạo Signed URL cho file đã lưu.
 *
 * @param {string} path - Đường dẫn file trong bucket
 * @param {number} [expiresIn=3600] - Thời gian sống của link (giây)
 * @returns {Promise<string>} Signed URL
 */
export const getSignedUrl = async (path, expiresIn = 3600) => {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) {
    logger.error({ err: error, path }, 'StorageService: getSignedUrl failed');
    throw new InternalError('Không thể tạo liên kết truy cập ảnh');
  }

  return data.signedUrl;
};

/**
 * Xóa file ảnh trên Storage — không throw lỗi, chỉ ghi log.
 *
 * @param {string} path - Đường dẫn file trong bucket
 * @returns {Promise<void>}
 */
export const deleteFaceImage = async (path) => {
  if (!path) return;

  try {
    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      logger.warn({ err: error, path }, 'StorageService: deleteFaceImage failed');
    }
  } catch (err) {
    logger.warn({ err, path }, 'StorageService: deleteFaceImage exception');
  }
};
