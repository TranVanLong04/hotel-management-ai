import { Filter, RotateCcw } from 'lucide-react';
import type { RoomFilterParams, RoomStatus } from '@/types';
import { ROOM_STATUS_LABELS } from '@/types';
import { useRoomTypes } from '../hooks/useRoomTypes';
import { Button } from '@components/ui/Button';

interface RoomFilterProps {
  filters: RoomFilterParams;
  onChange: (key: keyof RoomFilterParams, value: string | number | undefined) => void;
  onReset: () => void;
}

/**
 * Thanh công cụ bộ lọc danh sách phòng
 * Hỗ trợ lọc theo loại phòng, tầng và trạng thái phòng
 */
export function RoomFilter({ filters, onChange, onReset }: RoomFilterProps) {
  const { data: roomTypes, loading: loadingRoomTypes } = useRoomTypes();

  // Danh sách các tầng mẫu (1 đến 10)
  const floors = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // Danh sách các trạng thái phòng
  const roomStatuses: RoomStatus[] = [
    'available',
    'reserved',
    'occupied',
    'cleaning',
    'maintenance',
  ];

  const hasActiveFilters = Boolean(
    filters.room_type_id || filters.floor || filters.status || filters.search
  );

  return (
    <div className="card border border-gray-200/80 bg-white/90 p-5 shadow-card backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/90">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
            <Filter className="h-4 w-4" />
          </div>
          <span>Bộ lọc tìm kiếm phòng</span>
        </div>

        {/* Các Dropdown lọc */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:flex lg:items-center">
          {/* 1. Lọc theo Loại phòng */}
          <div className="min-w-44">
            <select
              value={filters.room_type_id ?? ''}
              onChange={(e) =>
                onChange('room_type_id', e.target.value ? e.target.value : undefined)
              }
              className="input py-2 text-xs font-medium"
              disabled={loadingRoomTypes}
              aria-label="Chọn loại phòng"
            >
              <option value="">Tất cả loại phòng</option>
              {roomTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Lọc theo Tầng */}
          <div className="min-w-32">
            <select
              value={filters.floor ?? ''}
              onChange={(e) =>
                onChange(
                  'floor',
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              className="input py-2 text-xs font-medium"
              aria-label="Chọn tầng"
            >
              <option value="">Tất cả các tầng</option>
              {floors.map((floor) => (
                <option key={floor} value={floor}>
                  Tầng {floor}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Lọc theo Trạng thái */}
          <div className="min-w-36">
            <select
              value={filters.status ?? ''}
              onChange={(e) =>
                onChange(
                  'status',
                  e.target.value ? (e.target.value as RoomStatus) : undefined
                )
              }
              className="input py-2 text-xs font-medium"
              aria-label="Chọn trạng thái phòng"
            >
              <option value="">Tất cả trạng thái</option>
              {roomStatuses.map((status) => (
                <option key={status} value={status}>
                  {ROOM_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>

          {/* Nút Xóa bộ lọc */}
          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onReset}
              className="h-[38px] text-xs font-semibold text-danger-600 hover:border-danger-400 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-950/30"
              title="Đặt lại toàn bộ bộ lọc về mặc định"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              <span>Xóa bộ lọc</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
