import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireCustomer } from '../../middlewares/role.middleware.js';
import { uploadImage } from '../../middlewares/upload.middleware.js';
import * as facesController from './faces.controller.js';

/**
 * Routes — Face Profiles module.
 * Tham chiếu: docs/03-backend/phase6-face-service/README.md
 *
 * POST /api/faces/register  → customer đăng ký khuôn mặt (multipart)
 * GET  /api/faces/me        → customer xem hồ sơ khuôn mặt của mình
 */
const router = Router();

// === Customer đăng ký khuôn mặt ===
router.post(
  '/register',
  authenticate,
  requireCustomer,
  uploadImage,
  facesController.registerFace
);

// === Customer xem hồ sơ khuôn mặt của mình ===
router.get(
  '/me',
  authenticate,
  requireCustomer,
  facesController.getMyFace
);

export default router;
