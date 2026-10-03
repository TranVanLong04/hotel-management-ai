import { Calendar, Moon, Users, DoorOpen, CreditCard } from 'lucide-react';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { formatDate, formatCurrency } from '@utils/format';
import type { Booking } from '@/types';

interface PaymentSummaryProps {
  booking: Booking;
}

/**
 * Tóm tắt đơn đặt phòng & thông tin số tiền cần thanh toán
 */
export function PaymentSummary({ booking }: PaymentSummaryProps) {
  const roomNumber = booking.rooms?.room_number ?? booking.room?.room_number ?? '---';
  const roomTypeName =
    booking.rooms?.room_types?.name ??
    booking.room?.room_type?.name ??
    'Phòng nghỉ tiêu chuẩn';

  const totalPrice =
    booking.room_subtotal > 0
      ? booking.room_subtotal
      : (booking.room_price || 0) * (booking.number_of_nights || 1);

  return (
    <Card className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-card dark:border-gray-800 dark:bg-gray-850">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
        <div>
          <span className="text-xs text-gray-400">Mã đơn đặt phòng</span>
          <p className="font-mono text-base font-bold text-gray-900 dark:text-white">
            {booking.booking_code}
          </p>
        </div>
        <Badge variant="warning">Chờ thanh toán</Badge>
      </div>

      <div className="my-5 space-y-3.5 text-sm text-gray-600 dark:text-gray-300">
        {/* Phòng */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <DoorOpen className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            Phòng lưu trú
          </span>
          <span className="font-semibold text-gray-900 dark:text-white">
            P.{roomNumber} ({roomTypeName})
          </span>
        </div>

        {/* Lịch trình */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Calendar className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            Thời gian
          </span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {formatDate(booking.check_in_date)} — {formatDate(booking.check_out_date)}
          </span>
        </div>

        {/* Số đêm */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Moon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            Số đêm lưu trú
          </span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {booking.number_of_nights} đêm
          </span>
        </div>

        {/* Số khách */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Users className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            Số lượng khách
          </span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {booking.number_of_guests} người
          </span>
        </div>
      </div>

      {/* Tổng tiền */}
      <div className="rounded-2xl border border-primary-100 bg-primary-50/50 p-4 dark:border-primary-900/40 dark:bg-primary-950/20">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
              Tổng số tiền cần thanh toán
            </span>
            <p className="mt-1 text-2xl font-black text-primary-600 dark:text-primary-400">
              {formatCurrency(totalPrice)}
            </p>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500">
          * Đã bao gồm thuế GTGT và phí dịch vụ khách sạn.
        </p>
      </div>
    </Card>
  );
}
