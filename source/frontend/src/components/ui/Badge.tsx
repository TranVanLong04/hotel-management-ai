import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  className?: string;
}

/** Color classes cho từng variant — hỗ trợ dark mode */
const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300',
  success: 'bg-success-100 text-success-800 dark:bg-success-900/50 dark:text-success-300',
  warning: 'bg-warning-100 text-warning-800 dark:bg-warning-900/50 dark:text-warning-300',
  danger: 'bg-danger-100 text-danger-800 dark:bg-danger-900/50 dark:text-danger-300',
  info: 'bg-info-100 text-info-800 dark:bg-info-900/50 dark:text-info-300',
};

const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5 font-medium',
};

/**
 * Badge hiển thị trạng thái — dùng kết hợp với BOOKING_STATUS_COLORS, ROOM_STATUS_COLORS
 */
export function Badge({ variant = 'default', size = 'md', children, className = '' }: BadgeProps) {
  return (
    <span className={`badge ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
