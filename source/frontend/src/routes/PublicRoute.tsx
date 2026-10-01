import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@stores/authStore';
import { PATHS } from './paths';

interface PublicRouteProps {
  children?: ReactNode;
}

/**
 * Route guard dành cho các trang công khai như Login, Register
 * Nếu người dùng đã đăng nhập, tự động chuyển hướng về trang chủ
 */
export function PublicRoute({ children }: PublicRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to={PATHS.HOME} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
