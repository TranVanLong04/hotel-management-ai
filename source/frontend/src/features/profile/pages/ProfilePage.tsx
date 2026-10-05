import { useProfile } from '../hooks/useProfile';
import { ProfileSummaryCard } from '../components/ProfileSummaryCard';
import { ProfileForm } from '../components/ProfileForm';
import { User, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

/**
 * Trang hồ sơ cá nhân khách hàng (/my-profile)
 * Bố cục 2 cột: Thẻ tóm tắt thông tin bên trái (1/3) & Form chỉnh sửa bên phải (2/3)
 */
export function ProfilePage() {
  const { profile, isLoading, isSubmitting, error, update, refetch } = useProfile();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center space-y-4 py-20 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Đang tải thông tin hồ sơ...
          </p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="card mx-auto max-w-md border border-danger-200 bg-white p-8 text-center shadow-sm dark:border-danger-900/50 dark:bg-gray-900">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-100 dark:bg-danger-950/50">
            <AlertCircle className="h-6 w-6 text-danger-600 dark:text-danger-400" />
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Không thể tải hồ sơ cá nhân
          </h2>
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            {error || 'Đã có lỗi xảy ra khi truy xuất dữ liệu hồ sơ của bạn.'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="btn btn-primary mt-6 inline-flex items-center gap-2 px-4 py-2 text-xs font-medium"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-16rem)] py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header trang */}
        <div className="mb-8">
          <div className="flex items-center gap-2.5 text-xs font-medium text-primary-600 dark:text-primary-400">
            <User className="h-4 w-4" />
            <span>Tài khoản & Cá nhân</span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl dark:text-white">
            Hồ sơ cá nhân
          </h1>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Xem và cập nhật thông tin định danh của bạn để việc đặt phòng và nhận phòng diễn ra nhanh chóng.
          </p>
        </div>

        {/* Layout 2 cột: Left (1/3) - Right (2/3) */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
          {/* Cột trái: Thẻ tóm tắt thông tin */}
          <div className="lg:col-span-1">
            <ProfileSummaryCard profile={profile} />
          </div>

          {/* Cột phải: Form chỉnh sửa */}
          <div className="lg:col-span-2">
            <ProfileForm
              profile={profile}
              onSubmit={update}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
