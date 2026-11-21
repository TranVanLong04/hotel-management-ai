import axios from 'axios';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { InternalError, BadRequestError } from '../../utils/errors.js';
import * as chatRepo from './chat.repository.js';

/**
 * Service điều phối Chat Gateway giữa Frontend và Chatbot Service (FastAPI)
 */

export const processChatMessage = async ({ userId, role, token, message, conversationId, history = [] }) => {
  // 1. Xác định hoặc tạo phiên hội thoại
  let conversation = null;
  if (conversationId) {
    conversation = await chatRepo.findConversationById(conversationId);
  }

  if (!conversation) {
    // Thử lấy cuộc hội thoại gần nhất của user hoặc tạo mới
    conversation = await chatRepo.getLatestActiveConversation(userId, role);
    if (!conversation) {
      const title = message.length > 30 ? `${message.substring(0, 30)}...` : message;
      conversation = await chatRepo.createConversation({
        userId,
        role,
        title,
      });
    }
  }

  // 2. Lưu tin nhắn của user vào database
  await chatRepo.saveMessage({
    conversationId: conversation.id,
    sender: 'user',
    content: message,
    uiType: 'text',
  });

  // 3. Nếu client không gửi history, lấy 10 tin nhắn gần nhất từ DB
  let chatHistory = history;
  if (!chatHistory || chatHistory.length === 0) {
    const recentMessages = await chatRepo.listMessagesByConversationId(conversation.id, 10);
    // Bỏ qua tin nhắn vừa lưu để tránh duplicate khi gửi cho LLM
    chatHistory = recentMessages
      .filter((m) => m.content !== message)
      .map((m) => ({
        role: m.sender === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));
  }

  // 4. Gọi sang Chatbot Service (FastAPI)
  let botReply = '';
  let uiType = 'text';
  let uiPayload = null;
  let suggestedActions = [];

  logger.info(
    { userId, role, hasToken: Boolean(token), tokenPreview: token ? `${token.substring(0, 10)}...` : null },
    'Chat Gateway forwarding request to Chatbot Service'
  );

  try {
    const response = await axios.post(
      `${env.CHATBOT_SERVICE_URL}/api/v1/chat/message`,
      {
        message,
        history: chatHistory,
        user_id: userId,
        role: role || 'customer',
        token: token || null,
      },
      {
        timeout: 45000, // 45s timeout cho các tác vụ AI và truy vấn dữ liệu quản trị
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = response.data;
    botReply = data.reply || 'Xin lỗi, tôi chưa thể trả lời câu hỏi lúc này.';
    uiType = data.ui_type || 'text';
    uiPayload = data.ui_payload || null;
    suggestedActions = data.suggested_actions || [];
  } catch (error) {
    logger.error({ err: error.message }, 'Lỗi khi gọi sang Chatbot Service');
    botReply = 'Hệ thống trợ lý AI tạm thời gián đoạn kết nối. Vui lòng thử lại sau giây lát hoặc liên hệ quầy lễ tân để được hỗ trợ.';
  }

  // 5. Lưu phản hồi của AI vào database
  const savedBotMessage = await chatRepo.saveMessage({
    conversationId: conversation.id,
    sender: 'assistant',
    content: botReply,
    uiType,
    uiPayload,
  });

  return {
    conversation_id: conversation.id,
    message: {
      id: savedBotMessage.id,
      sender: 'assistant',
      content: botReply,
      ui_type: uiType,
      ui_payload: uiPayload,
      created_at: savedBotMessage.created_at,
    },
    ui_type: uiType,
    ui_payload: uiPayload,
    suggested_actions: suggestedActions,
  };
};

export const getConversationHistory = async (conversationId, userId, role) => {
  const conversation = await chatRepo.findConversationById(conversationId);
  if (!conversation) {
    throw new BadRequestError('Không tìm thấy phiên hội thoại');
  }

  // Khách chỉ được xem cuộc hội thoại của chính mình (nếu có user_id)
  if (role !== 'admin' && conversation.user_id && conversation.user_id !== userId) {
    throw new BadRequestError('Bạn không có quyền truy cập hội thoại này');
  }

  const messages = await chatRepo.listMessagesByConversationId(conversationId, 50);
  return {
    conversation,
    messages,
  };
};

