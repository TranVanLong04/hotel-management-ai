import React, { useEffect } from 'react';
import {
  Receipt,
  User,
  Phone,
  DoorOpen,
  Calendar,
  Coffee,
  Tag,
  Percent,
} from 'lucide-react';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { formatCurrency, formatDate } from '@utils/format';
import type {
  Booking,
  Customer,
  Room,
  ServiceUsageItem,
  CalculatedFinancials,
} from '@/types';

interface InvoicePreviewProps {
  booking: Booking & {
    customer?: Customer;
    room?: Room & {
      room_types?: {
        name: string;
        base_price: number;
      };
    };
  };
  services: ServiceUsageItem[];
  discountAmount?: number;
  taxRate?: number;
  onCalculated?: (financials: CalculatedFinancials) => void;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  booking,
  services = [],
  discountAmount = 0,
  taxRate = 0.08,
  onCalculated,
}) => {
  // Tính toán số liệu tài chính
  const roomAmount = Number(booking.room_subtotal || booking.room_price || 0);
  const serviceAmount = services.reduce(
    (sum, s) => sum + Number(s.total_amount || 0),
    0
  );
  const subtotal = roomAmount + serviceAmount;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round(taxableAmount * taxRate * 100) / 100;
  const totalAmount = taxableAmount + taxAmount;

  // Gọi callback đồng bộ kết quả tính toán lên component cha
  useEffect(() => {
    if (onCalculated) {
      onCalculated({
        room_amount: roomAmount,
        service_amount: serviceAmount,
        subtotal,
        discount_amount: discountAmount,
        taxable_amount: taxableAmount,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total_amount: totalAmount,
      });
    }
  }, [roomAmount, serviceAmount, subtotal, discountAmount, taxableAmount, taxRate, taxAmount, totalAmount, onCalculated]);

  const customerName =
    booking.customers?.full_name || booking.customer?.full_name || 'Khách vãng lai';
  const customerPhone =
    booking.customers?.phone || booking.customer?.phone || 'Chưa có SĐT';
  const customerIdentity =
    booking.customers?.identity_number || booking.customer?.identity_number;
  const roomNumber =
    booking.rooms?.room_number || booking.room?.room_number || '---';
  const roomTypeName =
    booking.rooms?.room_types?.name ||
    booking.room?.room_types?.name ||
    booking.room?.room_type?.name ||
    'Tiêu chuẩn';

  return (
    <Card className="border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-850 p-6 space-y-6 transition-colors">
      {/* Header Hóa đơn */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white">
              Chi tiết hóa đơn tạm tính
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Mã đặt phòng:{' '}
              <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                {booking.booking_code}
              </span>
            </p>
          </div>
        </div>
        <Badge variant="warning" className="text-xs">
          Đang tính tiền
        </Badge>
      </div>

      {/* Thông tin Khách hàng & Phòng */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50 text-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <User className="h-4 w-4 text-indigo-500" />
            <span className="font-medium text-gray-900 dark:text-white">
              {customerName}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Phone className="h-4 w-4 text-gray-400" />
            <span>{customerPhone}</span>
          </div>
          {customerIdentity && (
            <div className="text-gray-500 dark:text-gray-400">
              CCCD/CMND: {customerIdentity}
            </div>
          )}
        </div>

        <div className="space-y-2 sm:border-l sm:border-gray-200 sm:pl-4 sm:dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <DoorOpen className="h-4 w-4 text-indigo-500" />
            <span>
              Phòng{' '}
              <strong className="text-gray-900 dark:text-white">
                {roomNumber}
              </strong>{' '}
              ({roomTypeName})
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>
              {formatDate(booking.check_in_date)} ➔ {formatDate(booking.check_out_date)}
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown: Tiền phòng */}
      <div className="space-y-3">
        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          <DoorOpen className="h-4 w-4 text-indigo-500" />
          Tiền phòng lưu trú ({booking.number_of_nights || 1} đêm)
        </h4>
        <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/30">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Phòng {roomNumber} — {roomTypeName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Đơn giá snapshot theo kỳ lưu trú
            </p>
          </div>
          <span className="font-bold text-gray-900 dark:text-white">
            {formatCurrency(roomAmount)}
          </span>
        </div>
      </div>

      {/* Breakdown: Dịch vụ bổ sung */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            <Coffee className="h-4 w-4 text-amber-500" />
            Dịch vụ đã sử dụng ({services.length})
          </h4>
          <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
            Tổng dịch vụ: {formatCurrency(serviceAmount)}
          </span>
        </div>

        {services.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-200 py-3 text-center text-xs text-gray-400 dark:border-gray-800">
            Khách không sử dụng thêm dịch vụ nào trong thời gian lưu trú
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 dark:bg-gray-800/80 dark:text-gray-300">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Tên dịch vụ</th>
                  <th className="py-2.5 px-3 font-semibold text-center">SL</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Đơn giá</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {services.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                    <td className="py-2.5 px-3 font-medium text-gray-900 dark:text-white">
                      {item.service_name}
                      {item.unit && (
                        <span className="ml-1 text-[11px] text-gray-400">
                          ({item.unit})
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-medium">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-600 dark:text-gray-400">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(item.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bảng tổng kết số liệu tài chính */}
      <div className="space-y-2 border-t border-gray-100 pt-4 dark:border-gray-800 text-sm">
        <div className="flex justify-between text-gray-600 dark:text-gray-400 text-xs">
          <span>Tiền phòng:</span>
          <span>{formatCurrency(roomAmount)}</span>
        </div>

        <div className="flex justify-between text-gray-600 dark:text-gray-400 text-xs">
          <span>Tiền dịch vụ:</span>
          <span>+{formatCurrency(serviceAmount)}</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-danger-600 dark:text-danger-400 text-xs font-medium">
            <span className="flex items-center gap-1">
              <Tag className="h-3.5 w-3.5" />
              Giảm giá / Ưu đãi:
            </span>
            <span>-{formatCurrency(discountAmount)}</span>
          </div>
        )}

        <div className="flex justify-between text-gray-600 dark:text-gray-400 text-xs">
          <span className="flex items-center gap-1">
            <Percent className="h-3.5 w-3.5" />
            Thuế GTGT VAT ({(taxRate * 100).toFixed(0)}%):
          </span>
          <span>+{formatCurrency(taxAmount)}</span>
        </div>

        <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-extrabold text-gray-900 dark:border-gray-700 dark:text-white">
          <span>TỔNG CỘNG HÓA ĐƠN:</span>
          <span className="text-xl text-amber-600 dark:text-amber-400">
            {formatCurrency(totalAmount)}
          </span>
        </div>
      </div>
    </Card>
  );
};
