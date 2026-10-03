import type { AxiosError } from 'axios';
import api from './axios';
import type { FaceProfile, ApiResponse } from '@/types';

/**
 * Face API Client — Giao tiếp với Backend cho tính năng Đăng ký & Nhận diện khuôn mặt
 */
export const faceApi = {
  /**
   * Lấy hồ sơ khuôn mặt đang hoạt động của khách hàng hiện tại
   * Trả về null nếu chưa đăng ký khuôn mặt (HTTP 404)
   */
  getMyProfile: async (): Promise<FaceProfile | null> => {
    try {
      const res = await api.get<never, ApiResponse<FaceProfile>>('/faces/me');
      return res.data ?? null;
    } catch (err: unknown) {
      const axiosError = err as AxiosError;
      // Khách hàng chưa đăng ký khuôn mặt → backend trả về 404
      if (axiosError?.response?.status === 404) {
        return null;
      }
      throw err;
    }
  },

  /**
   * Đăng ký khuôn mặt bằng cách tải lên file ảnh
   * @param file File ảnh dạng File (từ Blob webcam)
   */
  registerFace: async (file: File): Promise<FaceProfile> => {
    const formData = new FormData();
    formData.append('image', file);

    const res = await api.post<never, ApiResponse<FaceProfile>>('/faces/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return res.data;
  },
};
