import React from 'react';
import {
  Trash2,
  Banknote,
  QrCode,
  CreditCard,
  Globe,
  MoreHorizontal,
} from 'lucide-react';
import type { PaymentItemPayload, CheckoutPaymentMethod } from '@/types';
import { formatCurrency } from '@utils/format';

interface PaymentListProps {
  payments: PaymentItemPayload[];
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof PaymentItemPayload, value: any) => void;
  onFillRemaining: (index: number) => void;
  disabled?: boolean;
}

export const PAYMENT_METHODS_CONFIG: {
  value: CheckoutPaymentMethod;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: 'cash', label: 'Tiền mặt', icon: Banknote },
  { value: 'bank_transfer', label: 'Chuyển khoản NH / QR', icon: QrCode },
  { value: 'credit_card', label: 'Thẻ tín dụng / POS', icon: CreditCard },
  { value: 'online', label: 'Cổng trực tuyến (MoMo/VNPAY)', icon: Globe },
  { value: 'other', label: 'Hình thức khác', icon: MoreHorizontal },
];

export const PaymentList: React.FC<PaymentListProps> = ({
  payments,
  onRemove,
  onUpdate,
  onFillRemaining,
  disabled = false,
}) => {
  if (payments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {payments.map((payment, idx) => (
        <div
          key={idx}
          className="relative rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 dark:border-gray-800 dark:bg-gray-800/40 space-y-2.5 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Khoản #{idx + 1}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onFillRemaining(idx)}
                disabled={disabled}
                className="text-[11px] font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 disabled:opacity-50"
              >
                Điền số còn thiếu
              </button>
              {payments.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  disabled={disabled}
                  className="text-gray-400 hover:text-danger-600 dark:hover:text-danger-400 disabled:opacity-50 transition-colors"
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
                Hình thức thanh toán
              </label>
              <select
                value={payment.method}
                disabled={disabled}
                onChange={(e) =>
                  onUpdate(idx, 'method', e.target.value as CheckoutPaymentMethod)
                }
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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
                disabled={disabled}
                value={payment.amount || ''}
                onChange={(e) =>
                  onUpdate(idx, 'amount', Number(e.target.value) || 0)
                }
                placeholder="Nhập số tiền..."
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              {payment.amount > 0 && (
                <div className="mt-0.5 text-right text-[10px] text-gray-400">
                  ≈ {formatCurrency(payment.amount)}
                </div>
              )}
            </div>
          </div>

          {/* Mã giao dịch / Ghi chú */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                Mã giao dịch (tùy chọn)
              </label>
              <input
                type="text"
                disabled={disabled}
                value={payment.transaction_code || ''}
                onChange={(e) => onUpdate(idx, 'transaction_code', e.target.value)}
                placeholder="VD: VCB98765432..."
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-850 dark:text-gray-300"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                Ghi chú khoản thu
              </label>
              <input
                type="text"
                disabled={disabled}
                value={payment.note || ''}
                onChange={(e) => onUpdate(idx, 'note', e.target.value)}
                placeholder="Ghi chú thêm..."
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-850 dark:text-gray-300"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

