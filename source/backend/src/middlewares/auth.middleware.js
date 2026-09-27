import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../utils/errors.js';

/**
 * Middleware xác thực JWT token.
 * Tham chiếu: docs/03-backend/phase2-auth/README.md
 *
 * Flow:
 * 1. Lấy Authorization header → check "Bearer " prefix
 * 2. Verify JWT với JWT_SECRET
 * 3. Gắn req.user = { sub, email, role }
 * 4. Catch lỗi cụ thể: TokenExpiredError, JsonWebTokenError
 */
export const authenticate = (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Kiểm tra header tồn tại và đúng format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Chưa đăng nhập');
    }

    // Tách token từ "Bearer <token>"
    const token = authHeader.split(' ')[1];

    // Verify và decode token
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Gắn thông tin user vào request — dùng ở controller/service
    req.user = {
      sub: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    // Token hết hạn
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Phiên đăng nhập đã hết hạn'));
    }

    // Token không hợp lệ (sai format, sai signature, v.v.)
    if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Token không hợp lệ'));
    }

    // Lỗi từ authenticate logic (UnauthorizedError thrown ở trên)
    return next(error);
  }
};

/**
 * Middleware xác thực tùy chọn — không throw nếu thiếu token.
 * Nếu có token hợp lệ → gắn req.user.
 * Nếu không có token hoặc token sai → req.user = null, vẫn next().
 *
 * Dùng cho các endpoint public nhưng cần biết user nếu đã login.
 */
export const optionalAuth = (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);

    req.user = {
      sub: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch {
    // Token sai hoặc hết hạn → bỏ qua, coi như chưa đăng nhập
    req.user = null;
    next();
  }
};
