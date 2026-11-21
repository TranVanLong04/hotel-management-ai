import React from 'react';
import { MessageSquare, X, Sparkles } from 'lucide-react';
import { useChatbot } from '@/features/chatbot/hooks/useChatbot';
import { ChatWidget } from './ChatWidget';

export const FloatingChatButton: React.FC = () => {
  const {
    isOpen,
    toggleOpen,
    setIsOpen,
    messages,
    suggestedActions,
    isLoading,
    sendMessage,
  } = useChatbot();

  return (
    <>
      {/* Floating Chat Window */}
      <ChatWidget
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        messages={messages}
        isLoading={isLoading}
        suggestedActions={suggestedActions}
        onSendMessage={sendMessage}
      />

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          type="button"
          onClick={toggleOpen}
          aria-label={isOpen ? 'Đóng cửa sổ chat' : 'Mở trợ lý AI Grand Luxury'}
          className={`relative group flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-all duration-300 ${
            isOpen
              ? 'bg-gray-800 text-white hover:bg-gray-900 rotate-90 scale-95'
              : 'bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-700 text-white hover:scale-105 active:scale-95 shadow-amber-500/30'
          }`}
        >
          {isOpen ? (
            <X className="w-6 h-6 transition-transform" />
          ) : (
            <>
              <MessageSquare className="w-6 h-6 transition-transform group-hover:scale-110" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 items-center justify-center text-[9px] font-bold text-white">
                  <Sparkles className="w-2.5 h-2.5" />
                </span>
              </span>
            </>
          )}

          {/* Tooltip on hover when closed */}
          {!isOpen && (
            <span className="absolute right-16 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900/90 text-white text-xs font-medium rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none select-none">
              Trợ lý AI Grand Luxury ✨
            </span>
          )}
        </button>
      </div>
    </>
  );
};

