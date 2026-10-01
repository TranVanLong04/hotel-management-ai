import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  Moon,
  DoorOpen,
  ScanFace,
  XCircle,
  Clock,
  Eye,
  FileText,
} from 'lucide-react';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import { formatDate, formatCurrency } from '@utils/format';
import { PATHS } from '@routes/paths';
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_COLORS,
  type Booking,
} from '@/types';

interface BookingCardProps {
  booking: Booking;
  onCancel: (booking: Booking) => void;
}

/**
 * Thẻ hiển thị thông tin từng đơn đặt phòng của khách hàng
 * Bao gồm mã booking, thông tin phòng, ngày ở, giá tiền và các nút hành động (Hủy, Đăng ký mặt, Xem phòng)
 */
export function BookingCard({ booking, onCancel }: BookingCardProps) {
  const roomNumber = booking.rooms?.room_number ?? booking.room?.room_number ?? '---';
  const roomTypeName =
    booking.rooms?.room_types?.name ??
    booking.room?.room_type?.name ??
    'Phòng nghỉ tiêu chuẩn';
  const roomId = booking.rooms?.id ?? booking.room?.id ?? booking.room_id;

  const statusVariant = (BOOKING_STATUS_COLORS[booking.status] ?? 'default') as
    | 'default'
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info';

  const isCancellable =
    booking.status === 'pending' || booking.status === 'confirmed';

  // Tính tiền hiển thị: ưu tiên room_subtotal, fallback = room_price * number_of_nights
  const totalPrice =
    booking.room_subtotal > 0
      ? booking.room_subtotal
      : (booking.room_price ?? 0) * (booking.number_of_nights || 1);

  return (
    <Card className="overflow-hidden border border-gray-200 bg-white p-5 transition-all duration-200 hover:shadow-card-hover dark:border-gray-800 dark:bg-gray-850">
      {/* Header: Mã đặt phòng + Badge Trạng thái */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Mã đơn:</span>
          <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">
            {booking.booking_code}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant}>
            {BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
          </Badge>
        </div>
      </div>

      {/* Body: Thông tin phòng & thời gian lưu trú */}
      <div className="my-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Thông tin phòng */}
        <div className="space-y-1">
          <span className="text-xs font-medium text-gray-400">Phòng & Loại phòng</span>
          <div className="flex items-center gap-2">
            <DoorOpen className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              P.{roomNumber} • <span className="text-gray-600 dark:text-gray-300">{roomTypeName}</span>
            </p>
          </div>
        </div>

        {/* Lịch trình */}
        <div className="space-y-1">
          <span className="text-xs font-medium text-gray-400">Thời gian lưu trú</span>
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>
              {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
            </span>
          </div>
        </div>

        {/* Chi tiết khách & số đêm */}
        <div className="space-y-1">
          <span className="text-xs font-medium text-gray-400">Khách & Số đêm</span>
          <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
            <span className="inline-flex items-center gap-1">
              <Users className="h-4 w-4 text-gray-400" />
              {booking.number_of_guests} khách
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Moon className="h-4 w-4 text-gray-400" />
              {booking.number_of_nights} đêm
            </span>
          </div>
        </div>

        {/* Tổng thanh toán */}
        <div className="space-y-1 sm:text-right">
          <span className="text-xs font-medium text-gray-400">Tổng tiền phòng</span>
          <p className="text-base font-bold text-primary-600 dark:text-primary-400">
            {formatCurrency(totalPrice)}
          </p>
        </div>
      </div>

      {/* Ghi chú nếu có */}
      {booking.note && (
        <div className="mb-4 rounded-lg bg-gray-50 p-2.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300 flex items-start gap-2">
          <FileText className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
          <span>{booking.note}</span>
        </div>
      )}

      {/* Footer: Các nút hành động */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3 dark:border-gray-800">
        <div className="flex items-center gap-2">
          {/* Nút xem chi tiết phòng */}
          {roomId && (
            <Link to={PATHS.ROOM_DETAIL.replace(':id', roomId)}>
              <Button variant="outline" size="sm" type="button">
                <Eye className="mr-1.5 h-3.5 w-3.5" />
                Xem phòng
              </Button>
            </Link>
          )}

          {/* Nút Đăng ký khuôn mặt (Bổ sung 3: Luôn hiển thị nút, link sang /face-register) */}
          <Link to={PATHS.FACE_REGISTER}>
            <Button
              variant="outline"
              size="sm"
              type="button"
              className="border-primary-200 text-primary-700 hover:bg-primary-50 dark:border-primary-800 dark:text-primary-300 dark:hover:bg-primary-950"
            >
              <ScanFace className="mr-1.5 h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
              Đăng ký khuôn mặt
            </Button>
          </Link>
        </div>

        {/* Nút Hủy đặt phòng */}
        {isCancellable && (
          <Button
            variant="danger"
            size="sm"
            type="button"
            onClick={() => onCancel(booking)}
          >
            <XCircle className="mr-1.5 h-3.5 w-3.5" />
            Hủy đặt phòng
          </Button>
        )}
      </div>
    </Card>
  );
}
