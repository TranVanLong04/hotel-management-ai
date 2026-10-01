import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { PATHS } from '@routes/paths';

/**
 * Trang lỗi 404 — Không tìm thấy đường dẫn yêu cầu
 */
export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 rounded-full bg-primary-50 p-6 text-primary-600 dark:bg-primary-950/50 dark:text-primary-400">
        <span className="text-5xl font-black">404</span>
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-white">
        Không tìm thấy trang
      </h1>
      <p className="mt-2 max-w-md text-sm text-gray-600 dark:text-gray-400">
        Đường dẫn bạn truy cập không tồn tại hoặc đã được thay đổi. Vui lòng kiểm tra lại địa chỉ.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link to={PATHS.HOME} className="btn btn-primary px-4 py-2.5 text-sm">
          <Home className="mr-2 h-4 w-4" />
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
