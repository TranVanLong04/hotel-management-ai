import { Link } from 'react-router-dom';
import { ShieldAlert, Home, LogIn } from 'lucide-react';
import { PATHS } from '@routes/paths';
import { useAuthStore } from '@stores/authStore';

/**
 * Trang lỗi 403 — Không có quyền truy cập
 */
export function ForbiddenPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 rounded-full bg-danger-50 p-6 text-danger-600 dark:bg-danger-950/50 dark:text-danger-400">
        <ShieldAlert className="h-16 w-16" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-white">
        Truy cập bị từ chối (403)
      </h1>
      <p className="mt-2 max-w-md text-sm text-gray-600 dark:text-gray-400">
        Bạn không có quyền truy cập vào chức năng hoặc trang quản trị này. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là sự cố.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link to={PATHS.HOME} className="btn btn-primary px-4 py-2.5 text-sm">
          <Home className="mr-2 h-4 w-4" />
          Về trang chủ
        </Link>
        {!isAuthenticated && (
          <Link to={PATHS.LOGIN} className="btn btn-outline px-4 py-2.5 text-sm">
            <LogIn className="mr-2 h-4 w-4" />
            Đăng nhập tài khoản khác
          </Link>
        )}
      </div>
    </div>
  );
}
