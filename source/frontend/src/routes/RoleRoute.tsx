import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@stores/authStore';
import type { UserRole } from '@/types';
import { PATHS } from './paths';

interface RoleRouteProps {
  allowedRoles: UserRole[];
  children?: ReactNode;
}

/**
 * Route guard yêu cầu người dùng phải đăng nhập VÀ có vai trò (role) được phép
 * - Chưa đăng nhập -> chuyển hướng về /login (kèm location để quay lại sau khi login)
 * - Đã đăng nhập nhưng không đủ quyền -> chuyển hướng về /403 (Forbidden)
 * - Hợp lệ -> hiển thị nội dung bên trong hoặc Outlet
 */
export function RoleRoute({ allowedRoles, children }: RoleRouteProps) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to={PATHS.LOGIN} state={{ from: location }} replace />;
  }

  // Kiểm tra vai trò của user có nằm trong danh sách quyền được phép hay không
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={PATHS.FORBIDDEN} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
