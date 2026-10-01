import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  LogOut,
  Calendar,
  ScanFace,
  ChevronDown,
  Shield,
  Briefcase,
} from 'lucide-react';
import { useAuthStore } from '@stores/authStore';
import { useAuthActions } from '@/features/auth/hooks/useAuthActions';
import { PATHS } from '@routes/paths';
import { ROLE_LABELS } from '@/types';

/**
 * Menu dropdown hiển thị thông tin người dùng và các thao tác liên quan
 * Hỗ trợ click outside để đóng menu, hiển thị avatar/initials và vai trò
 */
export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((state) => state.user);
  const { handleLogout } = useAuthActions();
  const navigate = useNavigate();

  // Đóng dropdown khi click ra ngoài vùng menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!user) {
    return null;
  }

  const onLogout = async () => {
    setIsOpen(false);
    await handleLogout();
    navigate(PATHS.LOGIN);
  };

  // Lấy ký tự đầu viết tắt tên đại diện
  const initials = user.full_name
    ? user.full_name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <div className="relative" ref={menuRef}>
      {/* Nút trigger mở menu user */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2.5 rounded-full p-1.5 transition-colors duration-150 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:hover:bg-gray-800"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Tài khoản người dùng"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-semibold text-white shadow-sm ring-2 ring-white dark:bg-primary-500 dark:ring-gray-800">
          {initials}
        </div>
        <div className="hidden text-left sm:block">
          <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
            {user.full_name}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {ROLE_LABELS[user.role]}
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition-transform duration-200 dark:text-gray-400 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95 duration-100 dark:border-gray-700 dark:bg-gray-900">
          {/* Header trong dropdown trên màn hình nhỏ */}
          <div className="border-b border-gray-100 px-3 py-2 sm:hidden dark:border-gray-800">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
              {user.full_name}
            </p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              {user.email}
            </p>
            <span className="mt-1 inline-block rounded bg-primary-50 px-1.5 py-0.5 text-[10px] font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
              {ROLE_LABELS[user.role]}
            </span>
          </div>

          <div className="py-1">
            {/* Link Profile */}
            <Link
              to={PATHS.MY_PROFILE}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <UserIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span>Thông tin tài khoản</span>
            </Link>

            {/* Menu cho khách hàng */}
            {user.role === 'customer' && (
              <>
                <Link
                  to={PATHS.MY_BOOKINGS}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span>Lịch sử đặt phòng</span>
                </Link>
                <Link
                  to={PATHS.FACE_REGISTER}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <ScanFace className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span>Đăng ký khuôn mặt</span>
                </Link>
              </>
            )}

            {/* Menu cho Admin */}
            {user.role === 'admin' && (
              <Link
                to={PATHS.ADMIN_DASHBOARD}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-primary-600 transition-colors hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950/50"
              >
                <Shield className="h-4 w-4" />
                <span>Trang quản trị (Admin)</span>
              </Link>
            )}

            {/* Menu cho Staff */}
            {user.role === 'staff' && (
              <Link
                to={PATHS.STAFF_CHECKIN}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-primary-600 transition-colors hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950/50"
              >
                <Briefcase className="h-4 w-4" />
                <span>Trang lễ tân (Staff)</span>
              </Link>
            )}
          </div>

          <div className="border-t border-gray-100 pt-1 dark:border-gray-800">
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-danger-600 transition-colors hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-950/50"
            >
              <LogOut className="h-4 w-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
