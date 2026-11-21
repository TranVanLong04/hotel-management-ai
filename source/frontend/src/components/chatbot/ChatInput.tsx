import React, { useState, useRef, useEffect } from 'react';
import { Send, CornerDownLeft } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [inputText, setInputText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [inputText]);

  const handleSend = () => {
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText);
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700/60 rounded-b-2xl">
      <div className="flex items-end gap-2 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500/20 transition-all">
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập câu hỏi của bạn..."
          rows={1}
          disabled={isLoading}
          className="w-full bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 resize-none outline-none max-h-24 py-1 leading-relaxed"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!inputText.trim() || isLoading}
          className={`p-2 rounded-lg shrink-0 transition-all ${
            inputText.trim() && !isLoading
              ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm hover:scale-105 active:scale-95'
              : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
          }`}
          title="Gửi (Enter)"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-between mt-1 px-1 text-[11px] text-gray-400 dark:text-gray-500 select-none">
        <span>Nhấn Enter để gửi, Shift+Enter xuống dòng</span>
        <span className="flex items-center gap-0.5">
          <CornerDownLeft className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
};

