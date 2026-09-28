import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '@stores/authStore';

/**
 * Axios instance chính — tất cả API calls đều dùng instance này
 * - baseURL từ biến môi trường VITE_API_URL
 * - timeout 15 giây
 * - Tự động gắn Bearer token
 * - Tự động xử lý lỗi 401/403/400/500
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ========== REQUEST INTERCEPTOR ==========

api.interceptors.request.use(
  (config) => {
    // Lấy token trực tiếp từ store (không qua hook) để tránh vấn đề React context
    const { token } = useAuthStore.getState();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

// ========== RESPONSE INTERCEPTOR ==========

/** Các endpoint không cần redirect khi gặp 401 */
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register'];

api.interceptors.response.use(
  // Thành công → trả về response.data trực tiếp
  (response) => response.data,
  (error: unknown) => {
    // Kiểm tra có phải lỗi axios không
    if (!axios.isAxiosError(error)) {
      toast.error('Đã xảy ra lỗi không xác định');
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const url = error.config?.url ?? '';

    switch (status) {
      case 401: {
        // Token hết hạn — logout trừ khi đang ở trang login/register
        const isAuthEndpoint = AUTH_ENDPOINTS.some((ep) => url.includes(ep));
        if (!isAuthEndpoint) {
          useAuthStore.getState().logout();
          window.location.href = '/login';
          toast.error('Phiên đăng nhập đã hết hạn');
        }
        break;
      }
      case 403:
        toast.error('Bạn không có quyền thực hiện hành động này');
        break;
      case 400: {
        const message =
          (error.response?.data as { error?: { message?: string } })?.error?.message ??
          'Dữ liệu không hợp lệ';
        toast.error(message);
        break;
      }
      case 500:
        toast.error('Lỗi hệ thống, vui lòng thử lại sau');
        break;
      default:
        break;
    }

    return Promise.reject(error);
  }
);

export default api;
