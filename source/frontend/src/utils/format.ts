import dayjs from 'dayjs';

/**
 * Format số tiền sang VND
 * Ví dụ: 1500000 → "1.500.000 ₫"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

/**
 * Format số có dấu phân cách hàng nghìn
 * Ví dụ: 1500000 → "1.500.000"
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('vi-VN').format(num);
}

/**
 * Format ngày theo định dạng chỉ định
 * @param date Chuỗi ngày ISO hoặc YYYY-MM-DD
 * @param format Định dạng output, mặc định 'DD/MM/YYYY'
 */
export function formatDate(date: string | Date, format = 'DD/MM/YYYY'): string {
  return dayjs(date).format(format);
}

/**
 * Format ngày giờ đầy đủ
 * Ví dụ: "28/09/2026 14:30"
 */
export function formatDateTime(date: string | Date): string {
  return dayjs(date).format('DD/MM/YYYY HH:mm');
}
