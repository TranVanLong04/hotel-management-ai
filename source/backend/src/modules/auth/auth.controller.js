import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';
import * as authService from './auth.service.js';

/**
 * Controller — HTTP handlers cho module Auth.
 * Tham chiếu: docs/03-backend/phase2-auth/README.md
 *
 * Tất cả đều wrap asyncHandler → lỗi tự forward cho error middleware.
 */

/**
 * POST /api/auth/register
 * Body: { email, password, full_name, phone }
 */
export const register = asyncHandler(async (req, res) => {
  const { email, password, full_name, phone } = req.body;

  const result = await authService.register({ email, password, full_name, phone });

  sendCreated(res, result, 'Đăng ký thành công');
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.login(email, password);

  sendSuccess(res, result, 'Đăng nhập thành công');
});

/**
 * GET /api/auth/me
 * Header: Authorization: Bearer <token>
 * Cần middleware `authenticate` trước.
 */
export const getMe = asyncHandler(async (req, res) => {
  // req.user.sub = userId — được gắn bởi authenticate middleware
  const user = await authService.getMe(req.user.sub);

  sendSuccess(res, user);
});
