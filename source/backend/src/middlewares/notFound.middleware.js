import { NotFoundError } from '../utils/errors.js';

/**
 * Middleware xử lý route không tồn tại.
 * Đặt sau tất cả routes, trước errorHandler.
 */
export const notFoundHandler = (req, res, next) => {
  next(new NotFoundError('Route'));
};
