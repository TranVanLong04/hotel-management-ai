import { useState, useEffect } from 'react';

/**
 * Hook debounce giá trị — dùng cho search, filter
 * Trì hoãn cập nhật giá trị cho đến khi user ngừng thay đổi
 *
 * @param value Giá trị cần debounce
 * @param delay Thời gian chờ (ms), mặc định 500ms
 */
export function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Hủy timer cũ khi value thay đổi trước khi hết delay
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
