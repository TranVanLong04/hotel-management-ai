import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Users,
  Moon,
  DoorOpen,
  CreditCard,
  ScanFace,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import { Loading } from '@components/feedback/Loading';
import { bookingApi } from '@/api/booking.api';
import { formatDate, formatCurrency } from '@utils/format';
import { PATHS } from '@routes/paths';
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_COLORS,
  type Booking,
} from '@/types';

/**
 * Trang Chi tiết Đơn đặt phòng & Timeline tiến trình (/my-bookings/:id)
 */
export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchBooking = async () => {
      if (!id) {
        if (isMounted) {
          setLoading(false);
          setError('Mã đơn đặt phòng không hợp lệ');
        }
        return;
      }

      setLoading(true);
      try {
        const response = await bookingApi.getById(id);
        if (isMounted) {
          setBooking(response.data);
          setError(null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Không thể tải thông tin đơn đặt phòng';
          setError(msg);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBooking();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="py-24">
        <Loading fullScreen={false} size="lg" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center animate-fade-in">
        <div className="mb-4 inline-flex rounded-2xl bg-danger-50 p-4 text-danger-600 dark:bg-danger-950 dark:text-danger-400">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
          Không tìm thấy đơn đặt phòng
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {error ?? 'Đơn đặt phòng này không tồn tại hoặc bạn không có quyền truy cập.'}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to={PATHS.MY_BOOKINGS}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Xem đơn đặt phòng của tôi
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const roomNumber = booking.rooms?.room_number ?? booking.room?.room_number ?? '---';
  const roomTypeName =
    booking.rooms?.room_types?.name ??
    booking.room?.room_type?.name ??
    'Phòng nghỉ tiêu chuẩn';

  const statusVariant = (BOOKING_STATUS_COLORS[booking.status] ?? 'default') as
    | 'default'
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info';

  const totalPrice =
    booking.room_subtotal > 0
      ? booking.room_subtotal
      : (booking.room_price ?? 0) * (booking.number_of_nights || 1);

  // Trạng thái từng bước timeline
  const isPaid = booking.status !== 'pending_payment';
  const isPendingConfirm = booking.status === 'pending';
  const isConfirmed =
    booking.status === 'confirmed' ||
    booking.status === 'checked_in' ||
    booking.status === 'checked_out';

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      {/* Nút quay lại */}
      <div>
        <Link
          to={PATHS.MY_BOOKINGS}
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-primary-600 transition-colors dark:text-gray-400 dark:hover:text-primary-400"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Về danh sách đặt phòng của tôi</span>
        </Link>
      </div>

      {/* Header đơn */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-gray-400">Chi tiết đơn đặt phòng</span>
          <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl font-mono">
            {booking.booking_code}
          </h1>
        </div>
        <div>
          <Badge variant={statusVariant} size="lg">
            {BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
          </Badge>
        </div>
      </div>

      {/* Timeline Tiến trình Đặt phòng */}
      <Card className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-card dark:border-gray-800 dark:bg-gray-850">
        <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
          <Sparkles className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          Tiến trình xử lý đơn đặt phòng
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 relative">
          {/* Bước 1: Đã thanh toán */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                isPaid
                  ? 'bg-success-100 text-success-600 dark:bg-success-950/60 dark:text-success-400'
                  : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
              }`}
            >
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 dark:text-white">1. Thanh toán</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                {isPaid ? 'Đã thanh toán ✓' : 'Chờ thanh toán'}
              </p>
            </div>
          </div>

          {/* Bước 2: Đã đăng ký khuôn mặt */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                isPaid
                  ? 'bg-success-100 text-success-600 dark:bg-success-950/60 dark:text-success-400'
                  : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
              }`}
            >
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 dark:text-white">2. Khuôn mặt AI</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                {isPaid ? 'Đã đăng ký ✓' : 'Chờ đăng ký'}
              </p>
            </div>
          </div>

          {/* Bước 3: Đang chờ xác nhận */}
          <div
            className={`flex items-start gap-3 p-3 rounded-2xl ${
              isPendingConfirm
                ? 'bg-warning-50 border border-warning-200 dark:bg-warning-950/30 dark:border-warning-900/40'
                : isConfirmed
                ? 'bg-gray-50 dark:bg-gray-800'
                : 'bg-gray-50 opacity-60 dark:bg-gray-800'
            }`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                isConfirmed
                  ? 'bg-success-100 text-success-600 dark:bg-success-950/60 dark:text-success-400'
                  : isPendingConfirm
                  ? 'bg-warning-100 text-warning-700 dark:bg-warning-950/60 dark:text-warning-300 animate-pulse'
                  : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
              }`}
            >
              {isConfirmed ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 dark:text-white">3. Xác nhận đơn</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                {isConfirmed
                  ? 'Đã xác nhận ✓'
                  : isPendingConfirm
                  ? 'Đang chờ xác nhận (dự kiến 15p)'
                  : 'Chờ xử lý'}
              </p>
            </div>
          </div>

          {/* Bước 4: Sẵn sàng check-in */}
          <div
            className={`flex items-start gap-3 p-3 rounded-2xl ${
              isConfirmed
                ? 'bg-success-50 border border-success-200 dark:bg-success-950/30 dark:border-success-900/40'
                : 'bg-gray-50 opacity-60 dark:bg-gray-800'
            }`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                isConfirmed
                  ? 'bg-success-500 text-white dark:bg-success-600'
                  : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
              }`}
            >
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 dark:text-white">4. Check-in</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                {isConfirmed ? 'Sẵn sàng check-in' : 'Chưa kích hoạt'}
              </p>
            </div>
          </div>
        </div>

        {/* Thông báo phụ trợ */}
        {isPendingConfirm && (
          <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40">
            <p className="font-semibold flex items-center gap-1.5 mb-1">
              <Clock className="h-4 w-4" />
              Đơn hàng đang chờ khách sạn duyệt:
            </p>
            <span>
              Đơn đã thanh toán thành công. Khách sạn sẽ kiểm tra và xác nhận trong vòng 15 phút. Bạn sẽ nhận được email thông báo ngay khi đơn được duyệt.
            </span>
          </div>
        )}

        {isConfirmed && (
          <div className="mt-6 rounded-2xl bg-emerald-50 p-4 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40">
            <p className="font-semibold flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="h-4 w-4" />
              Đơn đặt phòng đã được xác nhận:
            </p>
            <span>
              Phòng đã được chuẩn bị sẵn sàng. Vui lòng có mặt đúng giờ nhận phòng ({formatDate(booking.check_in_date)} lúc 14:00) và làm thủ tục check-in tự động bằng khuôn mặt tại sảnh khách sạn.
            </span>
          </div>
        )}
      </Card>

      {/* Thông tin chi tiết phòng & Đơn */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Card className="rounded-3xl border border-gray-200 bg-white p-6 shadow-card dark:border-gray-800 dark:bg-gray-850 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Thông tin phòng nghỉ</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Số phòng:</span>
              <span className="font-bold text-gray-900 dark:text-white">P.{roomNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Loại phòng:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{roomTypeName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Thời gian lưu trú:</span>
              <span className="text-gray-900 dark:text-white">
                {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Số lượng khách:</span>
              <span className="text-gray-900 dark:text-white">{booking.number_of_guests} khách</span>
            </div>
          </div>
        </Card>

        <Card className="rounded-3xl border border-gray-200 bg-white p-6 shadow-card dark:border-gray-800 dark:bg-gray-850 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Chi phí & Thanh toán</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Số đêm ở:</span>
              <span className="text-gray-900 dark:text-white">{booking.number_of_nights} đêm</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Tổng thanh toán:</span>
              <span className="font-bold text-primary-600 dark:text-primary-400 text-base">
                {formatCurrency(totalPrice)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Trạng thái thanh toán:</span>
              <span className="font-semibold text-success-600 dark:text-success-400">
                {isPaid ? 'Đã thanh toán trực tuyến' : 'Chưa thanh toán'}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Thao tác chuyển tiếp */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-4">
        {booking.status === 'pending_payment' && (
          <Link to={PATHS.PAYMENT.replace(':bookingId', booking.id)}>
            <Button variant="primary" size="md" className="font-bold">
              <CreditCard className="mr-2 h-4 w-4" />
              Thanh toán ngay
            </Button>
          </Link>
        )}

        <Link to={`${PATHS.FACE_REGISTER}?bookingId=${booking.id}`}>
          <Button variant="outline" size="md">
            <ScanFace className="mr-2 h-4 w-4 text-primary-600 dark:text-primary-400" />
            Đăng ký khuôn mặt
          </Button>
        </Link>
      </div>
    </div>
  );
}
