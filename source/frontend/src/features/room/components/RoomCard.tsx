import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BedDouble, Users, Layers, ArrowRight } from 'lucide-react';
import type { Room } from '@/types';
import { ROOM_STATUS_LABELS, ROOM_STATUS_COLORS } from '@/types';
import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import { formatCurrency } from '@utils/format';

/**
 * Ảnh mặc định chuẩn 5 sao khi phòng chưa có ảnh hoặc link ảnh bị lỗi
 */
export const DEFAULT_ROOM_IMAGE =
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80';

interface RoomCardProps {
  room: Room;
}

/**
 * Thẻ hiển thị tóm tắt thông tin phòng (Room Card)
 * - Tự động trích xuất ảnh linh hoạt từ Room hoặc RoomType (image_url, imageUrl, image, thumbnail, images[])
 * - Xử lý fallback đa tầng: Ảnh API -> Default Hotel Image -> Placeholder trang nhã
 * - Tối ưu UI/UX: aspect-video, object-cover, hover zoom nhẹ mượt mà
 * - Badge số phòng và trạng thái với contrast overlay
 * - Thông tin số khách, tầng, loại phòng và giá
 */
export function RoomCard({ room }: RoomCardProps) {
  const [imageError, setImageError] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);

  const roomType = room.room_type || room.room_types;

  // Lấy đường dẫn ảnh từ nhiều trường dữ liệu khả dĩ (ở cả Room và RoomType)
  const apiImageUrl =
    room.image_url ||
    room.imageUrl ||
    room.image ||
    room.thumbnail ||
    (Array.isArray(room.images) && room.images.length > 0 ? room.images[0] : null) ||
    roomType?.image_url ||
    roomType?.imageUrl ||
    roomType?.image ||
    roomType?.thumbnail ||
    (Array.isArray(roomType?.images) && roomType?.images.length > 0 ? roomType?.images[0] : null);

  // Xác định nguồn ảnh hiện tại (ưu tiên API, fallback sang ảnh mặc định)
  const currentImageSrc = imageError || !apiImageUrl ? DEFAULT_ROOM_IMAGE : apiImageUrl;

  // Xử lý khi ảnh bị lỗi (chuyển sang ảnh default hoặc fallback placeholder)
  const handleImageError = () => {
    if (!imageError && apiImageUrl) {
      setImageError(true);
    } else {
      setFallbackFailed(true);
    }
  };

  // Lấy màu sắc badge từ ROOM_STATUS_COLORS
  const statusColor = (ROOM_STATUS_COLORS[room.status] ?? 'default') as
    | 'default'
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info';

  return (
    <div className="card group flex flex-col justify-between overflow-hidden p-0 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover">
      {/* Khối ảnh phòng với Badge số phòng & trạng thái */}
      <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        {!fallbackFailed ? (
          <img
            src={currentImageSrc}
            alt={roomType?.name ?? `Phòng ${room.room_number}`}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          /* Placeholder dự phòng khi cả ảnh gốc và ảnh default không tải được */
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gray-100 p-4 text-center text-gray-400 dark:bg-gray-800 dark:text-gray-500">
            <BedDouble className="h-12 w-12 text-gray-400 dark:text-gray-500" />
            <span className="text-xs font-semibold tracking-wide text-gray-600 dark:text-gray-400">
              Grand Luxury Hotel
            </span>
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              Hình ảnh đang cập nhật
            </span>
          </div>
        )}

        {/* Lớp overlay gradient nhẹ để badge luôn dễ đọc trên nền ảnh */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/25" />

        {/* Badge số phòng (Góc trên trái) */}
        <div className="absolute top-3 left-3 rounded-xl bg-black/60 px-3 py-1 text-xs font-bold tracking-wide text-white backdrop-blur-md shadow-xs">
          Phòng {room.room_number}
        </div>

        {/* Badge trạng thái (Góc trên phải) */}
        <div className="absolute top-3 right-3">
          <Badge variant={statusColor} className="shadow-xs backdrop-blur-md">
            {ROOM_STATUS_LABELS[room.status] ?? room.status}
          </Badge>
        </div>
      </div>

      {/* Nội dung chi tiết phòng */}
      <div className="flex flex-1 flex-col justify-between p-6">
        <div className="space-y-3">
          {/* Tên loại phòng */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-accent-600 dark:text-accent-400">
              {roomType?.name ?? 'Phòng tiêu chuẩn'}
            </span>
            <h3 className="font-display text-lg font-bold text-gray-900 transition-colors group-hover:text-primary-700 dark:text-white dark:group-hover:text-primary-400">
              Phòng {room.room_number} — {roomType?.name ?? 'Phòng tiêu chuẩn'}
            </h3>
          </div>

          {/* Thông số phòng: Số khách, Tầng */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              <span>Tối đa {roomType?.max_guests ?? 2} khách</span>
            </div>
            {room.floor !== null && (
              <div className="flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                <span>Tầng {room.floor}</span>
              </div>
            )}
          </div>

          {/* Mô tả ngắn */}
          {room.description && (
            <p className="line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
              {room.description}
            </p>
          )}
        </div>

        {/* Footer: Giá & Nút xem chi tiết */}
        <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
          <div>
            <span className="block text-[11px] text-gray-400">Giá phòng / đêm</span>
            <span className="text-base font-extrabold text-primary-700 dark:text-accent-400">
              {roomType?.base_price ? formatCurrency(roomType.base_price) : 'Liên hệ'}
            </span>
          </div>

          <Link to={`/rooms/${room.id}`}>
            <Button variant="outline" size="sm" className="group/btn">
              <span>Chi tiết</span>
              <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
