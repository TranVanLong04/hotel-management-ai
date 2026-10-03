/**
 * Types và Interfaces cho tính năng Nhận diện & Đăng ký Khuôn mặt (Phase 6)
 */

/** Hồ sơ khuôn mặt đã lưu trữ của khách hàng */
export interface FaceProfile {
  id: string;
  customer_id?: string;
  face_image_url: string;
  model_version: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

/** Cấu trúc response khi đăng ký khuôn mặt thành công */
export interface FaceRegisterResponse {
  success: boolean;
  data: FaceProfile;
  message?: string;
}

/** Kết quả sau khi chụp ảnh từ Webcam */
export interface FaceCaptureResult {
  blob: Blob;
  dataUrl: string;
}

/** Mã lỗi xử lý AI khuôn mặt — dùng Union Type */
export type FaceErrorCode =
  | 'FACE_NOT_DETECTED'
  | 'MULTIPLE_FACES'
  | 'LOW_QUALITY'
  | 'UPLOAD_FAILED'
  | 'UNKNOWN';
