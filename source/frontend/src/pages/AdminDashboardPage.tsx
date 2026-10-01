import { LayoutDashboard, Users, BedDouble, Calendar } from 'lucide-react';
import { useAuthStore } from '@stores/authStore';

/**
 * Trang tổng quan Admin Dashboard (placeholder hiển thị trong AdminLayout)
 */
export function AdminDashboardPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-6">
      {/* Header trang */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Bảng điều khiển Quản trị
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Xin chào <strong className="text-primary-600 dark:text-primary-400">{user?.full_name}</strong>, chúc bạn một ngày làm việc hiệu quả.
        </p>
      </div>

      {/* Stats Cards placeholder */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card flex items-center justify-between p-5">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
              Tổng phòng hoạt động
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              48 / 50
            </p>
          </div>
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            <BedDouble className="h-6 w-6" />
          </div>
        </div>

        <div className="card flex items-center justify-between p-5">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
              Lượt khách hôm nay
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              18
            </p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="card flex items-center justify-between p-5">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
              Đặt phòng đang chờ
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              6
            </p>
          </div>
          <div className="rounded-xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
            <Calendar className="h-6 w-6" />
          </div>
        </div>

        <div className="card flex items-center justify-between p-5">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
              Tỷ lệ nhận diện AI
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              99.2%
            </p>
          </div>
          <div className="rounded-xl bg-purple-50 p-3 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
            <LayoutDashboard className="h-6 w-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
