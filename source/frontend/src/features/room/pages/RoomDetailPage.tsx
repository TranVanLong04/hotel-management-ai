import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  BedDouble,
  Users,
  Layers,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  CalendarCheck,
  AlertCircle,
  Clock,
  Scan,
} from 'lucide-react';
import { useRoomDetail } from '../hooks/useRoomDetail';
import { ROOM_STATUS_LABELS, ROOM_STATUS_COLORS } from '@/types';
import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import { Loading } from '@components/feedback/Loading';
import { formatCurrency } from '@utils/format';
import { PATHS } from '@routes/paths';

/**
 * Trang chi tiết phòng nghỉ
 * Hiển thị đầy đủ hình ảnh, mô tả, danh sách tiện nghi và nút Đặt phòng ngay
 */
export function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const { data: room, loading, error, refetch } = useRoomDetail(id);

  // Trạng thái Loading
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
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="mb-4 inline-flex rounded-2xl bg-danger-50 p-4 text-danger-600 dark:bg-danger-950 dark:text-danger-400">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
          Không tìm thấy thông tin phòng
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {error ?? 'Phòng này có thể đã bị xóa hoặc không tồn tại trên hệ thống.'}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to={PATHS.ROOMS}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Về danh sách phòng
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

  // Lấy màu sắc badge từ ROOM_STATUS_COLORS
  const statusColor = (ROOM_STATUS_COLORS[room.status] ?? 'default') as
    | 'default'
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info';

  // Tách danh sách tiện ích từ chuỗi (dấu phẩy hoặc xuống dòng)
  const amenitiesList = roomType?.amenities
    ? roomType.amenities
        .split(/[,;\n]/)
        .map((a) => a.trim())
        .filter(Boolean)
    : [
        'Wi-Fi tốc độ cao miễn phí',
        'Điều hòa 2 chiều thông minh',
        'Smart TV 55 inch Ultra HD',
        'Minibar & Máy pha cà phê cao cấp',
        'Két sắt an toàn',
        'Phòng tắm kính với áo choàng lụa',
      ];

  // Xử lý chuyển hướng đến trang Booking
  const handleBooking = () => {
    if (isAvailable) {
      navigate(PATHS.BOOKING.replace(':id', room.id));
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      {/* Nút quay lại danh sách phòng */}
      <div>
        <Link
          to={PATHS.ROOMS}
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-primary-600 transition-colors dark:text-gray-400 dark:hover:text-primary-400"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại danh sách phòng</span>
        </Link>
      </div>

      {/* Grid 2 cột chi tiết phòng */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* CỘT TRÁI: Ảnh lớn + Mô tả + Tiện ích (Chiếm 2/3) */}
        <div className="space-y-8 lg:col-span-2">
          {/* Khối Ảnh lớn */}
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 shadow-card dark:from-gray-800 dark:to-gray-900">
            {hasImage ? (
              <img
                src={imageUrl ?? ''}
                alt={roomType?.name ?? `Phòng ${room.room_number}`}
                className="h-full w-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-gray-400 dark:text-gray-600">
                <BedDouble className="h-20 w-20" />
                <span className="text-sm font-semibold">Grand Luxury Hotel</span>
              </div>
            )}

            {/* Badge số phòng */}
            <div className="absolute top-4 left-4 rounded-2xl bg-black/60 px-4 py-1.5 text-sm font-bold text-white backdrop-blur-md shadow-md">
              Phòng {room.room_number}
            </div>

            {/* Badge trạng thái */}
            <div className="absolute top-4 right-4">
              <Badge variant={statusColor} className="px-3 py-1 text-xs shadow-md backdrop-blur-md">
                {ROOM_STATUS_LABELS[room.status] ?? room.status}
              </Badge>
            </div>
          </div>

          {/* Tiêu đề & Thông số tổng quan */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-700 dark:bg-accent-950 dark:text-accent-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{roomType?.name ?? 'Hạng phòng cao cấp'}</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
              Phòng {room.room_number} — {roomType?.name}
            </h1>

            {/* Thông số nhanh: Tầng, Số khách, Tiêu chuẩn 5 sao */}
            <div className="flex flex-wrap items-center gap-6 rounded-2xl bg-gray-50/80 p-4 border border-gray-200/60 text-sm text-gray-700 dark:bg-gray-900/60 dark:border-gray-800 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                <span>
                  Sức chứa: <strong>Tối đa {roomType?.max_guests ?? 2} người lớn</strong>
                </span>
              </div>
              {room.floor !== null && (
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  <span>
                    Vị trí: <strong>Tầng {room.floor}</strong>
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span>Tiêu chuẩn 5 sao</span>
              </div>
            </div>
          </div>

          {/* Mô tả chi tiết */}
          <div className="space-y-3">
            <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">
              Mô Tả Phòng
            </h2>
            <div className="prose prose-sm dark:prose-invert text-gray-600 dark:text-gray-400 leading-relaxed">
              <p>
                {room.description ||
                  roomType?.description ||
                  'Không gian nghỉ dưỡng lý tưởng với thiết kế mở tràn ngập ánh sáng tự nhiên, nội thất cao cấp và phong cách sang trọng đem lại sự thư thái tuyệt đối cho quý khách.'}
              </p>
            </div>
          </div>

          {/* Danh sách Tiện nghi & Dịch vụ đi kèm */}
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">
              Tiện Nghi & Dịch Vụ Đi Kèm
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {amenitiesList.map((amenity, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white p-3 text-xs font-medium text-gray-700 shadow-2xs dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-accent-600 dark:text-accent-400" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Đặc quyền công nghệ AI */}
          <div className="rounded-2xl border border-primary-200/80 bg-primary-50/50 p-5 dark:border-primary-900/60 dark:bg-primary-950/30">
            <div className="flex items-start gap-3.5">
              <div className="rounded-xl bg-primary-600 p-2.5 text-white shadow-xs">
                <Scan className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-primary-900 dark:text-primary-200">
                  Tích hợp AI Face ID Check-in
                </h3>
                <p className="text-xs text-primary-800/80 dark:text-primary-300/80">
                  Quý khách đã đăng ký khuôn mặt có thể nhận phòng không chạm trực tiếp tại quầy lễ tân
                  chỉ trong 3 giây mà không cần xuất trình giấy tờ rườm rà.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: Khối đặt phòng Sticky (Chiếm 1/3) */}
        <div>
          <div className="sticky top-24 card space-y-6 border border-gray-200/80 bg-white/95 p-6 shadow-card backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/95">
            {/* Header giá */}
            <div className="border-b border-gray-100 pb-5 dark:border-gray-800">
              <span className="block text-xs font-medium text-gray-400">Giá phòng niêm yết</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-display text-3xl font-extrabold text-primary-700 dark:text-accent-400">
                  {roomType?.base_price ? formatCurrency(roomType.base_price) : 'Liên hệ'}
                </span>
                <span className="text-xs text-gray-400"> / đêm</span>
              </div>
            </div>

            {/* Thông tin tóm tắt đặt phòng */}
            <div className="space-y-3 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center justify-between">
                <span>Trạng thái phòng:</span>
                <Badge variant={statusColor}>
                  {ROOM_STATUS_LABELS[room.status] ?? room.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Số khách tối đa:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {roomType?.max_guests ?? 2} người lớn
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Giờ nhận phòng:</span>
                <span className="font-semibold text-gray-900 dark:text-white">Từ 14:00</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Giờ trả phòng:</span>
                <span className="font-semibold text-gray-900 dark:text-white">Trước 12:00</span>
              </div>
            </div>

            {/* Cảnh báo nếu phòng không khả dụng */}
            {!isAvailable && (
              <div className="flex items-center gap-2 rounded-xl bg-warning-50 p-3 text-xs text-warning-800 dark:bg-warning-950/60 dark:text-warning-300">
                <Clock className="h-4 w-4 shrink-0" />
                <span>
                  Phòng hiện tại đang ở trạng thái <strong>{ROOM_STATUS_LABELS[room.status]}</strong> và không thể đặt trực tuyến lúc này.
                </span>
              </div>
            )}

            {/* Nút hành động Đặt phòng ngay */}
            <div className="space-y-2">
              <Button
                variant={isAvailable ? 'primary' : 'secondary'}
                size="lg"
                disabled={!isAvailable}
                onClick={handleBooking}
                className="w-full font-bold shadow-md cursor-pointer disabled:cursor-not-allowed"
              >
                <CalendarCheck className="mr-2 h-5 w-5" />
                <span>{isAvailable ? 'Đặt phòng ngay' : 'Phòng không khả dụng'}</span>
              </Button>
              <p className="text-center text-[11px] text-gray-400">
                Xác nhận tức thì • Hỗ trợ thanh toán linh hoạt
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
