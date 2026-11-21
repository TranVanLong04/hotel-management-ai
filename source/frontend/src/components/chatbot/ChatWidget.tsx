import React from 'react';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import type { ChatMessage } from '@/features/chatbot/hooks/useChatbot';

interface ChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  isLoading: boolean;
  suggestedActions: string[];
  onSendMessage: (text: string) => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  isOpen,
  onClose,
  messages,
  isLoading,
  suggestedActions,
  onSendMessage,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed bottom-24 right-4 sm:right-6 z-50 flex flex-col w-[calc(100vw-32px)] sm:w-[380px] h-[520px] max-h-[calc(100vh-120px)] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-amber-200/60 dark:border-amber-700/40 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200"
      role="dialog"
      aria-label="Cửa sổ Trợ lý AI Grand Luxury"
    >
      {/* Header */}
      <ChatHeader onClose={onClose} onMinimize={onClose} />

      {/* Messages */}
      <ChatMessages
        messages={messages}
        isLoading={isLoading}
        suggestedActions={suggestedActions}
        onSelectSuggestion={onSendMessage}
      />

      {/* Input */}
      <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
    </div>
  );
};

