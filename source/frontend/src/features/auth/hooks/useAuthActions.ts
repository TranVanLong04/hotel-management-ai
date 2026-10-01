import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@stores/authStore';
import { authApi } from '@/api/auth.api';
import type { LoginPayload, RegisterPayload, User } from '@/types';

/**
 * Custom hook xử lý các hành động xác thực (Login, Register, Logout, Refresh)
 * Tích hợp gọi authApi và cập nhật Zustand authStore
 */
export function useAuthActions() {
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const updateUser = useAuthStore((state) => state.updateUser);

  /**
   * Đăng nhập người dùng và lưu thông tin vào authStore
   * @param credentials Email và password
   * @returns Thông tin user sau khi đăng nhập thành công
   */
  const handleLogin = async (credentials: LoginPayload): Promise<User> => {
    setLoading(true);
    try {
      const response = await authApi.login(credentials);
      const { user, token } = response.data;
      login(user, token);
      toast.success(response.message || 'Đăng nhập thành công');
      return user;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Đăng ký tài khoản mới và tự động đăng nhập (lưu store)
   * @param payload Dữ liệu đăng ký
   * @returns Thông tin user vừa tạo
   */
  const handleRegister = async (payload: RegisterPayload): Promise<User> => {
    setLoading(true);
    try {
      const response = await authApi.register(payload);
      const { user, token } = response.data;
      // Tự động đăng nhập sau khi đăng ký thành công
      login(user, token);
      toast.success(response.message || 'Đăng ký thành công');
      return user;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Đăng xuất người dùng, xóa authStore và thông báo
   */
  const handleLogout = async (): Promise<void> => {
    setLoading(true);
    try {
      await authApi.logout();
    } finally {
      logout();
      setLoading(false);
      toast.success('Đã đăng xuất thành công');
    }
  };

  /**
   * Làm mới thông tin người dùng từ server bằng token hiện tại
   * @returns Thông tin user mới nhất hoặc null nếu thất bại
   */
  const refreshUser = async (): Promise<User | null> => {
    try {
      const response = await authApi.getMe();
      const user = response.data;
      updateUser(user);
      return user;
    } catch {
      return null;
    }
  };

  return {
    loading,
    handleLogin,
    handleRegister,
    handleLogout,
    refreshUser,
  };
}
