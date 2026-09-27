import { ForbiddenError } from '../utils/errors.js';
import { USER_ROLES } from '../config/constants.js';

/**
 * Middleware phân quyền theo role.
 * Tham chiếu: docs/03-backend/phase2-auth/README.md
 *
 * Sử dụng:
 *   router.get('/admin', authenticate, requireRole('admin'), controller);
 *   router.get('/staff', authenticate, requireStaff, controller);
 *
 * PHẢI đặt sau middleware `authenticate` (cần req.user.role).
 *
 * @param  {...string} roles - Các role được phép truy cập
 * @returns {Function} Express middleware
 */
export const requireRole = (...roles) => (req, _res, next) => {
  // req.user được gắn bởi authenticate middleware
  if (!req.user || !roles.includes(req.user.role)) {
    const rolesText = roles.join(', ');
    throw new ForbiddenError(`Chỉ ${rolesText} mới có quyền truy cập`);
  }

  next();
};

// === Shorthand — dùng cho các route phổ biến ===

/** Chỉ admin mới có quyền */
export const requireAdmin = requireRole(USER_ROLES.ADMIN);

/** Admin hoặc staff mới có quyền */
export const requireStaff = requireRole(USER_ROLES.ADMIN, USER_ROLES.STAFF);

/** Chỉ customer mới có quyền */
export const requireCustomer = requireRole(USER_ROLES.CUSTOMER);
