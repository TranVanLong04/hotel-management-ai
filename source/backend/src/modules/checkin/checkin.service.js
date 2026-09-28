import * as bookingsRepo from '../bookings/bookings.repository.js';
import * as roomsRepo from '../rooms/rooms.repository.js';
import * as facesRepo from '../face-profiles/faces.repository.js';
import * as aiService from '../../services/ai.service.js';
import { logger } from '../../config/logger.js';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
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
    throw new BadRequestError(
      'Khách hàng chưa đăng ký hồ sơ khuôn mặt. Vui lòng đăng ký trước hoặc sử dụng check-in thủ công.',
      'FACE_PROFILE_NOT_FOUND'
    );
  }

  // 5. Trích xuất embedding từ ảnh chụp hiện tại
  const embedResult = await aiService.embedFace(file.buffer, file.originalname || 'checkin.jpg');
  const newEmbedding = embedResult.embedding;

  // 6. So khớp với embedding đã đăng ký
  const compareResult = await aiService.compareFaces(
    newEmbedding,
    faceProfile.face_embedding,
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
