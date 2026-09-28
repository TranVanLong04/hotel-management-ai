import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';
import * as facesService from './faces.service.js';

/**
 * Controller — HTTP handlers cho module Face Profiles.
 * Tham chiếu: docs/03-backend/phase6-face-service/README.md
 */

/**
 * POST /api/faces/register
 * Customer only — Đăng ký khuôn mặt từ ảnh upload
 */
export const registerFace = asyncHandler(async (req, res) => {
  const profile = await facesService.registerFace(req.user.sub, req.file);

  sendCreated(res, profile, 'Đăng ký khuôn mặt thành công');
});

/**
 * GET /api/faces/me
 * Customer only — Lấy hồ sơ khuôn mặt đang hoạt động của mình
 */
export const getMyFace = asyncHandler(async (req, res) => {
  const profile = await facesService.getMyFaceProfile(req.user.sub);

  sendSuccess(res, profile);
});
