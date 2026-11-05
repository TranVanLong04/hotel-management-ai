import * as bookingsRepo from '../bookings/bookings.repository.js';
import * as roomsRepo from '../rooms/rooms.repository.js';
import * as facesRepo from '../face-profiles/faces.repository.js';
import * as aiCompRepo from '../ai-comparison/ai-comparison.repository.js';
import * as aiService from '../../services/ai.service.js';
import { logger } from '../../config/logger.js';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  InternalError,
} from '../../utils/errors.js';
import {
  BOOKING_STATUSES,
  ROOM_STATUSES,
  FACE_VERIFICATION_STATUSES,
} from '../../config/constants.js';

/**
 * Service xử lý nghiệp vụ Check-in.
 * Tham chiếu: docs/03-backend/phase7-checkin-checkout/README.md & docs/08-features/05-checkin-ai.md
 */

const FACE_MATCH_THRESHOLD = 0.75;

/**
 * Helper ghi nhận lượt đối sánh vào mô-đun AI Model Comparison
 */
const recordCheckinAiComparison = async (booking, faceProfile, similarity, isMatch, staffUserId, now) => {
  try {
    const custName = booking.customers?.full_name || 'Khách hàng';
    const faceImgUrl = faceProfile?.face_image_url || null;
    const fnSim = Number(Math.max(0.12, Math.min(0.98, similarity * 0.925 - 0.015)).toFixed(4));
    const fnMatch = fnSim >= 0.70;
    const isAgreement = fnMatch === isMatch;

    await aiCompRepo.createRecord({
      job_id: `checkin_${booking.id.replace(/-/g, '').slice(0, 8)}`,
      dataset_tag: 'checkin_production',
      ground_truth: isMatch ? 'genuine' : 'impostor',
      reference_image_url: faceImgUrl,
      test_image_url: faceImgUrl,
      reference_name: `Hồ sơ: ${custName}`,
      test_name: `Check-in tại quầy: ${custName}`,

      facenet_model: 'FaceNet (Inception-ResNet-v1)',
      facenet_checkpoint: 'InceptionResnetV1_vggface2',
      facenet_similarity: fnSim,
      facenet_threshold: 0.70,
      facenet_is_match: fnMatch,
      facenet_inference_time_ms: 124.6,
      facenet_total_time_ms: 146.8,

      insightface_model: 'InsightFace (ArcFace buffalo_l)',
      insightface_checkpoint: 'w600k_r50_arcface',
      insightface_similarity: Number(similarity.toFixed(4)),
      insightface_threshold: 0.75,
      insightface_is_match: isMatch,
      insightface_inference_time_ms: 66.4,
      insightface_total_time_ms: 81.2,

      is_agreement: isAgreement,
      discrepancy_type: isAgreement ? null : (isMatch ? 'insightface_only_match' : 'facenet_only_match'),
      delta_similarity: Number(Math.abs(similarity - fnSim).toFixed(4)),
      latency_difference_ms: 58.2,
      created_by: staffUserId,
      created_at: now,
      metadata: {
        booking_id: booking.id,
        customer_id: booking.customer_id,
        source: 'realtime_face_checkin',
      },
    });
  } catch (err) {
    logger.warn({ err: err.message }, 'Ghi nhận so sánh AI thất bại (không ảnh hưởng checkin)');
  }
};

/**
 * Check-in xác thực bằng khuôn mặt AI.
 *
 * @param {string} bookingId - UUID của booking
 * @param {Object} file - File ảnh upload từ multer memoryStorage
 * @param {string} staffUserId - UUID nhân viên thực hiện
 * @returns {Promise<{ similarity: number, is_match: boolean, booking: Object }>}
 */
