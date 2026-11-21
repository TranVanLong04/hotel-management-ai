import React from 'react';
import { Bot, User } from 'lucide-react';
import type { ChatMessage } from '@/features/chatbot/hooks/useChatbot';
import { RoomCard, type RoomItemData } from './cards/RoomCard';
import { BookingCard } from './cards/BookingCard';
import { PaymentCard } from './cards/PaymentCard';
import { CheckinCard } from './cards/CheckinCard';
import { PlaceCard } from './cards/PlaceCard';
import { DirectionsCard } from './cards/DirectionsCard';
import { ItineraryCard } from './cards/ItineraryCard';
import { AdminStatsCard } from './cards/AdminStatsCard';
import { AdminAiComparisonCard } from './cards/AdminAiComparisonCard';



interface ChatMessageItemProps {
  message: ChatMessage;
  onAction?: (actionText: string) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, onAction }) => {
  const isUser = message.sender === 'user';

  // Format simple markdown (bold and line breaks) safely, stripping raw image links
  const renderFormattedText = (text: string) => {
    // Strip markdown images ![alt](url) so they don't render as ugly raw text
    const cleanText = text.replace(/!\[.*?\]\(.*?\)/g, '').trim();
    if (!cleanText) return null;

    const lines = cleanText.split('\n');
    return lines.map((line, lineIdx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={lineIdx} className="block leading-relaxed">
          {parts.map((part, partIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={partIdx} className="font-semibold">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          })}
        </span>
      );
    });
  };

  const formattedTime = new Date(message.created_at).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const hasCard = !isUser && Boolean(message.ui_type && message.ui_type !== 'text');

  // UI-First: If a visual Card is rendered, only display a clean, concise 1-line lead-in
  const displayContent = hasCard
    ? message.content.split('\n')[0].replace(/!\[.*?\]\(.*?\)/g, '').trim()
    : message.content;

  const roomList: RoomItemData[] = Array.isArray(message.ui_payload)

    ? message.ui_payload
    : Array.isArray(message.ui_payload?.rooms)
    ? message.ui_payload.rooms
    : [];

  const handleBookRoom = (room: RoomItemData) => {
    if (!onAction) return;
    const checkIn = message.ui_payload?.check_in || '2026-11-14';
    const checkOut = message.ui_payload?.check_out || '2026-11-16';
    const guests = message.ui_payload?.guests || 1;
    onAction(`Đặt phòng ${room.room_number} từ ${checkIn} đến ${checkOut} cho ${guests} người`);
  };


  const handleConfirmBooking = (preview: any) => {
    if (!onAction) return;
    onAction(`Xác nhận đặt phòng ${preview.room_name} từ ngày ${preview.check_in_date} đến ngày ${preview.check_out_date} cho ${preview.number_of_guests} người.`);
  };

  const handlePayNow = (bookingCode: string) => {
    if (!onAction) return;
    onAction(`Tôi muốn thanh toán cho đơn đặt phòng ${bookingCode}.`);
  };

  return (
    <div className={`flex items-end gap-2 my-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs ${
          isUser
            ? 'bg-amber-600 text-white'
            : 'bg-gradient-to-tr from-amber-500 to-amber-700 text-white shadow-sm'
        }`}
      >
        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
      </div>

      {/* Bubble Container */}
      <div className={`max-w-[85%] ${isUser ? 'text-right' : 'text-left'}`}>
        <div
          className={`inline-block px-3.5 py-2.5 text-sm shadow-sm transition-all text-left ${
            isUser
              ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-2xl rounded-br-xs'
              : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700/60 rounded-2xl rounded-bl-xs'
          }`}
        >
          <div className="space-y-1">{renderFormattedText(displayContent)}</div>
          <div
            className={`text-[10px] mt-1 text-right select-none ${
              isUser ? 'text-amber-100/80' : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            {formattedTime}
          </div>
        </div>


        {/* Dynamic UI Cards */}
        {!isUser && message.ui_type === 'room_list' && roomList.length > 0 && (
          <div className="mt-2 space-y-2">
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              Có {roomList.length} phòng trống phù hợp:
            </p>
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {roomList.map((room: RoomItemData) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  checkIn={message.ui_payload?.check_in || '2026-11-14'}
                  checkOut={message.ui_payload?.check_out || '2026-11-16'}
                  guests={message.ui_payload?.guests || 1}
                  onBookRoom={handleBookRoom}
                />
              ))}
            </div>
          </div>
        )}

        {!isUser && message.ui_type === 'booking_preview' && message.ui_payload && (
          <div className="mt-2">
            <BookingCard
              type="preview"
              previewData={message.ui_payload}
              onConfirmBooking={handleConfirmBooking}
            />
          </div>
        )}

        {!isUser && message.ui_type === 'booking_confirmed' && message.ui_payload && (
          <div className="mt-2">
            <BookingCard
              type="confirmed"
              confirmedData={message.ui_payload}
              onPayNow={handlePayNow}
            />
          </div>
        )}

        {!isUser && message.ui_type === 'payment_card' && message.ui_payload && (
          <div className="mt-2">
            <PaymentCard
              data={message.ui_payload}
              payload={message.ui_payload}
              onPayNow={handlePayNow}
            />
          </div>
        )}

        {!isUser && message.ui_type === 'checkin_card' && message.ui_payload && (
          <div className="mt-2">
            <CheckinCard
              data={message.ui_payload}
              payload={message.ui_payload}
              onAction={onAction}
            />
          </div>
        )}

        {!isUser && (message.ui_type === 'place_card' || message.ui_type === 'place_list') && message.ui_payload && (
          <div className="mt-2">
            <PlaceCard
              data={message.ui_payload}
              payload={message.ui_payload}
              onAction={onAction}
            />
          </div>
        )}


        {!isUser && message.ui_type === 'directions_card' && message.ui_payload && (
          <div className="mt-2">
            <DirectionsCard
              data={message.ui_payload}
              payload={message.ui_payload}
              onAction={onAction}
            />
          </div>
        )}

        {!isUser && message.ui_type === 'itinerary_card' && message.ui_payload && (
          <div className="mt-2">
            <ItineraryCard
              data={message.ui_payload}
              payload={message.ui_payload}
              onAction={onAction}
            />
          </div>
        )}

        {!isUser && message.ui_type === 'admin_stats_card' && message.ui_payload && (
          <div className="mt-2">
            <AdminStatsCard
              data={message.ui_payload}
              payload={message.ui_payload}
            />
          </div>
        )}

        {!isUser && message.ui_type === 'admin_ai_comparison_card' && message.ui_payload && (
          <div className="mt-2">
            <AdminAiComparisonCard
              data={message.ui_payload}
              payload={message.ui_payload}
            />
          </div>
        )}


      </div>
    </div>
  );
};
