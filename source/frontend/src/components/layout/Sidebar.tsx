import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BedDouble,
  Layers,
  Sparkles,
  Users,
  BarChart3,
  UserCheck,
  UserMinus,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Shield,
  Briefcase,
  X,
  Home,
  LogOut,
  UtensilsCrossed,
} from 'lucide-react';
import { useAuthStore } from '@stores/authStore';
import { useAuthActions } from '@/features/auth/hooks/useAuthActions';
import { PATHS } from '@routes/paths';
import { ROLE_LABELS, type UserRole } from '@/types';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  badge?: string;
}

const SIDEBAR_STORAGE_KEY = 'admin_sidebar_collapsed';

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

/**
 * Sidebar quản trị cho AdminLayout
 * - Phân quyền hiển thị theo Role (Admin vs Staff)
 * - Persist trạng thái thu gọn (collapsed) vào localStorage
 * - Hỗ trợ drawer trên màn hình di động/tablet
 */
export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const user = useAuthStore((state) => state.user);
  const { handleLogout } = useAuthActions();
  const location = useLocation();

  // Đọc trạng thái thu gọn từ localStorage
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // Lưu trạng thái thu gọn vào localStorage mỗi khi thay đổi
  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // Bỏ qua nếu localStorage bị khóa
      }
      return next;
    });
  };

  // Đóng drawer mobile khi đổi route
  useEffect(() => {
    onMobileClose();
  }, [location.pathname, onMobileClose]);

  // Định nghĩa các mục menu với phân quyền role
  const navSections: { title: string; items: NavItem[] }[] = [
    {
      title: 'Nghiệp vụ Lễ tân',
      items: [
        {
          name: 'Check-in (AI Face)',
          path: PATHS.STAFF_CHECKIN,
          icon: UserCheck,
          roles: ['staff', 'admin'],
        },
        {
          name: 'Check-out & Hóa đơn',
          path: PATHS.STAFF_CHECKOUT,
          icon: UserMinus,
          roles: ['staff', 'admin'],
        },
        {
          name: 'Quản lý Đặt phòng',
          path: PATHS.STAFF_BOOKINGS,
          icon: CalendarDays,
          roles: ['staff', 'admin'],
        },
      ],
    },
    {
      title: 'Quản trị Hệ thống',
      items: [
        {
          name: 'Tổng quan (Dashboard)',
          path: PATHS.ADMIN_DASHBOARD,
          icon: LayoutDashboard,
          roles: ['admin'],
        },
        {
          name: 'Danh sách Phòng',
          path: PATHS.ADMIN_ROOMS,
          icon: BedDouble,
          roles: ['admin'],
        },
        {
          name: 'Hạng & Loại phòng',
          path: PATHS.ADMIN_ROOM_TYPES,
          icon: Layers,
          roles: ['admin'],
        },
        {
          name: 'Dịch vụ Khách sạn',
          path: PATHS.ADMIN_SERVICES,
          icon: UtensilsCrossed,
          roles: ['admin'],
        },
        {
          name: 'Tài khoản & Nhân sự',
          path: PATHS.ADMIN_USERS,
          icon: Users,
          roles: ['admin'],
        },
        {
          name: 'Báo cáo & Thống kê',
          path: PATHS.ADMIN_REPORTS,
          icon: BarChart3,
          roles: ['admin'],
        },
      ],
    },
  ];

  // Lọc các section và item theo role của user hiện tại
  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => user && item.roles.includes(user.role)
      ),
    }))
    .filter((section) => section.items.length > 0);

  const renderNavContent = (isMobileView = false) => (
    <div className="flex h-full flex-col justify-between">
      <div>
        {/* Header Logo */}
        <div
          className={`flex h-16 items-center border-b border-gray-200/80 px-4 dark:border-gray-800 ${
            collapsed && !isMobileView ? 'justify-center px-2' : 'justify-between'
          }`}
        >
          <Link
            to={PATHS.HOME}
            className="flex items-center gap-2.5 overflow-hidden transition-transform hover:scale-[1.02]"
            title="Về trang chủ khách hàng"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            {(!collapsed || isMobileView) && (
              <div className="min-w-0">
                <span className="block truncate font-bold text-gray-900 dark:text-white">
                  Grand Luxury
                </span>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                  Quản trị hệ thống
                </span>
              </div>
            )}
          </Link>

          {/* Nút đóng drawer trên mobile */}
          {isMobileView && (
            <button
              type="button"
              onClick={onMobileClose}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label="Đóng sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Thông tin nhân viên / admin */}
        {(!collapsed || isMobileView) && user && (
          <div className="border-b border-gray-100 bg-gray-50/50 p-3.5 dark:border-gray-800 dark:bg-gray-800/30">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-semibold text-white">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-gray-900 dark:text-white">
                  {user.full_name}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  {user.role === 'admin' ? (
                    <Shield className="h-3 w-3 text-primary-600 dark:text-primary-400" />
                  ) : (
                    <Briefcase className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  )}
                  <span className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                    {ROLE_LABELS[user.role]}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Danh sách Menu Items */}
        <nav className="space-y-6 overflow-y-auto px-3 py-4">
          {visibleSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {(!collapsed || isMobileView) && (
                <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={collapsed && !isMobileView ? item.name : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        collapsed && !isMobileView ? 'justify-center px-2' : ''
                      } ${
                        isActive
                          ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/20 font-semibold'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                      }`
                    }
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {(!collapsed || isMobileView) && (
                      <span className="truncate">{item.name}</span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer của Sidebar */}
      <div className="border-t border-gray-200/80 p-3 dark:border-gray-800">
        <div className="space-y-1">
          {/* Link về trang chủ khách hàng */}
          <Link
            to={PATHS.HOME}
            title={collapsed && !isMobileView ? 'Trang chủ khách hàng' : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 ${
              collapsed && !isMobileView ? 'justify-center px-2' : ''
            }`}
          >
            <Home className="h-4 w-4 shrink-0" />
            {(!collapsed || isMobileView) && <span>Về trang chủ</span>}
          </Link>

          {/* Nút Đăng xuất */}
          <button
            type="button"
            onClick={handleLogout}
            title={collapsed && !isMobileView ? 'Đăng xuất' : undefined}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-danger-600 transition-colors hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-950/30 ${
              collapsed && !isMobileView ? 'justify-center px-2' : ''
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {(!collapsed || isMobileView) && <span>Đăng xuất</span>}
          </button>
        </div>

        {/* Nút thu gọn / mở rộng Sidebar trên Desktop */}
        {!isMobileView && (
          <div className="mt-2 border-t border-gray-100 pt-2 dark:border-gray-800">
            <button
              type="button"
              onClick={toggleCollapse}
              className="flex w-full items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
              title={collapsed ? 'Mở rộng' : 'Thu gọn'}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <div className="flex items-center gap-2 text-xs">
                  <ChevronLeft className="h-4 w-4" />
                  <span>Thu gọn</span>
                </div>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar cố định */}
      <aside
        className={`hidden shrink-0 border-r border-gray-200/80 bg-white transition-all duration-300 md:block dark:border-gray-800 dark:bg-gray-900 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="sticky top-0 h-screen">{renderNavContent(false)}</div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl dark:bg-gray-900">
            {renderNavContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
