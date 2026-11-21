import api from './axios';
import type { ApiResponse } from '@/types';

export interface ChatMessagePayload {
  message: string;
  conversation_id?: string | null;
  history?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
}

export interface ChatResponseData {
  conversation_id: string;
  message: {
    id: string;
    sender: 'user' | 'assistant';
    content: string;
    created_at: string;
  };
  ui_type: string;
  ui_payload?: any;
  suggested_actions: string[];
}

export interface ChatHistoryResponseData {
  conversation: {
    id: string;
    title: string;
    role_context: string;
    created_at: string;
  };
  messages: Array<{
    id: string;
    sender: 'user' | 'assistant' | 'system';
    content: string;
    ui_type: string;
    ui_payload?: any;
    created_at: string;
  }>;
}

export const chatApi = {
  sendMessage: (payload: ChatMessagePayload): Promise<ApiResponse<ChatResponseData>> =>
    api.post('/chat/message', payload, {
      timeout: 45000, // 45 giây timeout cho các tác vụ AI phức tạp
    }),

  getConversationMessages: (conversationId: string): Promise<ApiResponse<ChatHistoryResponseData>> =>
    api.get(`/chat/conversations/${conversationId}/messages`),

  capturePaypalPayment: (payload: { orderId: string; bookingId?: string }): Promise<ApiResponse<any>> =>
    api.post('/chat/paypal/capture', payload),

  verifyFaceCheckin: (formData: FormData): Promise<ApiResponse<any>> =>
    api.post('/chat/verify-face', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};


