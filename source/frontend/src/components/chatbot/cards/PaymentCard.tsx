import React from 'react';
import { ExternalLink, CreditCard, Clock, ShieldCheck } from 'lucide-react';

export interface PaymentCardPayload {
  booking_code?: string;
  total_amount?: number;
  pay_url?: string;
  payUrl?: string;
  payment_url?: string;
  booking?: {
    id?: string;
    booking_code?: string;
    status?: string;
    check_in_date?: string;
    check_out_date?: string;
    room_subtotal?: number;
    room_price?: number;
    number_of_nights?: number;
    number_of_guests?: number;
    room_id?: string;
  };
  payment?: {
    gateway?: string;
    payUrl?: string;
    orderId?: string;
    amount?: number;
  };
}

interface PaymentCardProps {
  payload?: PaymentCardPayload;
  data?: PaymentCardPayload;
  onPayNow?: (bookingCode: string) => void;
}

export const PaymentCard: React.FC<PaymentCardProps> = ({ payload, data, onPayNow }) => {
  const currentPayload = data || payload || {};
  const booking = currentPayload.booking;
  const bookingCode = currentPayload.booking_code || booking?.booking_code || 'Chưa cập nhật';
  const payUrl =
    currentPayload.pay_url ||
    currentPayload.payUrl ||
    currentPayload.payment_url ||
    currentPayload.payment?.payUrl;

  const totalAmount =
    currentPayload.total_amount ||
    booking?.room_subtotal ||
    (booking?.room_price || 0) * (booking?.number_of_nights || 1) ||
    currentPayload.payment?.amount ||
    0;

  const formattedTotal = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(totalAmount);

  const handleOpenPayPal = () => {
    if (payUrl) {
      window.open(payUrl, '_blank', 'noopener,noreferrer');
    } else if (bookingCode && onPayNow) {
      onPayNow(bookingCode);
    }
  };

  return (
    <div className="w-full bg-gradient-to-b from-white to-blue-50/40 dark:from-gray-800 dark:to-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/50 p-3.5 shadow-sm my-2 text-left">
      {/* Header with PayPal Badge */}
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-blue-100 dark:border-blue-900/40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#003087] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            P
          </div>
          <div>
            <h4 className="font-bold text-xs text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
              Thanh toán đặt phòng
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-white bg-[#003087] px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                PayPal
              </span>
            </h4>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Mã đơn: <strong className="font-mono text-gray-800 dark:text-gray-200">{bookingCode}</strong>
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/40">
          <Clock className="w-2.5 h-2.5" /> Chờ thanh toán
        </span>
      </div>

      {/* Booking Details */}
      <div className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300 mb-3">
        {booking?.check_in_date && booking?.check_out_date && (
          <div className="flex justify-between items-center">
            <span className="text-gray-500 dark:text-gray-400">Thời gian lưu trú:</span>
            <span className="font-medium text-gray-800 dark:text-gray-200">
              {booking.check_in_date} → {booking.check_out_date}
              {booking.number_of_nights ? ` (${booking.number_of_nights} đêm)` : ''}
            </span>
          </div>
        )}

        {booking?.number_of_guests && (
          <div className="flex justify-between items-center">
            <span className="text-gray-500 dark:text-gray-400">Số lượng khách:</span>
            <span className="font-medium text-gray-800 dark:text-gray-200">{booking.number_of_guests} người</span>
          </div>
        )}

        <div className="pt-2 border-t border-dashed border-blue-200 dark:border-blue-900/40 flex justify-between items-center">
          <span className="font-bold text-gray-900 dark:text-gray-100">Số tiền cần thanh toán:</span>
          <span className="font-extrabold text-sm text-[#003087] dark:text-blue-400">
            {formattedTotal}
          </span>
        </div>
      </div>

      {/* CTA Button */}
      <button
        type="button"
        onClick={handleOpenPayPal}
        className="w-full py-2.5 px-3 bg-[#0070ba] hover:bg-[#003087] text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
      >
        <CreditCard className="w-4 h-4" />
        Thanh toán qua PayPal
        <ExternalLink className="w-3.5 h-3.5 opacity-80" />
      </button>

      <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
        <ShieldCheck className="w-3 h-3 text-emerald-500" />
        <span>Giao dịch an toàn & bảo mật qua cổng PayPal Sandbox</span>
      </div>
    </div>
  );
};
