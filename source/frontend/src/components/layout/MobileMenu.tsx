import { useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  X,
  Home,
  BedDouble,
  Calendar,
  ScanFace,
  LayoutDashboard,
  Briefcase,
  User as UserIcon,
  Sun,
  Moon,
  LogIn,
  UserPlus,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@stores/authStore';
import { useAuthActions } from '@/features/auth/hooks/useAuthActions';
import { useTheme } from '@hooks/useTheme';
import { PATHS } from '@routes/paths';
import { ROLE_LABELS } from '@/types';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Menu ngăn kéo (drawer) điều hướng dành cho thiết bị di động
 * Bao gồm các liên kết trang, thông tin tài khoản, chuyển đổi theme và đăng xuất
 */
export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { handleLogout } = useAuthActions();
  const theme = useTheme((state) => state.theme);
  const toggleTheme = useTheme((state) => state.toggleTheme);

  // Khóa cuộn trang khi menu mobile đang mở
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Đóng khi nhấn phím ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleLogoutClick = async () => {
    onClose();
    await handleLogout();
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400 font-semibold'
        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'
    }`;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Lớp nền mờ backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer content */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xs flex-col bg-white shadow-2xl transition-transform dark:bg-gray-900">
        {/* Header của Drawer */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3.5 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏨</span>
            <span className="font-bold text-gray-900 dark:text-white">
              Grand Luxury Hotel
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label="Đóng menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Thông tin User nếu đã đăng nhập */}
        {isAuthenticated && user && (
          <div className="border-b border-gray-100 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-800/40">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 font-semibold text-white">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                  {user.full_name}
                </p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  {user.email}
                </p>
                <span className="mt-1 inline-block rounded bg-primary-100 px-2 py-0.5 text-[11px] font-medium text-primary-800 dark:bg-primary-950 dark:text-primary-300">
                  {ROLE_LABELS[user.role]}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Danh sách liên kết điều hướng */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <nav className="space-y-1">
            <NavLink to={PATHS.HOME} onClick={onClose} className={navItemClass} end>
              <Home className="h-4 w-4" />
              <span>Trang chủ</span>
            </NavLink>

            <NavLink to={PATHS.ROOMS} onClick={onClose} className={navItemClass}>
              <BedDouble className="h-4 w-4" />
              <span>Danh sách phòng</span>
            </NavLink>

            {/* Menu cho Customer */}
            {isAuthenticated && user?.role === 'customer' && (
              <>
                <NavLink to={PATHS.MY_BOOKINGS} onClick={onClose} className={navItemClass}>
                  <Calendar className="h-4 w-4" />
                  <span>Lịch sử đặt phòng</span>
                </NavLink>
                <NavLink to={PATHS.FACE_REGISTER} onClick={onClose} className={navItemClass}>
                  <ScanFace className="h-4 w-4" />
                  <span>Đăng ký khuôn mặt</span>
                </NavLink>
                <NavLink to={PATHS.MY_PROFILE} onClick={onClose} className={navItemClass}>
                  <UserIcon className="h-4 w-4" />
                  <span>Thông tin cá nhân</span>
                </NavLink>
              </>
            )}

            {/* Menu cho Admin */}
            {isAuthenticated && user?.role === 'admin' && (
              <NavLink to={PATHS.ADMIN_DASHBOARD} onClick={onClose} className={navItemClass}>
                <LayoutDashboard className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                <span className="font-semibold text-primary-600 dark:text-primary-400">
                  Trang quản trị (Admin)
                </span>
              </NavLink>
            )}

            {/* Menu cho Staff */}
            {isAuthenticated && user?.role === 'staff' && (
              <NavLink to={PATHS.STAFF_CHECKIN} onClick={onClose} className={navItemClass}>
                <Briefcase className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                <span className="font-semibold text-primary-600 dark:text-primary-400">
                  Trang lễ tân (Staff)
                </span>
              </NavLink>
            )}
          </nav>
        </div>

        {/* Footer của Drawer (Theme toggle + Auth buttons) */}
        <div className="border-t border-gray-200 p-4 dark:border-gray-800">
          {/* Nút chuyển đổi Dark/Light mode */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex w-full items-center justify-between rounded-lg bg-gray-100 px-3.5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <span className="flex items-center gap-2">
              {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <span>{theme === 'dark' ? 'Giao diện tối' : 'Giao diện sáng'}</span>
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Đổi</span>
          </button>

          {/* Chưa đăng nhập: nút Đăng nhập / Đăng ký */}
          {!isAuthenticated ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                to={PATHS.LOGIN}
                onClick={onClose}
                className="btn btn-outline flex items-center justify-center gap-1.5 py-2 text-xs"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Đăng nhập</span>
              </Link>
              <Link
                to={PATHS.REGISTER}
                onClick={onClose}
                className="btn btn-primary flex items-center justify-center gap-1.5 py-2 text-xs"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Đăng ký</span>
              </Link>
            </div>
          ) : (
            <div className="mt-3">
              <button
                type="button"
                onClick={handleLogoutClick}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-danger-50 px-3 py-2 text-sm font-medium text-danger-600 transition-colors hover:bg-danger-100 dark:bg-danger-950/40 dark:text-danger-400"
              >
                <LogOut className="h-4 w-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
