import type { AxiosError } from 'axios';

/** Cấu trúc response lỗi từ backend */
interface ErrorResponseData {
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, string>;
  };
}

/**
 * Trích xuất message lỗi từ response
 * Ưu tiên: response.data.error.message → message mặc định
 */
export function getErrorMessage(
  error: unknown,
  defaultMessage = 'Đã xảy ra lỗi, vui lòng thử lại'
): string {
  const axiosError = error as AxiosError<ErrorResponseData>;
  return axiosError?.response?.data?.error?.message ?? defaultMessage;
}

/**
 * Lấy error code từ response
 */
export function getErrorCode(error: unknown): string | undefined {
  const axiosError = error as AxiosError<ErrorResponseData>;
  return axiosError?.response?.data?.error?.code;
}

/**
 * Kiểm tra lỗi validation (status 400 + có details)
 */
export function isValidationError(error: unknown): boolean {
  const axiosError = error as AxiosError<ErrorResponseData>;
  return (
    axiosError?.response?.status === 400 &&
    axiosError?.response?.data?.error?.details !== undefined
  );
}

/**
 * Trích xuất lỗi validation thành map { field: message }
 * Dùng để hiển thị lỗi dưới từng input field
 */
export function getValidationErrors(error: unknown): Record<string, string> {
  const axiosError = error as AxiosError<ErrorResponseData>;
  return axiosError?.response?.data?.error?.details ?? {};
}
