import { Link } from 'react-router-dom';
import { CalendarX2, AlertCircle, Sparkles } from 'lucide-react';
import { BookingCard } from './BookingCard';
import { Button } from '@components/ui/Button';
import { PATHS } from '@routes/paths';
import type { Booking } from '@/types';

interface BookingListProps {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  onCancel: (booking: Booking) => void;
  onRetry: () => void;
}

/**
 * Danh sách hiển thị các BookingCard với đầy đủ Loading Skeleton, Error và Empty State
 */
export function BookingList({
  bookings,
  loading,
  error,
  onCancel,
  onRetry,
}: BookingListProps) {
  // Trạng thái Đang tải (Skeleton)
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-850"
          >
            <div className="flex justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="h-5 w-32 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-6 w-24 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="my-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="h-10 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-10 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-10 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-10 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="flex justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="h-8 w-28 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-8 w-24 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Trạng thái Lỗi khi tải dữ liệu
  if (error) {
    return (
      <div className="rounded-2xl border border-danger-200 bg-danger-50/50 p-8 text-center dark:border-danger-900/50 dark:bg-danger-950/20">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-danger-100 text-danger-600 dark:bg-danger-900 dark:text-danger-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Không thể tải danh sách đơn đặt phòng
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
        <div className="mt-4 flex justify-center">
          <Button variant="primary" size="sm" onClick={onRetry}>
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  // Trạng thái Danh sách trống
  if (bookings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-850">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
          <CalendarX2 className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Chưa có đơn đặt phòng nào
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
          Bạn chưa có đơn đặt phòng nào trong mục này. Hãy khám phá danh sách phòng nghỉ tiện nghi của chúng tôi ngay hôm nay!
        </p>
        <div className="mt-6">
          <Link to={PATHS.ROOMS}>
            <Button variant="primary" size="md">
              <Sparkles className="mr-2 h-4 w-4" />
              Khám phá phòng ngay
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Render danh sách booking
  return (
    <div className="space-y-4 animate-fade-in">
      {bookings.map((booking) => (
        <BookingCard key={booking.id} booking={booking} onCancel={onCancel} />
      ))}
    </div>
  );
}
