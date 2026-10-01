import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@stores/authStore';
import { PATHS } from './paths';

interface ProtectedRouteProps {
  children?: ReactNode;
}

/**
 * Route guard yêu cầu người dùng phải đăng nhập trước khi truy cập
 * Nếu chưa đăng nhập: chuyển hướng về trang /login kèm vị trí (location) trước đó
 * Nếu đã đăng nhập: hiển thị nội dung bên trong hoặc Outlet
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={PATHS.LOGIN} state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
