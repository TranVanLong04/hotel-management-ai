import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BedDouble, Sparkles } from 'lucide-react';
import type { RoomFilterParams, RoomStatus } from '@/types';
import { useRooms } from '../hooks/useRooms';
import { RoomFilter } from '../components/RoomFilter';
import { RoomList } from '../components/RoomList';
import { Pagination } from '@components/ui/Pagination';

/**
 * Trang danh sách phòng nghỉ dành cho khách hàng
 * Đồng bộ hai chiều bộ lọc và số trang với URL query parameters
 */
export function RoomListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Đọc các giá trị filter từ URL
  const filters: RoomFilterParams = useMemo(() => {
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const room_type_id = searchParams.get('room_type_id') || undefined;
    const floorStr = searchParams.get('floor');
    const floor = floorStr ? parseInt(floorStr, 10) : undefined;
    const status = (searchParams.get('status') as RoomStatus) || undefined;
    const search = searchParams.get('search') || undefined;

    return {
      page: isNaN(page) || page < 1 ? 1 : page,
      limit: isNaN(limit) ? 12 : limit,
      room_type_id,
      floor: isNaN(Number(floor)) ? undefined : floor,
      status,
      search,
    };
  }, [searchParams]);

  // Fetch danh sách phòng
  const { data: rooms, pagination, loading, error, refetch } = useRooms(filters);

  // Xử lý khi thay đổi bộ lọc -> reset về trang 1
  const handleFilterChange = (
    key: keyof RoomFilterParams,
    value: string | number | undefined
  ) => {
    const newParams = new URLSearchParams(searchParams);

    if (value !== undefined && value !== '') {
      newParams.set(key, String(value));
    } else {
      newParams.delete(key);
    }

    // Reset về trang 1 mỗi khi thay đổi tiêu chí lọc
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Đặt lại toàn bộ bộ lọc
  const handleResetFilters = () => {
    setSearchParams({ page: '1' });
  };

  // Chuyển trang và cuộn nhẹ lên đầu danh sách
  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(newPage));
    setSearchParams(newParams);
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header trang danh sách phòng */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-gray-200/80 pb-6 dark:border-gray-800">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-accent-600 dark:text-accent-400">
            <Sparkles className="h-4 w-4" />
            <span>Khám phá không gian nghỉ dưỡng</span>
          </div>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
            Danh Sách Phòng Nghỉ
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Trải nghiệm các hạng phòng tiêu chuẩn 5 sao cùng công nghệ Face ID không chạm
          </p>
        </div>

        {/* Tổng số phòng tìm thấy */}
        {pagination && (
          <div className="flex items-center gap-2 rounded-xl bg-primary-50/80 px-4 py-2 text-xs font-semibold text-primary-800 dark:bg-primary-950/60 dark:text-primary-300">
            <BedDouble className="h-4 w-4" />
            <span>
              Tìm thấy <strong>{pagination.total}</strong> phòng
            </span>
          </div>
        )}
      </div>

      {/* Thanh công cụ lọc */}
      <RoomFilter
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Grid danh sách phòng */}
      <RoomList
        rooms={rooms}
        loading={loading}
        error={error}
        onResetFilter={handleResetFilters}
        onRetry={refetch}
      />

      {/* Phân trang */}
      {pagination && pagination.totalPages > 1 && (
        <div className="pt-6">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
