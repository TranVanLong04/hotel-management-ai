import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Sun, Moon, Menu, LogIn, BedDouble, Home, Sparkles } from 'lucide-react';
import { useAuthStore } from '@stores/authStore';
import { useTheme } from '@hooks/useTheme';
import { PATHS } from '@routes/paths';
import { UserMenu } from './UserMenu';
import { MobileMenu } from './MobileMenu';

/**
 * Header điều hướng chính cho khách vãng lai và khách hàng (MainLayout)
 * Hỗ trợ chuyển đổi Theme, hiển thị menu điều hướng, UserMenu hoặc Auth buttons
 */
export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const theme = useTheme((state) => state.theme);
  const toggleTheme = useTheme((state) => state.toggleTheme);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors rounded-lg ${
      isActive
        ? 'text-primary-600 bg-primary-50/80 dark:bg-primary-950/50 dark:text-primary-400 font-semibold'
        : 'text-gray-700 hover:text-primary-600 hover:bg-gray-100/60 dark:text-gray-200 dark:hover:text-primary-400 dark:hover:bg-gray-800/60'
    }`;

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-gray-200/80 bg-white/85 backdrop-blur-md transition-colors dark:border-gray-800 dark:bg-gray-900/85">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Tên khách sạn */}
          <div className="flex items-center gap-8">
            <Link
              to={PATHS.HOME}
              className="flex items-center gap-2.5 transition-transform hover:scale-[1.02]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-md shadow-primary-500/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                  Grand Luxury
                </span>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                  Hotel & AI
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden items-center gap-1 md:flex">
              <NavLink to={PATHS.HOME} className={navLinkClass} end>
                <Home className="h-4 w-4" />
                <span>Trang chủ</span>
              </NavLink>
              <NavLink to={PATHS.ROOMS} className={navLinkClass}>
                <BedDouble className="h-4 w-4" />
                <span>Phòng nghỉ</span>
              </NavLink>
            </nav>
          </div>

          {/* Action buttons (Right side) */}
          <div className="flex items-center gap-2 sm:gap-3">
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

            {/* UserMenu nếu đã login hoặc nút Đăng nhập / Đăng ký nếu chưa login */}
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  to={PATHS.LOGIN}
                  className="btn btn-outline px-3.5 py-1.5 text-xs font-semibold"
                >
                  <LogIn className="mr-1.5 h-3.5 w-3.5" />
                  Đăng nhập
                </Link>
                <Link
                  to={PATHS.REGISTER}
                  className="btn btn-primary px-3.5 py-1.5 text-xs font-semibold shadow-sm"
                >
                  Đăng ký
                </Link>
              </div>
            )}

            {/* Nút hamburger mở MobileMenu trên màn hình nhỏ */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 md:hidden dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
              aria-label="Mở menu điều hướng di động"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Drawer menu cho mobile */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
}
