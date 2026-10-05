import api from './axios';
import type { ApiResponse, AuthResponse, LoginPayload, RegisterPayload, User } from '@/types';

/**
 * Service API xác thực người dùng
 * Kết nối với các endpoint của module /auth ở backend
 */
export const authApi = {
  /**
   * Đăng nhập tài khoản bằng email và mật khẩu
   * @param credentials Thông tin email và mật khẩu
   * @returns Thông tin user và JWT token
   */
  login: async (credentials: LoginPayload): Promise<ApiResponse<AuthResponse>> => {
    return api.post('/auth/login', credentials);
  },

  /**
   * Đăng ký tài khoản khách hàng mới
   * @param payload Thông tin đăng ký (email, password, full_name, phone)
   * @returns Thông tin user và JWT token
   */
  register: async (payload: RegisterPayload): Promise<ApiResponse<AuthResponse>> => {
    return api.post('/auth/register', payload);
  },

  /**
   * Đăng xuất người dùng
   * Gửi request logout tới backend để ghi log và xác thực
   */
  logout: async (): Promise<ApiResponse<null>> => {
    return api.post('/auth/logout');
  },

  /**
   * Lấy thông tin tài khoản hiện tại từ JWT token
   * @returns Thông tin người dùng
   */
  getMe: async (): Promise<ApiResponse<User>> => {
    return api.get('/auth/me');
  },
};
