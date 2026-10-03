import { ShieldCheck, CheckCircle2, Wallet, CreditCard } from 'lucide-react';
import type { PaymentGateway } from '@/types';

interface PaymentMethodSelectorProps {
  selectedGateway: PaymentGateway;
  onSelect: (gateway: PaymentGateway) => void;
  disabled?: boolean;
  availableGateways?: string[];
}

interface MethodOption {
  id: PaymentGateway;
  title: string;
  subtitle: string;
  icon: typeof Wallet;
  badge: string;
  badgeColor: string;
}

const PAYMENT_METHODS: MethodOption[] = [
  {
    id: 'momo',
    title: 'Ví Điện Tử MoMo',
    subtitle: 'Quét mã QR qua App MoMo hoặc thanh toán trực tiếp',
    icon: Wallet,
    badge: 'Phổ biến',
    badgeColor: 'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300',
  },
  {
    id: 'vnpay',
    title: 'Cổng Thanh Toán VNPAY-QR',
    subtitle: 'Ứng dụng ngân hàng, Thẻ ATM nội địa, Visa/Mastercard',
    icon: CreditCard,
    badge: 'Đa dạng ngân hàng',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
  },
];

/**
 * Component chọn phương thức thanh toán trực tuyến
 * CHỈ hỗ trợ 2 cổng online: MoMo và VNPay (Tuyệt đối KHÔNG có tiền mặt trong flow online)
 */
export function PaymentMethodSelector({
  selectedGateway,
  onSelect,
  disabled = false,
  availableGateways = ['momo'],
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-gray-900 dark:text-white">
          Chọn phương thức thanh toán trực tuyến
        </label>
        <span className="flex items-center gap-1 text-xs text-success-600 dark:text-success-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          Bảo mật 256-bit SSL
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PAYMENT_METHODS.map((method) => {
          const isAvailable = availableGateways.includes(method.id);
          const isOptionDisabled = disabled || !isAvailable;
          const isSelected = selectedGateway === method.id && isAvailable;
          const Icon = method.icon;

          const tooltipText = !isAvailable
            ? 'VNPay chưa được cấu hình. Vui lòng dùng MoMo.'
            : undefined;

          return (
            <div key={method.id} className="relative group">
              <button
                type="button"
                disabled={isOptionDisabled}
                title={tooltipText}
                onClick={() => {
                  if (isAvailable) {
                    onSelect(method.id);
                  }
                }}
                className={`w-full text-left relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 ${
                  isSelected
                    ? 'border-primary-600 bg-primary-50/40 ring-2 ring-primary-500/20 shadow-sm dark:border-primary-400 dark:bg-primary-950/20 cursor-pointer'
                    : isAvailable
                    ? 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60 dark:border-gray-800 dark:bg-gray-850 dark:hover:border-gray-700 cursor-pointer'
                    : 'border-gray-200 bg-gray-50/70 opacity-60 cursor-not-allowed dark:border-gray-800 dark:bg-gray-900/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        method.id === 'momo'
                          ? 'bg-[#a50064]/10 text-[#a50064] dark:bg-[#a50064]/20 dark:text-pink-400'
                          : 'bg-[#005ba6]/10 text-[#005ba6] dark:bg-[#005ba6]/20 dark:text-blue-400'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white text-sm">
                        {method.title}
                      </span>
                      {isAvailable ? (
                        <span
                          className={`ml-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${method.badgeColor}`}
                        >
                          {method.badge}
                        </span>
                      ) : (
                        <span className="ml-2 inline-block rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          Chưa khả dụng
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 mt-0.5">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                        isSelected
                          ? 'border-primary-600 bg-primary-600 text-white dark:border-primary-400 dark:bg-primary-400'
                          : 'border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-800'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="h-4 w-4" />}
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  {isAvailable ? method.subtitle : 'VNPay chưa được cấu hình. Vui lòng dùng MoMo.'}
                </p>
              </button>

              {/* Tooltip khi hover phương thức chưa khả dụng */}
              {!isAvailable && (
                <div className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1 text-[11px] text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 z-10 dark:bg-gray-700">
                  VNPay chưa được cấu hình. Vui lòng dùng MoMo.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
