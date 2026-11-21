import { useState, useCallback, useRef } from 'react';
import { chatApi } from '@/api/chat.api';
import { useAuthStore } from '@stores/authStore';
import toast from 'react-hot-toast';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  ui_type?: string;
  ui_payload?: any;
  created_at: string;
}

const INITIAL_MESSAGE: ChatMessage = {
  id: 'welcome-msg',
  sender: 'assistant',
  content:
    'Xin chào! Tôi là trợ lý AI của Grand Luxury. Tôi có thể hỗ trợ thông tin khách sạn, tìm phòng, đặt phòng, thanh toán, check-in và gợi ý du lịch. Quý khách cần tôi giúp gì hôm nay?',
  created_at: new Date().toISOString(),
};

const DEFAULT_SUGGESTIONS = [
  'Giờ nhận và trả phòng?',
  'Bảng giá các hạng phòng',
  'Chính sách hủy phòng thế nào?',
];

export function useChatbot() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [suggestedActions, setSuggestedActions] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [conversationId, setConversationId] = useState<string | null>(() => {
    return sessionStorage.getItem('grand_luxury_chat_conv_id') || null;
  });

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isSendingRef = useRef(false);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isSendingRef.current) return;

      if (!isAuthenticated) {
        toast.error('Vui lòng đăng nhập để trò chuyện cùng Trợ lý AI');
        return;
      }

      isSendingRef.current = true;
      setIsLoading(true);

      const userMsgId = `user-${Date.now()}`;
      const newUserMsg: ChatMessage = {
        id: userMsgId,
        sender: 'user',
        content: trimmed,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, newUserMsg]);

      try {
        // Build history for API
        const historyPayload = messages
          .filter((m) => m.id !== 'welcome-msg')
          .slice(-10)
          .map((m) => ({
            role: m.sender as 'user' | 'assistant',
            content: m.content,
          }));

        const res = await chatApi.sendMessage({
          message: trimmed,
          conversation_id: conversationId,
          history: historyPayload,
        });

        if (res.success && res.data) {
          const { conversation_id, message: botMsg, ui_type, ui_payload, suggested_actions } = res.data;

          if (conversation_id && conversation_id !== conversationId) {
            setConversationId(conversation_id);
            sessionStorage.setItem('grand_luxury_chat_conv_id', conversation_id);
          }

          const newBotMsg: ChatMessage = {
            id: botMsg.id || `bot-${Date.now()}`,
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
        }
      } catch (err: any) {
        console.error('Chat error:', err);
        const errMsg: ChatMessage = {
          id: `error-${Date.now()}`,
          sender: 'assistant',
          content:
            'Xin lỗi Quý khách, kết nối tới hệ thống AI tạm thời bị gián đoạn. Vui lòng thử lại sau giây lát.',
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsLoading(false);
        isSendingRef.current = false;
      }
    },
    [conversationId, isAuthenticated, messages]
  );

  return {
    isOpen,
    setIsOpen,
    toggleOpen,
    messages,
    suggestedActions,
    isLoading,
    sendMessage,
    conversationId,
  };
}

