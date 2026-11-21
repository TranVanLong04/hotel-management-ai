import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  TrendingUp,
  BrainCircuit,
  BarChart3,
  RotateCcw,
  ShieldCheck,
  Send,
  ChevronRight,
  Database,
  Calendar,
} from 'lucide-react';
import { chatApi } from '@/api/chat.api';
import { useAuthStore } from '@stores/authStore';
import { ChatMessageItem } from '@/components/chatbot/ChatMessageItem';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import type { ChatMessage } from '@/features/chatbot/hooks/useChatbot';
import toast from 'react-hot-toast';

const ADMIN_INITIAL_MESSAGE: ChatMessage = {
  id: 'admin-welcome-msg',
  sender: 'assistant',
  content:
    'Kính chào Quản trị viên! Tôi là Trợ lý AI Quản trị của Grand Luxury Hotel. Tôi có thể hỗ trợ tra cứu báo cáo doanh thu, tình trạng phòng lấp đầy, số liệu vận hành và đối sánh hiệu năng các mô hình AI FaceNet vs InsightFace. Quý quản trị cần xem thông tin gì hôm nay?',
  created_at: new Date().toISOString(),
};

const ADMIN_SUGGESTED_PROMPTS = [
  {
    icon: TrendingUp,
    label: 'Báo cáo doanh thu hôm nay',
    prompt: 'Báo cáo doanh thu hôm nay của khách sạn thế nào?',
    desc: 'Doanh thu ngày & tháng, số lượng đặt phòng',
  },
  {
    icon: BarChart3,
    label: 'Công suất phòng hôm nay',
    prompt: 'Báo cáo công suất phòng và tỷ lệ lấp đầy hôm nay',
    desc: 'Tỷ lệ lấp đầy %, phòng đang ở, phòng trống',
  },
  {
    icon: BrainCircuit,
    label: 'Phân tích FaceNet vs InsightFace',
    prompt: 'So sánh mô hình AI FaceNet và InsightFace về độ chính xác và độ trễ',
    desc: 'Chỉ số EER, FMR, Latency suy luận và Agreement Rate',
  },
  {
    icon: Calendar,
    label: 'Doanh thu tháng này',
    prompt: 'Doanh thu tháng này và số khách hàng mới',
    desc: 'Tổng doanh thu lũy kế tháng hiện tại',
  },
];

