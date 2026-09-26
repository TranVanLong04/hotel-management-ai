import { AppError } from '../utils/errors.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

/**
 * Global error handler middleware.
 * Tham chiếu: docs/02-system-design/backend/04-error-handling.md
 *
 * Flow:
 * 1. Log với level phù hợp (error cho 5xx, warn cho 4xx)
 * 2. Nếu AppError && isOperational → trả JSON với code/message/details
 * 3. Nếu không → trả generic 500, ẩn stack (chỉ show ở dev)
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  // Đảm bảo có statusCode
  const statusCode = err.statusCode || 500;

  // Log theo severity — 4xx = warn, 5xx = error
  if (statusCode >= 500) {
    logger.error(
      {
        err,
        method: req.method,
        url: req.originalUrl,
        statusCode,
      },
      `[${statusCode}] ${err.message}`
    );
  } else {
    logger.warn(
      {
        code: err.code,
        method: req.method,
        url: req.originalUrl,
        statusCode,
      },
      `[${statusCode}] ${err.message}`
    );
  }

  // Lỗi nghiệp vụ (operational) — trả về chi tiết cho client
  if (err instanceof AppError && err.isOperational) {
    const response = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    };

    // Đính kèm details nếu có (VD: validation errors)
    if (err.details) {
      response.error.details = err.details;
    }

    return res.status(statusCode).json(response);
  }

  // Lỗi không dự kiến (bug) — ẩn chi tiết ở production
  const response = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: env.NODE_ENV === 'development'
        ? err.message
        : 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.',
    },
  };

  // Chỉ đính kèm stack ở dev để debug
  if (env.NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }

  return res.status(500).json(response);
};
