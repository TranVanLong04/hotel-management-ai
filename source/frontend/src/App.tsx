import { useEffect } from 'react';
import { useTheme } from '@hooks/useTheme';

/**
 * Root component — khởi tạo theme và render nội dung chính
 * Phase 1: Placeholder UI để verify setup
 * Phase sau: Sẽ thay bằng Outlet + Layout
 */
export function App() {
  const initTheme = useTheme((state) => state.initTheme);
  const toggleTheme = useTheme((state) => state.toggleTheme);
  const theme = useTheme((state) => state.theme);

  // Khởi tạo theme (đồng bộ class 'dark' trên <html>) khi app mount
  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100">
        🏨 Hotel Management
      </h1>
      <p className="mb-6 text-lg text-gray-600 dark:text-gray-400">
        Phase 1 setup hoàn tất — Vite + React + TypeScript + TailwindCSS
      </p>

      {/* Nút toggle theme để verify dark mode hoạt động */}
      <button
        onClick={toggleTheme}
        className="btn btn-primary px-6 py-3"
      >
        {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
      </button>
    </div>
  );
}
