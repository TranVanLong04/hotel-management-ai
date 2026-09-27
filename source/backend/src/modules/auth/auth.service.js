import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { USER_ROLES } from '../../config/constants.js';
import {
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from '../../utils/errors.js';
import * as authRepo from './auth.repository.js';

/**
 * Service — business logic cho module Auth.
 * Tham chiếu: docs/03-backend/phase2-auth/README.md
 */

/**
 * Tạo JWT token từ thông tin user.
 * Payload: { sub: user.id, email, role }
 * @param {Object} user - { id, email, role }
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
};

/**
 * Đăng ký tài khoản mới.
 * Flow: check trùng email → hash password → tạo user (role: customer) → tạo customer → generate token.
 *
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} params.full_name
 * @param {string} params.phone
 * @returns {Promise<{ user: Object, token: string }>}
 */
export const register = async ({ email, password, full_name, phone }) => {
  // 1. Kiểm tra email đã tồn tại chưa
  const existingUser = await authRepo.findByEmail(email);
  if (existingUser) {
    throw new ConflictError('AUTH_EMAIL_EXISTS', 'Email đã được sử dụng');
  }

  // 2. Hash password với bcrypt
  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

  // 3. Tạo username từ email — đảm bảo unique
  const username = `${email.split('@')[0]}_${Date.now()}`;

  // 4. Tạo user với role customer
  const user = await authRepo.createUser({
    email,
    username,
    password_hash: passwordHash,
    full_name,
    phone,
    role: USER_ROLES.CUSTOMER,
  });

  // 5. Tạo bản ghi customer liên kết
  await authRepo.createCustomer({
    user_id: user.id,
    full_name,
    phone,
    email,
  });

  // 6. Generate JWT token
  const token = generateToken(user);

  // 7. Log thành công — KHÔNG log password/token
  logger.info({ userId: user.id }, 'Đăng ký thành công');

  // 8. Trả kết quả — KHÔNG có password_hash
  return {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      role: user.role,
    },
    token,
  };
};

/**
 * Đăng nhập.
 * Flow: tìm user → compare password → check is_active → generate token.
 * LƯU Ý: message lỗi cho email sai và password sai PHẢI GIỐNG NHAU (bảo mật).
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: Object, token: string }>}
 */
export const login = async (email, password) => {
  // 1. Tìm user theo email — cần password_hash để compare
  const user = await authRepo.findByEmail(email);
  if (!user) {
    // Không tiết lộ email có tồn tại hay không
    throw new UnauthorizedError('Email hoặc mật khẩu không đúng');
  }

  // 2. Compare password — dùng CÙNG message nếu sai
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Email hoặc mật khẩu không đúng');
  }

  // 3. Kiểm tra tài khoản có bị khóa không
  if (!user.is_active) {
    throw new ForbiddenError('Tài khoản đã bị khóa');
  }

  // 4. Generate JWT token
  const token = generateToken(user);

  // 5. Log thành công
  logger.info({ userId: user.id }, 'Đăng nhập thành công');

  // 6. Trả kết quả — KHÔNG trả password_hash
  return {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      role: user.role,
    },
    token,
  };
};

/**
 * Lấy thông tin user hiện tại (từ JWT).
 * @param {string} userId - UUID từ req.user.sub
 * @returns {Promise<Object>} user (không có password_hash)
 */
export const getMe = async (userId) => {
  const user = await authRepo.findById(userId);

  if (!user) {
    throw new NotFoundError('User');
  }

  return user;
};
