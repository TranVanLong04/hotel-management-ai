import React, { useState } from 'react';
import {
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Badge } from '@components/ui/Badge';
import { formatCurrency } from '@utils/format';
import type { PaymentItemPayload } from '@/types';
import { PaymentList } from './PaymentList';

interface PaymentFormProps {
  roomAmount: number;
  serviceAmount: number;
  discountAmount: number;
  taxRate: number;
  onDiscountChange: (amount: number) => void;
  onTaxRateChange: (rate: number) => void;
  payments: PaymentItemPayload[];
  onPaymentsChange: (payments: PaymentItemPayload[]) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  roomAmount,
  serviceAmount,
  discountAmount,
  taxRate,
  onDiscountChange,
  onTaxRateChange,
  payments,
  onPaymentsChange,
  onSubmit,
  isSubmitting,
}) => {
  // Discount input type: 'vnd' hoặc 'percent'
  const [discountType, setDiscountType] = useState<'vnd' | 'percent'>('vnd');
  const [discountInputVal, setDiscountInputVal] = useState<number>(discountAmount);

  // Tính toán tổng tài chính
  const subtotalBeforeDiscount = roomAmount + serviceAmount;
  const taxableAmount = Math.max(0, subtotalBeforeDiscount - discountAmount);
  const taxAmount = Math.round(taxableAmount * taxRate * 100) / 100;
  const totalAmount = taxableAmount + taxAmount;

  // Tính toán các khoản thanh toán
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const remainingAmount = Math.max(0, totalAmount - totalPaid);
  const isOverpaid = totalPaid > totalAmount + 0.01;
  const isFullyPaid = Math.abs(totalAmount - totalPaid) <= 0.01 && totalAmount > 0;
  const isPartial = totalPaid > 0 && totalPaid < totalAmount - 0.01;
  const isUnpaid = totalPaid <= 0.01;

  // Cập nhật giảm giá
  const handleDiscountInputChange = (val: number, type: 'vnd' | 'percent') => {
    setDiscountInputVal(val);
    if (type === 'percent') {
      const calculatedVnd = Math.round((subtotalBeforeDiscount * Math.min(100, Math.max(0, val))) / 100);
      onDiscountChange(calculatedVnd);
    } else {
      onDiscountChange(Math.min(subtotalBeforeDiscount, Math.max(0, val)));
    }
  };

  // Thay đổi loại giảm giá
  const handleToggleDiscountType = (newType: 'vnd' | 'percent') => {
    setDiscountType(newType);
    if (newType === 'percent') {
      const percentVal = subtotalBeforeDiscount > 0 ? Math.round((discountAmount / subtotalBeforeDiscount) * 100) : 0;
      setDiscountInputVal(percentVal);
    } else {
      setDiscountInputVal(discountAmount);
    }
  };

  // Thêm một khoản thanh toán mới
  const handleAddPayment = () => {
    const defaultAmount = remainingAmount > 0 ? remainingAmount : 0;
    const newPayments: PaymentItemPayload[] = [
      ...payments,
      {
        amount: defaultAmount,
        method: 'cash',
        note: '',
      },
    ];
    onPaymentsChange(newPayments);
  };

  // Xóa khoản thanh toán
  const handleRemovePayment = (index: number) => {
    const newPayments = payments.filter((_, i) => i !== index);
    onPaymentsChange(newPayments);
  };

  // Cập nhật từng khoản thanh toán
  const handleUpdatePayment = (
    index: number,
    field: keyof PaymentItemPayload,
    value: any
  ) => {
    const newPayments = payments.map((p, i) => {
      if (i === index) {
        return { ...p, [field]: value };
      }
      return p;
    });
    onPaymentsChange(newPayments);
  };

  // Nút nhanh: Thanh toán hết số còn lại
  const handlePayRemaining = (index: number) => {
    const otherPaid = payments.reduce(
      (sum, p, i) => (i === index ? sum : sum + Number(p.amount || 0)),
      0
    );
    const needToPay = Math.max(0, totalAmount - otherPaid);
    handleUpdatePayment(index, 'amount', needToPay);
  };

  return (
    <Card className="border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-850 p-6 space-y-6">
      {/* Tiêu đề & Thiết lập Giảm giá + Thuế */}
      <div className="border-b border-gray-100 pb-4 dark:border-gray-800">
        <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white">
          Thiết lập thanh toán & Chiết khấu
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Nhập mã ưu đãi, thuế suất và ghi nhận các phương thức thanh toán của khách
        </p>
      </div>

      {/* Điều chỉnh Giảm giá & Thuế */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Giảm giá */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Giảm giá / Khuyến mãi
            </label>
            <div className="flex rounded-md bg-gray-100 p-0.5 dark:bg-gray-800">
              <button
                type="button"
                onClick={() => handleToggleDiscountType('vnd')}
                className={`px-2 py-0.5 text-[11px] font-bold rounded ${
                  discountType === 'vnd'
                    ? 'bg-white text-primary-600 shadow-xs dark:bg-gray-700 dark:text-primary-400'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                }`}
              >
                VNĐ
              </button>
              <button
                type="button"
                onClick={() => handleToggleDiscountType('percent')}
                className={`px-2 py-0.5 text-[11px] font-bold rounded ${
                  discountType === 'percent'
                    ? 'bg-white text-primary-600 shadow-xs dark:bg-gray-700 dark:text-primary-400'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                }`}
              >
                %
              </button>
            </div>
          </div>

          <div className="relative">
            <Input
              type="number"
              min={0}
              max={discountType === 'percent' ? 100 : subtotalBeforeDiscount}
              value={discountInputVal || ''}
              onChange={(e) =>
                handleDiscountInputChange(Number(e.target.value) || 0, discountType)
              }
              placeholder={discountType === 'percent' ? 'Nhập % giảm (0-100)' : 'Nhập số tiền VNĐ'}
            />
            {discountType === 'percent' && (
              <span className="absolute right-3 top-2.5 text-xs text-gray-400">
                ≈ {formatCurrency(discountAmount)}
              </span>
            )}
          </div>
        </div>

        {/* Thuế VAT */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-between">
            <span>Thuế suất GTGT (VAT)</span>
            <span className="text-[11px] text-gray-400">
              {(taxRate * 100).toFixed(0)}%
            </span>
          </label>
          <select
            value={taxRate}
            onChange={(e) => onTaxRateChange(Number(e.target.value))}
            className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value={0}>0% — Miễn thuế</option>
            <option value={0.05}>5% — Ưu đãi thuế</option>
            <option value={0.08}>8% — Thuế suất kích cầu (Chuẩn)</option>
            <option value={0.1}>10% — Thuế GTGT tiêu chuẩn</option>
          </select>
        </div>
      </div>

      {/* Danh sách các khoản thanh toán */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
            Khoản thanh toán ({payments.length})
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddPayment}
            className="h-8 gap-1 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Thêm phương thức
          </Button>
        </div>

        {payments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-4 text-center dark:border-gray-700 dark:bg-gray-800/20">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Chưa có khoản thanh toán nào được thêm.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddPayment}
              className="mt-2 text-xs"
            >
              Thêm khoản thanh toán ngay
            </Button>
          </div>
        ) : (
          <PaymentList
            payments={payments}
            onRemove={handleRemovePayment}
            onUpdate={handleUpdatePayment}
            onFillRemaining={handlePayRemaining}
            disabled={isSubmitting}
          />
        )}
      </div>

      {/* Khối trạng thái thanh toán Realtime */}
      <div className="rounded-xl border p-4 space-y-2.5 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>Tổng tiền hóa đơn:</span>
          <span className="font-bold text-gray-900 dark:text-white">
            {formatCurrency(totalAmount)}
          </span>
        </div>

        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>Tổng tiền đã thu:</span>
          <span className="font-bold text-primary-600 dark:text-primary-400">
            {formatCurrency(totalPaid)}
          </span>
        </div>

        <div className="flex justify-between border-t border-gray-200 pt-2 text-xs font-bold dark:border-gray-700">
          <span>Số tiền còn thiếu:</span>
          <span
            className={
              remainingAmount > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-success-600 dark:text-success-400'
            }
          >
            {formatCurrency(remainingAmount)}
          </span>
        </div>

        {/* Trạng thái hóa đơn dự kiến */}
        <div className="pt-2 flex items-center justify-between gap-2 text-xs">
          {isOverpaid ? (
            <span className="flex items-center gap-1.5 text-danger-600 font-semibold dark:text-danger-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Tổng thanh toán vượt quá hóa đơn ({formatCurrency(totalPaid - totalAmount)}). Vui lòng điều chỉnh lại.
            </span>
          ) : isFullyPaid ? (
            <span className="flex items-center gap-1.5 text-success-600 font-semibold dark:text-success-400">
              <CheckCircle className="h-4 w-4 shrink-0" />
              Đã thu đủ 100% — Trạng thái hóa đơn: <Badge variant="success">PAID</Badge>
            </span>
          ) : isPartial ? (
            <div className="flex items-center justify-between w-full">
              <span className="flex items-center gap-1.5 text-amber-700 font-medium dark:text-amber-300">
                <Clock className="h-4 w-4 shrink-0 text-amber-500" />
                Thanh toán một phần (Chờ thu thêm {formatCurrency(remainingAmount)})
              </span>
              <Badge variant="warning">PARTIAL</Badge>
            </div>
          ) : isUnpaid ? (
            <div className="flex items-center justify-between w-full">
              <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <AlertCircle className="h-4 w-4 shrink-0 text-gray-400" />
                Chưa ghi nhận thanh toán
              </span>
              <Badge variant="default">UNPAID</Badge>
            </div>
          ) : null}
        </div>
      </div>

      {/* Nút Submit Check-out */}
      <Button
        type="button"
        variant="primary"
        size="lg"
        onClick={onSubmit}
        disabled={isSubmitting || isOverpaid || payments.length === 0}
        className="w-full text-base font-bold shadow-md bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
      >
        {isSubmitting
          ? 'Đang xử lý check-out...'
          : isFullyPaid
          ? `Xác nhận Trả phòng & Đã thanh toán (${formatCurrency(totalPaid)})`
          : `Xác nhận Trả phòng (Thu trước: ${formatCurrency(totalPaid)})`}
      </Button>
    </Card>
  );
};
