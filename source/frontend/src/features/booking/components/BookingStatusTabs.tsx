import type { BookingStatus } from '@/types';

export type BookingTabValue = BookingStatus | 'all';

interface TabItem {
  value: BookingTabValue;
  label: string;
}

const TABS: TabItem[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending_payment', label: 'Chờ thanh toán' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'checked_in', label: 'Đang ở' },
  { value: 'checked_out', label: 'Đã trả phòng' },
  { value: 'cancelled', label: 'Đã hủy' },
];

interface BookingStatusTabsProps {
  activeTab: BookingTabValue;
  onChange: (tab: BookingTabValue) => void;
}

/**
 * Thanh chuyển đổi Tabs trạng thái booking
 * Hỗ trợ giao diện Responsive (cuộn ngang trên mobile) và Dark mode
 */
export function BookingStatusTabs({ activeTab, onChange }: BookingStatusTabsProps) {
  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto no-scrollbar">
      <nav className="-mb-px flex space-x-2 sm:space-x-4 min-w-full px-1 py-1" aria-label="Tabs">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onChange(tab.value)}
              className={`whitespace-nowrap px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all duration-200 border-b-2 ${
                isActive
                  ? 'border-primary-600 text-primary-600 bg-primary-50/50 dark:border-primary-400 dark:text-primary-400 dark:bg-primary-950/30'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
