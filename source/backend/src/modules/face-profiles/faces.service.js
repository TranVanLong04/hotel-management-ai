import { logger } from '../../config/logger.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import * as aiService from '../../services/ai.service.js';
import * as storageService from '../../services/storage.service.js';
import * as bookingsRepo from '../bookings/bookings.repository.js';
import * as facesRepo from './faces.repository.js';

/**
 * Service — business logic cho module Face Profiles.
 * Tham chiếu: docs/03-backend/phase6-face-service/README.md
 */

/**
 * Đăng ký hoặc cập nhật hồ sơ khuôn mặt cho khách hàng.
 *
 * @param {string} userId - UUID từ req.user.sub
 * @param {Express.Multer.File} file - File ảnh từ multer
 * @returns {Promise<Object>} Hồ sơ khuôn mặt đã tạo (KHÔNG kèm embedding)
 */
export const registerFace = async (userId, file) => {
  // 1. Kiểm tra file upload
  if (!file || !file.buffer) {
    throw new BadRequestError('Vui lòng chọn file ảnh khuôn mặt (field "image")');
  }

  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new BadRequestError('Chỉ chấp nhận file ảnh định dạng JPEG, JPG hoặc PNG');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new BadRequestError('Kích thước ảnh không được vượt quá 5MB');
  }

  // 2. Tìm thông tin khách hàng từ userId (tái sử dụng từ bookings.repository.js theo yêu cầu)
  const customer = await bookingsRepo.findCustomerByUserId(userId);
  if (!customer) {
    throw new NotFoundError('Customer');
  }

  // 3. Gọi AI Service để trích xuất vector embedding
  const aiResult = await aiService.embedFace(file.buffer, file.originalname || 'face.jpg');

  if (!aiResult || !Array.isArray(aiResult.embedding)) {
    throw new BadRequestError('Không thể trích xuất vector khuôn mặt từ ảnh');
  }

  // 4. Kiểm tra độ dài embedding chuẩn 512 floats
  if (aiResult.embedding.length !== 512) {
    throw new BadRequestError(
      `Độ dài vector khuôn mặt không đúng chuẩn (yêu cầu 512, nhận được ${aiResult.embedding.length})`,
      'AI_INVALID_EMBEDDING'
    );
  }

  // 5. Upload ảnh lên Supabase Storage (bucket faces)
  const { url: faceImageUrl } = await storageService.uploadFaceImage(
    file.buffer,
    userId,
    file.mimetype
  );

  // 6. Lưu hồ sơ vào DB (atomic qua RPC hoặc fallback)
  const profile = await facesRepo.registerProfile({
    customerId: customer.id,
    faceImageUrl,
    faceEmbedding: aiResult.embedding,
    modelVersion: aiResult.model_version || 'arcface-r100-v1',
  });

  logger.info(
    { customerId: customer.id, profileId: profile.id, userId },
    'Đăng ký khuôn mặt thành công'
  );

  // 7. Trả về kết quả — đảm bảo KHÔNG bao gồm face_embedding
  return {
    id: profile.id,
    face_image_url: profile.face_image_url,
    model_version: profile.model_version,
    is_active: profile.is_active,
    created_at: profile.created_at,
  };
};

/**
 * Lấy hồ sơ khuôn mặt đang hoạt động của khách hàng hiện tại.
 *
 * @param {string} userId - UUID từ req.user.sub
 * @returns {Promise<Object>}
 */
export const getMyFaceProfile = async (userId) => {
  // Tìm thông tin khách hàng
  const customer = await bookingsRepo.findCustomerByUserId(userId);
  if (!customer) {
    throw new NotFoundError('Customer');
  }

  // Tìm hồ sơ khuôn mặt active
  const profile = await facesRepo.findActiveByCustomerId(customer.id);
  if (!profile) {
    throw new NotFoundError('Face Profile');
  }

  // Trả về thông tin an toàn (không có embedding)
  return {
    id: profile.id,
    face_image_url: profile.face_image_url,
    model_version: profile.model_version,
    is_active: profile.is_active,
    created_at: profile.created_at,
  };
};
