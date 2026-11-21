import React from 'react';
import { Sparkles, Minus, X } from 'lucide-react';

interface ChatHeaderProps {
  onClose: () => void;
  onMinimize: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ onClose, onMinimize }) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white rounded-t-2xl shadow-sm select-none">
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
            <Sparkles className="w-4 h-4 text-amber-200" />
          </div>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-amber-700 rounded-full animate-pulse" />
        </div>
        <div>
          <h3 className="font-semibold text-sm tracking-wide text-white">
            Trợ lý AI Grand Luxury
          </h3>
          <p className="text-[11px] text-amber-100/80 font-normal">
            Sẵn sàng hỗ trợ 24/7
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onMinimize}
          className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          title="Thu nhỏ"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          title="Đóng chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