export function AdminAssistantPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [messages, setMessages] = useState<ChatMessage[]>([ADMIN_INITIAL_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(() => {
    return sessionStorage.getItem('grand_luxury_admin_chat_conv_id') || null;
  });
  const [suggestedActions, setSuggestedActions] = useState<string[]>([
    'Báo cáo doanh thu hôm nay',
    'Công suất phòng hôm nay',
    'So sánh mô hình AI FaceNet vs InsightFace',
    'Tỷ lệ lấp đầy buồng phòng',
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isSendingRef = useRef(false);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  const handleSendMessage = useCallback(
    async (textToSend?: string) => {
      const text = (textToSend || inputText).trim();
      if (!text || isSendingRef.current) return;

      if (!isAuthenticated) {
        toast.error('Vui lòng đăng nhập với tài khoản Admin');
        return;
      }

      isSendingRef.current = true;
      setIsLoading(true);
      setInputText('');

      const userMsgId = `admin-user-${Date.now()}`;
      const newUserMsg: ChatMessage = {
        id: userMsgId,
        sender: 'user',
        content: text,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, newUserMsg]);

      try {
        const historyPayload = messages
          .filter((m) => m.id !== 'admin-welcome-msg')
          .slice(-10)
          .map((m) => ({
            role: m.sender as 'user' | 'assistant',
            content: m.content,
          }));

        const res = await chatApi.sendMessage({
          message: text,
          conversation_id: conversationId,
          history: historyPayload,
        });

        if (res.success && res.data) {
          const { conversation_id, message: botMsg, ui_type, ui_payload, suggested_actions } = res.data;

          if (conversation_id && conversation_id !== conversationId) {
            setConversationId(conversation_id);
            sessionStorage.setItem('grand_luxury_admin_chat_conv_id', conversation_id);
          }

          const newBotMsg: ChatMessage = {
            id: botMsg.id || `admin-bot-${Date.now()}`,
            sender: 'assistant',
            content: botMsg.content,
            ui_type: ui_type || (botMsg as any).ui_type || 'text',
            ui_payload: ui_payload !== undefined && ui_payload !== null ? ui_payload : (botMsg as any).ui_payload,
            created_at: botMsg.created_at || new Date().toISOString(),
          };

          setMessages((prev) => [...prev, newBotMsg]);

          if (suggested_actions && suggested_actions.length > 0) {
            setSuggestedActions(suggested_actions);
          }
        } else {
          toast.error(res.message || 'Không nhận được phản hồi từ máy chủ AI');
        }
      } catch (err: any) {
        console.error('Lỗi gửi tin nhắn admin assistant:', err);
        const errorMsg: ChatMessage = {
          id: `admin-err-${Date.now()}`,
          sender: 'assistant',
          content: 'Xin lỗi Quản trị viên, hệ thống đang gặp gián đoạn tạm thời khi trích xuất dữ liệu báo cáo. Quý quản trị vui lòng thử lại sau giây lát.',
          ui_type: 'text',
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
        toast.error('Lỗi kết nối Trợ lý AI Quản trị');
      } finally {
        setIsLoading(false);
        isSendingRef.current = false;
      }
    },
    [inputText, isAuthenticated, messages, conversationId]
  );

  const handleClearChat = () => {
    setMessages([ADMIN_INITIAL_MESSAGE]);
    sessionStorage.removeItem('grand_luxury_admin_chat_conv_id');
    setConversationId(null);
    toast.success('Đã làm mới phiên trò chuyện');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <ErrorBoundary
      fallback={
        <div className="flex h-[calc(100vh-5rem)] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 mb-3">
            <Bot className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            Giao diện Trợ lý AI Quản trị gặp sự cố hiển thị
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 text-center max-w-md">
            Hệ thống đã ghi nhận lỗi. Quý quản trị có thể nhấn nút dưới đây để làm mới lại phiên trò chuyện.
          </p>
          <button
            onClick={() => {
              sessionStorage.removeItem('grand_luxury_admin_chat_conv_id');
              window.location.reload();
            }}
            className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 shadow-sm"
          >
            Làm mới trang & Khởi động lại
          </button>
        </div>
      }
    >
      <div className="flex h-[calc(100vh-5rem)] flex-col rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden dark:border-gray-800 dark:bg-gray-900">
      {/* Header Full-Page */}
      <div className="flex items-center justify-between border-b border-gray-200/80 px-6 py-4 bg-gradient-to-r from-gray-50 via-white to-amber-50/30 dark:border-gray-800 dark:from-gray-900 dark:via-gray-850 dark:to-gray-900">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-md shadow-amber-500/20">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-gray-900 dark:text-white">
                Trợ lý AI Quản trị Grand Luxury
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                <Sparkles className="h-3 w-3" /> Admin Internal
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Công cụ báo cáo thời gian thực, phân tích công suất phòng & so sánh hiệu năng AI (FaceNet & InsightFace)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 shadow-2xs dark:border-gray-700 dark:bg-gray-850 dark:text-gray-300">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Quyền Admin: <strong>{user?.full_name || 'Quản trị viên'}</strong></span>
          </div>

          <button
            type="button"
            onClick={handleClearChat}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-2xs transition-all dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750"
            title="Làm mới hội thoại"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Làm mới
          </button>
        </div>
      </div>

      {/* Suggested Quick Prompt Cards Banner (Hiển thị nổi bật) */}
      <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-2.5 dark:border-gray-800 dark:bg-gray-900/60">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {ADMIN_SUGGESTED_PROMPTS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(item.prompt)}
                disabled={isLoading}
                className="group flex items-start gap-2.5 rounded-xl border border-gray-200/70 bg-white p-2.5 text-left shadow-2xs transition-all hover:border-amber-400 hover:shadow-xs hover:bg-amber-50/30 active:scale-[0.99] dark:border-gray-800 dark:bg-gray-850 dark:hover:border-amber-600 dark:hover:bg-gray-800"
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors dark:bg-amber-400/10 dark:text-amber-400">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-gray-800 group-hover:text-amber-700 dark:text-gray-200 dark:group-hover:text-amber-400 truncate">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                    {item.desc}
                  </div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-amber-500 mt-1 dark:text-gray-600" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-gray-50/30 dark:bg-gray-950/20">
        {messages.map((msg) => (
          <ChatMessageItem
            key={msg.id}
            message={msg}
            onAction={(actionText) => handleSendMessage(actionText)}
          />
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-3 my-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-amber-700 text-white shadow-sm">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-xs border border-gray-200/80 bg-white px-4 py-3 shadow-xs dark:border-gray-700 dark:bg-gray-800">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1.5">
                Đang xử lý truy vấn dữ liệu quản trị...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Follow-up Chips */}
      {!isLoading && suggestedActions && suggestedActions.length > 0 && (
        <div className="border-t border-gray-100 bg-white px-6 py-2 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 whitespace-nowrap">
              Gợi ý tiếp theo:
            </span>
            {suggestedActions.map((action, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(action)}
                className="whitespace-nowrap rounded-full border border-amber-200/90 bg-amber-50/70 px-3 py-1 text-xs font-medium text-amber-800 transition-all hover:bg-amber-100 hover:scale-102 active:scale-98 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Input Bar */}
      <div className="border-t border-gray-200/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-end gap-3 rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-2.5 shadow-2xs focus-within:border-amber-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500/20 transition-all dark:border-gray-700 dark:bg-gray-800/80 dark:focus-within:bg-gray-850">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Hỏi trợ lý về doanh thu, công suất phòng, hoặc so sánh FaceNet vs InsightFace..."
            rows={1}
            disabled={isLoading}
            className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none resize-none max-h-32 py-1 leading-relaxed dark:text-gray-100 dark:placeholder-gray-500"
          />

          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${
              inputText.trim() && !isLoading
                ? 'bg-amber-600 text-white shadow-md hover:bg-amber-700 hover:scale-105 active:scale-95'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
            }`}
            title="Gửi câu hỏi (Enter)"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-1.5 flex items-center justify-between px-2 text-[11px] text-gray-400 dark:text-gray-500">
          <span>Nhấn <strong>Enter</strong> để gửi, <strong>Shift + Enter</strong> để xuống dòng</span>
          <span className="flex items-center gap-1">
            <Database className="h-3 w-3 text-amber-500" /> Kết nối cơ sở dữ liệu nội bộ Grand Luxury
          </span>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}
export default AdminAssistantPage;
