/**
 * Custom Error classes cho toàn hệ thống.
 * Tham chiếu: docs/02-system-design/backend/04-error-handling.md
 *
 * Luôn throw AppError (hoặc subclass) — KHÔNG throw Error thường.
 * asyncHandler sẽ catch và forward cho error middleware.
 */

/**
 * Base error class — tất cả lỗi nghiệp vụ kế thừa từ đây.
 * isOperational = true → lỗi dự kiến, trả về client bình thường.
 * isOperational = false → lỗi không dự kiến (bug), cần alert.
 */
export class AppError extends Error {
  constructor(code, message, statusCode = 400, details = null) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;

    // Giữ tên class đúng cho instanceof
    Error.captureStackTrace(this, this.constructor);
  }
}

// === 400 Bad Request ===
export class BadRequestError extends AppError {
  constructor(message = 'Yêu cầu không hợp lệ', code = 'BAD_REQUEST') {
    super(code, message, 400);
  }
}

// === 400 Validation Error — có details array ===
export class ValidationError extends AppError {
  constructor(message = 'Dữ liệu không hợp lệ', details = []) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

// === 401 Unauthorized ===
export class UnauthorizedError extends AppError {
  constructor(message = 'Chưa đăng nhập hoặc token không hợp lệ', code = 'UNAUTHORIZED') {
    super(code, message, 401);
  }
}

// === 403 Forbidden ===
export class ForbiddenError extends AppError {
  constructor(message = 'Không có quyền truy cập', code = 'FORBIDDEN') {
    super(code, message, 403);
  }
}

// === 404 Not Found — tự tạo code từ tên resource ===
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    const code = `${resource.toUpperCase().replace(/\s+/g, '_')}_NOT_FOUND`;
    super(code, `${resource} không tìm thấy`, 404);
  }
}

// === 409 Conflict ===
export class ConflictError extends AppError {
  constructor(code = 'CONFLICT', message = 'Dữ liệu bị xung đột') {
    super(code, message, 409);
  }
}

// === 500 Internal Error ===
export class InternalError extends AppError {
  constructor(message = 'Lỗi hệ thống') {
    super('INTERNAL_ERROR', message, 500);
    this.isOperational = false; // Lỗi không dự kiến
  }
}

// === 503 Service Unavailable ===
export class ServiceUnavailableError extends AppError {
  constructor(message = 'Dịch vụ tạm thời không khả dụng') {
    super('SERVICE_UNAVAILABLE', message, 503);
  }
}
