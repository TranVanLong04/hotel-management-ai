import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  BedDouble,
  Users,
  Layers,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useRoomDetail } from '@/features/room/hooks/useRoomDetail';
import { BookingForm } from '../components/BookingForm';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import { Loading } from '@components/feedback/Loading';
import { formatCurrency } from '@utils/format';
import { PATHS } from '@routes/paths';
import { ROOM_STATUS_LABELS, ROOM_STATUS_COLORS } from '@/types';

/**
 * Trang Đặt phòng (Booking Page)
 * Layout 2 cột: Cột trái chứa Form đặt phòng & Cột phải chứa Thẻ thông tin phòng Sticky
 */
export function BookingPage() {
  const { id: roomId } = useParams<{ id: string }>();
  const [imageError, setImageError] = useState(false);

  // Bổ sung 1: Fetch thông tin phòng bằng useRoomDetail từ Phase 4
  const { data: room, loading, error, refetch } = useRoomDetail(roomId);

  // Trạng thái Đang tải
  if (loading) {
    return (
      <div className="py-24">
        <Loading fullScreen={false} size="lg" />
      </div>
    );
  }

  // Trạng thái Lỗi hoặc Không tìm thấy phòng
  if (error || !room) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center animate-fade-in">
        <div className="mb-4 inline-flex rounded-2xl bg-danger-50 p-4 text-danger-600 dark:bg-danger-950 dark:text-danger-400">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
          Không tìm thấy thông tin phòng
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {error ?? 'Phòng này không tồn tại hoặc đã ngừng phục vụ trên hệ thống.'}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to={PATHS.ROOMS}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Xem danh sách phòng khác
            </Button>
          </Link>
          {error && (
            <Button variant="primary" size="sm" onClick={refetch}>
              Thử lại
            </Button>
          )}
        </div>
      </div>
    );
  }

  const roomType = room.room_type;
  const isAvailable = room.status === 'available';
  const imageUrl = roomType?.image_url;
  const hasImage = Boolean(imageUrl) && !imageError;

  const statusColor = (ROOM_STATUS_COLORS[room.status] ?? 'default') as
    | 'default'
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info';

  const amenitiesList = roomType?.amenities
    ? roomType.amenities
        .split(/[,;\n]/)
        .map((a) => a.trim())
        .filter(Boolean)
    : [
        'Wi-Fi tốc độ cao',
        'Điều hòa thông minh',
        'Smart TV Ultra HD',
        'Minibar & Máy pha cà phê',
      ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      {/* Nút quay lại */}
      <div>
        <Link
          to={PATHS.ROOM_DETAIL.replace(':id', room.id)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-primary-600 transition-colors dark:text-gray-400 dark:hover:text-primary-400"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại chi tiết phòng</span>
        </Link>
      </div>

      {/* Header trang */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
          Hoàn tất đặt phòng
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Vui lòng kiểm tra lại thông tin lưu trú và điền các thông tin cần thiết bên dưới.
        </p>
      </div>

      {/* Layout 2 cột */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* CỘT TRÁI: Form đặt phòng (Chiếm 7 cột) */}
        <div className="lg:col-span-7">
          <Card className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-card dark:border-gray-800 dark:bg-gray-850">
            <h2 className="mb-6 text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <span>Thông tin đặt phòng</span>
            </h2>

            {/* Bổ sung 1: Nếu room không available → disable form + warning */}
            <BookingForm room={room} disabled={!isAvailable} />
          </Card>
        </div>

        {/* CỘT PHẢI: Sticky Room Summary Card (Chiếm 5 cột) */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-6">
            <Card className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-card dark:border-gray-800 dark:bg-gray-850">
              {/* Ảnh phòng */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                {hasImage ? (
                  <img
                    src={imageUrl ?? ''}
                    alt={roomType?.name ?? `Phòng ${room.room_number}`}
                    className="h-full w-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-400 dark:text-gray-600">
                    <BedDouble className="h-12 w-12" />
                    <span className="text-xs font-semibold">Grand Luxury Hotel</span>
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <Badge variant={statusColor}>
                    {ROOM_STATUS_LABELS[room.status]}
                  </Badge>
                </div>
              </div>

              {/* Chi tiết thông tin phòng */}
              <div className="p-6 space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Phòng {room.room_number} — {roomType?.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {roomType?.description ?? 'Không gian nghỉ dưỡng sang trọng, đầy đủ tiện nghi.'}
                  </p>
                </div>

                {/* Đặc điểm phòng */}
                <div className="grid grid-cols-2 gap-3 border-y border-gray-100 py-4 text-xs dark:border-gray-800">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>Tối đa {roomType?.max_guests ?? 2} khách</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Layers className="h-4 w-4 text-gray-400" />
                    <span>Tầng {room.floor ?? 1}</span>
                  </div>
                </div>

                {/* Tiện nghi tiêu biểu */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Tiện nghi phòng:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {amenitiesList.slice(0, 4).map((amenity, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      >
                        <CheckCircle2 className="h-3 w-3 text-success-500" />
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Giá cơ bản */}
                <div className="flex items-baseline justify-between rounded-2xl bg-gray-50 p-4 dark:bg-gray-800">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Đơn giá niêm yết
                  </span>
                  <div>
                    <span className="text-xl font-black text-primary-600 dark:text-primary-400">
                      {formatCurrency(roomType?.base_price ?? 0)}
                    </span>
                    <span className="text-xs text-gray-400"> / đêm</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Thông tin hỗ trợ */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-850 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary-600 dark:text-primary-400 shrink-0" />
              <span>
                Hệ thống xác minh khuôn mặt AI hỗ trợ nhận phòng không cần tiếp xúc tại quầy.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
