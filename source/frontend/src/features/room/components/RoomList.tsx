import { BedDouble, AlertCircle, RotateCcw } from 'lucide-react';
import type { Room } from '@/types';
import { RoomCard } from './RoomCard';
import { Button } from '@components/ui/Button';

interface RoomListProps {
  rooms: Room[];
  loading: boolean;
  error: string | null;
  onResetFilter?: () => void;
  onRetry?: () => void;
}

/**
 * Danh sách hiển thị các thẻ phòng dạng lưới responsive (1 - 2 - 3 - 4 cột)
 * Xử lý các trạng thái Loading skeleton, Empty và Error
 */
export function RoomList({
  rooms,
  loading,
  error,
  onResetFilter,
  onRetry,
}: RoomListProps) {
  // Trạng thái Loading: Hiển thị Skeleton cards
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="card animate-pulse overflow-hidden p-0 border border-gray-200/60 dark:border-gray-800"
          >
            <div className="aspect-video w-full bg-gray-200 dark:bg-gray-800" />
            <div className="space-y-3 p-5">
              <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-6 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <div className="h-5 w-24 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="h-8 w-16 rounded bg-gray-200 dark:bg-gray-800" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Trạng thái Error: Lỗi kết nối / fetch data thất bại
  if (error) {
    return (
      <div className="card flex flex-col items-center justify-center py-16 text-center border-dashed border-2 border-danger-200 dark:border-danger-900/50">
        <div className="mb-4 rounded-2xl bg-danger-50 p-4 text-danger-600 dark:bg-danger-950 dark:text-danger-400">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white">
          Không thể tải danh sách phòng
        </h3>
        <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
          {error}
        </p>
        {onRetry && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onRetry}
            className="mt-5"
          >
            Thử lại
          </Button>
        )}
      </div>
    );
  }

  // Trạng thái Empty: Không tìm thấy phòng nào phù hợp bộ lọc
  if (rooms.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-20 text-center border-dashed border-2 border-gray-200 dark:border-gray-800">
        <div className="mb-4 rounded-2xl bg-primary-50 p-5 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
          <BedDouble className="h-10 w-10" />
        </div>
        <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white">
          Không tìm thấy phòng phù hợp
        </h3>
        <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
          Không có phòng nào khớp với các tiêu chí lọc hiện tại. Bạn vui lòng thử thay đổi hoặc xóa bộ lọc.
        </p>
        {onResetFilter && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetFilter}
            className="mt-6"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Xóa bộ lọc để xem tất cả
          </Button>
        )}
      </div>
    );
  }

  // Hiển thị danh sách phòng
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} />
      ))}
    </div>
  );
}
