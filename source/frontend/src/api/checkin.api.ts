import api from './axios';
import type { Booking, ApiResponse } from '@/types';

export interface VerifyCheckinResponse {
  similarity: number;
  is_match: boolean;
  booking: Booking;
}

export interface ManualCheckinPayload {
  reason: string;
  identity_number: string;
}

/**
 * Check-in API Client — Giao tiếp với Backend cho các luồng Check-in của Lễ tân
 */
export const checkinApi = {
  /**
   * Check-in xác thực bằng khuôn mặt qua AI Service
   * @param bookingId UUID của booking
   * @param image File hoặc Blob ảnh chụp từ camera
   */
  verifyCheckin: async (bookingId: string, image: File | Blob): Promise<VerifyCheckinResponse> => {
    const formData = new FormData();
    const file = image instanceof File ? image : new File([image], 'checkin.jpg', { type: 'image/jpeg' });
    formData.append('image', file);

    const res = await api.post<never, ApiResponse<VerifyCheckinResponse>>(
      `/checkin/${bookingId}/verify`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return res.data;
  },

  /**
   * Check-in xác nhận trực tiếp bởi nhân viên khi kiểm tra giấy tờ thành công
   * @param bookingId UUID của booking
   */
  confirmCheckin: async (bookingId: string): Promise<Booking> => {
    const res = await api.post<never, ApiResponse<Booking>>(`/checkin/${bookingId}/confirm`);
    return res.data;
  },

  /**
   * Check-in thủ công kèm lý do và số CMND/CCCD (Ghi nhận Security Event)
   * @param bookingId UUID của booking
   * @param data { reason, identity_number }
   */
  manualCheckin: async (bookingId: string, data: ManualCheckinPayload): Promise<Booking> => {
    const res = await api.post<never, ApiResponse<Booking>>(`/checkin/${bookingId}/manual`, data);
    return res.data;
  },
};

export const { verifyCheckin, confirmCheckin, manualCheckin } = checkinApi;
