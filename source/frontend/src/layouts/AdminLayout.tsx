import { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Sun, Moon, Sparkles } from 'lucide-react';
import { Sidebar } from '@components/layout/Sidebar';
import { UserMenu } from '@components/layout/UserMenu';
import { useTheme } from '@hooks/useTheme';

/**
 * Layout trang Quản trị và Lễ tân (Admin & Staff)
 * Bao gồm Sidebar điều hướng phân quyền ở bên trái,
 * Top Header hiển thị công cụ (Theme toggle, User menu) và Outlet cho trang quản trị
 */
export function AdminLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const theme = useTheme((state) => state.theme);
  const toggleTheme = useTheme((state) => state.toggleTheme);
  const initTheme = useTheme((state) => state.initTheme);

  const handleCloseMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      {/* Sidebar bên trái (Desktop + Drawer Mobile) */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={handleCloseMobileSidebar}
      />

      {/* Khu vực nội dung chính bên phải */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar điều hướng quản trị */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-gray-200/80 bg-white/90 px-4 backdrop-blur-sm sm:px-6 dark:border-gray-800 dark:bg-gray-900/90">
          <div className="flex items-center gap-3">
            {/* Nút mở Sidebar trên Mobile */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 md:hidden dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
              aria-label="Mở menu quản trị"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Bảng điều khiển khách sạn
              </span>
            </div>
          </div>

          {/* Action buttons (Right side) */}
          <div className="flex items-center gap-3">
            {/* Nút chuyển đổi Dark/Light mode */}
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
              aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              title={theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-amber-400 transition-transform hover:rotate-45" />
              ) : (
                <Moon className="h-5 w-5 text-gray-700 transition-transform hover:-rotate-12" />
              )}
            </button>

            {/* Menu người dùng */}
            <UserMenu />
          </div>
        </header>

        {/* Nội dung trang quản trị render qua Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