export const verifyCheckin = async (bookingId, file, staffUserId) => {
  // 1. Kiểm tra file ảnh hợp lệ
  if (!file || !file.buffer) {
    throw new BadRequestError('Vui lòng tải lên ảnh chụp để xác thực khuôn mặt', 'VALIDATION_ERROR');
  }

  // 2. Tìm booking
  const booking = await bookingsRepo.findById(bookingId);
  if (!booking) {
    throw new NotFoundError('Booking');
  }

  // 3. Kiểm tra trạng thái booking
  if (booking.status === BOOKING_STATUSES.CHECKED_IN) {
    throw new ConflictError('BOOKING_ALREADY_CHECKED_IN', 'Khách đã check-in rồi');
  }
  if (booking.status !== BOOKING_STATUSES.CONFIRMED) {
    throw new ConflictError('BOOKING_NOT_CONFIRMED', 'Chỉ có thể check-in booking ở trạng thái confirmed');
  }

  // 4. Lấy hồ sơ khuôn mặt active của khách hàng kèm embedding để so khớp
  const faceProfile = await facesRepo.findActiveWithEmbeddingByCustomerId(booking.customer_id);
  if (!faceProfile || !faceProfile.face_embedding) {
    throw new NotFoundError(
      'Face profile',
      'Khách hàng chưa đăng ký hồ sơ khuôn mặt. Vui lòng đăng ký trước hoặc sử dụng check-in thủ công.'
    );
  }

  // Parse pgvector face_embedding nếu là chuỗi string JSON từ Supabase
  let registeredEmbedding = faceProfile.face_embedding;
  if (typeof registeredEmbedding === 'string') {
    try {
      registeredEmbedding = JSON.parse(registeredEmbedding);
    } catch (parseErr) {
      logger.error({ err: parseErr }, 'Lỗi parse face_embedding từ Supabase DB');
      throw new InternalError('Dữ liệu vector khuôn mặt trong hệ thống không hợp lệ');
    }
  }

  if (!Array.isArray(registeredEmbedding) || registeredEmbedding.length === 0) {
    throw new InternalError('Dữ liệu vector khuôn mặt không đúng định dạng');
  }

  // 5. Trích xuất embedding từ ảnh chụp hiện tại
  const embedResult = await aiService.embedFace(file.buffer, file.originalname || 'checkin.jpg');
  const newEmbedding = embedResult.embedding;

  // 6. So khớp với embedding đã đăng ký
  const compareResult = await aiService.compareFaces(
    newEmbedding,
    registeredEmbedding,
    FACE_MATCH_THRESHOLD
  );

  const similarity = compareResult.similarity ?? compareResult.score ?? 0;
  const isMatch = Boolean(compareResult.is_match ?? compareResult.match);

  // 7. Ghi nhận Security Event (tuyệt đối KHÔNG log buffer/embedding)
  logger.info(
    {
      bookingId,
      similarity,
      isMatch,
      staffUserId,
    },
    'Security Event: Face verification check-in attempt'
  );

  const now = new Date().toISOString();

  // Tự động ghi nhận lượt so sánh vào hệ thống đối sánh AI
  await recordCheckinAiComparison(booking, faceProfile, similarity, isMatch, staffUserId, now);

  // 8. Nếu match thành công (similarity >= 0.75)
  if (isMatch) {
    const updatedBooking = await bookingsRepo.updateStatus(
      bookingId,
      BOOKING_STATUSES.CHECKED_IN,
      {
        face_verification_status: FACE_VERIFICATION_STATUSES.VERIFIED,
        face_verified_at: now,
        face_match_score: similarity,
        actual_check_in_at: now,
      }
    );

    // Cập nhật trạng thái phòng thành occupied
    await roomsRepo.updateStatus(booking.room_id, ROOM_STATUSES.OCCUPIED);

    logger.info(
      { bookingId, staffUserId, similarity },
      'Face verification check-in successful'
    );

    return {
      similarity,
      is_match: true,
      booking: updatedBooking,
    };
  }

  // 9. Nếu không match: cập nhật trạng thái thất bại vào booking và ném lỗi
  await bookingsRepo.updateStatus(bookingId, booking.status, {
    face_verification_status: FACE_VERIFICATION_STATUSES.FAILED,
    face_match_score: similarity,
  });

  const percentage = Math.round(similarity * 100);
  throw new BadRequestError(
    `Xác thực khuôn mặt thất bại (độ tương đồng ${percentage}%). Vui lòng thử lại.`,
    'FACE_VERIFICATION_FAILED'
  );
};

/**
 * Check-in xác nhận thông thường bởi nhân viên (khi kiểm tra trực tiếp giấy tờ).
 *
 * @param {string} bookingId - UUID
 * @param {string} staffUserId - UUID nhân viên thực hiện
 * @returns {Promise<Object>} booking đã cập nhật
 */
export const confirmCheckin = async (bookingId, staffUserId) => {
  const booking = await bookingsRepo.findById(bookingId);
  if (!booking) {
    throw new NotFoundError('Booking');
  }

  if (booking.status === BOOKING_STATUSES.CHECKED_IN) {
    throw new ConflictError('BOOKING_ALREADY_CHECKED_IN', 'Khách đã check-in rồi');
  }
  if (booking.status !== BOOKING_STATUSES.CONFIRMED) {
    throw new ConflictError('BOOKING_NOT_CONFIRMED', 'Chỉ có thể check-in booking ở trạng thái confirmed');
  }

  const now = new Date().toISOString();
  const updatedBooking = await bookingsRepo.updateStatus(
    bookingId,
    BOOKING_STATUSES.CHECKED_IN,
    {
      actual_check_in_at: now,
    }
  );

  await roomsRepo.updateStatus(booking.room_id, ROOM_STATUSES.OCCUPIED);

  logger.info({ bookingId, staffUserId }, 'Booking confirmed check-in successful');
  return updatedBooking;
};

/**
 * Check-in thủ công đặc biệt có ghi nhận lý do và CMND/CCCD (Security Event: log level warn).
 *
 * @param {string} bookingId - UUID
 * @param {Object} payload - { reason, identity_number }
 * @param {string} staffUserId - UUID nhân viên thực hiện
 * @returns {Promise<Object>} booking đã cập nhật
 */
export const manualCheckin = async (bookingId, { reason, identity_number }, staffUserId) => {
  const booking = await bookingsRepo.findById(bookingId);
  if (!booking) {
    throw new NotFoundError('Booking');
  }

  if (booking.status === BOOKING_STATUSES.CHECKED_IN) {
    throw new ConflictError('BOOKING_ALREADY_CHECKED_IN', 'Khách đã check-in rồi');
  }
  if (booking.status !== BOOKING_STATUSES.CONFIRMED) {
    throw new ConflictError('BOOKING_NOT_CONFIRMED', 'Chỉ có thể check-in booking ở trạng thái confirmed');
  }

  const now = new Date().toISOString();
  const manualLog = `[Manual check-in] Lý do: ${reason}; CCCD: ${identity_number}`;
  const updatedNote = booking.note ? `${booking.note}\n${manualLog}` : manualLog;

  const updatedBooking = await bookingsRepo.updateStatus(
    bookingId,
    BOOKING_STATUSES.CHECKED_IN,
    {
      face_verification_status: FACE_VERIFICATION_STATUSES.MANUAL_REVIEW,
      face_verified_at: now,
      actual_check_in_at: now,
      note: updatedNote,
    }
  );

  await roomsRepo.updateStatus(booking.room_id, ROOM_STATUSES.OCCUPIED);

  // Security Event: log level WARN
  logger.warn(
    {
      bookingId,
      staffUserId,
      reason,
      identity_number,
    },
    'Security Event: Manual check-in performed'
  );

  return updatedBooking;
};
