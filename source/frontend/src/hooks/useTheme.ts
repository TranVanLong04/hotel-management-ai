import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  initTheme: () => void;
}

/**
 * Store quản lý theme (light/dark mode)
 * Persist vào localStorage với key 'theme-storage'
 */
export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light' as Theme,

      /** Chuyển đổi giữa light và dark mode */
      toggleTheme: () => {
        const newTheme: Theme = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: newTheme });
        // Cập nhật class 'dark' trên <html> để Tailwind áp dụng dark mode
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
      },

      /** Khởi tạo theme khi app mount — đồng bộ class trên <html> */
      initTheme: () => {
        const theme = get().theme;
        document.documentElement.classList.toggle('dark', theme === 'dark');
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);
