import React, { useState } from 'react';
import { Navigation, MapPin, Clock, ExternalLink, Route, Car, Footprints } from 'lucide-react';

export interface DirectionsCardPayload {
  origin?: string;
  origin_address?: string;
  destination?: string;
  destination_address?: string;
  distance_km?: string;
  duration_minutes?: string;
  mode?: string;
  steps?: string[];
  map_embed_url?: string;
  external_maps_url?: string;
}

interface DirectionsCardProps {
  payload?: DirectionsCardPayload;
  data?: DirectionsCardPayload;
  onAction?: (actionText: string) => void;
}

export const DirectionsCard: React.FC<DirectionsCardProps> = ({ payload, data, onAction }) => {
  const currentPayload = data || payload || {};
  const origin = currentPayload.origin || 'Khách sạn Grand Luxury';
  const destination = currentPayload.destination || currentPayload.destination_address || 'Điểm đến';
  const distance = currentPayload.distance_km || 'Đang tính toán';
  const duration = currentPayload.duration_minutes || 'Đang tính toán';
  const mode = currentPayload.mode || 'driving';
  const steps = currentPayload.steps || [];

  const [isIframeLoaded, setIsIframeLoaded] = useState<boolean>(false);

  // Fallback construct iframe URL
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const embedUrl =
    currentPayload.map_embed_url ||
    (apiKey
      ? `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${encodeURIComponent(
          'Grand Luxury Hotel Danang'
        )}&destination=${encodeURIComponent(destination)}&mode=${mode}`
      : `https://maps.google.com/maps?saddr=${encodeURIComponent(
          '28 Võ Nguyên Giáp, Sơn Trà, Đà Nẵng'
        )}&daddr=${encodeURIComponent(destination)}&output=embed`);

  const externalUrl =
    currentPayload.external_maps_url ||
    `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      '28 Võ Nguyên Giáp, Sơn Trà, Đà Nẵng'
    )}&destination=${encodeURIComponent(destination)}&travelmode=driving`;

  return (
    <div className="w-full bg-gradient-to-b from-white to-blue-50/30 dark:from-gray-800 dark:to-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/50 p-3.5 shadow-sm my-2 text-left space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-blue-100 dark:border-blue-900/40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <Route className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
              Chỉ đường từ Khách sạn
            </h4>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Đến: <strong className="text-gray-800 dark:text-gray-200">{destination}</strong>
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800/40">
          {mode === 'walking' ? <Footprints className="w-3 h-3" /> : <Car className="w-3 h-3" />}
          {mode === 'walking' ? 'Đi bộ' : 'Lái xe'}
        </span>
      </div>

      {/* Metrics (Distance & Duration) */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-white dark:bg-gray-800/80 p-2 rounded-lg border border-gray-100 dark:border-gray-700/60 flex items-center gap-2 shadow-2xs">
          <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Navigation className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[10px] text-gray-400">Khoảng cách</div>
            <div className="font-bold text-gray-800 dark:text-gray-100">{distance}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800/80 p-2 rounded-lg border border-gray-100 dark:border-gray-700/60 flex items-center gap-2 shadow-2xs">
          <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[10px] text-gray-400">Thời gian ước tính</div>
            <div className="font-bold text-gray-800 dark:text-gray-100">{duration}</div>
          </div>
        </div>
      </div>

      {/* Route Addresses */}
      <div className="text-[11px] space-y-1 bg-gray-50/70 dark:bg-gray-800/40 p-2 rounded-lg border border-gray-100 dark:border-gray-700/40">
        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-gray-400">Xuất phát:</span>
          <span className="font-medium truncate">{origin}</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
          <MapPin className="w-2.5 h-2.5 text-red-500 shrink-0" />
          <span className="text-gray-400">Điểm đến:</span>
          <span className="font-medium truncate">{currentPayload.destination_address || destination}</span>
        </div>
      </div>

      {/* Embedded Google Maps iFrame */}
      <div className="relative w-full h-44 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-inner bg-gray-100 dark:bg-gray-900">
        {!isIframeLoaded && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 gap-1.5">
            <Route className="w-4 h-4 animate-spin text-blue-500" />
            Đang tải bản đồ chỉ đường Google Maps...
          </div>
        )}
        <iframe
          title={`Google Maps directions to ${destination}`}
          src={embedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={() => setIsIframeLoaded(true)}
          className={`w-full h-full transition-opacity duration-300 ${
            isIframeLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>

      {/* Key Route Steps */}
      {steps.length > 0 && (
        <div className="space-y-1 text-[11px] text-gray-600 dark:text-gray-300">
          <div className="font-semibold text-gray-700 dark:text-gray-200 text-[10px] uppercase tracking-wider">
            Lộ trình gợi ý:
          </div>
          <ol className="list-decimal list-inside space-y-0.5 text-gray-500 dark:text-gray-400">
            {steps.slice(0, 3).map((st, i) => (
              <li key={i} className="truncate">
                {st}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Open in Google Maps External App */}
      <div className="pt-1 flex items-center gap-2">
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs hover:shadow transition-all active:scale-98"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Mở chỉ đường trên Google Maps
        </a>

        {onAction && (
          <button
            type="button"
            onClick={() => onAction(`Gợi ý quán ăn gần ${destination}`)}
            className="py-2 px-2.5 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-medium rounded-lg transition-colors"
            title="Tìm quán ăn gần đây"
          >
            Quán ăn gần đây
          </button>
        )}
      </div>
    </div>
  );
};

