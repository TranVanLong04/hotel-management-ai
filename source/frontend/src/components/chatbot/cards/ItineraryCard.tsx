import React from 'react';
import { CalendarDays, Clock, MapPin, Sparkles, Navigation, CheckCircle } from 'lucide-react';

export interface ScheduleItem {
  time: string;
  period: string;
  title: string;
  activity: string;
  place: string;
}

export interface ItineraryCardPayload {
  title?: string;
  destination?: string;
  days?: number;
  target_audience?: string;
  preferences?: string;
  hotel_origin?: string;
  schedule?: ScheduleItem[];
  travel_tips?: string[];
}

interface ItineraryCardProps {
  payload?: ItineraryCardPayload;
  data?: ItineraryCardPayload;
  onAction?: (actionText: string) => void;
}

export const ItineraryCard: React.FC<ItineraryCardProps> = ({ payload, data, onAction }) => {
  const currentPayload = data || payload || {};
  const destination = currentPayload.destination || 'Đà Nẵng';
  const days = currentPayload.days || 1;
  const title = currentPayload.title || `Lịch trình gợi ý ${destination} (${days} ngày)`;
  const schedule = currentPayload.schedule || [];
  const travelTips = currentPayload.travel_tips || [];

  return (
    <div className="w-full bg-gradient-to-b from-white to-amber-50/30 dark:from-gray-800 dark:to-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/50 p-3.5 shadow-sm my-2 text-left space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-amber-100 dark:border-amber-900/40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
              Lịch trình gợi ý {days > 1 ? `${days} ngày` : '1 ngày'}
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-white bg-amber-600 px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                <Sparkles className="w-2.5 h-2.5" /> AI
              </span>
            </h4>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[240px]">
              {title}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/50 px-2 py-0.5 rounded-full">
          {destination} • {days} ngày
        </span>
      </div>

      {/* Timeline Schedule */}
      <div className="space-y-2.5">
        {schedule.map((item, idx) => (
          <div key={idx} className="relative pl-5 border-l-2 border-amber-300 dark:border-amber-700 space-y-0.5">
            {/* Dot */}
            <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-amber-600" />

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> {item.time} ({item.period})
              </span>
              {onAction && (
                <button
                  type="button"
                  onClick={() => onAction(`Chỉ đường từ khách sạn đến ${item.place}`)}
                  className="text-[9px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                >
                  <Navigation className="w-2.5 h-2.5" /> Chỉ đường
                </button>
              )}
            </div>

            <h5 className="font-semibold text-xs text-gray-800 dark:text-gray-200">
              {item.title}
            </h5>

            <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
              {item.activity}
            </p>

            <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
              <MapPin className="w-2.5 h-2.5 text-red-500 shrink-0" />
              <span>{item.place}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Travel Tips */}
      {travelTips.length > 0 && (
        <div className="p-2.5 bg-amber-50/80 dark:bg-amber-950/40 rounded-lg border border-amber-200/60 dark:border-amber-900/40 space-y-1">
          <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
            Mẹo du lịch từ Grand Luxury:
          </span>
          <ul className="space-y-1 text-[10px] text-gray-600 dark:text-gray-300">
            {travelTips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

