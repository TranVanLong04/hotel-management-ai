import React, { useEffect, useRef } from 'react';
import { Bot } from 'lucide-react';
import type { ChatMessage } from '@/features/chatbot/hooks/useChatbot';
import { ChatMessageItem } from './ChatMessageItem';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading: boolean;
  suggestedActions: string[];
  onSelectSuggestion: (text: string) => void;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isLoading,
  suggestedActions,
  onSelectSuggestion,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50/70 dark:bg-gray-900/40 select-text">
      {messages.map((msg) => (
        <ChatMessageItem
          key={msg.id}
          message={msg}
          onAction={onSelectSuggestion}
        />
      ))}

      {/* Typing Indicator */}
      {isLoading && (
        <div className="flex items-center gap-2 my-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-amber-700 text-white flex items-center justify-center shrink-0">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 rounded-2xl rounded-bl-xs px-4 py-3 shadow-sm flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}

      {/* Suggested Action Chips */}
      {!isLoading && suggestedActions && suggestedActions.length > 0 && (
        <div className="pt-2 pb-1">
          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mb-1.5 px-1 select-none">
            Gợi ý câu hỏi nhanh:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestedActions.map((action, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectSuggestion(action)}
                className="text-xs bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-700/50 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-full px-3 py-1 transition-all shadow-2xs hover:scale-102 active:scale-98 text-left"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

