import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@components/ui/Card';

type StatsCardColor = 'primary' | 'success' | 'warning' | 'info' | 'danger';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: StatsCardColor;
  change?: number;
  changePeriod?: string;
  subtext?: string;
}

const colorMap: Record<StatsCardColor, { bg: string; text: string; iconBg: string }> = {
  primary: {
    bg: 'bg-primary-50 dark:bg-primary-950/40',
    text: 'text-primary-600 dark:text-primary-400',
    iconBg: 'bg-primary-50 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400',
  },
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
  },
  info: {
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    text: 'text-sky-600 dark:text-sky-400',
    iconBg: 'bg-sky-50 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400',
  },
  danger: {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-50 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400',
  },
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  color = 'primary',
  change,
  changePeriod,
  subtext,
}: StatsCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const config = colorMap[color];

  return (
    <Card className="p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {value}
          </p>

          {change !== undefined && (
            <div className="mt-2.5 flex items-center gap-1.5 text-xs">
              <span
                className={`inline-flex items-center gap-0.5 font-semibold ${
                  isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {isPositive ? `+${change}%` : `${change}%`}
              </span>
              {changePeriod && (
                <span className="text-gray-400 dark:text-gray-500">
                  {changePeriod}
                </span>
              )}
            </div>
          )}

          {subtext && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {subtext}
            </p>
          )}
        </div>

        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${config.iconBg}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}

