import axios from 'axios';
import FormData from 'form-data';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import {
  BadRequestError,
  ServiceUnavailableError,
  InternalError,
} from '../utils/errors.js';

/**
 * Service tích hợp với AI Service (FastAPI).
 * Tham chiếu: docs/03-backend/phase6-face-service/README.md & docs/02-system-design/ai-service/02-api-endpoints.md
 */

// Tạo axios instance giao tiếp AI Service
const aiClient = axios.create({
  baseURL: env.AI_SERVICE_URL,
  timeout: 15000, // 15s
  headers: {
    'X-API-Key': env.AI_SERVICE_API_KEY,
  },
});

/**
 * Trích xuất face embedding 512 chiều từ buffer ảnh.
 *
 * @param {Buffer} buffer - Buffer file ảnh
 * @param {string} filename - Tên file ảnh (để giữ phần mở rộng jpeg/png)
 * @returns {Promise<{ embedding: number[], model_version: string, face_detected: boolean, bbox?: Object, confidence?: number }>}
 */
export const embedFace = async (buffer, filename = 'face.jpg') => {
  const formData = new FormData();
  formData.append('image', buffer, { filename });

  try {
    const response = await aiClient.post('/embed', formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    if (!response.data || !response.data.success) {
      throw new InternalError('AI Service trả về kết quả không hợp lệ');
    }

    return response.data.data;
  } catch (error) {
    // 1. Lỗi mạng / timeout / connection refused
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      logger.error({ err: error.message }, 'AI Service connection refused');
      throw new ServiceUnavailableError('Dịch vụ AI tạm thời không khả dụng');
    }

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      logger.error({ err: error.message }, 'AI Service request timeout');
      throw new ServiceUnavailableError('Dịch vụ AI phản hồi quá thời gian chờ (timeout)');
    }

    // 2. Lỗi HTTP status trả về từ AI Service
    if (error.response) {
      const { status, data } = error.response;
      const errorCode = data?.error?.code;
      const errorMessage = data?.error?.message;

      logger.warn({ status, errorCode, errorMessage }, 'AI Service returned error');

      if (errorCode === 'FACE_NOT_DETECTED' || status === 400 && errorCode === 'FACE_NOT_DETECTED') {
        throw new BadRequestError(
          errorMessage || 'Không phát hiện khuôn mặt trong ảnh',
          'FACE_NOT_DETECTED'
        );
      }

      if (errorCode === 'FACE_LOW_QUALITY') {
        throw new BadRequestError(
          errorMessage || 'Khuôn mặt không đủ chất lượng để nhận diện',
          'FACE_LOW_QUALITY'
        );
      }

      if (errorCode === 'FACE_MULTIPLE_DETECTED') {
        throw new BadRequestError(
          errorMessage || 'Phát hiện nhiều hơn một khuôn mặt trong ảnh',
          'FACE_MULTIPLE_DETECTED'
        );
      }

      if (errorCode === 'INVALID_IMAGE') {
        throw new BadRequestError(
          errorMessage || 'File ảnh không hợp lệ',
          'VALIDATION_ERROR'
        );
      }

      if (status >= 500) {
        throw new InternalError('Lỗi xử lý nội bộ từ AI Service');
      }
    }

    // Lỗi không xác định khác
    if (error.isOperational) {
      throw error;
    }
    logger.error({ err: error }, 'AI Service unexpected error');
    throw new InternalError('Lỗi gọi AI Service');
  }
};

/**
 * So sánh 2 face embeddings (cosine similarity).
 *
 * @param {number[]} emb1 - Embedding 1 (512 floats)
 * @param {number[]} emb2 - Embedding 2 (512 floats)
 * @param {number} [threshold=0.55] - Ngưỡng match
 * @returns {Promise<{ match: boolean, score: number, threshold: number }>}
 */
export const compareFaces = async (emb1, emb2, threshold = 0.55) => {
  try {
    const response = await aiClient.post('/compare', {
      embedding1: emb1,
      embedding2: emb2,
      threshold,
    });

    if (!response.data || !response.data.success) {
      throw new InternalError('AI Service trả về kết quả không hợp lệ khi so khớp');
    }

    return response.data.data;
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new ServiceUnavailableError('Dịch vụ AI tạm thời không khả dụng');
    }
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new ServiceUnavailableError('Dịch vụ AI phản hồi quá thời gian chờ');
    }
    if (error.isOperational) {
      throw error;
    }
    logger.error({ err: error }, 'AI Service compareFaces error');
    throw new InternalError('Lỗi so khớp khuôn mặt');
  }
};

/**
 * Kiểm tra sức khỏe của AI Service.
 * @returns {Promise<Object>}
 */
export const checkAIHealth = async () => {
  try {
    const response = await aiClient.get('/health');
    return response.data;
  } catch (error) {
    logger.warn({ err: error.message }, 'AI Service health check failed');
    return { status: 'down', error: error.message };
  }
};

/**
 * So sánh 2 ảnh chạy song song FaceNet và InsightFace.
 *
 * @param {Buffer} buffer1 - Buffer ảnh 1
 * @param {Buffer} buffer2 - Buffer ảnh 2
 * @param {Object} [options] - { thresholdFacenet, thresholdInsightface, filename1, filename2 }
 * @returns {Promise<{ facenet: Object, insightface: Object, analysis: Object }>}
 */
export const compareModels = async (
  buffer1,
  buffer2,
  {
    thresholdFacenet = 0.75,
    thresholdInsightface = 0.55,
    filename1 = 'image1.jpg',
    filename2 = 'image2.jpg',
  } = {}
) => {
  const formData = new FormData();
  formData.append('image1', buffer1, { filename: filename1 });
  formData.append('image2', buffer2, { filename: filename2 });
  formData.append('threshold_facenet', String(thresholdFacenet));
  formData.append('threshold_insightface', String(thresholdInsightface));

  try {
    const response = await aiClient.post('/compare-models', formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000,
    });

    if (!response.data || !response.data.success) {
      throw new InternalError('AI Service trả về kết quả không hợp lệ khi so sánh hai mô hình');
    }

    return response.data.data;
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      logger.error({ err: error.message }, 'AI Service connection refused in compareModels');
      throw new ServiceUnavailableError('Dịch vụ AI tạm thời không khả dụng');
    }

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      logger.error({ err: error.message }, 'AI Service request timeout in compareModels');
      throw new ServiceUnavailableError('Dịch vụ AI phản hồi quá thời gian chờ (timeout)');
    }

    if (error.response) {
      const { status, data } = error.response;
      const errorCode = data?.error?.code;
      const errorMessage = data?.error?.message;

      logger.warn({ status, errorCode, errorMessage }, 'AI Service compareModels returned error');

      if (errorCode === 'FACE_NOT_DETECTED') {
        throw new BadRequestError(
          errorMessage || 'Không phát hiện được khuôn mặt trong ảnh để so sánh',
          'FACE_NOT_DETECTED'
        );
      }
      if (errorCode === 'INVALID_IMAGE') {
        throw new BadRequestError(errorMessage || 'File ảnh không hợp lệ', 'VALIDATION_ERROR');
      }
      if (status >= 500) {
        throw new InternalError('Lỗi xử lý nội bộ từ AI Service khi so sánh mô hình');
      }
    }

    if (error.isOperational) {
      throw error;
    }
    logger.error({ err: error }, 'AI Service compareModels unexpected error');
    throw new InternalError('Lỗi điều phối so sánh hai mô hình AI');
  }
};

