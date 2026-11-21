import React from 'react';
import { Users, BedDouble, Check, Calendar } from 'lucide-react';

export interface RoomItemData {
  id: string;
  room_number: string;
  floor?: number;
  room_type_name: string;
  price_per_night: number;
  max_guests: number;
  amenities?: string;
  image_url?: string;
}

interface RoomCardProps {
  room: RoomItemData;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  onBookRoom: (room: RoomItemData) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  checkIn,
  checkOut,
  guests = 1,
  onBookRoom,
}) => {
  const fallbackImage =
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80';

  const amenitiesList = room.amenities
    ? room.amenities.split(',').map((a) => a.trim()).slice(0, 3)
    : ['Wi-Fi 6', 'View biển', 'Minibar'];

  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(room.price_per_night);

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-amber-200/70 dark:border-amber-700/50 shadow-sm hover:shadow-md transition-all my-2">
      {/* Room Image */}
      <div className="relative h-28 w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
        <img
          src={room.image_url || fallbackImage}
          alt={room.room_type_name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = fallbackImage;
          }}
        />
        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-semibold text-white">
          Số phòng: {room.room_number} {room.floor ? `(Tầng ${room.floor})` : ''}
        </div>
        <div className="absolute bottom-2 right-2 bg-amber-600/90 backdrop-blur-md text-white px-2 py-0.5 rounded text-[11px] font-bold">
          {formattedPrice}/đêm
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
            {room.room_type_name}
          </h4>
          <span className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
            <Users className="w-3.5 h-3.5 text-amber-600" />
            Tối đa {room.max_guests} người
          </span>
        </div>

        {checkIn && checkOut && (
          <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 mb-1.5">
            <Calendar className="w-3 h-3 text-amber-600" />
            <span>{checkIn} → {checkOut} ({guests} khách)</span>
          </div>
        )}


        {/* Amenities */}
        <div className="flex flex-wrap gap-1 mb-2.5">
          {amenitiesList.map((amenity, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 rounded text-[10px]"
            >
              <Check className="w-2.5 h-2.5 text-emerald-500" />
              {amenity}
            </span>
          ))}
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => onBookRoom(room)}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg shadow-amber-600/20 hover:shadow-amber-600/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98] ring-1 ring-amber-400/30"
        >
          <BedDouble className="w-4 h-4" />
          <span>Đặt phòng này ngay</span>
        </button>

      </div>
    </div>
  );
};

