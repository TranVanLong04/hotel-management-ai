import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Coins,
  QrCode,
  Banknote,
  Percent,
} from 'lucide-react';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { formatCurrency } from '@utils/format';
import type { PaymentItemPayload, PaymentMethod } from '../checkoutApi';

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

const PAYMENT_METHODS_CONFIG: {
  value: PaymentMethod;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: 'cash', label: 'Tiền mặt', icon: Banknote },
  { value: 'bank_transfer', label: 'Chuyển khoản NH / QR', icon: QrCode },
  { value: 'credit_card', label: 'Thẻ tín dụng / POS', icon: CreditCard },
  { value: 'momo', label: 'Ví MoMo', icon: Coins },
  { value: 'vnpay', label: 'Cổng VNPAY', icon: CreditCard },
  { value: 'zalopay', label: 'Ví ZaloPay', icon: Coins },
];

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
    const otherPaid = payments.reduce((sum, p, i) => (i === index ? sum : sum + Number(p.amount || 0)), 0);
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
            className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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
          <div className="rounded-xl border border-dashed border-danger-200 bg-danger-50/50 p-4 text-center dark:border-danger-900/50 dark:bg-danger-950/20">
            <p className="text-xs font-semibold text-danger-700 dark:text-danger-400">
              Cần ít nhất 1 khoản thanh toán để hoàn tất trả phòng.
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
          <div className="space-y-3">
            {payments.map((payment, idx) => (
              <div
                key={idx}
                className="relative rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 dark:border-gray-800 dark:bg-gray-800/40 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Khoản #{idx + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePayRemaining(idx)}
                      className="text-[11px] font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
                    >
                      Điền số còn thiếu
                    </button>
                    {payments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePayment(idx)}
                        className="text-gray-400 hover:text-danger-600 dark:hover:text-danger-400"
                        title="Xóa khoản thanh toán này"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {/* Phương thức thanh toán */}
                  <div>
                    <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                      Hình thức
                    </label>
                    <select
                      value={payment.method}
                      onChange={(e) =>
                        handleUpdatePayment(idx, 'method', e.target.value as PaymentMethod)
                      }
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      {PAYMENT_METHODS_CONFIG.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Số tiền thanh toán */}
                  <div>
                    <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                      Số tiền (VNĐ)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={payment.amount || ''}
                      onChange={(e) =>
                        handleUpdatePayment(idx, 'amount', Number(e.target.value) || 0)
                      }
                      placeholder="Nhập số tiền..."
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-900 focus:border-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* Mã giao dịch / Ghi chú */}
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <input
                    type="text"
                    value={payment.transaction_code || ''}
                    onChange={(e) =>
                      handleUpdatePayment(idx, 'transaction_code', e.target.value)
                    }
                    placeholder="Mã giao dịch (nếu có, VD: VCB123...)"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-850 dark:text-gray-300"
                  />
                  <input
                    type="text"
                    value={payment.note || ''}
                    onChange={(e) => handleUpdatePayment(idx, 'note', e.target.value)}
                    placeholder="Ghi chú thanh toán..."
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-850 dark:text-gray-300"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Khối trạng thái thanh toán Realtime */}
      <div className="rounded-xl border p-4 space-y-2 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>Tổng tiền hóa đơn:</span>
          <span className="font-bold text-gray-900 dark:text-white">
            {formatCurrency(totalAmount)}
          </span>
        </div>

        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>Tổng tiền đã nhập:</span>
          <span className="font-bold text-primary-600 dark:text-primary-400">
            {formatCurrency(totalPaid)}
          </span>
        </div>

        <div className="flex justify-between border-t border-gray-200 pt-2 text-xs font-bold dark:border-gray-700">
          <span>Số tiền còn thiếu:</span>
          <span
            className={
              remainingAmount > 0
                ? 'text-danger-600 dark:text-danger-400'
                : 'text-success-600 dark:text-success-400'
            }
          >
            {formatCurrency(remainingAmount)}
          </span>
        </div>

        {/* Trạng thái hóa đơn dự kiến */}
        <div className="pt-2 flex items-center gap-2 text-xs">
          {isOverpaid ? (
            <span className="flex items-center gap-1.5 text-danger-600 font-semibold dark:text-danger-400">
              <AlertCircle className="h-4 w-4" />
              Tổng thanh toán vượt quá hóa đơn ({formatCurrency(totalPaid - totalAmount)}).
            </span>
          ) : isFullyPaid ? (
            <span className="flex items-center gap-1.5 text-success-600 font-semibold dark:text-success-400">
              <CheckCircle className="h-4 w-4" />
              Đã đủ 100% — Hóa đơn sẽ được ghi nhận trạng thái: PAID.
            </span>
          ) : isPartial ? (
            <span className="flex items-center gap-1.5 text-warning-700 font-medium dark:text-warning-300">
              <AlertCircle className="h-4 w-4" />
              Khách thanh toán một phần — Hóa đơn sẽ ghi nhận trạng thái: PARTIAL.
            </span>
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
        className="w-full text-base font-bold shadow-md"
      >
        {isSubmitting ? (
          'Đang xử lý check-out...'
        ) : (
          `Xác nhận Trả phòng & Xuất Hóa đơn (${formatCurrency(totalPaid)})`
        )}
      </Button>
    </Card>
  );
};

