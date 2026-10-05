import { Link } from 'react-router-dom';
import { ScanFace, Calendar, ShieldCheck, Mail, Phone, MapPin, CreditCard } from 'lucide-react';
import dayjs from 'dayjs';
import type { CustomerProfile } from '@/types';
import { useAuthStore } from '@stores/authStore';
import { PATHS } from '@routes/paths';

interface ProfileSummaryCardProps {
  profile: CustomerProfile;
}

/**
 * Thẻ tóm tắt thông tin hồ sơ và các liên kết nhanh (Đăng ký khuôn mặt, Lịch sử đặt phòng)
 */
export function ProfileSummaryCard({ profile }: ProfileSummaryCardProps) {
  const user = useAuthStore((state) => state.user);

  // Lấy 2 chữ cái đầu của tên đầy đủ
  const initials = profile.full_name
    ? profile.full_name
        .trim()
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'KH';

  const joinedDate = profile.created_at || user?.created_at
    ? dayjs(profile.created_at || user?.created_at).format('DD/MM/YYYY')
    : 'Mới tham gia';

  return (
    <div className="card sticky top-24 space-y-6 overflow-hidden border border-gray-100 bg-white p-6 shadow-sm transition-all dark:border-gray-800 dark:bg-gray-900">
      {/* Header Profile với Avatar initials và tên */}
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-primary-600 to-primary-400 text-2xl font-bold text-white shadow-md ring-4 ring-primary-50 dark:ring-primary-950">
          {initials}
          <div className="absolute bottom-0 right-0 rounded-full bg-emerald-500 p-1 ring-2 ring-white dark:ring-gray-900" title="Đã xác thực tài khoản">
            <ShieldCheck className="h-3.5 w-3.5 text-white" />
          </div>
        </div>

        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          {profile.full_name || 'Khách hàng'}
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">{profile.email}</p>

        <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-950/60 dark:text-primary-300">
          <span className="h-1.5 w-1.5 rounded-full bg-primary-500"></span>
          Khách hàng thân thiết
        </div>
      </div>

      <hr className="border-gray-100 dark:border-gray-800" />

      {/* Thông tin nhanh */}
      <div className="space-y-3 text-xs text-gray-600 dark:text-gray-300">
        <div className="flex items-center gap-2.5">
          <Mail className="h-4 w-4 text-gray-400" />
          <span className="truncate">{profile.email}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Phone className="h-4 w-4 text-gray-400" />
          <span>{profile.phone || 'Chưa cập nhật SĐT'}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <CreditCard className="h-4 w-4 text-gray-400" />
          <span>CCCD: {profile.identity_number || 'Chưa cập nhật'}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span className="truncate">{profile.address || 'Chưa cập nhật địa chỉ'}</span>
        </div>
        <div className="flex items-center justify-between pt-1 text-[11px] text-gray-400 dark:text-gray-500">
          <span>Ngày tham gia:</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">{joinedDate}</span>
        </div>
      </div>

      <hr className="border-gray-100 dark:border-gray-800" />

      {/* Phím tắt / Shortcuts */}
      <div className="space-y-2.5 pt-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Tiện ích dịch vụ
        </p>

        <Link
          to={PATHS.FACE_REGISTER}
          className="flex w-full items-center justify-between rounded-lg border border-primary-100 bg-primary-50/50 px-3.5 py-2.5 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-100 dark:border-primary-900/50 dark:bg-primary-950/30 dark:text-primary-300 dark:hover:bg-primary-900/50"
        >
          <div className="flex items-center gap-2">
            <ScanFace className="h-4 w-4" />
            <span>Đăng ký khuôn mặt AI</span>
          </div>
          <span className="text-[10px] text-primary-500 dark:text-primary-400">→</span>
        </Link>

        <Link
          to={PATHS.MY_BOOKINGS}
          className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span>Lịch sử đặt phòng</span>
          </div>
          <span className="text-[10px] text-gray-400">→</span>
        </Link>
      </div>
    </div>
  );
}
