import React from 'react';
import { MapPin, Star, Navigation, Compass, Utensils, Clock } from 'lucide-react';

export interface PlaceItem {
  name: string;
  address?: string;
  rating?: number;
  user_ratings_total?: number;
  description?: string;
  category?: string;
  type?: string;
  price_level?: string;
  image_url?: string;
  distance_km?: string;
  duration_minutes?: string;
  duration_walking?: string;
  highlight?: string;
}

export interface PlaceCardPayload {
  query?: string;
  keyword?: string;
  places?: PlaceItem[];
  place?: PlaceItem;
  hotel_origin?: string;
  origin_hotel?: string;
}

interface PlaceCardProps {
  payload?: PlaceCardPayload;
  data?: PlaceCardPayload;
  onAction?: (actionText: string) => void;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({ payload, data, onAction }) => {
  const currentPayload = data || payload || {};
  const places: PlaceItem[] = Array.isArray(currentPayload)
    ? currentPayload
    : Array.isArray(currentPayload.places) && currentPayload.places.length > 0
    ? currentPayload.places
    : currentPayload.place
    ? [currentPayload.place]
    : [];

  const titleHeader = !Array.isArray(currentPayload) && currentPayload.keyword
    ? `Quán ngon "${currentPayload.keyword}" gần khách sạn`
    : !Array.isArray(currentPayload) && currentPayload.query
    ? `Địa điểm "${currentPayload.query}"`
    : 'Địa điểm & Quán ăn nổi bật gần khách sạn';

  const handleDirections = (placeName: string) => {
    if (onAction) {
      onAction(`Chỉ đường từ khách sạn đến ${placeName}`);
    } else {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        placeName + ', Đà Nẵng'
      )}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (places.length === 0) {
    return null;
  }

  return (
    <div className="w-full my-2 space-y-2 text-left">
      <div className="flex items-center justify-between px-0.5 text-xs text-gray-600 dark:text-gray-300">
        <span className="font-semibold flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          {titleHeader}
        </span>
        <span className="text-[11px] text-gray-400 font-medium">{places.length} kết quả</span>
      </div>

      {/* Horizontal Cards List */}
      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {places.map((place, idx) => {
          const fallbackImg =
            'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=400&q=80';
          const distanceDisplay = place.distance_km || place.duration_walking || place.duration_minutes;

          return (
            <div
              key={idx}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/70 p-2.5 shadow-2xs hover:shadow-sm transition-all flex items-center gap-3"
            >
              {/* Left: Square Image */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 shadow-2xs">
                <img
                  src={place.image_url || fallbackImg}
                  alt={place.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = fallbackImg;
                  }}
                />
                {place.rating && (
                  <span className="absolute bottom-1 right-1 text-[9px] font-bold text-amber-900 bg-amber-100/95 backdrop-blur-xs px-1.5 py-0.2 rounded flex items-center gap-0.5 shadow-2xs">
                    <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                    {place.rating.toFixed(1)}
                  </span>
                )}
              </div>

              {/* Right: Info and Action */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 h-full space-y-1">
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100 truncate">
                      {place.name}
                    </h4>
                    {place.price_level && (
                      <span className="text-[10px] text-gray-400 font-medium shrink-0">
                        {place.price_level}
                      </span>
                    )}
                  </div>

                  {(place.type || place.category) && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                      <Utensils className="w-2.5 h-2.5" />
                      {place.type || place.category}
                    </span>
                  )}

                  {place.address && (
                    <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                      <span className="truncate">{place.address}</span>
                    </div>
                  )}

                  {place.highlight && (
                    <p className="text-[10px] text-amber-700 dark:text-amber-300 line-clamp-1 italic mt-0.5">
                      ★ {place.highlight}
                    </p>
                  )}
                </div>

                {/* Footer: Distance & Directions Button */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-700/40">
                  {distanceDisplay ? (
                    <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> {distanceDisplay}
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400">Gần khách sạn</span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDirections(place.name)}
                    className="inline-flex items-center gap-1 py-1 px-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold text-[10px] rounded-lg shadow-2xs hover:shadow-xs transition-all active:scale-95"
                  >
                    <Navigation className="w-2.5 h-2.5" />
                    Chỉ đường
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
