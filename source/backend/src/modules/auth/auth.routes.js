import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { registerSchema, loginSchema } from './auth.validation.js';
import * as authController from './auth.controller.js';

/**
 * Routes — Auth module.
 * Tham chiếu: docs/03-backend/phase2-auth/README.md
 *
 * POST /api/auth/register → validate → register
 * POST /api/auth/login    → validate → login
 * GET  /api/auth/me       → authenticate → getMe
 */
const router = Router();

// Đăng ký — validate body bằng Zod trước khi vào controller
router.post('/register', validate(registerSchema), authController.register);

// Đăng nhập — validate body
router.post('/login', validate(loginSchema), authController.login);

// Lấy thông tin user hiện tại — cần JWT token
router.get('/me', authenticate, authController.getMe);

export default router;
